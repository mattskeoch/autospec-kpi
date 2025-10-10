'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchJSON, currentYearMonth } from '@/lib/api';
import RefreshButton from '@/components/RefreshButton';

const METRICS = ['sales', 'deposits'];
const SCOPES = ['org', 'store', 'rep'];

export default function TargetsPage() {
  const [month, setMonth] = useState(currentYearMonth()); // "YYYY-MM"
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const asDate = (ym) => `${ym}-01`;

  const load = useCallback(async () => {
    try {
      setLoading(true); setErr('');
      const res = await fetchJSON(`targets?month=${month}`);
      setRows(Array.isArray(res?.rows) ? res.rows : []);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const g = new Map();
    for (const r of rows) {
      const key = `${r.scope}|${r.key}`;
      if (!g.has(key)) g.set(key, { scope: r.scope, key: r.key, items: [] });
      g.get(key).items.push(r);
    }
    return Array.from(g.values()).sort((a, b) =>
      a.scope.localeCompare(b.scope) || String(a.key).localeCompare(b.key)
    );
  }, [rows]);

  async function upsert(items) {
    // Ask for admin key at call-time; don’t hardcode it in the client bundle.
    const adminKey = window.prompt('Admin key to save targets:');
    if (!adminKey) return;

    const body = {
      month: month, // "YYYY-MM"
      updated_by: 'dashboard',
      items: items.map(it => ({
        scope: it.scope,
        key: it.key,
        metric: it.metric,
        target: Number(it.target || 0),
      })),
    };

    const url = 'targets/upsert';
    const res = await fetch(`/` + url.replace(/^\/+/, ''), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`Save failed: ${res.status} ${res.statusText} :: ${t}`);
    }
    await load();
  }

  function addBlankRow() {
    setRows(prev => ([
      ...prev,
      { month: asDate(month), scope: 'org', key: 'all', metric: 'sales', target: 0 },
    ]));
  }

  function updateRow(i, patch) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  }

  function removeRow(i) {
    setRows(prev => prev.filter((_, idx) => idx !== i));
  }

  async function saveAll() {
    const items = rows.map(r => ({
      scope: r.scope,
      key: r.key,
      metric: r.metric,
      target: r.target,
    }));
    await upsert(items);
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Targets</h1>
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm text-neutral-300 hover:underline">← Dashboard</Link>
          <RefreshButton onClick={load} loading={loading} />
        </div>
      </div>

      {err && <p className="mb-4 text-sm text-rose-400">Error: {err}</p>}

      <section className="rounded-2xl bg-surface p-4 sm:p-6">
        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-neutral-400">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg bg-neutral-900/70 px-3 py-2 text-sm"
          />
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={addBlankRow}
              className="rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-2 text-sm font-semibold"
            >
              Add Row
            </button>
            <button
              onClick={saveAll}
              className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
              disabled={loading || rows.length === 0}
            >
              Save All
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-300">
              <tr>
                <Th>Scope</Th>
                <Th>Key</Th>
                <Th>Metric</Th>
                <Th className="text-right">Target</Th>
                <Th className="w-24 text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-neutral-900/40">
              {rows.map((r, i) => (
                <tr key={`${i}-${r.scope}-${r.key}-${r.metric}`} className="border-t border-neutral-800">
                  <Td>
                    <select
                      value={r.scope}
                      onChange={(e) => updateRow(i, { scope: e.target.value })}
                      className="rounded-md bg-neutral-900/70 px-2 py-1"
                    >
                      {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Td>
                  <Td>
                    <input
                      value={r.key}
                      onChange={(e) => updateRow(i, { key: e.target.value })}
                      placeholder={r.scope === 'org' ? 'all / online / partner' : 'identifier'}
                      className="w-full rounded-md bg-neutral-900/70 px-2 py-1"
                    />
                  </Td>
                  <Td>
                    <select
                      value={r.metric}
                      onChange={(e) => updateRow(i, { metric: e.target.value })}
                      className="rounded-md bg-neutral-900/70 px-2 py-1"
                    >
                      {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Td>
                  <Td className="text-right">
                    <input
                      type="number"
                      inputMode="numeric"
                      step="1"
                      value={Number(r.target || 0)}
                      onChange={(e) => updateRow(i, { target: Number(e.target.value || 0) })}
                      className="w-40 rounded-md bg-neutral-900/70 px-2 py-1 text-right"
                    />
                  </Td>
                  <Td className="text-right">
                    <button
                      onClick={() => removeRow(i)}
                      className="inline-flex items-center rounded-md bg-rose-500/15 px-2 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/25"
                    >
                      Remove
                    </button>
                  </Td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-neutral-400">No targets for this month.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tips */}
        <p className="mt-3 text-xs text-neutral-500">
          Org keys: <code className="text-neutral-400">all</code>, <code className="text-neutral-400">online</code>, <code className="text-neutral-400">partner</code>.
          Metrics: <code className="text-neutral-400">sales</code>, <code className="text-neutral-400">deposits</code>.
        </p>
      </section>
    </main>
  );
}

function Th({ children, className = '' }) {
  return <th className={`px-3 py-2 text-left font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = '' }) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>;
}
