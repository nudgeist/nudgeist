import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pageCount, paginate } from '../src/paginate.js';

test('pages do not overlap', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.deepEqual(paginate(items, 1, 3), [1, 2, 3]);
  assert.deepEqual(paginate(items, 2, 3), [4, 5, 6]);
  assert.deepEqual(paginate(items, 4, 3), [10]);
  assert.deepEqual(paginate(items, 5, 3), []);
  assert.equal(pageCount(items, 3), 4);
});
