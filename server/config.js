'use strict';
// Server settings from the environment. The login settings (AUTH_* / SSO_* /
// SESSION_DAYS / LOCAL_ADMIN_USERS) are parsed by ./auth/config.js.
const path = require('node:path');
const { loadAuthConfig } = require('./auth/config');
const { loadAiConfig } = require('./ai');

function trimSlash(u) {
  return u ? String(u).replace(/\/+$/, '') : '';
}

function loadConfig(env = process.env) {
  const port = Number(env.PORT || 8080);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) throw new Error('PORT must be a TCP port, got ' + env.PORT);
  return {
    appName: 'tapestry',
    port,
    host: env.HOST || '0.0.0.0',
    dataDir: path.resolve(env.DATA_DIR || path.join(__dirname, '..', 'data')),
    distDir: path.resolve(env.DIST_DIR || path.join(__dirname, '..', 'dist')),
    // Optional portal back link: shown only when both are set.
    portalUrl: trimSlash(env.PORTAL_URL),
    portalName: String(env.PORTAL_NAME || '').trim().slice(0, 40),
    trustProxy: env.TRUST_PROXY || '',
    // Throws on impossible settings (both modes off, SSO without a client ID, ...).
    auth: loadAuthConfig(env),
    // Shared AI key for all users (server/ai.js); off unless SERVER_AI_KEY_FILE has a key.
    ai: loadAiConfig(env),
  };
}

module.exports = { loadConfig };
