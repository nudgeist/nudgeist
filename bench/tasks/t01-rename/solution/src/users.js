export function getUser(id, db) {
  return db.users.find((u) => u.id === id) ?? null;
}

export function listUsrs(db) {
  return db.users.map((u) => getUser(u.id, db));
}
