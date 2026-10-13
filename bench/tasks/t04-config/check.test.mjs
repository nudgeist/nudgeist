import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfig } from '../src/config.js';

test('port defaults to 8080 and PORT overrides it', () => {
  assert.equal(Number(loadConfig({}).port), 8080);
  assert.equal(Number(loadConfig({ PORT: '9000' }).port), 9000);
  assert.equal(loadConfig({ HOST: 'example.test' }).host, 'example.test');
  assert.equal(loadConfig({}).host, 'localhost');
});
