'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchJSON } from '@/lib/api';
import RefreshButton from '@/components/RefreshButton';

function fmtAUD(n) {
  const num = Number.isFinite(Number(n)) ? Number(n) : 0;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Coerce each incoming row to primitives so React never receives nested objects.
 * Handles BigQuery {value: ...} wrappers and Date-like values.
 */
function sanitizeRow(r = {}) {
  const s = (v) => {
    if (v == null) return '';
    if (typeof v === 'object') {
      if ('value' in v && v.value != null) return String(v.value);
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

/** Normalize the “source” field to stable lowercase tokens (all | east | west | online). */
const normalizeSource = (value) => String(value ?? '').trim().toLowerCase();

export default function SalesLogPage() {
  const [data, setData] = useState({ rows: [], as_of: '' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Filters
  const [source, setSource] = useState('All');       // 'All' | 'east' | 'west' | 'online'
  const [salesperson, setSalesperson] = useState('All');

  /** Fetch and sanitize MTD sales-log rows. */
  async function load() {
    try {
      setLoading(true);
      setErr('');
      const res = await fetchJSON('sales-log');
      const rows = Array.isArray(res?.rows) ? res.rows.map(sanitizeRow) : [];
      setData({ rows, as_of: String(res?.as_of || '') });
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => { load(); }, []);

  // Distinct salesperson options (stable + sorted)
  const salespeople = useMemo(() => {
    const names = Array.from(new Set((data.rows || []).map(r => r.salesperson || '—'))).sort();
    return ['All', ...names];
  }, [data.rows]);

  // Distinct source options based on current data
  const sourceOptions = useMemo(() => {
    const unique = new Set();
    for (const row of data.rows || []) {
      const normalized = normalizeSource(row.source);
      if (normalized) unique.add(normalized);
    }
    return ['All', ...Array.from(unique).sort()];
  }, [data.rows]);

  // If the chosen source disappears after a refresh, fall back to 'All'
  useEffect(() => {
    if (source !== 'All' && !sourceOptions.includes(source)) {
      setSource('All');
    }
  }, [source, sourceOptions]);

  // Apply filters efficiently
  const filtered = useMemo(() => {
    const selectedSource = source === 'All' ? null : source;
    return (data.rows || []).filter(r => {
      const okSource = selectedSource ? normalizeSource(r.source) === selectedSource : true;
      const okRep = salesperson === 'All' ? true : (r.salesperson || '—') === salesperson;
      return okSource && okRep;
    });
  }, [data.rows, source, salesperson]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {/* Header + actions */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sales Log</h1>
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm text-neutral-300 hover:underline">← Dashboard</Link>
          <RefreshButton onClick={load} loading={loading} />
        </div>
      </div>

      {err ? <p className="mb-4 text-sm text-red-400">Error: {err}</p> : null}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="text-sm text-neutral-300">Source</label>
        <select
          value={source}
          onChange={e => setSource(e.target.value)}
          className="rounded-lg bg-neutral-800 px-3 py-2"
        >
          {sourceOptions.map(x => (
            <option key={x} value={x}>{x === 'All' ? x : x.toUpperCase()}</option>
          ))}
        </select>

        <label className="ml-4 text-sm text-neutral-300">Salesperson</label>
        <select
          value={salesperson}
          onChange={e => setSalesperson(e.target.value)}
          className="rounded-lg bg-neutral-800 px-3 py-2"
        >
          {salespeople.map(x => <option key={x} value={x}>{x}</option>)}
        </select>

        <div className="ml-auto self-center text-xs text-neutral-500">
          As of {data.as_of}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[900px] text-sm">
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
            {filtered.map((r) => {
              // Prefer a stable key if available (orderId), else fallback
              const key = r.orderId || `${r.orderNumber}-${r.date}`;
              return (
                <tr key={key} className="border-t border-neutral-800">
                  <Td>{r.date}</Td>
                  <Td className="font-medium">{r.customer}</Td>
                  <Td className="font-medium">{r.salesperson}</Td>
                  <Td className="uppercase">{r.source}</Td>
                  <Td>{r.orderNumber}</Td>
                  <Td className="text-right">{fmtAUD(r.orderTotal)}</Td>
                  <Td className="text-right">{fmtAUD(r.outstanding)}</Td>
                  <Td className="text-right">{fmtAUD(r.amountPaid)}</Td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-neutral-400">
                  No orders for this filter.
                </td>
              </tr>
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
