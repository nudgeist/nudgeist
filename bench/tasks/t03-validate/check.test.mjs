import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyDiscount } from '../src/pricing.js';

test('validates amount and percent', () => {
  for (const a of ['10', NaN, Infinity, undefined, null]) assert.throws(() => applyDiscount(a, 10), TypeError, String(a));
  for (const p of [-1, 101, 100.5]) assert.throws(() => applyDiscount(100, p), RangeError, String(p));
  assert.equal(applyDiscount(200, 10), 180);
  assert.equal(applyDiscount(200, 0), 200);
  assert.equal(applyDiscount(200, 100), 0);
});
