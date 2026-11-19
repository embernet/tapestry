'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../server/index.js');
const { loadConfig } = require('../server/config.js');
const { loadAiConfig, redact } = require('../server/ai.js');

const KEY = 'sk-test-SECRET-0123456789abcdef';
let server, base, dir, db, auth, calls, upstream;

test.before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tapestry-ai-'));
  fs.mkdirSync(path.join(dir, 'dist'));
  fs.writeFileSync(path.join(dir, 'dist', 'index.html'), '<div id="root"></div>');
  fs.writeFileSync(path.join(dir, 'key'), KEY + '\n', { mode: 0o600 });
  calls = [];
  upstream = { status: 200, body: { model: 'gpt-4o', choices: [{ message: { role: 'assistant', content: 'hello' }, finish_reason: 'stop' }], usage: { prompt_tokens: 7, completion_tokens: 3, total_tokens: 10 } } };
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    return new Response(JSON.stringify(upstream.body), { status: upstream.status, headers: { 'content-type': 'application/json' } });
  };
  const config = loadConfig({ DATA_DIR: path.join(dir, 'data'), DIST_DIR: path.join(dir, 'dist'), SERVER_AI_KEY_FILE: path.join(dir, 'key'), SERVER_AI_MODELS: 'gpt-4o-mini', SERVER_AI_RPM: '3' });
  const made = createApp(config, { fetchImpl });
  ({ db, auth } = made);
  server = made.app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => { server.close(); db.close(); fs.rmSync(dir, { recursive: true, force: true }); });

let seq = 0;
async function login() {
  const u = `u${++seq}`;
  auth.store.addLocalUser(u, u, 'pw-123456789');
  const r = await fetch(base + '/local', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ username: u, password: 'pw-123456789', next: '/' }) });
  return r.headers.get('set-cookie').split(';')[0];
}
const chat = (cookie, body) => fetch(base + '/api/ai/v1/chat/completions', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('needs a sign-in', async () => {
  const r = await fetch(base + '/api/ai/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 401);
});

test('session advertises shared AI but never the key', async () => {
  const cookie = await login();
  const text = await (await fetch(base + '/api/session', { headers: { cookie } })).text();
  assert.ok(!text.includes(KEY) && !text.includes('SECRET'));
  assert.deepEqual(JSON.parse(text).ai, { available: true, label: 'OpenAI', model: 'gpt-4o', models: ['gpt-4o', 'gpt-4o-mini'] });
});

test('forwards a cleaned request with the server key and records usage', async () => {
  const cookie = await login();
  calls.length = 0;
  const r = await chat(cookie, { model: 'gpt-5-expensive', messages: [{ role: 'system', content: 's' }, { role: 'user', content: 'hi', extra: 1 }], response_format: { type: 'json_object' }, n: 50, tools: [{}] });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.choices[0].message.content, 'hello');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${KEY}`);
  assert.deepEqual(calls[0].body, { model: 'gpt-4o', messages: [{ role: 'system', content: 's' }, { role: 'user', content: 'hi' }], response_format: { type: 'json_object' } });
  const row = db.prepare('SELECT requests, prompt_tokens, completion_tokens FROM ai_usage WHERE username = ?').get(`u${seq}`);
  assert.deepEqual({ ...row }, { requests: 1, prompt_tokens: 7, completion_tokens: 3 });

  await chat(cookie, { model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'x' }] });
  assert.equal(calls[1].body.model, 'gpt-4o-mini');
});

test('rejects malformed messages', async () => {
  const cookie = await login();
  for (const body of [{}, { messages: [] }, { messages: [{ role: 'tool', content: 'x' }] }, { messages: [{ role: 'user', content: {} }] }]) {
    assert.equal((await chat(cookie, body)).status, 400);
  }
});

test('per-user rate limit', async () => {
  const cookie = await login();
  const ok = { messages: [{ role: 'user', content: 'x' }] };
  for (let i = 0; i < 3; i++) assert.equal((await chat(cookie, ok)).status, 200);
  assert.equal((await chat(cookie, ok)).status, 429);
  assert.equal((await chat(await login(), ok)).status, 200); // others unaffected
});

test('upstream errors never echo the key', async () => {
  const cookie = await login();
  upstream = { status: 401, body: { error: { message: `Incorrect API key provided: ${KEY}` } } };
  const r = await chat(cookie, { messages: [{ role: 'user', content: 'x' }] });
  const text = await r.text();
  assert.equal(r.status, 502);
  assert.ok(!text.includes('SECRET'), text);
  assert.match(text, /key was refused/);
});

test('config: no key file means off; key in env is refused', () => {
  assert.equal(loadAiConfig({}).enabled, false);
  assert.equal(loadAiConfig({ SERVER_AI_KEY_FILE: '/nonexistent/key' }).enabled, false);
  assert.throws(() => loadAiConfig({ OPENAI_API_KEY: 'sk-x' }), /as a file/);
  assert.equal(redact('bad key sk-abc123XYZ_-*** here'), 'bad key sk-… here');
});
