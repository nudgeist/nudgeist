export function receiveAll(queue) {
  if (!Array.isArray(queue)) throw new Error('Cannot recieve: queue must be an array');
  return queue.splice(0);
}
