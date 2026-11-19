'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../server/index.js');
const { loadConfig } = require('../server/config.js');

let server, base, dataDir, distDir, db, auth;
const PW = 'test-password-123';

test.before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tapestry-test-'));
  distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tapestry-dist-'));
  fs.writeFileSync(path.join(distDir, 'index.html'), '<!doctype html><div id="root"></div>');
  fs.mkdirSync(path.join(distDir, 'assets'));
  fs.writeFileSync(path.join(distDir, 'assets', 'app-abc.js'), 'console.log(1)');
  const config = loadConfig({ DATA_DIR: dataDir, DIST_DIR: distDir, PORT: '8205', PORTAL_URL: 'https://portal.example/', PORTAL_NAME: 'Example' });
  const made = createApp(config);
  ({ db, auth } = made);
  server = made.app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => {
  server.close();
  db.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.rmSync(distDir, { recursive: true, force: true });
});

async function login() {
  auth.store.addLocalUser('ada', 'Ada L', PW);
  const res = await fetch(base + '/local', {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'ada', password: PW, next: '/' }),
  });
  assert.equal(res.status, 303);
  return res.headers.get('set-cookie').split(';')[0];
}

test('healthz is open', async () => {
  const r = await fetch(base + '/healthz');
  assert.equal(r.status, 200);
  assert.equal((await r.json()).ok, true);
});

test('the app and its assets need a sign-in', async () => {
  for (const p of ['/', '/assets/app-abc.js', '/some/deep/link']) {
    const r = await fetch(base + p, { redirect: 'manual' });
    assert.equal(r.status, 302, p);
    assert.match(r.headers.get('location'), /^\/login\?next=/, p);
  }
  const api = await fetch(base + '/api/session');
  assert.equal(api.status, 401);
});

test('signed in: app, assets, SPA fallback and session info', async () => {
  const cookie = await login();
  const home = await fetch(base + '/', { headers: { cookie } });
  assert.equal(home.status, 200);
  assert.match(await home.text(), /id="root"/);
  assert.equal(home.headers.get('cache-control'), 'no-store');

  const asset = await fetch(base + '/assets/app-abc.js', { headers: { cookie } });
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('cache-control'), /immutable/);

  const deep = await fetch(base + '/some/deep/link', { headers: { cookie } });
  assert.equal(deep.status, 200);

  const s = await (await fetch(base + '/api/session', { headers: { cookie } })).json();
  assert.equal(s.user.username, 'ada');
  assert.equal(s.user.displayName, 'Ada L');
  assert.equal(s.portalUrl, 'https://portal.example');
  assert.equal(s.portalName, 'Example');
  assert.equal(s.sso, false);

  const missing = await fetch(base + '/api/nope', { headers: { cookie } });
  assert.equal(missing.status, 404);
});

test('settings: both login modes off refuses to start', () => {
  assert.throws(() => loadConfig({ AUTH_LOCAL: 'off', AUTH_SSO: 'off' }), /both off/);
});

test('settings: SSO needs https or localhost PUBLIC_URL', () => {
  assert.throws(() => loadConfig({ AUTH_SSO: 'on', SSO_CLIENT_ID: 'x', PUBLIC_URL: 'http://192.168.1.1:8205' }), /PUBLIC_URL/);
  assert.ok(loadConfig({ AUTH_SSO: 'on', SSO_CLIENT_ID: 'x', PUBLIC_URL: 'http://localhost:8205' }).auth.sso);
});

test('no portal link unless both PORTAL_URL and PORTAL_NAME are set', () => {
  const c = loadConfig({ PORTAL_URL: 'https://p.example' });
  assert.equal(c.portalName, '');
});
