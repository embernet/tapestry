'use strict';
// Shared AI for every signed-in user: an OpenAI-compatible endpoint whose API
// key lives only on the server.
//
//   POST /api/ai/v1/chat/completions   (signed-in users; mounted behind requireUser)
//
// The browser never sees the key: the page calls this route with no key, and the
// server adds it. Only a safe subset of the request is forwarded (model from the
// allowlist, messages, tools, structured output, temperature; see validate). Per-user rate limit, per-user
// daily usage in the app DB (table ai_usage).
//
// Settings (environment):
//   SERVER_AI_KEY_FILE   file holding the API key (one line). Missing/empty = feature off.
//   SERVER_AI_BASE_URL   default https://api.openai.com/v1
//   SERVER_AI_MODEL      default model, default gpt-5.6
//   SERVER_AI_MODELS     optional comma list users may pick from (always includes SERVER_AI_MODEL)
//   SERVER_AI_LABEL      name shown in Settings, default "OpenAI"
//   SERVER_AI_RPM        requests per user per minute, default 30
const fs = require('node:fs');
const express = require('express');

const MAX_MESSAGES = 200;
const MAX_CHARS = 1_500_000;      // message text, tool definitions, tool arguments and schemas together
const MAX_TOOLS = 32;
const MAX_TOOL_CALLS = 32;        // per assistant message
const NAME = /^[A-Za-z0-9_-]{1,64}$/;
const CALL_ID = /^[A-Za-z0-9_.:-]{1,100}$/;

function loadAiConfig(env = process.env) {
  if (env.SERVER_AI_KEY || env.OPENAI_API_KEY) {
    throw new Error('Pass the AI key as a file (SERVER_AI_KEY_FILE), never as an environment value');
  }
  let key = '';
  if (env.SERVER_AI_KEY_FILE) {
    try {
      key = fs.readFileSync(env.SERVER_AI_KEY_FILE, 'utf8').trim();
    } catch (e) {
      if (e.code !== 'ENOENT') throw new Error(`SERVER_AI_KEY_FILE: ${e.code || e.message}`);
    }
  }
  const model = (env.SERVER_AI_MODEL || 'gpt-5.6').trim();
  const models = [...new Set([model, ...String(env.SERVER_AI_MODELS || '').split(',').map((s) => s.trim()).filter(Boolean)])];
  const rpm = Number(env.SERVER_AI_RPM || 30);
  if (!(Number.isInteger(rpm) && rpm > 0 && rpm <= 1000)) throw new Error('SERVER_AI_RPM must be 1-1000');
  return {
    enabled: Boolean(key),
    key,
    baseUrl: (env.SERVER_AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
    model,
    models,
    label: String(env.SERVER_AI_LABEL || 'OpenAI').trim().slice(0, 40),
    rpm,
  };
}

// Never let anything that looks like a key reach the browser or the logs.
// With `key`, any run of 8+ key-like characters that is part of the key, or holds
// 12 characters of it in a row, goes too (an upstream message may quote a
// key's tail without its "sk-").
function redact(s, key) {
  let out = String(s || '');
  if (key) {
    out = out.split(key).join('[key]');
    const windows = [];
    for (let i = 0; i + 12 <= key.length; i++) windows.push(key.slice(i, i + 12));
    out = out.replace(/[A-Za-z0-9_\-*.]{8,}/g, (t) => (key.includes(t) || windows.some((w) => t.includes(w)) ? '[key]' : t));
  }
  return out.replace(/sk-[A-Za-z0-9_\-*.]{4,}/g, 'sk-…').replace(/Bearer\s+\S+/gi, 'Bearer …').slice(0, 500);
}

const FINISH = new Set(['stop', 'length', 'tool_calls', 'content_filter', 'function_call']);
const num = (v) => (Number.isFinite(Number(v)) && v !== null && v !== undefined ? Number(v) : undefined);
const isPlainObject = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const jsonSize = (v) => JSON.stringify(v).length;

// Only the parts of the OpenAI chat completions API that Tapestry uses are
// forwarded: model (from the allowlist), messages (text, tool calls and tool
// results), tools (functions), tool_choice, response_format (json_object or
// json_schema) and temperature. Everything else is dropped.
function validate(body, cfg) {
  if (!isPlainObject(body)) return { error: 'send a JSON body' };
  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) return { error: 'messages must be a non-empty array' };
  if (messages.length > MAX_MESSAGES) return { error: `at most ${MAX_MESSAGES} messages` };
  let chars = 0;
  const clean = [];
  const callIds = new Set();
  for (const m of messages) {
    if (!isPlainObject(m)) return { error: 'each message must be an object' };
    if (m.role === 'system' || m.role === 'user') {
      if (typeof m.content !== 'string') return { error: 'each message needs role system|user|assistant|tool and string content' };
      chars += m.content.length;
      clean.push({ role: m.role, content: m.content });
    } else if (m.role === 'assistant') {
      const hasCalls = Array.isArray(m.tool_calls) && m.tool_calls.length > 0;
      if (!(typeof m.content === 'string' || (hasCalls && (m.content === null || m.content === undefined)))) {
        return { error: 'an assistant message needs string content or tool_calls' };
      }
      const out = { role: 'assistant', content: typeof m.content === 'string' ? m.content : null };
      if (typeof m.content === 'string') chars += m.content.length;
      if (hasCalls) {
        if (m.tool_calls.length > MAX_TOOL_CALLS) return { error: `at most ${MAX_TOOL_CALLS} tool calls a message` };
        out.tool_calls = [];
        for (const c of m.tool_calls) {
          if (!isPlainObject(c) || typeof c.id !== 'string' || !CALL_ID.test(c.id) || !isPlainObject(c.function)
            || typeof c.function.name !== 'string' || !NAME.test(c.function.name) || typeof c.function.arguments !== 'string') {
            return { error: 'each tool call needs an id and a function with a name and string arguments' };
          }
          chars += c.function.arguments.length;
          callIds.add(c.id);
          out.tool_calls.push({ id: c.id, type: 'function', function: { name: c.function.name, arguments: c.function.arguments } });
        }
      }
      clean.push(out);
    } else if (m.role === 'tool') {
      if (typeof m.tool_call_id !== 'string' || !callIds.has(m.tool_call_id) || typeof m.content !== 'string') {
        return { error: 'a tool message needs string content and the tool_call_id of an earlier tool call' };
      }
      chars += m.content.length;
      clean.push({ role: 'tool', tool_call_id: m.tool_call_id, content: m.content });
    } else {
      return { error: 'each message needs role system|user|assistant|tool and string content' };
    }
  }
  const out = {
    model: cfg.models.includes(body.model) ? body.model : cfg.model,
    messages: clean,
  };

  if (body.tools !== undefined) {
    if (!Array.isArray(body.tools) || body.tools.length > MAX_TOOLS) return { error: `tools must be an array of at most ${MAX_TOOLS} functions` };
    if (body.tools.length) {
      out.tools = [];
      for (const t of body.tools) {
        const f = isPlainObject(t) && t.type === 'function' ? t.function : null;
        if (!isPlainObject(f) || typeof f.name !== 'string' || !NAME.test(f.name)
          || (f.description !== undefined && typeof f.description !== 'string')
          || (f.parameters !== undefined && !isPlainObject(f.parameters))) {
          return { error: 'each tool must be { type: "function", function: { name, description?, parameters? } }' };
        }
        const fn = { name: f.name };
        if (f.description) fn.description = f.description.slice(0, 1024);
        if (f.parameters) fn.parameters = f.parameters;
        chars += jsonSize(fn);
        out.tools.push({ type: 'function', function: fn });
      }
      const tc = body.tool_choice;
      if (tc === 'auto' || tc === 'none' || tc === 'required') out.tool_choice = tc;
      else if (isPlainObject(tc) && tc.type === 'function' && isPlainObject(tc.function) && out.tools.some((t) => t.function.name === tc.function.name)) {
        out.tool_choice = { type: 'function', function: { name: tc.function.name } };
      }
    }
  }

  const rf = body.response_format;
  if (isPlainObject(rf) && rf.type === 'json_object') out.response_format = { type: 'json_object' };
  else if (isPlainObject(rf) && rf.type === 'json_schema') {
    const js = rf.json_schema;
    if (!isPlainObject(js) || typeof js.name !== 'string' || !NAME.test(js.name) || !isPlainObject(js.schema)) {
      return { error: 'response_format json_schema needs a name and a schema object' };
    }
    const schema = { name: js.name, schema: js.schema };
    if (typeof js.strict === 'boolean') schema.strict = js.strict;
    if (typeof js.description === 'string') schema.description = js.description.slice(0, 1024);
    chars += jsonSize(schema);
    out.response_format = { type: 'json_schema', json_schema: schema };
  }
  if (chars > MAX_CHARS) return { error: 'request too large' };
  if (typeof body.temperature === 'number' && body.temperature >= 0 && body.temperature <= 2) out.temperature = body.temperature;
  return { value: out };
}

function createAi({ db, config, fetchImpl = fetch, log = console }) {
  const cfg = config;
  db.exec(`CREATE TABLE IF NOT EXISTS ai_usage (
    day TEXT NOT NULL, user_id TEXT NOT NULL, username TEXT,
    requests INTEGER NOT NULL DEFAULT 0, prompt_tokens INTEGER NOT NULL DEFAULT 0, completion_tokens INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, user_id))`);
  const record = db.prepare(`INSERT INTO ai_usage (day, user_id, username, requests, prompt_tokens, completion_tokens)
    VALUES (?, ?, ?, 1, ?, ?)
    ON CONFLICT(day, user_id) DO UPDATE SET requests = requests + 1, username = excluded.username,
      prompt_tokens = prompt_tokens + excluded.prompt_tokens, completion_tokens = completion_tokens + excluded.completion_tokens`);

  const recent = new Map(); // user id -> timestamps (ms) in the last minute
  function limited(userId) {
    const now = Date.now();
    const list = (recent.get(userId) || []).filter((t) => now - t < 60_000);
    if (list.length >= cfg.rpm) { recent.set(userId, list); return true; }
    list.push(now);
    recent.set(userId, list);
    return false;
  }
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of recent) if (!v.some((t) => now - t < 60_000)) recent.delete(k);
  }, 300_000).unref();

  const router = express.Router();

  router.post('/api/ai/v1/chat/completions', express.json({ limit: '4mb' }), async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!cfg.enabled) return res.status(503).json({ error: { message: 'Shared AI is not set up on this server. Choose a provider with your own key in Settings.' } });
    const check = validate(req.body, cfg);
    if (check.error) return res.status(400).json({ error: { message: check.error } });
    if (limited(req.user.id)) {
      return res.status(429).json({ error: { message: `Too many AI requests: the limit is ${cfg.rpm} a minute. Try again shortly.` } });
    }

    const started = Date.now();
    const send = (body) => fetchImpl(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    });
    let upstream, data;
    try {
      upstream = await send(check.value);
      data = await upstream.json().catch(() => null);
      // Reasoning models (e.g. gpt-5.x) take function tools on chat completions
      // only with reasoning switched off; other models reject the parameter, so
      // it is added only when the service asks for it, and only once.
      if (upstream.status === 400 && check.value.tools && /reasoning_effort/.test(String(data?.error?.message || ''))) {
        upstream = await send({ ...check.value, reasoning_effort: 'none' });
        data = await upstream.json().catch(() => null);
      }
    } catch (e) {
      log.error(`[ai] ${req.user.username}: upstream unreachable: ${redact(e.message, cfg.key)}`);
      return res.status(502).json({ error: { message: 'The AI service could not be reached. Try again later.' } });
    }

    if (!upstream.ok) {
      const detail = redact(data?.error?.message || upstream.statusText, cfg.key);
      log.error(`[ai] ${req.user.username}: upstream ${upstream.status}: ${detail}`);
      let message = `The AI service returned an error (${upstream.status}): ${detail}`;
      if (upstream.status === 401 || upstream.status === 403) message = 'The server\'s AI key was refused. Ask the administrator to check it.';
      if (upstream.status === 429) message = 'The shared AI is busy or its quota is used up. Try again later.';
      return res.status(upstream.status === 400 ? 400 : 502).json({ error: { message } });
    }

    const usage = data?.usage || {};
    try {
      record.run(new Date().toISOString().slice(0, 10), req.user.id, req.user.username,
        Number(usage.prompt_tokens) || 0, Number(usage.completion_tokens) || 0);
    } catch (e) {
      log.error(`[ai] usage not recorded: ${redact(e.message, cfg.key)}`);
    }
    log.log(`[ai] ${req.user.username} ${check.value.model} ${num(usage.prompt_tokens) ?? '?'}+${num(usage.completion_tokens) ?? '?'} tokens ${Date.now() - started} ms`);

    // Rebuilt field by field: nothing else from the upstream reply is passed on.
    const msg = data?.choices?.[0]?.message || {};
    const message = { role: 'assistant', content: typeof msg.content === 'string' ? msg.content : '' };
    if (typeof msg.refusal === 'string' && msg.refusal) message.refusal = redact(msg.refusal, cfg.key);
    const toolCalls = (Array.isArray(msg.tool_calls) ? msg.tool_calls : [])
      .filter((c) => c && c.function && typeof c.function.name === 'string')
      .slice(0, MAX_TOOL_CALLS)
      .map((c) => ({ id: redact(c.id, cfg.key).slice(0, 100), type: 'function', function: { name: c.function.name, arguments: typeof c.function.arguments === 'string' ? c.function.arguments : '{}' } }));
    if (toolCalls.length) message.tool_calls = toolCalls;
    res.json({
      model: typeof data?.model === 'string' ? redact(data.model, cfg.key).slice(0, 100) : check.value.model,
      choices: [{ index: 0, message, finish_reason: FINISH.has(data?.choices?.[0]?.finish_reason) ? data.choices[0].finish_reason : null }],
      usage: { prompt_tokens: num(usage.prompt_tokens), completion_tokens: num(usage.completion_tokens), total_tokens: num(usage.total_tokens) },
    });
  });

  // What the page may know: never the key.
  function info() {
    return cfg.enabled ? { available: true, label: cfg.label, model: cfg.model, models: cfg.models } : { available: false };
  }

  return { router, info };
}

module.exports = { loadAiConfig, createAi, redact };
