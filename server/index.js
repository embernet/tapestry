'use strict';
// Tapestry Studio server: serves the built single-page app (dist/) behind a
// sign-in (local accounts and/or TIG-SSO, see ./auth/README.md).
//
//   GET /healthz        open; 200 + JSON when healthy
//   /login /local /auth/callback /logout   sign-in routes (shared auth module)
//   GET /api/session    the signed-in user, the optional portal link and whether shared AI is on
//   POST /api/ai/v1/chat/completions   shared AI with the server's key (./ai.js)
//   everything else     the app (signed-in users only)
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const express = require('express');
const { loadConfig } = require('./config');
const { createAuth } = require('./auth');
const { createAi } = require('./ai');
const pkg = require('../package.json');

function openDb(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, 'tapestry.db'));
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  return db;
}

function createApp(config = loadConfig(), { fetchImpl } = {}) {
  const db = openDb(config.dataDir);
  const auth = createAuth({ db, appName: 'Tapestry', config: config.auth });
  const ai = createAi({ db, config: config.ai, fetchImpl });
  const indexHtml = path.join(config.distDir, 'index.html');

  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);

  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      'X-Frame-Options': 'SAMEORIGIN',
    });
    next();
  });

  app.get('/healthz', (req, res) => {
    try {
      db.prepare('SELECT 1').get();
      res.json({ ok: true, app: config.appName, version: pkg.version });
    } catch (e) {
      res.status(503).json({ ok: false, error: e.message });
    }
  });

  app.use(auth.attachUser);
  app.use(auth.router);
  app.use(auth.requireUser);

  app.get('/api/session', (req, res) => {
    res.set('Cache-Control', 'no-store');
    const { username, displayName, source, isAdmin } = req.user;
    res.json({
      user: { username, displayName, source, isAdmin },
      sso: auth.mode.sso,
      portalUrl: config.portalUrl && config.portalName ? config.portalUrl : '',
      portalName: config.portalUrl && config.portalName ? config.portalName : '',
      ai: ai.info(),
    });
  });
  app.use(ai.router);
  app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }));

  // Vite's hashed assets can be cached; index.html never is (so a new build is picked up at once).
  app.use('/assets', express.static(path.join(config.distDir, 'assets'), { maxAge: '30d', immutable: true }));
  app.use(express.static(config.distDir, { index: false, maxAge: '1h' }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.set('Cache-Control', 'no-store');
    res.sendFile(indexHtml);
  });

  app.use((req, res) => res.status(404).type('text').send('Not found'));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    const msg = status >= 500 ? 'internal error' : err.message;
    if (req.originalUrl.startsWith('/api/')) return res.status(status).json({ error: msg });
    res.status(status).type('text').send(msg);
  });

  return { app, db, config, auth, ai };
}

if (require.main === module) {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error(`FATAL: settings: ${err.message}`);
    process.exit(1);
  }
  const { app, db } = createApp(config);
  const server = app.listen(config.port, config.host, () => {
    const a = config.auth;
    console.log(`tapestry ${pkg.version} on http://${config.host}:${config.port} (data ${config.dataDir}; login: local=${a.local ? 'on' : 'off'}, sso=${a.sso ? 'on' : 'off'}; shared AI ${config.ai.enabled ? `on, ${config.ai.model}` : 'off'})`);
  });
  const stop = () => server.close(() => { db.close(); process.exit(0); });
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}

module.exports = { createApp };
