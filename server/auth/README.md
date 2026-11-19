# Shared login module (Horizon login standard)

Drop-in login for Horizon suite apps: local accounts and/or TIG-SSO (OpenID
Connect, authorization code + S256 PKCE). The reference copy lives in the
`horizon` portal repo, `src/auth/`. Copy the folder unchanged into an app; fix
bugs here first, then re-copy.

Design and the reasons behind it: `~/git/horizon-infra/designs/2026-11-18-horizon-portal-and-sso.md`.
TIG-SSO rules: `~/git/TIG-SSO/docs/agent-guide.md`.

## Use

```js
const { DatabaseSync } = require('node:sqlite');
const { createAuth } = require('./auth');
const { loadAuthConfig } = require('./auth/config');

const auth = createAuth({ db: new DatabaseSync('data/app.db'), appName: 'Breakthrough', config: loadAuthConfig() });
app.use(auth.attachUser);       // sets req.user or null
app.use(auth.router);           // /login /local /auth/callback /logout
app.get('/', auth.requireUser, handler);   // HTML -> 302 /login?next=..., /api/* -> 401 JSON
```

`req.user = { id, username, displayName, source: 'local' | 'sso', isAdmin }`.
`id` is `local:<username>` or `sso:<sub>`, so the two kinds never collide.

Needs: Node 24 (`node:sqlite`), `express` 5, `openid-client` 6. Tables are
created in the app's database, prefixed `auth_`.

## Settings (environment)

| Setting | Default | |
|---|---|---|
| `AUTH_LOCAL` | `on` | local username/password accounts |
| `AUTH_SSO` | `off` | TIG-SSO sign-in |
| `SSO_ISSUER` | `https://tig-sso.grlab.co.uk/realms/tig` | |
| `SSO_CLIENT_ID` | | required with SSO |
| `SSO_CLIENT_SECRET_FILE` | | confidential client only; a file path, never the secret itself |
| `PUBLIC_URL` | | required with SSO; `https://…` or `http://localhost:<port>` |
| `SSO_ADMIN_GROUP` | | SSO users in this AD group get `isAdmin` |
| `LOCAL_ADMIN_USERS` | | comma list of local usernames with `isAdmin` |
| `SESSION_DAYS` | `7` | 1–30 |

Both modes off: `loadAuthConfig` throws and the app should refuse to start.

## Behaviour

| Route | SSO off | SSO on |
|---|---|---|
| `GET /login` | local form | redirect to TIG-SSO (keeps `next`) |
| `GET/POST /local` | local form / sign-in | the same only if `AUTH_LOCAL=on`, else 404 |
| `GET /auth/callback` | 404 | checks state cookie, PKCE, nonce, ID token |
| `/logout` | ends the app session | `?everywhere=1` (or form field) also ends TIG-SSO |

- Sessions are server-side; the cookie (`<app>_sid`, HttpOnly, SameSite=Lax,
  Secure on https) holds a random token stored only as a SHA-256.
- `next` only ever redirects to same-site paths.
- Local sign-in refuses cross-origin POSTs and locks a user+IP for 60 s after 5 failures.
- SSO users are keyed on `sub`, re-linked by `preferred_username` if Keycloak issues a new `sub`.
- If TIG-SSO is unreachable, `/login` shows a "try again" page (with a link to
  `/local` when local accounts are on) instead of failing the app.

Manage local accounts: `node src/auth/cli.js <db> add <user> ["Name"]` (password on stdin), `remove`, `list`.

## Not yet

- Hourly re-check of SSO users with an `offline_access` refresh token, so a
  disabled AD account loses a 7-day session within the hour. Waiting on the
  TIG-SSO owner's answer (design doc, open question 4).
