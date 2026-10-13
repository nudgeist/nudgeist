// The advisor: Haiku reads the request and the session brief and names the
// cheapest model and effort it expects to do the job well. It runs through
// the user's own `claude` (same account, same login), with no tools, no
// settings, no plugins and no session file, so it can't act or recurse.
// Measured 2026-10-13 (2.1.296): ~1.2k tokens and 1.7-3 s per call.
import { execFileSync } from 'node:child_process';

const SYSTEM = `You pick the cheapest Claude model and reasoning effort that will do a developer's next request in Claude Code well.
Models, cheapest first: haiku (clear, local, mechanical work), sonnet (most everyday coding), opus (hard debugging, design, ambiguous or wide-reaching work).
You see the request and a short summary of the session, not the code. When unsure, pick the stronger model and say so with a low confidence.
Reply with exactly one line and nothing else:
<haiku|sonnet|opus> <low|medium|high> <confidence 1-9> | <reason, at most 8 words>`;

const LINE = /^\s*(haiku|sonnet|opus)\s+(low|medium|high)\s+([1-9])\s*\|\s*(.+?)\s*$/im;

export function parseVerdict(text) {
  const m = LINE.exec(typeof text === 'string' ? text : '');
  return m ? { model: m[1].toLowerCase(), effort: m[2].toLowerCase(), confidence: Number(m[3]), why: m[4].replace(/[.\s]+$/, '').slice(0, 80) } : null;
}

// The verdict, or null on any failure (no claude, timeout, odd reply): the
// prompt then goes through untouched.
export function askAdvisor({ prompt, brief, env = process.env, timeoutMs = 8000 }) {
  const input = `Session summary:\n${brief}\n\nNext request:\n${prompt.slice(0, 2000)}`;
  try {
    const raw = execFileSync(
      env.CLAUDE_CODE_EXECPATH || 'claude',
      ['-p', '--model', 'haiku', '--effort', 'low', '--tools', '', '--setting-sources', '', '--strict-mcp-config', '--disable-slash-commands', '--no-session-persistence', '--system-prompt', SYSTEM, '--output-format', 'json'],
      {
        input,
        encoding: 'utf8',
        timeout: timeoutMs,
        stdio: ['pipe', 'pipe', 'ignore'],
        // Startup without these took ~4 s of the ~8 s.
        env: { ...env, NUDGEIST_CHILD: '1', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1', DISABLE_AUTOUPDATER: '1', DISABLE_TELEMETRY: '1', MAX_THINKING_TOKENS: '0' },
      },
    );
    const r = JSON.parse(raw);
    const verdict = parseVerdict(r.result);
    return verdict && { ...verdict, cost_usd: r.total_cost_usd };
  } catch {
    return null;
  }
}
