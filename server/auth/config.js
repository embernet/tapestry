'use strict';

// Login settings shared by every Horizon suite app (login standard:
// horizon-infra designs/2026-11-18-horizon-portal-and-sso.md §2).
//
//   AUTH_LOCAL=on|off       local username/password accounts      (default on)
//   AUTH_SSO=on|off         sign in through TIG-SSO (OIDC + PKCE)  (default off)
//   SSO_ISSUER              default https://tig-sso.grlab.co.uk/realms/tig
//   SSO_CLIENT_ID           e.g. horizon-portal-dev
//   SSO_CLIENT_SECRET_FILE  confidential client only; omit for a public client
//   PUBLIC_URL              this app's external URL; redirect URI = PUBLIC_URL/auth/callback
//   SSO_ADMIN_GROUP         optional AD group whose members are admins
//   LOCAL_ADMIN_USERS       optional comma list of local usernames who are admins
//   SESSION_DAYS            app session length in days (default 7)

const fs = require('node:fs');

const DEFAULT_ISSUER = 'https://tig-sso.grlab.co.uk/realms/tig';

function flag(value, fallback) {
  if (value === undefined || value === '') return fallback;
  const v = String(value).trim().toLowerCase();
  if (['1', 'on', 'true', 'yes'].includes(v)) return true;
  if (['0', 'off', 'false', 'no'].includes(v)) return false;
  throw new Error(`not an on/off value: "${value}"`);
}

function isLoopback(url) {
  return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
}

function loadAuthConfig(env = process.env) {
  const cfg = {
    local: flag(env.AUTH_LOCAL, true),
    sso: flag(env.AUTH_SSO, false),
    issuer: (env.SSO_ISSUER || DEFAULT_ISSUER).replace(/\/+$/, ''),
    clientId: env.SSO_CLIENT_ID || '',
    clientSecret: '',
    publicUrl: (env.PUBLIC_URL || '').replace(/\/+$/, ''),
    adminGroup: env.SSO_ADMIN_GROUP || '',
    localAdmins: (env.LOCAL_ADMIN_USERS || '').split(',').map((s) => s.trim()).filter(Boolean),
    sessionDays: Number(env.SESSION_DAYS || 7),
  };

  if (!cfg.local && !cfg.sso) {
    throw new Error('AUTH_LOCAL and AUTH_SSO are both off: nobody could sign in. Turn one on.');
  }
  if (!(cfg.sessionDays > 0 && cfg.sessionDays <= 30)) {
    throw new Error('SESSION_DAYS must be between 1 and 30');
  }
  if (cfg.sso) {
    if (!cfg.clientId) throw new Error('AUTH_SSO=on needs SSO_CLIENT_ID');
    if (!cfg.publicUrl) throw new Error('AUTH_SSO=on needs PUBLIC_URL (the redirect URI is built from it)');
    const u = new URL(cfg.publicUrl);
    if (u.protocol !== 'https:' && !isLoopback(u)) {
      throw new Error('PUBLIC_URL must be https://, or http://localhost / 127.0.0.1 (TIG-SSO refuses other http redirect URIs)');
    }
    if (env.SSO_CLIENT_SECRET) {
      throw new Error('Pass the client secret as a file (SSO_CLIENT_SECRET_FILE), never as an environment value');
    }
    if (env.SSO_CLIENT_SECRET_FILE) {
      cfg.clientSecret = fs.readFileSync(env.SSO_CLIENT_SECRET_FILE, 'utf8').trim();
      if (!cfg.clientSecret) throw new Error('SSO_CLIENT_SECRET_FILE is empty');
    }
  }
  cfg.secureCookies = cfg.publicUrl.startsWith('https://');
  return cfg;
}

module.exports = { loadAuthConfig, flag };
