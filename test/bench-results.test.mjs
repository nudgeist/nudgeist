// Published bench results must stay sealed and anonymous: every file matches
// its SHA256SUMS line, and nothing in them looks like a path, account, email,
// key or session id.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { LEAKS } from '../bench/lib.mjs';

const RESULTS = fileURLToPath(new URL('../bench/results/', import.meta.url));
const folders = existsSync(RESULTS) ? readdirSync(RESULTS).map((d) => join(RESULTS, d)) : [];

for (const dir of folders) {
  test(`bench results ${basename(dir)}: sealed and anonymous`, () => {
    const sums = readFileSync(join(dir, 'SHA256SUMS'), 'utf8').trim().split('\n');
    assert.ok(sums.length > 3);
    const files = readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile() && e.name !== 'SHA256SUMS').map((e) => relative(dir, join((e.parentPath ?? e.path), e.name)).split('\\').join('/')).sort();
    assert.deepEqual(files, sums.map((l) => l.split(/ {2}/)[1]).sort(), 'every file is listed, and only those');
    for (const line of sums) {
      const [hash, file] = line.split(/ {2}/);
      const body = readFileSync(join(dir, file));
      assert.equal(createHash('sha256').update(body).digest('hex'), hash, `${file} changed after it was sealed`);
      for (const re of LEAKS) assert.ok(!re.test(body.toString('utf8')), `${file} matches ${re}`);
    }
  });
}
