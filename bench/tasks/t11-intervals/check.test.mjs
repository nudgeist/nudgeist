import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mergeIntervals } from '../src/intervals.js';

test('closed intervals merge correctly', () => {
  assert.deepEqual(mergeIntervals([[1, 3], [3, 5]]), [[1, 5]]);
  assert.deepEqual(mergeIntervals([[1, 10], [2, 3]]), [[1, 10]]);
  assert.deepEqual(mergeIntervals([[5, 6], [1, 2]]), [[1, 2], [5, 6]]);
  assert.deepEqual(mergeIntervals([[1, 4], [2, 3], [3, 8], [9, 9]]), [[1, 8], [9, 9]]);
  assert.deepEqual(mergeIntervals([]), []);
  const input = [[1, 3], [2, 6]];
  mergeIntervals(input);
  assert.deepEqual(input, [[1, 3], [2, 6]], 'input not mutated');
});
