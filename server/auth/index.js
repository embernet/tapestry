'use strict';

// Shared login module for Horizon suite apps. Copy this folder unchanged into
// an app's src/auth/. Contract (see README.md beside this file):
//
//   const auth = createAuth({ db, appName, config: loadAuthConfig() });
//   app.use(auth.attachUser);   app.use(auth.router);   app.get('/', auth.requireUser, ...)
//
//   req.user = { id, username, displayName, source: 'local'|'sso', isAdmin }
//
// Routes:  /login  /local  /auth/callback  /logout
//   SSO off:  /login = local form; /local = same; /auth/callback = 404
//   SSO on:   /login -> TIG-SSO; /local = local form only if AUTH_LOCAL=on, else 404

const express = require('express');
const { createStore } = require('./store');
const { createOidc } = require('./oidc');
const { loginPage, messagePage } = require('./views');

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

// Only same-site paths: "/x", never "//host", "/\\host" or absolute URLs.
function safeNext(value) {
  const v = String(value || '');
  if (!v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\')) return '/';
  if (/[\r\n]/.test(v)) return '/';
  return v;
}

function createAuth({ db, appName, config }) {
  const cfg = config;
  const store = createStore(db);
  const oidc = cfg.sso ? createOidc(cfg) : null;
  const cookieName = `${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}_sid`;
  const router = express.Router();
  const form = express.urlencoded({ extended: false, limit: '8kb' });

  setInterval(() => store.sweep(), 3600000).unref();

  const cookieBase = () =>
    `Path=/; HttpOnly; SameSite=Lax${cfg.secureCookies ? '; Secure' : ''}`;

  function setSession(res, user, idToken) {
    const token = store.createSession(user, cfg.sessionDays, idToken);
    res.append('Set-Cookie', `${cookieName}=${token}; Max-Age=${cfg.sessionDays * 86400}; ${cookieBase()}`);
  }
  function clearSession(req, res) {
    store.deleteSession(parseCookies(req.headers.cookie)[cookieName]);
    res.append('Set-Cookie', `${cookieName}=; Max-Age=0; ${cookieBase()}`);
  }

  function sameOrigin(req) {
    const origin = req.get('origin');
    if (!origin) return true; // older browsers / curl; SameSite=Lax still applies to the cookie
    // Accept the configured public origin and the origin the browser actually used
    // (e.g. the host IP on dev while PUBLIC_URL is localhost). A cross-site form
    // always carries the other site's Origin, so it matches neither.
    const allowed = [`${req.protocol}://${req.get('host')}`];
    if (cfg.publicUrl) allowed.push(new URL(cfg.publicUrl).origin);
    return allowed.includes(origin);
  }

  // ---- throttle local password guesses: 5 failures per user+IP -> 60 s lock ----
  const fails = new Map();
  const throttleKey = (req, u) => `${req.ip}|${String(u).toLowerCase()}`;
  function locked(key) {
    const f = fails.get(key);
    return f && f.until > Date.now();
  }
  function noteFail(key) {
    const f = fails.get(key) || { n: 0, until: 0 };
    f.n += 1;
    if (f.n >= 5) { f.n = 0; f.until = Date.now() + 60000; }
    fails.set(key, f);
    if (fails.size > 10000) fails.clear();
  }

  // ---- middleware ----
  function attachUser(req, res, next) {
    const s = store.getSession(parseCookies(req.headers.cookie)[cookieName]);
    req.user = s ? s.user : null;
    req.authSession = s;
    next();
  }

  function requireUser(req, res, next) {
    if (req.user) return next();
    // originalUrl, not path: inside a router mounted at /api, req.path has lost the prefix.
    const pathname = req.originalUrl.split('?')[0];
    if (pathname === '/api' || pathname.startsWith('/api/')) return res.status(401).json({ error: 'sign in required' });
    return res.redirect(302, `/login?next=${encodeURIComponent(safeNext(req.originalUrl))}`);
  }

  // ---- local login ----
  function showLocalForm(req, res, { error, status = 200 } = {}) {
    res.status(status).type('html').send(loginPage({
      appName,
      next: safeNext(req.query.next || req.body?.next),
      error,
      ssoOn: cfg.sso,
      noUsers: store.countLocalUsers() === 0,
    }));
  }

  router.get('/login', async (req, res, next) => {
    if (req.user) return res.redirect(302, safeNext(req.query.next));
    if (!cfg.sso) return showLocalForm(req, res);
    try {
      const { url, state, verifier, nonce } = await oidc.startLogin();
      store.putPending(state, verifier, nonce, safeNext(req.query.next));
      res.append('Set-Cookie', `${cookieName}_state=${state}; Max-Age=600; ${cookieBase()}`);
      return res.redirect(302, url);
    } catch (err) {
      console.error('[auth] TIG-SSO unavailable:', err.message);
      return res.status(503).type('html').send(messagePage({
        appName,
        title: 'Single sign-on is unavailable',
        body: 'This app could not reach TIG-SSO. Try again in a minute.',
        links: [['Try again', `/login?next=${encodeURIComponent(safeNext(req.query.next))}`],
          ...(cfg.local ? [['Local sign-in', '/local']] : [])],
      }));
    }
  });

  router.get('/local', (req, res) => {
    if (cfg.sso && !cfg.local) return res.status(404).type('text').send('Not found');
    if (req.user) return res.redirect(302, safeNext(req.query.next));
    return showLocalForm(req, res);
  });

  router.post('/local', form, (req, res) => {
    if (!cfg.local) return res.status(404).type('text').send('Not found');
    if (!sameOrigin(req)) return res.status(403).type('text').send('Cross-site request refused');
    const username = String(req.body.username || '').trim().toLowerCase();
    const key = throttleKey(req, username);
    if (locked(key)) return showLocalForm(req, res, { error: 'Too many attempts. Wait a minute and try again.', status: 429 });
    const row = store.checkLocalLogin(username, String(req.body.password || ''));
    if (!row) {
      noteFail(key);
      return showLocalForm(req, res, { error: 'Wrong username or password.', status: 401 });
    }
    fails.delete(key);
    if (req.user) clearSession(req, res);
    setSession(res, {
      id: `local:${row.username}`,
      username: row.username,
      displayName: row.display_name,
      source: 'local',
      isAdmin: cfg.localAdmins.includes(row.username),
    });
    return res.redirect(303, safeNext(req.body.next));
  });

  // ---- SSO callback ----
  router.get('/auth/callback', async (req, res) => {
    if (!cfg.sso) return res.status(404).type('text').send('Not found');
    const fail = (title, body) => res.status(400).type('html').send(messagePage({
      appName, title, body,
      links: [['Sign in again', '/login'], ...(cfg.local ? [['Local sign-in', '/local']] : [])],
    }));
    if (req.query.error) {
      return fail('Sign-in was not completed', `TIG-SSO said: ${String(req.query.error_description || req.query.error)}`);
    }
    const cookieState = parseCookies(req.headers.cookie)[`${cookieName}_state`];
    res.append('Set-Cookie', `${cookieName}_state=; Max-Age=0; ${cookieBase()}`);
    if (!req.query.state || req.query.state !== cookieState) {
      return fail('Sign-in expired', 'The sign-in started in another tab or took too long. Please sign in again.');
    }
    const pending = store.takePending(req.query.state);
    if (!pending) return fail('Sign-in expired', 'Please sign in again.');
    try {
      const { claims, idToken } = await oidc.finishLogin(cfg.publicUrl + req.originalUrl, pending);
      store.upsertSsoUser(claims);
      if (req.user) clearSession(req, res);
      setSession(res, {
        id: `sso:${claims.sub}`,
        username: claims.username,
        displayName: claims.displayName,
        source: 'sso',
        isAdmin: Boolean(cfg.adminGroup) && claims.groups.includes(cfg.adminGroup),
      }, idToken);
      return res.redirect(302, safeNext(pending.next));
    } catch (err) {
      console.error('[auth] callback failed:', err.message);
      return fail('Sign-in failed', 'TIG-SSO\'s answer could not be verified. Please sign in again.');
    }
  });

  // ---- logout: ?everywhere=1 also ends the TIG-SSO session ----
  async function logout(req, res) {
    const idToken = req.authSession?.idToken;
    const wasSso = req.user?.source === 'sso';
    clearSession(req, res);
    const everywhere = ['1', 'true', 'yes'].includes(String(req.query.everywhere || req.body?.everywhere || ''));
    if (cfg.sso && wasSso && everywhere) {
      try {
        return res.redirect(302, await oidc.logoutUrl(idToken, `${cfg.publicUrl}/`));
      } catch (err) {
        console.error('[auth] end-session URL failed:', err.message);
      }
    }
    return res.redirect(302, '/');
  }
  router.get('/logout', logout);
  router.post('/logout', form, (req, res) => {
    if (!sameOrigin(req)) return res.status(403).type('text').send('Cross-site request refused');
    return logout(req, res);
  });

  return { router, attachUser, requireUser, store, mode: { local: cfg.local, sso: cfg.sso } };
}

module.exports = { createAuth, safeNext, parseCookies };
