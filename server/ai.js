'use strict';
// Shared AI for every signed-in user: an OpenAI-compatible endpoint whose API
// key lives only on the server.
//
//   POST /api/ai/v1/chat/completions   (signed-in users; mounted behind requireUser)
//
// The browser never sees the key: the page calls this route with no key, and the
// server adds it. Only a safe subset of the request is forwarded (model from the
// allowlist, messages, JSON mode, temperature). Per-user rate limit, per-user
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
const MAX_CHARS = 1_500_000;
const ROLES = new Set(['system', 'user', 'assistant']);

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
function redact(s) {
  return String(s || '').replace(/sk-[A-Za-z0-9_\-*.]{4,}/g, 'sk-…').slice(0, 500);
}

function validate(body, cfg) {
  if (!body || typeof body !== 'object') return { error: 'send a JSON body' };
  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) return { error: 'messages must be a non-empty array' };
  if (messages.length > MAX_MESSAGES) return { error: `at most ${MAX_MESSAGES} messages` };
  let chars = 0;
  const clean = [];
  for (const m of messages) {
    if (!m || !ROLES.has(m.role) || typeof m.content !== 'string') return { error: 'each message needs role system|user|assistant and string content' };
    chars += m.content.length;
    clean.push({ role: m.role, content: m.content });
  }
  if (chars > MAX_CHARS) return { error: 'request too large' };
  const out = {
    model: cfg.models.includes(body.model) ? body.model : cfg.model,
    messages: clean,
  };
  if (body.response_format && body.response_format.type === 'json_object') out.response_format = { type: 'json_object' };
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
    let upstream;
    try {
      upstream = await fetchImpl(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
        body: JSON.stringify(check.value),
        signal: AbortSignal.timeout(180_000),
      });
    } catch (e) {
      log.error(`[ai] ${req.user.username}: upstream unreachable: ${redact(e.message)}`);
      return res.status(502).json({ error: { message: 'The AI service could not be reached. Try again later.' } });
    }

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const detail = redact(data?.error?.message || upstream.statusText);
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
      log.error(`[ai] usage not recorded: ${e.message}`);
    }
    log.log(`[ai] ${req.user.username} ${check.value.model} ${usage.prompt_tokens ?? '?'}+${usage.completion_tokens ?? '?'} tokens ${Date.now() - started} ms`);

    const msg = data?.choices?.[0]?.message || {};
    res.json({
      model: data?.model || check.value.model,
      choices: [{ index: 0, message: { role: 'assistant', content: typeof msg.content === 'string' ? msg.content : '' }, finish_reason: data?.choices?.[0]?.finish_reason || null }],
      usage: { prompt_tokens: usage.prompt_tokens, completion_tokens: usage.completion_tokens, total_tokens: usage.total_tokens },
    });
  });

  // What the page may know: never the key.
  function info() {
    return cfg.enabled ? { available: true, label: cfg.label, model: cfg.model, models: cfg.models } : { available: false };
  }

  return { router, info };
}

module.exports = { loadAiConfig, createAi, redact };
