import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '../src/client.js';

const tick = () => new Promise((r) => setTimeout(r, 5));

function server() {
  const s = { valid: 't1', refreshes: 0, failNext: false };
  s.refreshToken = async () => {
    s.refreshes++;
    await tick();
    if (s.failNext) {
      s.failNext = false;
      throw new Error('auth down');
    }
    return s.valid;
  };
  s.request = async (path, token) => {
    await tick();
    return token === s.valid ? { status: 200, path } : { status: 401 };
  };
  return s;
}

test('concurrent 401s share one refresh; a failed refresh does not stick', async () => {
  const s = server();
  const call = createClient(s);
  assert.equal((await call('/a')).status, 200);
  assert.equal(s.refreshes, 1);
  s.valid = 't2';
  const res = await Promise.all([1, 2, 3, 4, 5].map((i) => call(`/x${i}`)));
  assert.ok(res.every((r) => r.status === 200), 'all retried with the new token');
  assert.equal(s.refreshes, 2, 'one shared refresh for five 401s');
  s.valid = 't3';
  s.failNext = true;
  await assert.rejects(Promise.all([call('/y1'), call('/y2')]), { message: 'auth down' });
  assert.equal(s.refreshes, 3);
  assert.equal((await call('/z')).status, 200);
  assert.equal(s.refreshes, 4);
});
