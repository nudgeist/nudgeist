import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseDuration } from '../src/duration.js';

test('h, m and s in order', () => {
  assert.equal(parseDuration('1h30m'), 5400);
  assert.equal(parseDuration('45s'), 45);
  assert.equal(parseDuration('2h5s'), 7205);
  assert.equal(parseDuration('1h2m3s'), 3723);
  assert.equal(parseDuration('2h'), 7200);
  assert.equal(parseDuration('90m'), 5400);
  for (const bad of ['', '5x', '30m1h', 'h', '1h 2m', '1.5h', 'm']) assert.throws(() => parseDuration(bad), Error, bad);
});
