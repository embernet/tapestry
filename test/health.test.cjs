'use strict';
// The health endpoints module (server/health.js, standards §12): shape, 503,
// no error details, timeouts, and shared/cached checks.
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { mountHealth, resolveVersion } = require('../server/health.js');

async function serve(opts) {
  const app = express();
  mountHealth(app, { appName: 'demo', version: '1.2.3', log: () => {}, ...opts });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

test('a failing check gives 503 with its name and no error details', async (t) => {
  const logged = [];
  const s = await serve({
    log: (m) => logged.push(m),
    checks: { good: () => {}, bad: () => { throw new Error('secret-host:5432 refused'); } },
  });
  t.after(s.close);
  const r = await fetch(s.base + '/readyz');
  assert.equal(r.status, 503);
  assert.equal(r.headers.get('cache-control'), 'no-store');
  const text = await r.text();
  assert.doesNotMatch(text, /secret-host|refused/);
  const j = JSON.parse(text);
  assert.equal(j.status, 'unavailable');
  assert.deepEqual(j.failing, ['bad']);
  assert.equal(j.checks.good.ok, true);
  assert.equal(j.checks.bad.ok, false);
  assert.equal(j.app, 'demo');
  assert.equal(j.version, '1.2.3');
  assert.match(logged.join('\n'), /bad check failed: secret-host/); // the detail goes to the log
  // /healthz stays 200: alive, just not ready
  assert.equal((await fetch(s.base + '/healthz')).status, 200);
});

test('no checks: 200 with checks {}', async (t) => {
  const s = await serve({});
  t.after(s.close);
  const r = await fetch(s.base + '/readyz');
  assert.equal(r.status, 200);
  assert.deepEqual((await r.json()).checks, {});
});

test('a check that hangs times out', async (t) => {
  const s = await serve({ timeoutMs: 50, checks: { slow: () => new Promise(() => {}) } });
  t.after(s.close);
  const t0 = Date.now();
  const r = await fetch(s.base + '/readyz');
  assert.equal(r.status, 503);
  assert.deepEqual((await r.json()).failing, ['slow']);
  assert.ok(Date.now() - t0 < 1000);
});

test('checks are shared while in flight and reused briefly', async (t) => {
  let calls = 0;
  const s = await serve({ cacheMs: 200, checks: { db: async () => { calls++; await new Promise((r) => setTimeout(r, 30)); } } });
  t.after(s.close);
  await Promise.all([1, 2, 3, 4, 5].map(() => fetch(s.base + '/readyz').then((r) => r.json())));
  assert.equal(calls, 1);
  await fetch(s.base + '/readyz');
  assert.equal(calls, 1);
  await new Promise((r) => setTimeout(r, 250));
  await fetch(s.base + '/readyz');
  assert.equal(calls, 2);
});

test('resolveVersion strips the v and falls back to the package version', () => {
  assert.equal(resolveVersion('v1.0.0', '0.1.0'), '1.0.0');
  assert.equal(resolveVersion(' abc1234-dirty ', '0.1.0'), 'abc1234-dirty');
  assert.equal(resolveVersion('', '0.1.0'), '0.1.0');
  assert.equal(resolveVersion(undefined, '0.1.0'), '0.1.0');
});
