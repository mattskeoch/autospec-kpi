'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchJSON, currentYearMonth } from '@/lib/api';
import Link from 'next/link';
import KpiStat from '@/components/KpiStat';
import Highlights from '@/components/Highlights';
import Section from '@/components/Section';
import SmallStat from '@/components/SmallStat';
import ProgressStat from '@/components/ProgressStat';

function fmtAUD(n) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })
    .format(Number(n || 0));
}
function pctStr(p) { return `${Math.round(Math.max(0, Math.min(1, p || 0)) * 100)}%`; }
function top3(rows) {
  return [...(rows || [])]
    .sort((a, b) => (b.sales || 0) - (a.sales || 0))
    .slice(0, 3);
}

// --- helper to pull a target row (month already handled when fetching) ---
function pickTarget(rows, metric, scope = 'org', key = 'all') {
  const row = (rows || []).find(
    r => (r.scope || '').toLowerCase() === scope &&
      (r.key || '').toLowerCase() === key &&
      (r.metric || '').toLowerCase() === metric
  );
  return Number(row?.target || 0);
}

const DEFAULT_KPIS = { total_mtd: 0, east_mtd: 0, west_mtd: 0, as_of: '' };
const DEFAULT_REPS = { rows: [], as_of: '' };
const DEFAULT_TARGETS = { month: '', rows: [] };

export default function DashboardPage({
  initialKpis,
  initialReps,
  initialHighlights,
  initialTargets,
  initialError = '',
}) {
  const hasInitialData = Boolean(initialKpis && initialReps && initialHighlights && initialTargets);

  const [kpis, setKpis] = useState(initialKpis || DEFAULT_KPIS);
  const [reps, setReps] = useState(initialReps || DEFAULT_REPS);
  const [loading, setLoading] = useState(() => !hasInitialData);
  const [err, setErr] = useState(initialError);
  const [high, setHigh] = useState(initialHighlights || null);
  const [targets, setTargets] = useState(initialTargets || DEFAULT_TARGETS);

  useEffect(() => {
    if (hasInitialData) {
      setKpis(initialKpis);
      setReps(initialReps);
      setHigh(initialHighlights);
      setTargets(initialTargets);
      setLoading(false);
    }
  }, [hasInitialData, initialHighlights, initialKpis, initialReps, initialTargets]);

  useEffect(() => {
    setErr(initialError || '');
  }, [initialError]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr('');

      const ym = currentYearMonth();

      const [k, r, h, t] = await Promise.all([
        fetchJSON('kpis/mtd'),
        fetchJSON('rep-table'),
        fetchJSON('kpis/highlights'),
        fetchJSON(`targets?month=${ym}`),
      ]);

      setKpis(k);
      setReps(r);
      setHigh(h);
      setTargets(t);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasInitialData) {
      load();
    }
  }, [hasInitialData, load]);

  const top = top3(reps.rows);
  // --- computed values for progress vs targets (org-level) ---
  const salesTarget = pickTarget(targets?.rows, 'sales');       // scope='org', key='all'
  const depositsTarget = pickTarget(targets?.rows, 'deposits');

  const salesProgressPct = salesTarget
    ? Math.min(1, Number(kpis?.total_mtd || 0) / salesTarget)
    : 0;

  const depositsProgressPct = depositsTarget
    ? Math.min(1, Number(high?.totals?.total_deposits_mtd || 0) / depositsTarget)
    : 0;


  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Autospec Sales Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/sales-log"
            className="rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-2 text-sm font-semibold"
          >
            View Sales Log
          </Link>
          <button
            className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {err ? <p className="text-red-400 text-sm mb-4">Error: {err}</p> : null}

      {/* HERO BAND */}
      <div className="rounded-3xl p-6 sm:p-8 bg-neutral-950 border border-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiStat
            label="MTD Sales (All)"
            value={new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(kpis.total_mtd)}
            hint="vs last month"
            delta={kpis.delta_all_vs_last_month}
            deltaUp={(kpis.delta_all_vs_last_month ?? 0) >= 0}
            line={[0.2, 0.55, 0.35, 0.85, 0.5, 0.7, 0.6, 0.75]}
          />

          <KpiStat
            label="East"
            value={new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(kpis.east_mtd)}
            hint="vs last month"
            delta={kpis.delta_east_vs_last_month}
            deltaUp={(kpis.delta_east_vs_last_month ?? 0) >= 0}
            line={[0.1, 0.2, 0.35, 0.9, 0.55, 0.4, 0.32]}
            accent="text-rose-400"
          />

          <KpiStat
            label="West"
            value={new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(kpis.west_mtd)}
            hint="vs last month"
            delta={kpis.delta_west_vs_last_month}
            deltaUp={(kpis.delta_west_vs_last_month ?? 0) >= 0}
            line={[0.15, 0.6, 0.55, 0.45, 0.62, 0.58, 0.8]}
          />


        </div>



        <p className="text-xs text-neutral-400 mt-4">As of {kpis.as_of || reps.as_of || ''}</p>
      </div>

      {/* Secondary KPIs (progress cards) */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProgressStat
          label="Sales vs Target"
          value={Number(kpis?.total_mtd || 0)}
          target={Number(salesTarget || 0)}
          percent={salesTarget ? Number(kpis?.total_mtd || 0) / salesTarget : 0}
        />

        <ProgressStat
          label="Deposits vs Target"
          value={Number(high?.totals?.total_deposits_mtd || 0)}
          target={Number(depositsTarget || 0)}
          percent={
            depositsTarget
              ? Number(high?.totals?.total_deposits_mtd || 0) / depositsTarget
              : 0
          }
        />

        {/* No targets yet – same styling, shows “—” and a muted bar */}
        <ProgressStat
          label="Online Sales vs Target"
          value={Number(high?.totals?.online_sales_mtd || 0)}
        />

        <ProgressStat
          label="Partner Sales vs Target"
          value={Number(high?.totals?.partner_sales_mtd || 0)}
        />
      </div>


      {/* SECTION: Top Performers */}
      <Section
        title="Top Performers"
        subtitle="MTD sales — medals update live as orders land"
        right={<span className="text-xs text-neutral-500">{(reps.rows || []).length} reps</span>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {top.map((r, i) => (
            <Card key={`${r.rep}-${i}`}>
              <div className="text-sm text-neutral-400 mb-1">
                {['🥇', '🥈', '🥉'][i]} #{i + 1}
              </div>
              <div className="text-xl font-semibold">{r.rep || 'Unassigned'}</div>
              <div className="text-4xl font-bold tabular-nums mt-2">{fmtAUD(r.sales)}</div>
              {/* <div className="text-xs text-neutral-500 mt-2">Sales count: {r.salesCount ?? 0}</div> */}
            </Card>
          ))}
          {top.length === 0 && (
            <Card className="sm:col-span-3 text-neutral-400 text-sm">No salesperson data yet.</Card>
          )}
        </div>
      </Section>

      {high && (
        <div className="mt-6">
          <Highlights data={high} />
        </div>
      )}


      {/* SECTION: Team Leaderboard */}
      <Section
        title="Team Leaderboard"
        subtitle="MTD by rep"
        right={
          <div className="text-xs text-neutral-400">
            Help text?
          </div>
        }
      >
        <RepTable rows={reps.rows || []} />
      </Section>
    </main>
  );
}

/* ---------- Cards ---------- */

function KpiHeroCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-neutral-900/60 backdrop-blur p-6 border border-white/10 shadow-sm">
      <div className="text-sm text-neutral-300">{label}</div>
      <div className="text-4xl font-extrabold tabular-nums mt-2">{value}</div>
    </div>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl bg-neutral-800 p-6 shadow border border-white/5 ${className}`}>
      {children}
    </div>
  );
}

/* ---------- Table ---------- */

function pct(v) { return Math.max(0, Math.min(1, Number(v || 0))); }

function RepTable({ rows }) {
  return (
    <div className="mt-2">
      <div className="space-y-2">
        {(rows || []).map((r, idx) => (
          <div key={r.rep || idx} className="grid grid-cols-12 gap-4 bg-neutral-800 rounded-xl p-4 border border-white/5">
            <div className="col-span-3">
              <div className="text-xs text-neutral-400">Rep</div>
              <div className="font-semibold">{r.rep || 'Unassigned'}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-neutral-400">Sales</div>
              <div className="font-semibold">{fmtAUD(r.sales)}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-neutral-400">Deposits</div>
              <div className="font-semibold">{fmtAUD(r.deposits)}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-neutral-400">Sales Count</div>
              <div className="font-semibold">{r.salesCount ?? 0}</div>
            </div>
            <div className="col-span-3 space-y-2">
              <div className="text-[11px] text-neutral-400">Sales Progress {pctStr(r.salesProgress)}</div>
              <Bar pct={pct(r.salesProgress)} />
              <div className="text-[11px] text-neutral-400 mt-2">Deposit Progress {pctStr(r.depositProgress)}</div>
              <Bar pct={pct(r.depositProgress)} />
            </div>
          </div>
        ))}
        {(rows || []).length === 0 && (
          <div className="rounded-2xl bg-neutral-800 p-6 shadow text-neutral-400 text-sm border border-white/5">
            No rows yet.
          </div>
        )}
      </div>
    </div>
  );
}

function Bar({ pct }) {
  const p = Math.max(0, Math.min(1, Number(pct || 0)));
  return (
    <div className="h-2 w-full bg-neutral-700 rounded-full overflow-hidden">
      <div className="h-full bg-white/80" style={{ width: `${(p * 100).toFixed(1)}%` }} />
    </div>
  );
}
