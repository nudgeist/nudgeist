export function createClient({ request, refreshToken }) {
  let token = null;
  let pending = null;

  function refresh() {
    pending ??= refreshToken()
      .then((t) => {
        token = t;
      })
      .finally(() => {
        pending = null;
      });
    return pending;
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
