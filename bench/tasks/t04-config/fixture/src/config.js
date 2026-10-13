export function loadConfig(env = process.env) {
  return { port: 3000, host: env.HOST || 'localhost' };
}
