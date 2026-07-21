const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
