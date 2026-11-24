'use strict';
// House rule: every AI feature goes through callAI (utils.ts). With the
// Tapestry server's shared AI selected, callAI sends the request to this
// origin's /api/ai/v1/chat/completions with no key; no component talks to an
// AI provider, its SDK or its URL itself. The Gemini SDK lives only in
// services/geminiClient.ts, loaded only for a user's own Gemini key.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (['node_modules', 'dist', 'data', '.git', 'test', 'server', 'scripts'].includes(e.name)) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p) : /\.(js|mjs|ts|tsx)$/.test(e.name) ? [p] : [];
  });
}
const sources = files(root).map((f) => ({ file: path.relative(root, f).split(path.sep).join('/'), text: fs.readFileSync(f, 'utf8') }));
const code = (text) => text.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
const where = (re, allowed = []) => sources.filter((s) => re.test(code(s.text)) && !allowed.includes(s.file)).map((s) => s.file);

test('only services/geminiClient.ts uses the Gemini SDK', () => {
  assert.deepEqual(where(/@google\/genai|GoogleGenAI/, ['services/geminiClient.ts']), []);
});

test('the Gemini client is loaded only on demand, for the gemini provider', () => {
  assert.deepEqual(where(/from\s+['"][./]*(services\/)?geminiClient['"]/), [], 'no static import of geminiClient');
  const users = sources.filter((s) => /geminiClient/.test(code(s.text)) && s.file !== 'services/geminiClient.ts');
  assert.deepEqual(users.map((s) => s.file), ['utils.ts']);
  const utils = code(users[0].text);
  const at = utils.indexOf("import('./services/geminiClient')");
  assert.ok(at > 0, 'dynamic import');
  assert.match(utils.slice(Math.max(0, at - 200), at), /config\.provider === 'gemini'/);
});

test('AI provider URLs appear only in the request helper and the own-key settings forms', () => {
  const urls = /generativelanguage\.googleapis\.com|api\.openai\.com|api\.anthropic\.com|api\.x\.ai|\/chat\/completions/;
  assert.deepEqual(where(urls, ['services/aiRequest.ts', 'components/SettingsModal.tsx', 'components/ApiKeyModal.tsx']), []);
});

test('network calls from the page come only from known places', () => {
  // utils.ts: callAI (URL from services/aiRequest.ts); serverSession: /api/session;
  // BulkEditToolbar: this origin's /system_automations; usePersistence: GitHub Gists (not AI).
  assert.deepEqual(where(/\bfetch\s*\(/, ['utils.ts', 'services/serverSession.ts', 'components/BulkEditToolbar.tsx', 'hooks/usePersistence.ts']), []);
  assert.deepEqual(where(/XMLHttpRequest|new\s+WebSocket|new\s+EventSource|sendBeacon|\baxios\b/), []);
  const bulk = sources.find((s) => s.file === 'components/BulkEditToolbar.tsx').text;
  assert.ok(bulk.match(/fetch\(([^)]*)\)/g).every((c) => /fetch\(`\/system_automations\//.test(c)));
  const persist = sources.find((s) => s.file === 'hooks/usePersistence.ts').text;
  assert.ok(persist.match(/fetch\(([^,)]*)/g).every((c) => /api\.github\.com/.test(c)));
});

test('callAI sends the server provider to this origin without a key', () => {
  const utils = code(sources.find((s) => s.file === 'utils.ts').text);
  const fetches = utils.match(/fetch\s*\([^,]*/g) || [];
  assert.deepEqual(fetches, ['fetch(url'], 'callAI fetches only the URL from chatCompletionsEndpoint');
  assert.match(utils, /const \{ url, headers \} = chatCompletionsEndpoint\(config\)/);
  assert.doesNotMatch(utils, /process\.env/);
});

test('every AI feature calls callAI, not a client of its own', () => {
  const callers = sources.filter((s) => /\bcallAI\s*\(/.test(code(s.text)) && s.file !== 'utils.ts').map((s) => s.file).sort();
  for (const f of ['components/SsmModal.tsx', 'components/TrizModal.tsx', 'components/LssModal.tsx', 'components/TocModal.tsx',
    'components/SwotModal.tsx', 'components/ScamperModal.tsx', 'components/TagCloudModal.tsx', 'components/ScriptPanel.tsx',
    'components/ChatPanel/useChatLogic.ts', 'components/ChatPanel/usePlanExecution.ts', 'hooks/useScriptTools.ts']) {
    assert.ok(callers.includes(f), `${f} uses callAI`);
  }
  assert.deepEqual(where(/generateContent|\.chats\.create|chat\.completions\.create|new\s+OpenAI\b/, ['services/geminiClient.ts']), []);
});

test('the build never bakes a key into the page', () => {
  const vite = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
  assert.match(vite, /throw new Error\(`\$\{name\} is set/);
  assert.doesNotMatch(code(vite), /JSON\.stringify\(env\./);
});
