#!/usr/bin/env node
// Summarizes a results folder from its raw files only, and seals them:
//   node bench/report.mjs bench/results/<date>
// writes summary.md and SHA256SUMS (check with `shasum -a 256 -c SHA256SUMS`
// from inside the folder). Anyone can rerun this on the published files.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('usage: node bench/report.mjs <results folder>');
const jsonl = (f) => readFileSync(join(dir, f), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
const advisor = jsonl('advisor.jsonl');
const runs = jsonl('runs.jsonl');

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const usd = (v) => (v == null ? '–' : `$${v < 0.01 ? v.toFixed(4) : v.toFixed(3)}`);

const rows = meta.tasks.map((task) => {
  const j = advisor.filter((r) => r.task === task);
  const of = (model) => runs.filter((r) => r.task === task && r.model === model);
  const haiku = of('haiku');
  const opus = of('opus');
  const sonnet = of('sonnet');
  const haikuRate = haiku.filter((r) => r.passed).length / haiku.length;
  return {
    task,
    suggestions: j.map((r) => r.suggestion),
    haikuShare: j.filter((r) => r.suggestion === 'haiku').length / j.length,
    agree: new Set(j.map((r) => r.suggestion)).size === 1,
    haiku: `${haiku.filter((r) => r.passed).length}/${haiku.length}`,
    haikuRate,
    opus: `${opus.filter((r) => r.passed).length}/${opus.length}`,
    sonnet: sonnet.length ? `${sonnet.filter((r) => r.passed).length}/${sonnet.length}` : '–',
    haikuCost: avg(haiku.map((r) => r.cost_usd ?? 0)),
    opusCost: avg(opus.map((r) => r.cost_usd ?? 0)),
    advisorCost: avg(j.map((r) => r.verdict?.cost_usd ?? 0)),
  };
});

// Each advisor call stands for one message: did its model call hold up against
// what Haiku actually did on that task?
const byTask = Object.fromEntries(rows.map((r) => [r.task, r]));
const calls = advisor.map((c) => ({ said: c.suggestion === 'haiku', ok: byTask[c.task].haikuRate === 1 }));
const count = (said, ok) => calls.filter((c) => c.said === said && c.ok === ok).length;
// Following the advisor: Haiku as often as it said Haiku (plus an Opus redo as
// often as Haiku failed there), Opus otherwise, plus every advisor call. An
// effort suggestion is counted as Opus at its tested effort: not measured.
const alwaysOpus = rows.reduce((s, r) => s + r.opusCost, 0);
const follow = rows.reduce((s, r) => s + r.advisorCost + r.haikuShare * (r.haikuCost + (1 - r.haikuRate) * r.opusCost) + (1 - r.haikuShare) * r.opusCost, 0);

const md = [
  `# Bench results, ${meta.date}`,
  '',
  `${meta.claude_code} · Node ${meta.node} · ${meta.platform}. The advisor believed it was in a session on ${meta.session_assumed.model} at ${meta.session_assumed.effort} effort with ${meta.session_assumed.context_tokens / 1000}k tokens and a warm cache.`,
  `Solvers: Haiku ${meta.solvers.haiku}; Opus ${meta.solvers.opus}; Sonnet ${meta.solvers.sonnet}. Tools: ${meta.solver_tools}.`,
  '',
  '| Task | Advisor (each run) | Haiku passed | Opus passed | Sonnet passed | Haiku cost | Opus cost |',
  '|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.task} | ${r.suggestions.join(', ')} | ${r.haiku} | ${r.opus} | ${r.sonnet} | ${usd(r.haikuCost)} | ${usd(r.opusCost)} |`),
  '',
  '## Did the advisor get the model right?',
  '',
  `Each of the ${calls.length} advisor calls, against whether Haiku passed every run of that task.`,
  '',
  '| | Haiku passed every run | Haiku failed a run |',
  '|---|---|---|',
  `| Advisor suggested Haiku | ${count(true, true)} (right) | ${count(true, false)} (wrong: a redo on Opus) |`,
  `| Advisor did not suggest Haiku | ${count(false, true)} (missed saving) | ${count(false, false)} (right to hold back) |`,
  '',
  `- Tasks where all advisor calls agreed: ${rows.filter((r) => r.agree).length}/${rows.length}.`,
  `- Tasks Haiku passed every run: ${rows.filter((r) => r.haikuRate === 1).length}/${rows.length}.`,
  `- Advisor call: median ${median(advisor.map((r) => r.ms))} ms, average ${usd(avg(advisor.map((r) => r.verdict?.cost_usd ?? 0)))} per message.`,
  `- Effort suggestions (${advisor.filter((r) => ['low', 'medium'].includes(r.suggestion)).length} advisor runs) aren't graded here: no runs at those efforts.`,
  '',
  '## Cost of following the advisor',
  '',
  `- Always Opus: ${usd(alwaysOpus)} for the ${rows.length} tasks.`,
  `- Following the advisor, advisor calls and Opus redos included: ${usd(follow)} (${Math.round((1 - follow / alwaysOpus) * 100)}% less).`,
  '',
  'List prices as reported by Claude Code (`total_cost_usd`). One run per task on Opus and two on Haiku: small samples, our own tasks.',
  '',
].join('\n');
writeFileSync(join(dir, 'summary.md'), md);

const all = readdirSync(dir, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile() && e.name !== 'SHA256SUMS')
  .map((e) => relative(dir, join(e.parentPath, e.name)))
  .sort();
writeFileSync(join(dir, 'SHA256SUMS'), all.map((f) => `${createHash('sha256').update(readFileSync(join(dir, f))).digest('hex')}  ${f}`).join('\n') + '\n');
console.log(md);
