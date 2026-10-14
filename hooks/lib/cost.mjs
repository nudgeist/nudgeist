// List prices per million tokens (Anthropic's pricing page, read 2026-10-13). Only these exact models get a US$ figure in a notice.
// ponytail: one table by hand; update it when Anthropic changes prices.
const PRICES = {
  'claude-opus-5-5': { w5m: 5, w1h: 8, read: 0.2, out: 20 },
  'claude-sonnet-5-5': { w5m: 2.5, w1h: 4, read: 0.1, out: 10 },
  'claude-haiku-5-5': { w5m: 0.125, w1h: 0.2, read: 0.01, out: 0.5 },
};
// Haiku 5.5 bills prompts over 100k tokens at five times the rate.
const HAIKU_LONG = { w5m: 0.625, w1h: 1, read: 0.05, out: 2.5 };
export const TARGETS = { haiku: 'claude-haiku-5-5', sonnet: 'claude-sonnet-5-5' };
const RANK = { haiku: 0, sonnet: 1, opus: 2, fable: 3 };

export const tier = (model) => (typeof model === 'string' && /fable|opus|sonnet|haiku/i.exec(model)?.[0].toLowerCase()) || null;
export const rank = (t) => RANK[t] ?? -1;

// Older or unlisted models of a family are priced as the 5.5 model of that
// family (Fable as Opus): it can only understate what a cheaper model saves.
export function priceOf(model, context) {
  const t = tier(model);
  if (t === 'haiku' && context > 100_000) return HAIKU_LONG;
  return PRICES[`claude-${t === 'fable' ? 'opus' : t}-5-5`] ?? null;
}

export const listed = (model) => model in PRICES;

// What one turn costs, in US$, on `model`: its first request reads the
// conversation from the prompt cache when `warm`, else writes it; the turn's
// other requests read it. `ttl1h` picks the cache-write rate the session pays.
export function turnCost({ model, context, calls, out, warm, ttl1h }) {
  const p = priceOf(model, context);
  if (!p) return null;
  const write = ttl1h ? p.w1h : p.w5m;
  return (context * (warm ? p.read : write) + Math.max(0, calls - 1) * context * p.read + out * p.out) / 1e6;
}

// This turn on `target` (its cache is cold: it never saw this conversation)
// against staying on the session's model.
export function detour({ current, target, context, calls, out, warm, ttl1h }) {
  const stay = turnCost({ model: current, context, calls, out, warm, ttl1h });
  const go = turnCost({ model: target, context, calls, out, warm: false, ttl1h });
  return stay == null || go == null ? null : { stay, go };
}
