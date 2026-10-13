import { getUser } from './users.js';

export function profileName(id, db) {
  const u = getUser(id, db);
  return u ? `${u.first} ${u.last}` : 'Unknown';
}
