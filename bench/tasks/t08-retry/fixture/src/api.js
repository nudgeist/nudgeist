export async function fetchUser(http, id) {
  let lastError;
  for (let i = 0; i < 3; i++) {
    try {
      return await http.get(`/users/${id}`);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export async function fetchOrders(http, id) {
  let lastError;
  for (let i = 0; i < 3; i++) {
    try {
      return await http.get(`/users/${id}/orders`);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export async function fetchInvoices(http, id) {
  let lastError;
  for (let i = 0; i < 3; i++) {
    try {
      return await http.get(`/invoices?user=${id}`);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}
