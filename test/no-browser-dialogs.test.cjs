'use strict';
// House rule: in-page controls for every message and question, never the
// browser's alert/confirm/prompt dialogs. The server side is clean; the React
// front end still has legacy calls (being replaced), so for now this test only
// fails on new ones: files not in LEGACY, or more calls than recorded there.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const BANNED = /\b(?:window\.)?(?:alert|confirm|prompt)\s*\(|onbeforeunload|addEventListener\(\s*['"]beforeunload/;
const root = path.join(__dirname, '..');

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (['node_modules', 'dist', 'data', '.git', 'test'].includes(e.name)) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p) : /\.(js|cjs|mjs|ts|tsx|html)$/.test(e.name) ? [p] : [];
  });
}
function hits() {
  const out = {};
  for (const f of files(root)) {
    fs.readFileSync(f, 'utf8').split('\n').forEach((line) => {
      if (BANNED.test(line) && !/^\s*(\/\/|\*)/.test(line)) {
        const k = path.relative(root, f);
        out[k] = (out[k] || 0) + 1;
      }
    });
  }
  return out;
}

const LEGACY = JSON.parse(fs.readFileSync(path.join(__dirname, 'browser-dialogs-legacy.json'), 'utf8'));

test('no new browser dialogs', () => {
  const now = hits();
  const worse = Object.entries(now).filter(([f, n]) => n > (LEGACY[f] || 0)).map(([f, n]) => `${f}: ${n} (allowed ${LEGACY[f] || 0})`);
  assert.deepEqual(worse, [], "use the app's own toast/confirm instead of alert/confirm/prompt");
});
