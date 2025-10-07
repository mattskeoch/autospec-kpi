export async function fetchJSON(path) {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  const base = process.env.NEXT_PUBLIC_API_BASE || '';
  const url = base ? `${base}/${clean}` : `/${clean.startsWith('api/') ? clean : `api/${clean}`}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${res.statusText}: ${text || url}`);
  }
  return res.json();
}
