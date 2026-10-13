import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { receiveAll } from '../src/inbox.js';

test('no misspelling left, behavior unchanged', () => {
  for (const f of ['README.md', 'src/inbox.js']) assert.ok(!readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').toLowerCase().includes('recieve'), f);
  assert.throws(() => receiveAll('x'), { message: 'Cannot receive: queue must be an array' });
  const q = [1, 2];
  assert.deepEqual(receiveAll(q), [1, 2]);
  assert.deepEqual(q, []);
});
