const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function setToken(token: string) {
  if (typeof window !== 'undefined') localStorage.setItem('token', token);
}
export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function api(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error((await res.json()).error || 'request_failed');
  return res.json();
}

