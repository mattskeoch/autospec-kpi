// src/lib/api.js
export async function fetchJSON(path) {
  // Accept either "/api/..." or "api/..."
  const url = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${res.statusText}: ${text || url}`);
  }
  return res.json();
}
