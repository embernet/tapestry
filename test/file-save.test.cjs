'use strict';
// Save and Save As (utils/saveFlow.ts runSave): every path, with a stand-in browser, and
// that the app's buttons, menus and Ctrl+S all go through it.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runSave } = require('../utils/saveFlow.ts');
const { chooseSaveTarget, classifyWriteFailure, modelFileName, PICKER_MIN_MS } = require('../utils/filePicker.ts');
const { markSavedToFile, isRecoverable, recoverableModels } = require('../utils/recovery.ts');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

// A file handle that records what was written; fail = an error to throw from createWritable.
function fakeHandle(name, { fail = null, permission = 'granted' } = {}) {
  const h = {
    name, writes: [], fail, permission, permissionAsked: 0,
    async createWritable() {
      if (h.fail) throw h.fail;
      let buf = '';
      return { async write(d) { buf += d; }, async close() { h.writes.push(buf); } };
    },
    async requestPermission() { h.permissionAsked++; if (h.permission === 'granted') h.fail = null; return h.permission; },
  };
  return h;
}

const err = (name, message = '') => Object.assign(new Error(message), { name });

// A stand-in browser. picker: a handle to return, or an error to throw after pickerMs.
function fakeDeps(o = {}) {
  let t = 0;
  const calls = { picker: [], downloads: [], asked: [], notices: [], blocked: 0 };
  let explained = false;
  const deps = {
    env: { hasSaveFilePicker: true, isSecureContext: true, inIframe: false, pickerBlocked: false, ...(o.env || {}) },
    now: () => t,
    async pickSaveFile(opts) {
      calls.picker.push(opts);
      t += o.pickerMs ?? 2000;
      const r = typeof o.picker === 'function' ? o.picker() : o.picker;
      if (r instanceof Error) throw r;
      return r;
    },
    download: (name, text) => calls.downloads.push({ name, text }),
    ask: async (q) => { calls.asked.push(q.title); return (o.answers || []).shift() ?? false; },
    notify: (message, kind) => calls.notices.push({ message, kind }),
    markPickerBlocked: () => { calls.blocked++; },
    downloadExplained: () => explained,
    markDownloadExplained: () => { explained = true; },
  };
  return { deps, calls };
}

const req = (o = {}) => ({ mode: 'save', handle: null, suggestedName: 'My model.json', text: 'v1', ...o });

test('the decision: handle -> same file; no handle or Save As -> picker; no picker -> download', () => {
  const env = (o = {}) => ({ hasWritableHandle: false, hasSaveFilePicker: true, isSecureContext: true, inIframe: false, pickerBlocked: false, ...o });
  assert.equal(chooseSaveTarget(env({ hasWritableHandle: true }), 'save'), 'same-file');
  assert.equal(chooseSaveTarget(env(), 'save'), 'save-picker');
  assert.equal(chooseSaveTarget(env({ hasWritableHandle: true }), 'saveAs'), 'save-picker');
  assert.equal(chooseSaveTarget(env(), 'saveAs'), 'save-picker');
  for (const o of [{ hasSaveFilePicker: false }, { isSecureContext: false }, { pickerBlocked: true }, { inIframe: true }]) {
    assert.equal(chooseSaveTarget(env(o), 'save'), 'download', JSON.stringify(o));
    assert.equal(chooseSaveTarget(env(o), 'saveAs'), 'download', JSON.stringify(o));
  }
});

test('Save with a handle writes straight back, with no picker, and says "Saved to <name>"', async () => {
  const handle = fakeHandle('model.json');
  const { deps, calls } = fakeDeps();
  const r = await runSave(req({ handle, text: 'v2' }), deps);
  assert.equal(r.status, 'written');
  assert.equal(r.handle, handle);
  assert.deepEqual(handle.writes, ['v2']);
  assert.equal(calls.picker.length, 0);
  assert.equal(calls.downloads.length, 0);
  assert.deepEqual(calls.notices, [{ message: 'Saved to model.json', kind: 'success' }]);
});

test('Save with no handle opens the picker with the model name and JSON, writes there and returns the handle', async () => {
  const picked = fakeHandle('Chosen.json');
  const { deps, calls } = fakeDeps({ picker: picked });
  const r = await runSave(req({ text: (name) => `saved as ${name}` }), deps);
  assert.equal(r.status, 'written');
  assert.equal(r.handle, picked);
  assert.equal(calls.picker.length, 1);
  assert.equal(calls.picker[0].suggestedName, 'My model.json');
  assert.deepEqual(calls.picker[0].types[0].accept, { 'application/json': ['.json'] });
  assert.deepEqual(picked.writes, ['saved as Chosen.json']);
  assert.match(calls.notices[0].message, /Saved to Chosen\.json/);
});

test('Save As always opens the picker, even with a handle, and the old file is left alone', async () => {
  const old = fakeHandle('old.json');
  const picked = fakeHandle('new.json');
  const { deps, calls } = fakeDeps({ picker: picked });
  const r = await runSave(req({ mode: 'saveAs', handle: old, text: 'v3' }), deps);
  assert.equal(r.status, 'written');
  assert.equal(r.handle, picked);
  assert.equal(calls.picker.length, 1);
  assert.deepEqual(old.writes, []);
  assert.deepEqual(picked.writes, ['v3']);
});

test('no picker in this browser: Save and Save As download, and say why once', async () => {
  const { deps, calls } = fakeDeps({ env: { hasSaveFilePicker: false } });
  for (const mode of ['save', 'saveAs', 'save']) {
    const r = await runSave(req({ mode }), deps);
    assert.deepEqual(r, { status: 'downloaded', name: 'My model.json' });
  }
  assert.equal(calls.picker.length, 0);
  assert.equal(calls.downloads.length, 3);
  assert.deepEqual(calls.downloads[0], { name: 'My model.json', text: 'v1' });
  const why = calls.notices.filter((n) => /can't choose a folder/.test(n.message));
  assert.equal(why.length, 1);
  assert.match(why[0].message, /Downloads folder/);
});

test('a picker refused at once (quick AbortError, or intercepted) downloads and is not tried again', async () => {
  for (const e of [err('AbortError'), err('SecurityError'), err('AbortError', 'Intercepted by Page.setInterceptFileChooserDialog()')]) {
    const { deps, calls } = fakeDeps({ picker: e, pickerMs: e.message ? PICKER_MIN_MS + 3000 : 3 });
    const r = await runSave(req(), deps);
    assert.equal(r.status, 'downloaded', e.name + e.message);
    assert.equal(calls.downloads.length, 1);
    assert.equal(calls.blocked, 1);
  }
});

test('Cancel in the picker saves nothing and says nothing', async () => {
  const { deps, calls } = fakeDeps({ picker: err('AbortError', 'The user aborted a request.'), pickerMs: PICKER_MIN_MS + 1500 });
  for (const mode of ['save', 'saveAs']) {
    const r = await runSave(req({ mode }), deps);
    assert.deepEqual(r, { status: 'cancelled' });
  }
  assert.equal(calls.downloads.length, 0);
  assert.deepEqual(calls.notices, []);
  assert.deepEqual(calls.asked, []);
  assert.equal(calls.blocked, 0);
});

test('write access revoked: ask in the page, ask the browser again, then write to the same file', async () => {
  const handle = fakeHandle('model.json', { fail: err('NotAllowedError') });
  const { deps, calls } = fakeDeps({ answers: [true] });
  const r = await runSave(req({ handle, text: 'v4' }), deps);
  assert.equal(r.status, 'written');
  assert.equal(r.handle, handle);
  assert.deepEqual(calls.asked, ['Allow saving to this file?']);
  assert.equal(handle.permissionAsked, 1);
  assert.deepEqual(handle.writes, ['v4']);
  assert.equal(calls.picker.length, 0);
});

test('access still refused: offer the picker, and save there', async () => {
  const handle = fakeHandle('model.json', { fail: err('NotAllowedError'), permission: 'denied' });
  const picked = fakeHandle('elsewhere.json');
  const { deps, calls } = fakeDeps({ answers: [true, true], picker: picked });
  const r = await runSave(req({ handle }), deps);
  assert.equal(r.status, 'written');
  assert.equal(r.handle, picked);
  assert.deepEqual(calls.asked, ['Allow saving to this file?', 'Save somewhere else?']);
  assert.deepEqual(picked.writes, ['v1']);
});

test('access still refused and no picker here: download, never dropped', async () => {
  const handle = fakeHandle('model.json', { fail: err('NotAllowedError'), permission: 'denied' });
  const { deps, calls } = fakeDeps({ answers: [true, true], env: { pickerBlocked: true } });
  // pickerBlocked with a handle still writes back first (same-file); the fallback downloads.
  const r = await runSave(req({ handle }), deps);
  assert.equal(r.status, 'downloaded');
  assert.equal(calls.downloads.length, 1);
});

test('the file has gone: offer the picker straight away', async () => {
  const handle = fakeHandle('model.json', { fail: err('NotFoundError') });
  const picked = fakeHandle('again.json');
  const { deps, calls } = fakeDeps({ answers: [true], picker: picked });
  const r = await runSave(req({ handle }), deps);
  assert.equal(r.status, 'written');
  assert.equal(r.handle, picked);
  assert.deepEqual(calls.asked, ['Save somewhere else?']);
  assert.equal(handle.permissionAsked, 0);
});

test('declining the in-page question is not silent: it says the model was not saved', async () => {
  const handle = fakeHandle('model.json', { fail: err('NotAllowedError') });
  const { deps, calls } = fakeDeps({ answers: [false] });
  const r = await runSave(req({ handle }), deps);
  assert.equal(r.status, 'failed');
  assert.match(calls.notices.at(-1).message, /Not saved to a file/);
  assert.equal(classifyWriteFailure(err('NotFoundError')), 'gone');
  assert.equal(classifyWriteFailure(err('NotAllowedError')), 'permission');
  assert.equal(classifyWriteFailure(err('InvalidStateError')), 'permission');
});

test('file names: the model name plus .json, without characters file systems refuse', () => {
  assert.equal(modelFileName('My model'), 'My model.json');
  assert.equal(modelFileName('a/b:c?'), 'a b c.json');
  assert.equal(modelFileName('already.json'), 'already.json');
  assert.equal(modelFileName(''), 'Tapestry model.json');
  assert.equal(modelFileName('...hidden'), 'hidden.json');
});

test('after a save the saved hash is the content hash: off the recovered list, no unsaved changes', () => {
  const before = { id: 'm', name: 'M', contentHash: 'h2', lastDiskHash: 'h1' };
  assert.equal(isRecoverable(before), true);
  const after = markSavedToFile(before, 'h2', 'M.json', '2026-11-24T00:00:00.000Z');
  assert.equal(after.lastDiskHash, 'h2');
  assert.equal(after.contentHash, 'h2');
  assert.equal(after.filename, 'M.json');
  assert.equal(after.updatedAt, '2026-11-24T00:00:00.000Z');
  assert.deepEqual(recoverableModels([after, { id: 'n', contentHash: 'x' }]).map((m) => m.id), ['n']);
});

test('the app: one save helper, Save As is the file picker, the browser copy has its own name', () => {
  const hook = read('hooks/usePersistence.ts');
  assert.match(hook, /await saveFile\(\{ mode, handle, suggestedName, text \}\)/);
  assert.match(hook, /markSavedToFile\(m, currentHash, result\.name, now\)/);
  assert.match(hook, /if \(result\.status === 'written'\) currentFileHandleRef\.current = result\.handle;/);
  assert.match(hook, /const handleSaveFileAs = useCallback\(\(\) => saveModelToFile\('saveAs'\)/);
  assert.match(hook, /if \(!\(await handleDiskSave\(\)\)\) return;/);   // Save & Exit stays if not saved
  for (const f of ['App.tsx', 'components/ContextMenus.tsx']) {
    assert.match(read(f), /onSaveAs=\{persistence\.handleSaveFileAs\}/, f);
    assert.match(read(f), /onSaveCopy=\{\(\) => persistence\.setIsSaveCopyModalOpen\(true\)\}/, f);
  }
  assert.match(read('components/AppHeader.tsx'), /Save a copy in this browser…/);
  assert.match(read('components/CanvasContextMenu.tsx'), /Save a copy in this browser…/);
  assert.doesNotMatch(read('components/AppHeader.tsx') + read('components/CanvasContextMenu.tsx'), /Save to Disk/);
  assert.match(read('App.tsx'), /\(e\.ctrlKey \|\| e\.metaKey\) && !e\.shiftKey && !e\.altKey && e\.key\.toLowerCase\(\) === 's'[\s\S]{0,200}persistence\.handleDiskSave\(\)/);
});
