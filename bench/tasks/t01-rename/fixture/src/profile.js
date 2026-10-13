import { getUsr } from './users.js';

export function profileName(id, db) {
  const u = getUsr(id, db);
  return u ? `${u.first} ${u.last}` : 'Unknown';
}
