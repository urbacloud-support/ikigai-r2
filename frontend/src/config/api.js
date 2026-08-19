export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export function authHeaders() {
  const token = localStorage.getItem('ikigai_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function authFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers || {}),
  };
  const response = await fetch(`${API_BASE}${url}`, { ...options, headers });
  
  // Centralized Error Handling for expired sessions
  if (response.status === 401 || response.status === 403) {
    window.dispatchEvent(new CustomEvent('auth-expired'));
  }
  
  return response;
}
