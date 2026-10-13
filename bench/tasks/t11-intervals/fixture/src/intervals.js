// Merges overlapping [start, end] intervals.
export function mergeIntervals(list) {
  const sorted = [...list].sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [s, e] of sorted) {
    const last = out[out.length - 1];
    if (last && s < last[1]) last[1] = e;
    else out.push([s, e]);
  }
  return out;
}
