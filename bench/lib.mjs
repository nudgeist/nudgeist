// Shared bench plumbing: copy a task's fixture into a scratch folder, grade it
// with the task's hidden test, and keep anything personal out of the results.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { homedir, tmpdir, userInfo } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BENCH = dirname(fileURLToPath(import.meta.url));
export const TASKS = join(BENCH, 'tasks');

export function loadTasks(only) {
  return readdirSync(TASKS)
    .filter((d) => !only || only.includes(d))
    .sort()
    .map((d) => ({ ...JSON.parse(readFileSync(join(TASKS, d, 'task.json'), 'utf8')), dir: join(TASKS, d) }));
}

// A scratch copy of the fixture: `before` stays pristine for the diff, `after`
// is where the model works.
export function workspace(task, { solution = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'nudgeist-bench-'));
  cpSync(join(task.dir, 'fixture'), join(root, 'before'), { recursive: true });
  cpSync(join(task.dir, 'fixture'), join(root, 'after'), { recursive: true });
  if (solution) cpSync(join(task.dir, 'solution'), join(root, 'after'), { recursive: true });
  return { root, work: join(root, 'after') };
}

// The hidden test goes in only after the model is done, so it can't read it.
export function grade(work, task) {
  mkdirSync(join(work, 'check'), { recursive: true });
  cpSync(join(task.dir, 'check.test.mjs'), join(work, 'check', 'check.test.mjs'));
  try {
    execFileSync(process.execPath, ['--test', 'check/check.test.mjs'], { cwd: work, stdio: 'pipe', timeout: 60_000 });
    return { passed: true };
  } catch (e) {
    const out = `${e.stdout || ''}${e.stderr || ''}`;
    return { passed: false, failure: out.split('\n').filter((l) => /not ok|Error|expected|actual/.test(l)).slice(0, 6).join('\n') };
  }
}

// What the model changed, with paths relative to the task and no timestamps.
export function diff(root) {
  try {
    execFileSync('diff', ['-ruN', '-x', 'check', 'before', 'after'], { cwd: root, stdio: 'pipe' });
    return '';
  } catch (e) {
    return String(e.stdout || '').replace(/^(---|\+\+\+) (\S+)\t.*$/gm, '$1 $2');
  }
}

// Every string that leaves this machine goes through here. Anything that still
// looks personal afterwards fails the run instead of being written.
const NEEDLES = [homedir(), tmpdir(), userInfo().username].filter((s) => s && s.length > 2);
export function scrub(text, root) {
  let s = String(text ?? '');
  if (root) s = s.split(root).join('<task>');
  for (const n of NEEDLES) s = s.split(n).join('<redacted>');
  return s;
}

export const LEAKS = [/\/(Users|home)\/(?!<)[^\s"'/]+/, /[A-Za-z]:\\Users\\/, /[\w.+-]+@[\w-]+\.[a-z]{2,}/i, /sk-ant-[\w-]+/, /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i];
export function assertClean(text, what) {
  for (const re of LEAKS) if (re.test(text)) throw new Error(`refusing to write ${what}: it matches ${re}`);
  for (const n of NEEDLES) if (text.includes(n)) throw new Error(`refusing to write ${what}: it contains a local name or path`);
  return text;
}
