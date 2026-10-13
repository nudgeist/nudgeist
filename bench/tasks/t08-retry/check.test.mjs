import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as api from '../src/api.js';

const flaky = (fails) => {
  const calls = [];
  return { calls, get: async (url) => { calls.push(url); if (calls.length <= fails) throw new Error(`fail ${calls.length}`); return { url }; } };
};

test('withRetry and the three helpers', async () => {
  assert.equal(typeof api.withRetry, 'function');
  let n = 0;
  assert.equal(await api.withRetry(async () => { if (++n < 2) throw new Error('x'); return 'ok'; }, 3), 'ok');
  await assert.rejects(api.withRetry(async () => { throw new Error('always'); }, 2), { message: 'always' });
  for (const [fn, url] of [[api.fetchUser, '/users/7'], [api.fetchOrders, '/users/7/orders'], [api.fetchInvoices, '/invoices?user=7']]) {
    const h = flaky(2);
    assert.deepEqual(await fn(h, 7), { url });
    assert.equal(h.calls.length, 3);
    await assert.rejects(fn(flaky(3), 7), { message: 'fail 3' });
    assert.ok(!/\b(for|while)\b/.test(fn.toString()), `${fn.name} still has its own loop`);
  }
});
