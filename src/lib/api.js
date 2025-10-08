export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, ''); // no trailing slash

export async function fetchJSON(path, init = {}) {
  const url = `${API_BASE}/${String(path || '').replace(/^\/+/, '')}`; // ensure absolute
  const res = await fetch(url, { cache: 'no-store', ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url} :: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export function currentYearMonth() {
  // Robust: use Intl parts, no string parsing
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Perth',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());

  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  return `${y}-${m}`; // e.g. "2025-10"
}


