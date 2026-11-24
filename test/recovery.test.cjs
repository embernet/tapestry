'use strict';
// Recovered models: the browser-stored models changed since they were last saved.
const test = require('node:test');
const assert = require('node:assert/strict');
const { isRecoverable, recoverableModels, markSaved } = require('../utils/recovery.ts');

test('never saved: recoverable', () => {
  assert.equal(isRecoverable({ id: 'a', contentHash: '1' }), true);
  assert.equal(isRecoverable({ id: 'a' }), true);
});

test('saved to a file and unchanged: not recoverable; a later change: recoverable again', () => {
  let m = { id: 'a', name: 'A', contentHash: '1' };
  m = markSaved(m, '2', 'disk');
  assert.equal(m.contentHash, '2');
  assert.equal(m.lastDiskHash, '2');
  assert.equal(m.name, 'A');
  assert.equal(isRecoverable(m), false);
  m = { ...m, contentHash: '3' };                 // autosave after an unsaved change
  assert.equal(isRecoverable(m), true);
  m = { ...m, contentHash: '2' };                 // change undone: matches the saved file again
  assert.equal(isRecoverable(m), false);
});

test('saved elsewhere (Gist) and unchanged: not recoverable', () => {
  let m = markSaved({ id: 'a', contentHash: '1', lastDiskHash: '0' }, '5', 'other');
  assert.equal(m.lastDiskHash, '0');              // the file on disk is still behind
  assert.equal(isRecoverable(m), false);
  assert.equal(isRecoverable({ ...m, contentHash: '6' }), true);
});

test('stale entries from already-saved models drop out of the list', () => {
  const index = [
    { id: 'saved', contentHash: '7', lastDiskHash: '7' },        // left by a save before the list was filtered
    { id: 'changed', contentHash: '8', lastDiskHash: '7' },
    { id: 'new', contentHash: '9' },
    { id: 'gist', contentHash: '4', lastSavedHash: '4' },
  ];
  assert.deepEqual(recoverableModels(index).map((m) => m.id), ['changed', 'new']);
  assert.equal(index.length, 4, 'the index itself is not changed');
});
