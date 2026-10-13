export function receiveAll(queue) {
  if (!Array.isArray(queue)) throw new Error('Cannot receive: queue must be an array');
  return queue.splice(0);
}
