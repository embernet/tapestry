'use strict';
// House rule: in-page controls for every message and question, never the
// browser's alert/confirm/prompt dialogs or a beforeunload "Leave site?" prompt.
// Use services/dialogs.ts (notify / confirmDialog / promptDialog) instead.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// alert( / window.alert( etc., but not someObject.prompt( (the Tapestry script API's ai.prompt).
const BANNED = /(?:^|[^.\w])(?:alert|confirm|prompt)\s*\(|window\.(?:alert|confirm|prompt)\s*\(|onbeforeunload|addEventListener\(\s*['"]beforeunload/;
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
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (BANNED.test(line) && !/^\s*(\/\/|\*)/.test(line)) {
        const k = path.relative(root, f);
        (out[k] = out[k] || []).push(`line ${i + 1}: ${line.trim().slice(0, 120)}`);
      }
    });
  }
  return out;
}

test('no browser dialogs in front-end or server code', () => {
  const found = hits();
  assert.deepEqual(found, {}, "use notify / confirmDialog / promptDialog from services/dialogs.ts");
});
