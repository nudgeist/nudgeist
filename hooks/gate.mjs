#!/usr/bin/env node
// nudgeist: before a prompt reaches the model, Haiku checks whether a cheaper
// model or a lower effort will do it well. When it will, and the switch
// actually pays once the prompt cache is counted, the prompt is held once with
// that suggestion. Sending it again unchanged continues; /nudgeist:haiku,
// /nudgeist:sonnet, /nudgeist:low or /nudgeist:medium in front runs that one
// turn lighter. It never switches anything itself and never blocks on its own
// error.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TARGETS, detour, listed, rank, tier } from './lib/cost.mjs';
import { askAdvisor } from './lib/advisor.mjs';
import { brief, readSession } from './lib/session.mjs';

export const MIN_CONFIDENCE = 7; // of 9
export const MAX_SPEND_RATIO = 0.5; // a model switch must at least halve the turn's cost
export const QUIET_AFTER = 2; // declines in a row
const HIGH_EFFORT = new Set(['xhigh', 'max']);
const DEFAULT_TURN = { calls: 3, out: 1500 };

// claude-opus-5-5 → Opus 5.5
const modelName = (m) => m.replace(/^claude-/, '').replace(/-(\d+)-(\d+)$/, ' $1.$2').replace(/-(\d+)$/, ' $1').replace(/^\w/, (c) => c.toUpperCase());
const usd = (v) => '~US$' + Number(v.toPrecision(2));

// The suggestion for this verdict, or null. Model first (it saves the most),
// effort when a model switch doesn't pay or isn't needed. A message that
// continues work already under way keeps the session's model and effort.
export function decide({ verdict, current, turn, now }) {
  if (!verdict || verdict.kind !== 'new' || verdict.confidence < MIN_CONFIDENCE) return null;
  const why = verdict.why.replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase());
  const curTier = tier(current.model);
  if (rank(verdict.model) < rank(curTier) && TARGETS[verdict.model]) {
    const warm = Number.isFinite(current.at) && now - current.at < (current.ttl1h ? 60 : 5) * 60_000;
    const target = TARGETS[verdict.model];
    const cost = detour({ current: current.model, target, context: current.context || 0, ...turn, warm, ttl1h: current.ttl1h });
    if (cost && cost.go <= cost.stay * MAX_SPEND_RATIO) {
      const name = modelName(target).replace(/ [\d.]+$/, '');
      // No figure before the first request: its setup size isn't known yet.
      const money = listed(current.model) && current.context > 0 ? ` (${usd(cost.go)} instead of ${usd(cost.stay)} at list price, estimated)` : '';
      return [
        `nudgeist: ${name} can likely handle this: ${why}.`,
        `This turn on ${name}${money}: put /nudgeist:${verdict.model} in front and send.`,
        `Stay on ${modelName(current.model)}: send it again unchanged.`,
      ].join('\n');
    }
  }
  if (HIGH_EFFORT.has(current.effort) && verdict.effort !== 'high' && rank(verdict.model) <= rank(curTier)) {
    return [
      `nudgeist: ${verdict.effort} effort can likely handle this: ${why}.`,
      `This turn at ${verdict.effort} effort: put /nudgeist:${verdict.effort} in front and send.`,
      `Stay at ${current.effort}: send it again unchanged.`,
    ].join('\n');
  }
  return null;
}

// Whether anything could be suggested before paying for a verdict: a model
// below the current one whose detour could pay, or an effort above high.
function worthAsking(current, turn, now) {
  const best = { kind: 'new', model: 'haiku', effort: 'low', confidence: 9, why: '' };
  return decide({ verdict: best, current, turn, now }) != null;
}

// event: "start" (SessionStart), "switch" (PostModelSwitch) or "prompt" (UserPromptSubmit).
export function handle(event, input, env = process.env, { advisor = askAdvisor, now = Date.now() } = {}) {
  if (env.NUDGEIST_CHILD || /^(0|off|false)$/i.test(env.NUDGEIST || '')) return null;
  const dir = env.CLAUDE_PLUGIN_DATA;
  if (!dir || typeof input.session_id !== 'string') return null; // nowhere to remember a hold: never hold
  const file = join(dir, `${input.session_id.replace(/[^\w-]/g, '_')}.json`);
  let state = {};
  try {
    state = JSON.parse(readFileSync(file, 'utf8'));
  } catch {}
  const save = () => {
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, JSON.stringify(state));
  };
  // Only an interactive SessionStart carries the model (2.1.296; -p and SDK don't).
  const model = event === 'start' ? input.model : event === 'switch' ? input.to_model : null;
  if (typeof model === 'string') {
    state.model = model;
    save();
    return null;
  }
  if (event !== 'prompt' || env.CLAUDE_CODE_SESSION_ATTENDED !== '1') return null; // only someone at the session can answer
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
  if (prompt.startsWith('/nudgeist:')) {
    state.declines = 0;
    state.accepts = (state.accepts || 0) + 1;
    save();
    return null;
  }
  // Other commands and tags Claude Code writes itself pass.
  if (prompt === '' || prompt.startsWith('/') || prompt.startsWith('<')) return null;
  const hash = createHash('sha256').update(prompt).digest('hex');
  if (state.held === hash) {
    delete state.held;
    state.declines = (state.declines || 0) + 1;
    const quiet = state.declines >= QUIET_AFTER && !state.quiet;
    state.quiet ||= quiet;
    save();
    return quiet ? { systemMessage: 'nudgeist: you kept your model twice in a row, so it stays quiet for the rest of this session.' } : null;
  }
  if (state.quiet) return null;

  const facts = readSession(input.transcript_path);
  const current = facts.last ?? (state.model ? { model: state.model, effort: null, context: 0, at: NaN, ttl1h: false } : null);
  if (!current || !tier(current.model)) return null;
  const turn = { calls: facts.calls ?? DEFAULT_TURN.calls, out: facts.out ?? DEFAULT_TURN.out };
  if (!worthAsking(current, turn, now)) return null; // nothing to save: no advisor, no wait
  const verdict = advisor({ prompt, brief: brief(facts, { cwd: input.cwd, title: input.session_title, prompt }), env });
  const reason = decide({ verdict, current, turn, now });
  if (!reason) return null;
  state.held = hash;
  state.offers = (state.offers || 0) + 1;
  save();
  return { decision: 'block', reason };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin
    .on('data', (d) => (raw += d))
    .on('end', () => {
      try {
        const out = handle(process.argv[2], JSON.parse(raw));
        if (out) process.stdout.write(JSON.stringify(out));
      } catch {} // fail open
    });
}
