// What the transcript says about the session, read locally and never sent
// anywhere but the advisor: the last request's model, effort and context, how
// much a typical turn does, and a short brief of what the session is about.
// The transcript format isn't a stable API, so anything unexpected is skipped.
import { closeSync, fstatSync, openSync, readFileSync, readSync, statSync } from 'node:fs';
import { isAbsolute, relative } from 'node:path';

const SLICE_BYTES = 512 * 1024;
const FILE_TOOLS = new Set(['Read', 'Edit', 'MultiEdit', 'Write', 'NotebookEdit']);

function tail(path) {
  let fd;
  try {
    fd = openSync(path, 'r');
  } catch {
    return '';
  }
  try {
    const size = fstatSync(fd).size;
    const buf = Buffer.alloc(Math.min(size, SLICE_BYTES));
    readSync(fd, buf, 0, buf.length, size - buf.length);
    return buf.toString('utf8');
  } finally {
    closeSync(fd);
  }
}

// A prompt a person typed (not a tool result, command output or tag).
function typedText(rec) {
  if (rec.type !== 'user' || rec.isMeta || rec.isSidechain) return null;
  const c = rec.message?.content;
  const text = typeof c === 'string' ? c : Array.isArray(c) && c.every((b) => b.type === 'text') ? c.map((b) => b.text).join('\n') : null;
  return text && !text.trimStart().startsWith('<') ? text.trim() : null;
}

const median = (xs) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : null);

export function readSession(path) {
  const turns = [];
  const prompts = [];
  const files = [];
  const seen = new Set();
  let last = null;
  let reply = null;
  let turn = null;
  for (const line of tail(path).split('\n')) {
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      continue; // the slice's first line can be cut
    }
    const text = typedText(rec);
    if (text) {
      prompts.push(text);
      turn = { calls: 0, out: 0 };
      turns.push(turn);
      continue;
    }
    const m = rec.message;
    if (rec.type !== 'assistant' || rec.isSidechain || !m?.usage || typeof m.model !== 'string' || m.model.startsWith('<')) continue;
    for (const b of Array.isArray(m.content) ? m.content : []) {
      const p = b.type === 'tool_use' && FILE_TOOLS.has(b.name) ? b.input?.file_path ?? b.input?.notebook_path : null;
      if (typeof p === 'string') files.push(p);
      if (b.type === 'text' && typeof b.text === 'string' && b.text.trim()) reply = b.text.trim();
    }
    // One API request is written as several records that share its id and usage.
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    const u = m.usage;
    const context = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
    last = {
      model: m.model,
      effort: typeof rec.effort === 'string' ? rec.effort : null,
      context,
      at: Date.parse(rec.timestamp),
      ttl1h: (u.cache_creation?.ephemeral_1h_input_tokens || 0) > 0 || last?.ttl1h === true,
    };
    if (turn) {
      turn.calls++;
      turn.out += u.output_tokens || 0;
    }
  }
  const done = turns.filter((t) => t.calls > 0).slice(-10);
  return {
    last,
    calls: median(done.map((t) => t.calls)),
    out: median(done.map((t) => t.out)),
    prompts: prompts.slice(-4),
    reply,
    files: [...new Set(files.reverse())].slice(0, 5),
  };
}

function lines(path) {
  try {
    if (statSync(path).size > 2 * 1024 * 1024) return null;
    let n = 0;
    for (const ch of readFileSync(path, 'utf8')) if (ch === '\n') n++;
    return n;
  } catch {
    return null;
  }
}

const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// A few lines for the advisor: what the session is about, without the code.
export function brief(facts, { cwd, title, prompt }) {
  // The prompt being checked may already be in the transcript: it's sent separately.
  const earlier = facts.prompts.filter((p) => p !== prompt).slice(-3);
  const out = [];
  if (title) out.push(`Session title: ${clip(title, 80)}`);
  if (cwd) out.push(`Project folder: ${cwd.split(/[\\/]/).pop()}`);
  if (earlier.length) out.push(`Earlier requests: ${earlier.map((p) => `"${clip(p.replace(/\s+/g, ' '), 120)}"`).join(' | ')}`);
  if (facts.files.length)
    out.push(
      `Files in play: ${facts.files
        .map((f) => {
          const n = lines(f);
          const name = cwd && isAbsolute(f) && !relative(cwd, f).startsWith('..') ? relative(cwd, f) : f;
          return n == null ? name : `${name} (${n.toLocaleString('en-US')} lines)`;
        })
        .join(', ')}`,
    );
  // What a short answer like "yes" is answering: the end of Claude's last reply.
  if (facts.reply) out.push(`Claude's last reply ended with: "${facts.reply.length > 200 ? `…${facts.reply.slice(-199)}` : facts.reply}"`);
  if (facts.last) out.push(`Conversation so far: ${Math.round(facts.last.context / 1000)}k tokens`);
  return out.join('\n') || 'New session, nothing done yet.';
}
