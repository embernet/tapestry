'use strict';

// Tables the auth module owns inside the app's node:sqlite database
// (all prefixed auth_). Sessions are stored server-side; the cookie holds a
// random token and only its SHA-256 is kept here.

const crypto = require('node:crypto');

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_local_users (
      username TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_sso_users (
      sub TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      display_name TEXT NOT NULL,
      email TEXT,
      last_login INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS auth_sso_users_username ON auth_sso_users(username);
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      user_json TEXT NOT NULL,
      id_token TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_pending (
      state TEXT PRIMARY KEY,
      verifier TEXT NOT NULL,
      nonce TEXT NOT NULL,
      next TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const { N, r, p, keylen } = SCRYPT;
  const hash = crypto.scryptSync(password, salt, keylen, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, salt, hash] = parts;
  const expected = Buffer.from(hash, 'base64');
  const got = crypto.scryptSync(password, Buffer.from(salt, 'base64'), expected.length,
    { N: Number(N), r: Number(r), p: Number(p) });
  return crypto.timingSafeEqual(got, expected);
}

// A dummy hash so a login for an unknown user costs the same time as a real one.
const DUMMY_HASH = hashPassword(crypto.randomBytes(12).toString('hex'));

function createStore(db) {
  migrate(db);
  const now = () => Date.now();

  return {
    // ---- local users ----
    addLocalUser(username, displayName, password) {
      if (!/^[a-z0-9][a-z0-9._-]{1,31}$/.test(username)) {
        throw new Error('username: 2-32 chars, lower-case letters, digits, . _ -');
      }
      if (String(password).length < 10) throw new Error('password: at least 10 characters');
      db.prepare(`INSERT INTO auth_local_users(username, display_name, password_hash, created_at)
                  VALUES (?, ?, ?, ?)
                  ON CONFLICT(username) DO UPDATE SET display_name = excluded.display_name,
                                                      password_hash = excluded.password_hash`)
        .run(username, displayName || username, hashPassword(password), now());
    },
    removeLocalUser(username) {
      return db.prepare('DELETE FROM auth_local_users WHERE username = ?').run(username).changes > 0;
    },
    listLocalUsers() {
      return db.prepare('SELECT username, display_name, created_at FROM auth_local_users ORDER BY username').all();
    },
    countLocalUsers() {
      return db.prepare('SELECT COUNT(*) AS n FROM auth_local_users').get().n;
    },
    checkLocalLogin(username, password) {
      const row = db.prepare('SELECT * FROM auth_local_users WHERE username = ?').get(String(username).toLowerCase());
      const ok = verifyPassword(String(password), row ? row.password_hash : DUMMY_HASH);
      return ok && row ? row : null;
    },

    // ---- SSO users: keyed on sub; re-linked by username if Keycloak re-imported the user ----
    upsertSsoUser({ sub, username, displayName, email }) {
      const bySub = db.prepare('SELECT sub FROM auth_sso_users WHERE sub = ?').get(sub);
      if (!bySub && username) {
        db.prepare('UPDATE auth_sso_users SET sub = ? WHERE username = ?').run(sub, username);
      }
      db.prepare(`INSERT INTO auth_sso_users(sub, username, display_name, email, last_login)
                  VALUES (?, ?, ?, ?, ?)
                  ON CONFLICT(sub) DO UPDATE SET username = excluded.username,
                    display_name = excluded.display_name, email = excluded.email,
                    last_login = excluded.last_login`)
        .run(sub, username, displayName, email || null, now());
    },

    // ---- sessions ----
    createSession(user, days, idToken) {
      const token = crypto.randomBytes(32).toString('base64url');
      db.prepare(`INSERT INTO auth_sessions(token_hash, user_json, id_token, created_at, expires_at)
                  VALUES (?, ?, ?, ?, ?)`)
        .run(sha256(token), JSON.stringify(user), idToken || null, now(), now() + days * 86400000);
      return token;
    },
    getSession(token) {
      if (!token) return null;
      const row = db.prepare('SELECT * FROM auth_sessions WHERE token_hash = ?').get(sha256(token));
      if (!row) return null;
      if (row.expires_at < now()) {
        db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(row.token_hash);
        return null;
      }
      return { user: JSON.parse(row.user_json), idToken: row.id_token };
    },
    deleteSession(token) {
      if (token) db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(sha256(token));
    },
    deleteSessionsFor(userId) {
      db.prepare("DELETE FROM auth_sessions WHERE json_extract(user_json, '$.id') = ?").run(userId);
    },

    // ---- pending OIDC logins (state -> PKCE verifier, nonce, next), 10 minutes ----
    putPending(state, verifier, nonce, next) {
      db.prepare('INSERT INTO auth_pending(state, verifier, nonce, next, expires_at) VALUES (?, ?, ?, ?, ?)')
        .run(state, verifier, nonce, next, now() + 600000);
    },
    takePending(state) {
      const row = db.prepare('SELECT * FROM auth_pending WHERE state = ?').get(String(state));
      if (row) db.prepare('DELETE FROM auth_pending WHERE state = ?').run(row.state);
      return row && row.expires_at >= now() ? row : null;
    },

    sweep() {
      db.prepare('DELETE FROM auth_sessions WHERE expires_at < ?').run(now());
      db.prepare('DELETE FROM auth_pending WHERE expires_at < ?').run(now());
    },
  };
}

module.exports = { createStore, hashPassword, verifyPassword };
