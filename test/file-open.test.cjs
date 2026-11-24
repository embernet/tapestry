'use strict';
// "Open a file": which chooser to use, how a picker failure is read, where Save writes,
// and that every open goes through services/fileOpen.ts with an always-mounted input.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { choosePicker, classifyPickerFailure, chooseSaveTarget, PICKER_MIN_MS, acceptsFile, deliverToInput } = require('../utils/filePicker.ts');

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

test('an intercepted picker is blocked, not cancelled, however long it took', () => {
  const err = { name: 'AbortError', message: "Failed to execute 'showOpenFilePicker' on 'Window': Intercepted by Page.setInterceptFileChooserDialog()." };
  assert.equal(classifyPickerFailure(err, 5), 'unavailable');
  assert.equal(classifyPickerFailure(err, PICKER_MIN_MS + 5000), 'unavailable');
  assert.equal(classifyPickerFailure({ name: 'AbortError', message: 'The user aborted a request.' }, PICKER_MIN_MS + 5000), 'cancelled');
});

test('accept lists: extensions, MIME types, wildcards', () => {
  assert.equal(acceptsFile({ name: 'model.json', type: 'application/json' }, '.json'), true);
  assert.equal(acceptsFile({ name: 'MODEL.JSON', type: '' }, '.json'), true);
  assert.equal(acceptsFile({ name: 'model', type: 'application/json' }, '.json,application/json'), true);
  assert.equal(acceptsFile({ name: 'notes.txt', type: 'text/plain' }, '.json'), false);
  assert.equal(acceptsFile({ name: 'photo.png', type: 'image/png' }, '.json,application/json'), false);
  assert.equal(acceptsFile({ name: 'notes.txt', type: 'text/plain' }, '.md,.txt,text/markdown'), true);
  assert.equal(acceptsFile({ name: 'x.csv', type: 'text/csv' }, 'text/*'), true);
  assert.equal(acceptsFile({ name: 'anything.bin' }, ''), true);
});

// A stand-in for <input type="file">: records what a drop hands it.
const fakeInput = (accept, multiple = false) => ({ accept, multiple, files: null, events: [], dispatchEvent(ev) { this.events.push(ev.type); return true; } });
const list = (files) => ({ list: files });

test('a dropped .json reaches the input and fires change (the same path as a chosen file)', () => {
  const input = fakeInput('.json');
  const file = { name: 'my model.json', type: 'application/json' };
  const r = deliverToInput(input, [file], list);
  assert.deepEqual(r, { ok: true, count: 1 });
  assert.deepEqual(input.files, { list: [file] });
  assert.deepEqual(input.events, ['change']);
});

test('anything else is refused in the page and the input is left alone', () => {
  for (const file of [{ name: 'notes.txt', type: 'text/plain' }, { name: 'photo.png', type: 'image/png' }, { name: 'model.json.zip', type: 'application/zip' }]) {
    const input = fakeInput('.json');
    const r = deliverToInput(input, [file], list);
    assert.equal(r.ok, false);
    assert.match(r.message, /isn't a \.json file/);
    assert.equal(input.files, null);
    assert.deepEqual(input.events, []);
  }
  const empty = fakeInput('.json');
  assert.equal(deliverToInput(empty, [], list).ok, false);
  assert.equal(deliverToInput(null, [{ name: 'a.json' }], list).ok, false);
});

test('several dropped files: only those that fit, and one unless the input takes many', () => {
  const one = fakeInput('.json');
  deliverToInput(one, [{ name: 'a.txt' }, { name: 'b.json' }, { name: 'c.json' }], list);
  assert.deepEqual(one.files.list.map((f) => f.name), ['b.json']);
  const many = fakeInput('.csv', true);
  deliverToInput(many, [{ name: 'a_nodes.csv' }, { name: 'b.json' }, { name: 'a_edges.csv' }], list);
  assert.deepEqual(many.files.list.map((f) => f.name), ['a_nodes.csv', 'a_edges.csv']);
});

test('drops and "Choose file…" labels go to the same model file input as Open Model', () => {
  // Start screen: drop anywhere -> App's importFileRef, whose onChange is handleImportInputChange -> processImportedData.
  assert.match(read('components/StartScreen.tsx'), /useFileDrop\(importFileRef\)/);
  assert.match(read('components/StartScreen.tsx'), /<div \{\.\.\.dropProps\}/);
  assert.match(read('components/AppModals.tsx'), /<OpenModelModal [^\n]*fileInputRef=\{props\.importFileRef\}/);
  assert.match(read('components/OpenModelModal.tsx'), /<FileChooser inputRef=\{fileInputRef\}/);
  assert.match(read('App.tsx'), /<input type="file" ref=\{importFileRef\} onChange=\{handleImportInputChangeWrapper\}/);
  assert.match(read('hooks/usePersistence.ts'), /const handleImportInputChange = [\s\S]{0,400}processImportedData\(text, file\.name\)/);
  // Drops are handed to the input by dropFiles -> deliverToInput, never imported another way.
  const chooser = read('components/FileChooser.tsx');
  assert.match(chooser, /dropFiles\(inputRef\.current, e\.dataTransfer\.files\)/);
  assert.match(chooser, /<label\s+htmlFor=\{id\}/);
  assert.match(read('services/fileOpen.ts'), /deliverToInput\(input,/);
});

test('the in-page step is a label and a drop zone, not a button that clicks the input after an await', () => {
  const svc = read('services/fileOpen.ts');
  assert.doesNotMatch(svc, /confirmDialog/);
  assert.match(svc, /await fileStep\(opts, false\)/);
  assert.match(svc, /watchChooser\(opts\.input/);
  assert.match(read('components/DialogHost.tsx'), /<FileChooser inputRef=\{inputRef\}/);
  assert.match(svc, /If no file window opened, this browser may be blocking or intercepting file choosers/);
});

test('no file input is opened with .click() outside services/fileOpen.ts and the keyboard fallback', () => {
  const hits = [];
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    if (['node_modules', 'dist', 'data', '.git', 'test', 'server'].includes(e.name)) return;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    if (!/\.(ts|tsx)$/.test(e.name)) return;
    fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      if (/(fileInputRef|importFileRef|inputRef)\.current\??\.click\(\)/.test(line) && !/e\.key === 'Enter'|inputRef\.current\?\.click\(\);$/.test(line.trim())) hits.push(`${path.relative(root, p)}:${i + 1}`);
    });
  });
  walk(root);
  assert.deepEqual(hits, []);
});
