'use strict';
// "Open a file": which chooser to use, how a picker failure is read, where Save writes,
// and that every open goes through services/fileOpen.ts with an always-mounted input.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { choosePicker, classifyPickerFailure, chooseSaveTarget, PICKER_MIN_MS } = require('../utils/filePicker.ts');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const env = (o = {}) => ({ hasOpenFilePicker: true, isSecureContext: true, inIframe: false, pickerBlocked: false, ...o });

test('File System Access picker only where it exists and can work', () => {
  assert.equal(choosePicker(env()), 'file-system-access');                                   // Chrome, localhost / https
  assert.equal(choosePicker(env({ hasOpenFilePicker: false })), 'file-input');              // Firefox, Safari
  assert.equal(choosePicker(env({ hasOpenFilePicker: false, isSecureContext: false })), 'file-input'); // Chrome at http://<host IP>
  assert.equal(choosePicker(env({ isSecureContext: false })), 'file-input');
  assert.equal(choosePicker(env({ inIframe: true })), 'file-input');
  assert.equal(choosePicker(env({ pickerBlocked: true })), 'file-input');                   // refused earlier this session
});

test('a quick AbortError is a refused picker, a slow one is Cancel', () => {
  assert.equal(classifyPickerFailure({ name: 'AbortError' }, PICKER_MIN_MS + 1500), 'cancelled');
  assert.equal(classifyPickerFailure({ name: 'AbortError' }, 5), 'unavailable');
  assert.equal(classifyPickerFailure({ name: 'SecurityError' }, 5000), 'unavailable');
  assert.equal(classifyPickerFailure({ name: 'NotAllowedError' }, 5), 'unavailable');
  assert.equal(classifyPickerFailure(undefined, 5), 'unavailable');
});

test('Save writes back only with a picker handle; else save picker or download', () => {
  const s = (o = {}) => chooseSaveTarget({ hasWritableHandle: false, hasSaveFilePicker: true, isSecureContext: true, inIframe: false, pickerBlocked: false, ...o });
  assert.equal(s({ hasWritableHandle: true }), 'same-file');
  assert.equal(s(), 'save-picker');                                                         // opened via <input type="file">: no handle
  assert.equal(s({ hasSaveFilePicker: false }), 'download');                                // Firefox, Safari
  assert.equal(s({ hasSaveFilePicker: false, isSecureContext: false }), 'download');        // http://<host IP>
  assert.equal(s({ pickerBlocked: true }), 'download');
  assert.equal(s({ inIframe: true, hasWritableHandle: true }), 'download');
});

test('only services/fileOpen.ts calls showOpenFilePicker', () => {
  const hits = [];
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    if (['node_modules', 'dist', 'data', '.git', 'test', 'server'].includes(e.name)) return;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    if (/\.(ts|tsx)$/.test(e.name) && /showOpenFilePicker\s*\(/.test(fs.readFileSync(p, 'utf8'))) hits.push(path.relative(root, p));
  });
  walk(root);
  assert.deepEqual(hits, [path.join('services', 'fileOpen.ts')]);
});

test('the model file input is mounted unconditionally at the root of App', () => {
  const app = read('App.tsx');
  const ret = app.indexOf('return (\n        <div className="w-screen h-screen');
  assert.ok(ret > 0, 'App root element found');
  const input = app.indexOf('<input type="file" ref={importFileRef}');
  assert.ok(input > ret, 'input rendered by App');
  assert.equal(app.slice(ret, input).split('\n').length, 3, 'input is the first child of the root element, outside any condition');
});

test('every Open Model button goes through handleImportClick', () => {
  for (const [f, re] of [
    ['components/StartScreen.tsx', /handleImportClick\(importFileRef\)/],
    ['components/ContextMenus.tsx', /onOpenModel=\{\(\) => persistence\.handleImportClick\(props\.importFileRef\)\}/],
    ['App.tsx', /onOpenModel=\{\(\) => persistence\.handleImportClick\(importFileRef\)\}/],
    ['components/AppModals.tsx', /onOpenFile=\{\(\) => \{ persistence\.setIsOpenModelModalOpen\(false\); persistence\.handleImportClick\(props\.importFileRef\); \}\}/],
  ]) assert.match(read(f), re, f);
  assert.match(read('hooks/usePersistence.ts'), /const handleImportClick = useCallback\(\(fileInputRef[^)]*\) => openFile\(/);
});
