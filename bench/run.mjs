#!/usr/bin/env node
// Does the advisor's suggestion hold up? For each task, ask the advisor the way
// nudgeist does from an Opus 5.5 xhigh session, then solve the task for real on
// Haiku (twice), Opus (once) and, when the advisor said Sonnet, Sonnet (once),
// and grade every result with the task's hidden test.
//
//   node bench/run.mjs --config-dir ~/.claude-bench [--out bench/results/<date>] [--tasks t01-rename,t02-typo]
//
// --config-dir picks the Claude Code login the runs bill to. Results hold no
// paths, names, accounts or session ids: see lib.mjs scrub/assertClean.
import { execFile, execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs } from 'node:util';
import { decide } from '../hooks/gate.mjs';
import { askAdvisor } from '../hooks/lib/advisor.mjs';
import { brief } from '../hooks/lib/session.mjs';
import { BENCH, assertClean, diff, grade, loadTasks, scrub, workspace } from './lib.mjs';

const { values: opt } = parseArgs({
  options: {
    'config-dir': { type: 'string' },
    out: { type: 'string', default: join(BENCH, 'results', new Date().toISOString().slice(0, 10)) },
    tasks: { type: 'string' },
    'haiku-runs': { type: 'string', default: '2' },
    'advisor-runs': { type: 'string', default: '3' },
    'opus-effort': { type: 'string', default: 'high' },
  },
});
if (!opt['config-dir']) throw new Error('--config-dir is required: it decides which login pays for the runs');

const ENV = {
  HOME: process.env.HOME,
  PATH: process.env.PATH,
  USER: process.env.USER,
  LOGNAME: process.env.LOGNAME,
  LANG: 'en_US.UTF-8',
  TMPDIR: process.env.TMPDIR,
  SHELL: process.env.SHELL,
  CLAUDE_CONFIG_DIR: opt['config-dir'],
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
  DISABLE_AUTOUPDATER: '1',
  DISABLE_TELEMETRY: '1',
};
// The session the advisor believes it's in: Opus 5.5 at xhigh, 30k tokens of
// conversation, cache warm (last turn a minute ago, 1-hour cache).
const NOW = Date.now();
const SESSION = { model: 'claude-opus-5-5', effort: 'xhigh', context: 30_000, at: NOW - 60_000, ttl1h: true };
const TURN = { calls: 3, out: 1500 };

const out = opt.out;
mkdirSync(join(out, 'diffs'), { recursive: true });
const lines = { advisor: [], runs: [] };
const write = (kind, row) => {
  lines[kind].push(assertClean(JSON.stringify(row), `${kind} row`));
  writeFileSync(join(out, `${kind}.jsonl`), lines[kind].join('\n') + '\n');
};

const files = (dir) => readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => join((e.parentPath ?? e.path), e.name));

function advisorTask(task, i) {
  const ws = workspace(task);
  const facts = { last: SESSION, prompts: [], files: files(ws.work).filter((f) => f.endsWith('.js')) };
  const started = Date.now();
  const seen = brief(facts, { cwd: ws.work });
  const verdict = askAdvisor({ prompt: task.prompt, brief: seen, env: ENV, timeoutMs: 30_000 });
  const ms = Date.now() - started;
  const notice = decide({ verdict, current: SESSION, turn: TURN, now: NOW });
  const suggestion = notice ? /\/nudgeist:(\w+)/.exec(notice)[1] : 'none';
  write('advisor', { task: task.id, run: i, brief: scrub(seen, ws.root), verdict, suggestion, ms });
  rmSync(ws.root, { recursive: true, force: true });
  return suggestion;
}

function solve(task, model, n, effort) {
  const ws = workspace(task);
  const args = ['-p', '--model', model, ...(effort ? ['--effort', effort] : []), '--tools', 'Read,Edit,Write,Glob,Grep', '--permission-mode', 'acceptEdits', '--setting-sources', '', '--strict-mcp-config', '--disable-slash-commands', '--no-session-persistence', '--max-turns', '25', '--output-format', 'json'];
  return new Promise((resolve) => {
    const child = execFile('claude', args, { cwd: ws.work, env: ENV, timeout: 15 * 60_000, maxBuffer: 32 * 1024 * 1024 }, (err, stdout) => {
      let r = {};
      try {
        r = JSON.parse(stdout);
      } catch {}
      const g = grade(ws.work, task);
      const name = `${task.id}.${model}.${n}.diff`;
      writeFileSync(join(out, 'diffs', name), assertClean(scrub(diff(ws.root), ws.root), name));
      const u = r.usage || {};
      write('runs', {
        task: task.id,
        model,
        effort: effort || 'default',
        run: n,
        passed: g.passed,
        failure: g.passed ? undefined : scrub(g.failure, ws.root),
        finished: r.subtype || (err ? `error: ${scrub(err.code ?? err.signal ?? 'exit', ws.root)}` : 'unknown'),
        turns: r.num_turns,
        ms: r.duration_ms,
        cost_usd: r.total_cost_usd,
        tokens: { input: u.input_tokens, cache_write: u.cache_creation_input_tokens, cache_read: u.cache_read_input_tokens, output: u.output_tokens },
        models_used: Object.keys(r.modelUsage || {}),
        diff: relative(out, join(out, 'diffs', name)),
      });
      rmSync(ws.root, { recursive: true, force: true });
      resolve(g.passed);
    });
    child.stdin.end(task.prompt);
  });
}

const tasks = loadTasks(opt.tasks?.split(','));
writeFileSync(
  join(out, 'meta.json'),
  assertClean(
    JSON.stringify(
      {
        date: new Date(NOW).toISOString().slice(0, 10),
        claude_code: execFileSync('claude', ['--version'], { env: ENV, encoding: 'utf8' }).trim(),
        node: process.version,
        platform: process.platform,
        session_assumed: { model: SESSION.model, effort: SESSION.effort, context_tokens: SESSION.context, cache: 'warm, 1 hour', turn: TURN },
        advisor: { model: 'haiku', effort: 'low', runs_per_task: Number(opt['advisor-runs']) },
        solvers: { haiku: `default effort, ${opt['haiku-runs']} runs`, opus: `${opt['opus-effort']} effort, 1 run`, sonnet: 'default effort, 1 run, only when the advisor suggested Sonnet' },
        solver_tools: 'Read, Edit, Write, Glob, Grep (no shell); no settings, plugins or MCP servers',
        tasks: tasks.map((t) => t.id),
      },
      null,
      2,
    ),
    'meta',
  ) + '\n',
);

for (const task of tasks) {
  const suggestions = Array.from({ length: Number(opt['advisor-runs']) }, (_, i) => advisorTask(task, i + 1));
  const jobs = [];
  for (let n = 1; n <= Number(opt['haiku-runs']); n++) jobs.push(solve(task, 'haiku', n));
  jobs.push(solve(task, 'opus', 1, opt['opus-effort']));
  if (suggestions.includes('sonnet')) jobs.push(solve(task, 'sonnet', 1));
  const results = await Promise.all(jobs);
  console.log(`${task.id}: advisor ${suggestions.join('/')} · solved ${results.map((p) => (p ? 'pass' : 'FAIL')).join(' ')}`);
}
console.log(`wrote ${out}`);
