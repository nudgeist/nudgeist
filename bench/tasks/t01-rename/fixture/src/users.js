export function getUsr(id, db) {
  return db.users.find((u) => u.id === id) ?? null;
}

export function listUsrs(db) {
  return db.users.map((u) => getUsr(u.id, db));
}
