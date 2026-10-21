import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { decide, handle } from '../hooks/gate.mjs';
import { detour, priceOf, tier } from '../hooks/lib/cost.mjs';
import { parseVerdict } from '../hooks/lib/advisor.mjs';
import { brief, readSession } from '../hooks/lib/session.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'nudgeist-'));
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const turn = { calls: 3, out: 1500 };

test('cost: a Haiku detour pays on a warm 50k Opus session; Sonnet at 150k and Haiku past 100k do not', () => {
  const opus = 'claude-opus-5-5';
  const a = detour({ current: opus, target: 'claude-haiku-5-5', context: 50_000, ...turn, warm: true, ttl1h: true });
  near(a.stay, 0.06); // 50k read ×3 at $0.20 + 1.5k out at $20
  near(a.go, 0.01175); // 50k written at $0.20 (1h) + 2 reads at $0.01 + out at $0.50
  const b = detour({ current: opus, target: 'claude-sonnet-5-5', context: 150_000, ...turn, warm: true, ttl1h: true });
  assert.ok(b.go > b.stay);
  const c = detour({ current: opus, target: 'claude-haiku-5-5', context: 300_000, ...turn, warm: true, ttl1h: true });
  assert.ok(c.go > c.stay);
  assert.equal(tier('claude-fable-5'), 'fable');
  assert.equal(priceOf('claude-fable-5', 0), priceOf('claude-opus-5-5', 0));
});

test('parseVerdict: one strict line, anywhere in the reply; anything else is null', () => {
  assert.deepEqual(parseVerdict('new haiku low 8 | one-line rename in one file.'), { kind: 'new', model: 'haiku', effort: 'low', confidence: 8, why: 'one-line rename in one file' });
  assert.equal(parseVerdict('Sure!\ncont sonnet medium 7 | approves the plan').kind, 'cont');
  assert.equal(parseVerdict('haiku low 8 | no kind'), null);
  assert.equal(parseVerdict('haiku'), null);
  assert.equal(parseVerdict(undefined), null);
});

function transcript(dir) {
  const t = join(dir, 't.jsonl');
  const file = join(dir, 'menu.css');
  writeFileSync(file, 'a\nb\nc\n');
  const user = (content) => ({ type: 'user', message: { content } });
  const asst = (id, extra = {}, usage = {}) => ({ type: 'assistant', timestamp: '2026-10-13T10:00:00Z', effort: 'xhigh', message: { id, model: 'claude-opus-5-5', usage: { input_tokens: 10, cache_read_input_tokens: 49_990, output_tokens: 500, ...usage }, content: [] }, ...extra });
  const rows = [
    user('fix the menu on mobile'),
    asst('m1', { message: { id: 'm1', model: 'claude-opus-5-5', usage: { input_tokens: 10, cache_read_input_tokens: 49_990, output_tokens: 500, cache_creation: { ephemeral_1h_input_tokens: 5 } }, content: [{ type: 'tool_use', name: 'Read', input: { file_path: file } }] } }),
    asst('m1'),
    asst('m2'),
    user([{ type: 'tool_result', content: 'x' }]),
    asst('side', { isSidechain: true }),
    user('<command-name>/effort</command-name>'),
    user('remove the red border'),
    asst('m3', { message: { id: 'm3', model: 'claude-opus-5-5', usage: { input_tokens: 10, cache_read_input_tokens: 49_990, output_tokens: 500 }, content: [{ type: 'text', text: 'Done. Want me to also fix the footer?' }] } }),
  ];
  writeFileSync(t, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  return { t, file };
}

test('readSession: last request, typical turn, earlier requests and files; brief stays short', () => {
  const dir = tmp();
  const { t, file } = transcript(dir);
  const s = readSession(t);
  assert.deepEqual({ ...s.last, at: undefined }, { model: 'claude-opus-5-5', effort: 'xhigh', context: 50_000, at: undefined, ttl1h: true });
  assert.equal(s.calls, 2); // turns of 2 and 1 requests; the upper middle
  assert.deepEqual(s.prompts, ['fix the menu on mobile', 'remove the red border']);
  assert.deepEqual(s.files, [file]);
  const b = brief(s, { cwd: dir, title: 'Menu fixes', prompt: 'remove the red border' });
  assert.match(b, /Earlier requests: "fix the menu on mobile"\n/);
  assert.match(b, /Session title: Menu fixes/);
  assert.match(b, /menu\.css \(3 lines\)/);
  assert.match(b, /50k tokens/);
  assert.match(b, /last reply ended with: "Done\. Want me to also fix the footer\?"/);
  assert.equal(brief(readSession(join(dir, 'missing.jsonl')), {}), 'New session, nothing done yet.');
});

test('decide: model when the detour pays, effort otherwise, nothing when unsure', () => {
  const now = Date.parse('2026-10-13T10:01:00Z');
  const current = { model: 'claude-opus-5-5', effort: 'xhigh', context: 50_000, at: Date.parse('2026-10-13T10:00:00Z'), ttl1h: true };
  const m = decide({ verdict: { kind: 'new', model: 'haiku', effort: 'low', confidence: 8, why: 'one-line rename' }, current, turn, now });
  assert.match(m, /Haiku can likely handle this: one-line rename\.\nThis turn on Haiku \(~US\$0\.012 instead of ~US\$0\.06 at list price, estimated\): put \/nudgeist:haiku in front and send\./);
  assert.match(m, /Stay on Opus 5\.5: send it again unchanged\./);
  const e = decide({ verdict: { kind: 'new', model: 'opus', effort: 'medium', confidence: 8, why: 'small question' }, current, turn, now });
  assert.match(e, /\/nudgeist:medium/);
  assert.equal(decide({ verdict: { kind: 'new', model: 'haiku', effort: 'low', confidence: 6, why: 'x' }, current, turn, now }), null);
  assert.equal(decide({ verdict: { kind: 'new', model: 'opus', effort: 'high', confidence: 9, why: 'x' }, current, turn, now }), null);
  // A yes or an ok continues work already under way: no hold, whatever the rating.
  assert.equal(decide({ verdict: { kind: 'cont', model: 'haiku', effort: 'low', confidence: 9, why: 'bare confirmation' }, current, turn, now }), null);
  const big = { ...current, context: 300_000, effort: 'high' };
  assert.equal(decide({ verdict: { kind: 'new', model: 'haiku', effort: 'low', confidence: 9, why: 'x' }, current: big, turn, now }), null);
});

test('handle: holds once, resend continues, two declines go quiet, commands and unattended pass', () => {
  const dir = tmp();
  const { t } = transcript(dir);
  const env = { CLAUDE_PLUGIN_DATA: tmp(), CLAUDE_CODE_SESSION_ATTENDED: '1' };
  const now = Date.parse('2026-10-13T10:01:00Z');
  let calls = 0;
  const advisor = () => (calls++, { kind: 'new', model: 'haiku', effort: 'low', confidence: 8, why: 'one-line rename' });
  const send = (prompt, e = env) => handle('prompt', { session_id: 's1', transcript_path: t, cwd: dir, prompt }, e, { advisor, now });
  assert.equal(send('rename foo to bar').decision, 'block');
  assert.equal(send('rename foo to bar'), null); // kept the model once
  assert.equal(send('/nudgeist:haiku rename foo to bar'), null); // accepted: decline streak resets
  assert.equal(send('rename a to b').decision, 'block');
  assert.equal(send('rename a to b'), null);
  assert.equal(send('rename c to d').decision, 'block');
  assert.match(send('rename c to d').systemMessage, /quiet for the rest of this session/);
  assert.equal(send('rename e to f'), null);
  assert.equal(calls, 3);
  assert.equal(send('rename g to h', { ...env, CLAUDE_CODE_SESSION_ATTENDED: '0' }), null);
  assert.equal(send('rename g to h', { ...env, NUDGEIST: 'off' }), null);
  assert.equal(handle('prompt', { session_id: 's2', transcript_path: t, prompt: '/clear' }, env, { advisor, now }), null);
});

test('handle: no advisor call when nothing could be saved; first prompt uses the SessionStart model', () => {
  const env = { CLAUDE_PLUGIN_DATA: tmp(), CLAUDE_CODE_SESSION_ATTENDED: '1' };
  const never = () => assert.fail('advisor called');
  const base = { session_id: 's3', transcript_path: '/nonexistent' };
  handle('start', { ...base, model: 'claude-haiku-5-5' }, env);
  assert.equal(handle('prompt', { ...base, prompt: 'rename foo' }, env, { advisor: never }), null);
  handle('switch', { ...base, to_model: 'claude-opus-5-5' }, env);
  const out = handle('prompt', { ...base, prompt: 'rename foo' }, env, { advisor: () => ({ kind: 'new', model: 'haiku', effort: 'low', confidence: 9, why: 'tiny edit' }) });
  assert.equal(out.decision, 'block');
});

test('decide: dated model ids read as their family, and exactly half on a cold cache counts', () => {
  const now = Date.parse('2026-10-13T12:00:00Z');
  const dated = { model: 'claude-opus-4-1-20250805', effort: 'high', context: 50_000, at: Date.parse('2026-10-13T11:59:00Z'), ttl1h: true };
  assert.match(decide({ verdict: { kind: 'new', model: 'haiku', effort: 'low', confidence: 8, why: 'x' }, current: dated, turn, now }), /Stay on Opus 4\.1: send it again unchanged\./);
  const cold = { model: 'claude-opus-5-5', effort: 'high', context: 80_000, at: Date.parse('2026-10-13T09:00:00Z'), ttl1h: true };
  assert.match(decide({ verdict: { kind: 'new', model: 'sonnet', effort: 'medium', confidence: 8, why: 'everyday edit' }, current: cold, turn, now }), /\/nudgeist:sonnet/);
});

test('handle: accepting clears the hold; only the four commands accept; old state files go at start', () => {
  const dir = tmp();
  const { t } = transcript(dir);
  const data = tmp();
  const env = { CLAUDE_PLUGIN_DATA: data, CLAUDE_CODE_SESSION_ATTENDED: '1' };
  const now = Date.parse('2026-10-13T10:01:00Z');
  const advisor = () => ({ kind: 'new', model: 'haiku', effort: 'low', confidence: 8, why: 'one-line rename' });
  const send = (prompt) => handle('prompt', { session_id: 's4', transcript_path: t, cwd: dir, prompt }, env, { advisor, now });
  const state = () => JSON.parse(readFileSync(join(data, 's4.json'), 'utf8'));
  assert.equal(send('rename foo to bar').decision, 'block');
  assert.equal(send('/nudgeist:help'), null);
  assert.equal(state().accepts, undefined);
  assert.equal(send('/nudgeist:haiku rename foo to bar'), null);
  assert.equal(state().held, undefined);
  assert.equal(send('rename foo to bar').decision, 'block', 'the same text later is a new message, not a decline');
  assert.equal(state().declines, 0);

  const old = join(data, 'old.json');
  writeFileSync(old, '{}');
  const week = new Date(now - 8 * 24 * 3600_000);
  utimesSync(old, week, week);
  handle('start', { session_id: 's5', model: 'claude-opus-5-5' }, env, { now });
  assert.equal(existsSync(old), false);
  assert.equal(existsSync(join(data, 's4.json')), true);
});
