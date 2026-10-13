export function createClient({ request, refreshToken }) {
  let token = null;

  async function refresh() {
    token = await refreshToken();
  }

  return async function call(path) {
    if (!token) await refresh();
    let res = await request(path, token);
    if (res.status === 401) {
      await refresh();
      res = await request(path, token);
    }
    return res;
  };
}
