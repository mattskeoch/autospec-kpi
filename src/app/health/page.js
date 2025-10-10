'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchJSON } from '@/lib/api';
import RefreshButton from '@/components/RefreshButton';

export default function HealthPage() {
  const [data, setData] = useState(null);
  const [latency, setLatency] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true); setErr('');
      const t0 = performance.now();
      const res = await fetchJSON('status');
      const t1 = performance.now();
      setLatency(Math.round(t1 - t0));
      setData(res);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Service Health</h1>
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm text-neutral-300 hover:underline">← Dashboard</Link>
          <RefreshButton onClick={load} loading={loading} />
        </div>
      </div>

      {err && <p className="mb-4 text-sm text-rose-400">Error: {err}</p>}

      <section className="rounded-2xl bg-surface p-4 sm:p-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Stat label="API OK" value={data?.ok ? 'Yes' : 'No'} />
          <Stat label="API Latency" value={latency != null ? `${latency} ms` : '—'} />
          <Stat label="Timestamp" value={data?.ts || '—'} />
          <Stat label="Environment" value={process.env.NEXT_PUBLIC_API_BASE ? 'Remote API' : 'Same origin'} />
        </dl>
      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-neutral-900/60 p-4">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
