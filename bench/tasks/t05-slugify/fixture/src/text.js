export function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
