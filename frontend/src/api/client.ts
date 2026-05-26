const BASE_URL = import.meta.env.VITE_API_BASE || '';
const TOKEN_KEY = 'sms_token';


function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path.startsWith('http') ? path : `${BASE_URL}/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText || 'Request failed');
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export async function apiBlob(path: string, params?: Record<string, string>): Promise<Blob> {
  const token = getToken();
  const url = new URL(path.startsWith('http') ? path : `${BASE_URL}/api${path}`, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Export failed');
  return res.blob();
}
