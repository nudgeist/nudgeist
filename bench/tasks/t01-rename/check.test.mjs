import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import * as users from '../src/users.js';
import { profileName } from '../src/profile.js';

const db = { users: [{ id: 1, first: 'Ada', last: 'Lovelace' }] };
test('getUser replaces getUsr and still works', () => {
  assert.equal(typeof users.getUser, 'function');
  assert.equal(users.getUsr, undefined);
  assert.equal(users.getUser(1, db).first, 'Ada');
  assert.equal(users.getUser(2, db), null);
  assert.equal(users.listUsrs(db).length, 1);
  assert.equal(profileName(1, db), 'Ada Lovelace');
  for (const f of ['src/users.js', 'src/profile.js']) assert.ok(!readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').includes('getUsr'), f);
});
