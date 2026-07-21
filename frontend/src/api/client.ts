const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const API = `${BASE}/api`;

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const texto = await res.text().catch(() => '');
    throw new Error(`Error ${res.status}: ${texto || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function get<T>(path: string): Promise<T> {
  return fetch(`${API}${path}`).then((r) => handle<T>(r));
}

export function post<T>(path: string): Promise<T> {
  return fetch(`${API}${path}`, { method: 'POST' }).then((r) => handle<T>(r));
}

export async function uploadFile<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}${path}`, { method: 'POST', body: form });
  return handle<T>(res);
}

/** Descarga un archivo del backend (exportación de reportes) y dispara el guardado. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`Error ${res.status} al exportar`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
