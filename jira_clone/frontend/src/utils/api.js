// Centralized API fetch utility for authenticated requests
export async function apiFetch(url, options = {}, navigate) {
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  let method = (options.method || 'GET').toUpperCase();
  let opts = { ...options, headers };
  if (method === 'GET' || method === 'HEAD') {
    // Remove body for GET/HEAD requests
    const { body, ...rest } = opts;
    opts = rest;
  }
  const res = await fetch(url, opts);
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (navigate) navigate('/login');
    throw new Error('Unauthorized');
  }
  return res;
} 