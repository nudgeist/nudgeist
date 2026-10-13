#!/usr/bin/env node
// Proves each task's hidden test is fair: it fails on the untouched fixture
// (doing nothing can't pass) and passes with the reference solution (the task
// is solvable as written). Free: no model runs. `node bench/validate.mjs`
import { rmSync } from 'node:fs';
import { grade, loadTasks, workspace } from './lib.mjs';

let bad = 0;
for (const task of loadTasks()) {
  const a = workspace(task);
  const before = grade(a.work, task).passed;
  const b = workspace(task, { solution: true });
  const after = grade(b.work, task);
  rmSync(a.root, { recursive: true, force: true });
  rmSync(b.root, { recursive: true, force: true });
  const ok = !before && after.passed;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'BAD '} ${task.id}: fixture ${before ? 'passes (should fail)' : 'fails'}, solution ${after.passed ? 'passes' : `fails\n${after.failure}`}`);
}
process.exitCode = bad ? 1 : 0;
