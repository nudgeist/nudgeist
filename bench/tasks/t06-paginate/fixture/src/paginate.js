// page is 1-based
export function paginate(items, page, size) {
  const start = (page - 1) * size - (page > 1 ? 1 : 0);
  return items.slice(start, start + size);
}

export function pageCount(items, size) {
  return Math.ceil(items.length / size);
}
