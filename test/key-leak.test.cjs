'use strict';
// The shared AI key never reaches the browser: not in the built bundle, not in
// any server response (including errors from the AI service that quote the
// request), not in the logs. Uses the real key file; nothing here prints the
// key or any part of it, and failure messages name only where it was found.
//
//   SERVER_AI_KEY_FILE=<key file>       required, else these tests are skipped
//   TAPESTRY_DIST=<built dist dir>      default ./dist
//   TAPESTRY_URL=<running instance>     optional, e.g. http://127.0.0.1:8205: also
//                                       scans its page, every script and style it loads,
//                                       and its open endpoints
//
// e.g. docker run --rm --network host -u $(id -u):$(id -g) -e HOME=/tmp -v "$PWD":/app -w /app \
//        -v ~/.secrets/tapestry-dev-openai-key:/run/key:ro -e SERVER_AI_KEY_FILE=/run/key \
//        -e TAPESTRY_URL=http://127.0.0.1:8205 node:24-bookworm node --test test/key-leak.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const keyFile = process.env.SERVER_AI_KEY_FILE;
let key = '';
try { key = keyFile ? fs.readFileSync(keyFile, 'utf8').trim() : ''; } catch { key = ''; }
const skip = key.length >= 20 ? false : 'set SERVER_AI_KEY_FILE to a readable key file';

// The whole key, its first 14 and its last 10 characters.
const needles = () => [key, key.slice(0, 14), key.slice(-10)];
const leaks = (text) => needles().some((n) => String(text).includes(n));

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

test('the built bundle holds no part of the key', { skip }, (t) => {
  const dist = path.resolve(process.env.TAPESTRY_DIST || path.join(__dirname, '..', 'dist'));
  if (!fs.existsSync(path.join(dist, 'index.html'))) return t.skip(`no build at ${dist}`);
  const found = walk(dist).filter((f) => leaks(fs.readFileSync(f, 'latin1'))).map((f) => path.relative(dist, f));
  assert.deepEqual(found, [], 'key found in the bundle');
  assert.ok(walk(dist).length > 1);
});

test('a running instance serves no part of the key', { skip: skip || (!process.env.TAPESTRY_URL && 'set TAPESTRY_URL') }, async () => {
  const base = process.env.TAPESTRY_URL.replace(/\/+$/, '');
  const seen = new Set();
  const found = [];
  async function scan(p) {
    if (seen.has(p)) return '';
    seen.add(p);
    const r = await fetch(base + p, { redirect: 'manual' });
    const text = await r.text();
    const headers = [...r.headers].map(([k, v]) => `${k}: ${v}`).join('\n');
    if (leaks(text) || leaks(headers)) found.push(p);
    return text;
  }
  for (const p of ['/', '/local', '/healthz', '/readyz', '/api/session', '/api/ai/v1/chat/completions', '/nope']) await scan(p);
  // the page and every script/style it loads (signed in or not, the bundle is the same)
  const dist = path.resolve(process.env.TAPESTRY_DIST || path.join(__dirname, '..', 'dist'));
  const html = fs.existsSync(path.join(dist, 'index.html')) ? fs.readFileSync(path.join(dist, 'index.html'), 'utf8') : '';
  const assets = [...html.matchAll(/(?:src|href)="(\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]);
  for (const a of assets) await scan(a);
  const r = await fetch(base + '/api/ai/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"messages":[{"role":"user","content":"x"}]}' });
  if (leaks(await r.text())) found.push('POST /api/ai/v1/chat/completions');
  assert.deepEqual(found, [], 'key found in a response');
});

test('no server response or log line carries the key, even when the AI service quotes the request', { skip }, async () => {
  const { createApp } = require('../server/index.js');
  const { loadConfig } = require('../server/config.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tapestry-leak-'));
  fs.mkdirSync(path.join(dir, 'dist'));
  fs.writeFileSync(path.join(dir, 'dist', 'index.html'), '<div id="root"></div>');
  let status = 200;
  // A worst-case AI service: it quotes the Authorization header back in errors,
  // and in every field of a successful reply that the server does not pass on.
  const fetchImpl = async (url, init) => {
    const auth = init.headers.Authorization;
    if (auth !== `Bearer ${key}`) throw new Error('server did not send its key upstream');
    const body = status === 200
      ? { id: auth, system_fingerprint: auth, model: auth, choices: [{ message: { role: 'assistant', content: 'ok', refusal: auth, audio: auth, annotations: [auth], tool_calls: [{ id: auth, type: 'function', function: { name: 'f', arguments: '{}' } }] }, logprobs: auth, finish_reason: auth }], usage: { prompt_tokens: auth, completion_tokens: 1, total_tokens: 2, detail: auth } }
      : { error: { message: `Request had header Authorization: ${auth} (key ending ${key.slice(-10)})`, param: auth } };
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'x-echo': auth } });
  };
  const logged = [];
  const orig = { log: console.log, error: console.error, warn: console.warn };
  for (const k of Object.keys(orig)) console[k] = (...a) => logged.push(a.map(String).join(' '));
  const config = loadConfig({ DATA_DIR: path.join(dir, 'data'), DIST_DIR: path.join(dir, 'dist'), SERVER_AI_KEY_FILE: keyFile, SERVER_AI_RPM: '50' });
  const made = createApp(config, { fetchImpl });
  const server = made.app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const found = [];
  try {
    made.auth.store.addLocalUser('leak', 'leak', 'pw-123456789');
    const lr = await fetch(base + '/local', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ username: 'leak', password: 'pw-123456789', next: '/' }) });
    const cookie = lr.headers.get('set-cookie').split(';')[0];
    const check = async (label, r) => {
      const text = await r.text();
      if (leaks(text) || leaks([...r.headers].join('\n'))) found.push(label);
    };
    for (const p of ['/', '/healthz', '/readyz', '/api/session']) await check(p, await fetch(base + p, { headers: { cookie } }));
    for (const s of [200, 400, 401, 403, 404, 429, 500, 503]) {
      status = s;
      await check(`AI ${s}`, await fetch(base + '/api/ai/v1/chat/completions', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'x' }] }) }));
    }
  } finally {
    Object.assign(console, orig);
    server.close();
    made.db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
  assert.deepEqual(found, [], 'key found in a response');
  assert.ok(logged.length > 0, 'the server logged its AI calls');
  assert.equal(logged.filter(leaks).length, 0, 'key found in the logs');
});
