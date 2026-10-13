import assert from 'node:assert/strict';
import { test } from 'node:test';
import { slugify, titleCase } from '../src/text.js';

test('slugify', () => {
  assert.equal(slugify('Héllo, Wörld!'), 'hello-world');
  assert.equal(slugify('  --Ça va?  '), 'ca-va');
  assert.equal(slugify('Node.js 24 Release'), 'node-js-24-release');
  assert.equal(slugify('Ñandú'), 'nandu');
  assert.equal(slugify(''), '');
  assert.equal(titleCase('a b'), 'A B');
});
