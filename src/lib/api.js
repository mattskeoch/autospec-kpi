// src/lib/api.js
export const API_BASE = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE || ''); // no trailing slash

function normalizeBaseUrl(input) {
  if (!input) return '';
  const trimmed = String(input).trim();
  if (!trimmed) return '';
  const noSlash = trimmed.replace(/\/+$/, '');
  return noSlash.startsWith('http') ? noSlash : `https://${noSlash}`;
}

export async function fetchJSON(path, init = {}) {
  const safePath = String(path || '').replace(/^\/+/, '');
  if (!safePath) throw new Error('fetchJSON requires a non-empty path');

  // If API_BASE is set, use it; else use relative (requires a reverse proxy rule on Pages)
  const url = API_BASE ? `${API_BASE}/${safePath}` : `/${safePath}`;

  const res = await fetch(url, { cache: 'no-store', ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url} :: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export function currentYearMonth() {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Perth',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  return `${y}-${m}`;
}
