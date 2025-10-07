'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchJSON } from '@/lib/api';

function fmtAUD(n) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(Number(n || 0));
}

export default function SalesLogPage() {
  const [data, setData] = useState({ rows: [], as_of: '' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // filters
  const [source, setSource] = useState('All');          // All | east | west | online
  const [salesperson, setSalesperson] = useState('All');// All or exact name

  async function load() {
    try {
      setLoading(true); setErr('');
      const res = await fetchJSON('sales-log');
      setData(res || { rows: [], as_of: '' });
    } catch (e) { setErr(String(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const salespeople = useMemo(() => {
    const names = Array.from(new Set((data.rows || []).map(r => r.salesperson || '—'))).sort();
    return ['All', ...names];
  }, [data.rows]);

  const filtered = useMemo(() => {
    return (data.rows || []).filter(r => {
      const okSource = source === 'All' ? true : (r.source || '') === source;
      const okRep = salesperson === 'All' ? true : (r.salesperson || '—') === salesperson;
      return okSource && okRep;
    });
  }, [data.rows, source, salesperson]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Sales Log (MTD)</h1>
        <div className="flex items-center gap-2">
          <a href="/" className="text-sm text-neutral-300 hover:underline">← Dashboard</a>
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
          {['All', 'east', 'west', 'online'].map(x => <option key={x} value={x}>{x}</option>)}
        </select>

        <label className="text-sm text-neutral-300 ml-4">Salesperson</label>
        <select value={salesperson} onChange={e => setSalesperson(e.target.value)} className="bg-neutral-800 rounded-lg px-3 py-2">
          {salespeople.map(x => <option key={x} value={x}>{x}</option>)}
        </select>

        <div className="ml-auto text-xs text-neutral-500 self-center">
          As of {data.as_of || ''}
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
                <Td className="font-medium">{r.customer || ''}</Td>
                <Td className="font-medium">{r.salesperson || '—'}</Td>
                <Td className="uppercase">{r.source || ''}</Td>
                <Td>{r.orderNumber || ''}</Td>
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
