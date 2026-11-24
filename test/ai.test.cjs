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
    const u = typeof upstream === 'function' ? upstream() : upstream;
    return new Response(JSON.stringify(u.body), { status: u.status, headers: { 'content-type': 'application/json' } });
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
  assert.deepEqual(JSON.parse(text).ai, { available: true, label: 'OpenAI', model: 'gpt-5.6', models: ['gpt-5.6', 'gpt-4o-mini'] });
});

test('forwards a cleaned request with the server key and records usage', async () => {
  const cookie = await login();
  calls.length = 0;
  const r = await chat(cookie, { model: 'gpt-5-expensive', messages: [{ role: 'system', content: 's' }, { role: 'user', content: 'hi', extra: 1 }], response_format: { type: 'json_object' }, n: 50, logprobs: true, stream: true });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.choices[0].message.content, 'hello');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${KEY}`);
  assert.deepEqual(calls[0].body, { model: 'gpt-5.6', messages: [{ role: 'system', content: 's' }, { role: 'user', content: 'hi' }], response_format: { type: 'json_object' } });
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

const TOOL = { type: 'function', function: { name: 'updateScript', description: 'Replace the script', parameters: { type: 'object', properties: { newCode: { type: 'string' } }, required: ['newCode'] } } };
const SCHEMA = { type: 'json_schema', json_schema: { name: 'response', schema: { type: 'object', properties: { analysis: { type: 'string' } } }, strict: false } };

test('forwards tools, tool_choice and a json_schema response format; returns tool calls only', async () => {
  const cookie = await login();
  calls.length = 0;
  upstream = { status: 200, body: { model: 'gpt-5.6', system_fingerprint: 'fp', choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'updateScript', arguments: '{"newCode":"x"}' }, extra: 1 }], annotations: ['a'] }, finish_reason: 'tool_calls' }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } } };
  const r = await chat(cookie, { messages: [{ role: 'user', content: 'hi' }], tools: [{ ...TOOL, extra: 1 }], tool_choice: 'auto', response_format: SCHEMA, parallel_tool_calls: true });
  assert.equal(r.status, 200);
  assert.deepEqual(calls[0].body, { model: 'gpt-5.6', messages: [{ role: 'user', content: 'hi' }], tools: [TOOL], tool_choice: 'auto', response_format: SCHEMA });
  const j = await r.json();
  assert.deepEqual(j.choices[0].message, { role: 'assistant', content: '', tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'updateScript', arguments: '{"newCode":"x"}' } }] });
  assert.equal(j.system_fingerprint, undefined);
  upstream = { status: 200, body: { choices: [{ message: { role: 'assistant', content: 'ok' } }], usage: {} } };
});

test('forwards a tool-call round trip: assistant tool_calls, then the tool result', async () => {
  const cookie = await login();
  calls.length = 0;
  const messages = [
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: null, tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'updateScript', arguments: '{}' } }] },
    { role: 'tool', tool_call_id: 'call_1', content: '{"ok":true}' },
  ];
  assert.equal((await chat(cookie, { messages, tools: [TOOL] })).status, 200);
  assert.deepEqual(calls[0].body.messages, messages);
});

test('tools on a reasoning model: retried once with reasoning_effort none when the service asks', async () => {
  const cookie = await login();
  calls.length = 0;
  const replies = [
    { status: 400, body: { error: { message: "Function tools with reasoning_effort are not supported for gpt-5.6 in /v1/chat/completions. To use function tools, use /v1/responses or set reasoning_effort to 'none'." } } },
    { status: 200, body: { choices: [{ message: { role: 'assistant', content: 'done' } }], usage: {} } },
  ];
  const saved = upstream;
  let i = 0;
  upstream = () => replies[Math.min(i++, 1)];
  const r = await chat(cookie, { messages: [{ role: 'user', content: 'hi' }], tools: [TOOL] });
  upstream = saved;
  assert.equal(r.status, 200);
  assert.equal((await r.json()).choices[0].message.content, 'done');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].body.reasoning_effort, undefined);
  assert.equal(calls[1].body.reasoning_effort, 'none');
  // without tools, a 400 is not retried
  calls.length = 0;
  i = 0;
  upstream = () => replies[0];
  assert.equal((await chat(await login(), { messages: [{ role: 'user', content: 'hi' }] })).status, 400);
  upstream = saved;
  assert.equal(calls.length, 1);
});

test('rejects malformed tools, tool messages and schemas, and oversized requests', async () => {
  const cookie = await login();
  calls.length = 0;
  const m = [{ role: 'user', content: 'x' }];
  const bad = [
    { messages: m, tools: [{}] },
    { messages: m, tools: [{ type: 'function', function: { name: 'has space' } }] },
    { messages: m, tools: [{ type: 'function', function: { name: 'f', parameters: 'x' } }] },
    { messages: m, tools: Array.from({ length: 33 }, (_, i) => ({ type: 'function', function: { name: `f${i}` } })) },
    { messages: m, tools: 'all' },
    { messages: [...m, { role: 'tool', tool_call_id: 'nope', content: 'x' }] },
    { messages: [...m, { role: 'assistant', content: null }] },
    { messages: [...m, { role: 'assistant', content: null, tool_calls: [{ id: 'c', function: { name: 'f', arguments: {} } }] }] },
    { messages: m, response_format: { type: 'json_schema', json_schema: { name: 'r' } } },
    { messages: m, response_format: { type: 'json_schema', json_schema: { name: 'r', schema: { big: 'x'.repeat(1_500_001) } } } },
    { messages: m, tools: [{ type: 'function', function: { name: 'f', parameters: { big: 'x'.repeat(1_500_001) } } }] },
  ];
  for (const body of bad) assert.equal((await chat(cookie, body)).status, 400, JSON.stringify(body).slice(0, 120));
  assert.equal(calls.length, 0, 'nothing malformed is sent upstream');
});

test('only the configured AI service is called, whatever the request says', async () => {
  const cookie = await login();
  calls.length = 0;
  await chat(cookie, { messages: [{ role: 'user', content: 'x' }], url: 'https://evil.example/', baseUrl: 'https://evil.example/', model: 'https://evil.example/' });
  assert.deepEqual(calls.map((c) => c.url), ['https://api.openai.com/v1/chat/completions']);
});

test('upstream errors that echo the request headers never reach the browser or the logs', async () => {
  const logged = [];
  const orig = { log: console.log, error: console.error };
  console.log = (...a) => logged.push(a.join(' '));
  console.error = (...a) => logged.push(a.join(' '));
  try {
    for (const status of [400, 401, 429, 500]) {
      upstream = { status, body: { error: { message: `Bad request. Headers: Authorization: Bearer ${KEY}; key ${KEY.slice(3)}` } } };
      const text = await (await chat(await login(), { messages: [{ role: 'user', content: 'x' }] })).text();
      assert.ok(!text.includes('SECRET'), `status ${status}: ${text}`);
    }
  } finally {
    Object.assign(console, orig);
    upstream = { status: 200, body: { choices: [{ message: { role: 'assistant', content: 'ok' } }], usage: {} } };
  }
  assert.ok(logged.length > 0);
  assert.ok(!logged.join('\n').includes('SECRET'), 'key in the logs');
});

test('config: no key file means off; key in env is refused', () => {
  assert.equal(loadAiConfig({}).enabled, false);
  assert.equal(loadAiConfig({ SERVER_AI_KEY_FILE: '/nonexistent/key' }).enabled, false);
  assert.throws(() => loadAiConfig({ OPENAI_API_KEY: 'sk-x' }), /as a file/);
  assert.equal(redact('bad key sk-abc123XYZ_-*** here'), 'bad key sk-… here');
  assert.equal(redact('k=abcdefSECRET1 Bearer xyz', 'abcdefSECRET1'), 'k=[key] Bearer …');
});
