export function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function slugify(title) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
