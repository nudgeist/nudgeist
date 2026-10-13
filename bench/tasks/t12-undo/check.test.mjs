import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Editor } from '../src/editor.js';

test('undo and redo', () => {
  const e = new Editor('ac');
  e.insert(1, 'b');
  e.delete(0, 1);
  assert.equal(e.text, 'bc');
  e.undo();
  assert.equal(e.text, 'abc');
  e.undo();
  assert.equal(e.text, 'ac');
  e.undo();
  assert.equal(e.text, 'ac');
  e.redo();
  assert.equal(e.text, 'abc');
  e.insert(3, 'd');
  e.redo();
  assert.equal(e.text, 'abcd', 'a new edit clears redo');
  e.undo();
  e.redo();
  e.redo();
  assert.equal(e.text, 'abcd');
});

test('at most 50 undo steps', () => {
  const e = new Editor('');
  for (let i = 0; i < 60; i++) e.insert(e.text.length, String(i % 10));
  for (let i = 0; i < 70; i++) e.undo();
  assert.equal(e.text, '0123456789');
});
