'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchJSON } from '@/lib/api';

function fmtAUD(n) {
  const num = Number.isFinite(Number(n)) ? Number(n) : 0;
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(num);
}

// Force every field to primitives so React never sees objects.
function sanitizeRow(r = {}) {
  const s = (v) => {
    if (v == null) return '';
    if (typeof v === 'object') {
      if ('value' in v && v.value != null) return String(v.value);   // BigQuery { value: ... }
      if (typeof v.toISOString === 'function') return v.toISOString().slice(0, 10);
      return String(v);
    }
    return String(v);
  };
  const n = (v) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };
  return {
    date: s(r.date),
    customer: s(r.customer),
    salesperson: s(r.salesperson || '—'),
    source: s(r.source),
    orderNumber: s(r.orderNumber),
    orderTotal: n(r.orderTotal),
    outstanding: n(r.outstanding),
    amountPaid: n(r.amountPaid),
    shop: s(r.shop),
    orderId: s(r.orderId ?? ''),
    tags: s(r.tags),
  };
}

export default function SalesLogPage() {
  const [data, setData] = useState({ rows: [], as_of: '' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // filters
  const [source, setSource] = useState('All');          // All | east | west | online
  const [salesperson, setSalesperson] = useState('All');// All or exact name

  const normalizeSource = (value) => (value ?? '').trim().toLowerCase();

  async function load() {
    try {
      setLoading(true); setErr('');
      const res = await fetchJSON('sales-log');
      // sanitize everything up-front
      const rows = Array.isArray(res?.rows) ? res.rows.map(sanitizeRow) : [];
      setData({ rows, as_of: String(res?.as_of || '') });
    } catch (e) { setErr(String(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const salespeople = useMemo(() => {
    const names = Array.from(new Set((data.rows || []).map(r => r.salesperson || '—'))).sort();
    return ['All', ...names];
  }, [data.rows]);

  const sourceOptions = useMemo(() => {
    const unique = new Set();
    for (const row of data.rows || []) {
      const normalized = normalizeSource(row.source);
      if (normalized) unique.add(normalized);
    }
    return ['All', ...Array.from(unique).sort()];
  }, [data.rows]);

  useEffect(() => {
    if (source !== 'All' && !sourceOptions.includes(source)) {
      setSource('All');
    }
  }, [source, sourceOptions]);

  const filtered = useMemo(() => {
    const selectedSource = source === 'All' ? null : source;
    return (data.rows || []).filter(r => {
      const okSource = selectedSource ? normalizeSource(r.source) === selectedSource : true;
      const okRep = salesperson === 'All' ? true : (r.salesperson || '—') === salesperson;
      return okSource && okRep;
    });
  }, [data.rows, source, salesperson]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Sales Log (MTD)</h1>
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm text-neutral-300 hover:underline">← Dashboard</Link>
          <button
            className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
            onClick={load}
            disabled={loading}
          >{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      </div>

      {err ? <p className="text-red-400 text-sm mb-4">Error: {err}</p> : null}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <label className="text-sm text-neutral-300">Source</label>
        <select value={source} onChange={e => setSource(e.target.value)} className="bg-neutral-800 rounded-lg px-3 py-2">
          {sourceOptions.map(x => (
            <option key={x} value={x}>{x === 'All' ? x : x.toUpperCase()}</option>
          ))}
        </select>

        <label className="text-sm text-neutral-300 ml-4">Salesperson</label>
        <select value={salesperson} onChange={e => setSalesperson(e.target.value)} className="bg-neutral-800 rounded-lg px-3 py-2">
          {salespeople.map(x => <option key={x} value={x}>{x}</option>)}
        </select>

        <div className="ml-auto text-xs text-neutral-500 self-center">
          As of {data.as_of}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <Th>Date</Th>
              <Th>Customer Name</Th>
              <Th>Sales Person</Th>
              <Th>Source</Th>
              <Th>Order #</Th>
              <Th className="text-right">Order Total</Th>
              <Th className="text-right">Outstanding</Th>
              <Th className="text-right">Amount Paid</Th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-neutral-900/40">
            {filtered.map((r, i) => (
              <tr key={`${r.orderNumber}-${i}`} className="border-t border-neutral-800">
                <Td>{r.date}</Td>
                <Td className="font-medium">{r.customer}</Td>
                <Td className="font-medium">{r.salesperson}</Td>
                <Td className="uppercase">{r.source}</Td>
                <Td>{r.orderNumber}</Td>
                <Td className="text-right">{fmtAUD(r.orderTotal)}</Td>
                <Td className="text-right">{fmtAUD(r.outstanding)}</Td>
                <Td className="text-right">{fmtAUD(r.amountPaid)}</Td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center text-neutral-400 py-10">No orders for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Th({ children, className = '' }) {
  return <th className={`px-3 py-2 text-left font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = '' }) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>;
}
