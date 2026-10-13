export function loadConfig(env = process.env) {
  return { port: Number(env.PORT) || 8080, host: env.HOST || 'localhost' };
}
