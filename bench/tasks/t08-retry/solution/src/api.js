export async function withRetry(fn, attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export const fetchUser = (http, id) => withRetry(() => http.get(`/users/${id}`));
export const fetchOrders = (http, id) => withRetry(() => http.get(`/users/${id}/orders`));
export const fetchInvoices = (http, id) => withRetry(() => http.get(`/invoices?user=${id}`));
