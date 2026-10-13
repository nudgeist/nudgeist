import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LRU } from '../src/lru.js';

test('a read keeps an entry alive', () => {
  const c = new LRU(2);
  c.set('a', 1);
  c.set('b', 2);
  assert.equal(c.get('a'), 1);
  c.set('c', 3);
  assert.equal(c.get('b'), undefined);
  assert.equal(c.get('a'), 1);
  assert.equal(c.get('c'), 3);
  assert.equal(c.get('zzz'), undefined);
  c.set('d', 4);
  assert.equal(c.get('a'), undefined);
  c.set('c', 30);
  c.set('e', 5);
  assert.equal(c.get('c'), 30);
  assert.equal(c.get('d'), undefined);
});
