// Parses durations like "2h" into seconds.
export function parseDuration(text) {
  const m = /^(\d+)h$/.exec(text.trim());
  if (!m) throw new Error(`Bad duration: ${text}`);
  return Number(m[1]) * 3600;
}
