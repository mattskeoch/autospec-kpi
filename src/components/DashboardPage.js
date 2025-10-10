'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchJSON, currentYearMonth } from '@/lib/api';
import Link from 'next/link';
import RefreshButton from '@/components/RefreshButton';
import KpiStat from '@/components/KpiStat';
import Highlights from '@/components/Highlights';
import Section from '@/components/Section';
import ProgressStat from '@/components/ProgressStat';
import RepTable from '@/components/RepTable';


const AUD0 = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
const INT0 = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 });

function fmtAUD(n) { return AUD0.format(Number(n || 0)); }
function fmtAUDNoSymbol(n) { return INT0.format(Number(n || 0)); }

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

// --- sparkline helper: MTD only (Perth local), normalized 0..1 ---
function makeSparkSeries(input, { scope = 'all', debug = false } = {}) {
  const rows = Array.isArray(input) ? input : (Array.isArray(input?.rows) ? input.rows : []);
  const TZ = 'Australia/Perth';

  // Amount candidates (shaped + sales-log)
  const amountOf = (r) => Number(
    r?.adjusted_order_total ??
    r?.order_total_after_labour ??
    r?.order_total_net ??
    r?.order_total ??
    r?.orderTotal ??
    r?.amountPaid ??
    0
  );

  // Date candidates (shaped + sales-log)
  const pickDate = (r) =>
    r?.date_utc ??
    r?.created_at ??
    r?.created_at_utc ??
    r?.last_updated_at ??
    r?.fulfillment_date_utc ??
    r?.date ??
    null;

  // Online / region
  const isOnline = (r) =>
    r?.is_online === true ||
    /online store/i.test(String(r?.tags || '')) ||
    String(r?.source || '').trim().toLowerCase() === 'online';

  const region = (r) => {
    const sr = String(r?.store_region || '').toLowerCase();
    if (sr) return sr;
    const src = String(r?.source || '').toLowerCase();
    return (src === 'east' || src === 'west') ? src : '';
  };

  // Scope filter (All includes online; East/West exclude online)
  let filtered = rows;
  if (scope === 'east') filtered = rows.filter((r) => region(r) === 'east' && !isOnline(r));
  if (scope === 'west') filtered = rows.filter((r) => region(r) === 'west' && !isOnline(r));

  // Build Perth-local Y/M/D parts for "today"
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const y = Number(parts.find(p => p.type === 'year').value);
  const m = Number(parts.find(p => p.type === 'month').value);
  const dToday = Number(parts.find(p => p.type === 'day').value);

  // Map Perth-local YYYY-MM-DD -> sum(amount)
  const toLocalYMD = (iso) => {
    if (!iso) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso);
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toLocaleDateString('en-CA', { timeZone: TZ });
  };

  const buckets = new Map();
  for (const r of filtered) {
    const ymd = toLocalYMD(pickDate(r));
    if (!ymd) continue;
    // keep only rows in *this* month (Perth-local)
    if (!ymd.startsWith(`${String(y)}-${String(m).padStart(2, '0')}-`)) continue;
    const amt = amountOf(r);
    if (!Number.isFinite(amt) || amt <= 0) continue;
    buckets.set(ymd, (buckets.get(ymd) || 0) + amt);
  }

  // Build day-by-day series from 1 → today (Perth)
  const series = [];
  for (let day = 1; day <= dToday; day++) {
    // Construct a UTC date from Y/M/day, then render to Perth YMD to avoid TZ drift
    const ymd = new Date(Date.UTC(y, m - 1, day))
      .toLocaleDateString('en-CA', { timeZone: TZ });
    series.push(buckets.get(ymd) || 0);
  }

  if (debug) {
    // eslint-disable-next-line no-console
    console.table(series.map((v, i) => ({
      day: new Date(Date.UTC(y, m - 1, i + 1))
        .toLocaleDateString('en-CA', { timeZone: TZ }),
      value: v,
    })));
  }

  const max = Math.max(1, ...series);
  return series.map((v) => Math.max(0, Math.min(1, v / max)));
}

// Did this scope record any sales today (Perth local)?
function hasSaleToday(input, { scope = 'all' } = {}) {
  const rows = Array.isArray(input) ? input : (Array.isArray(input?.rows) ? input.rows : []);
  const TZ = 'Australia/Perth';

  const amountOf = (r) => Number(
    r?.adjusted_order_total ??
    r?.order_total_after_labour ??
    r?.order_total_net ??
    r?.order_total ??
    r?.orderTotal ??
    r?.amountPaid ??
    0
  );

  const pickDate = (r) =>
    r?.date_utc ??
    r?.created_at ??
    r?.created_at_utc ??
    r?.last_updated_at ??
    r?.fulfillment_date_utc ??
    r?.date ??
    null;

  const isOnline = (r) =>
    r?.is_online === true ||
    /online store/i.test(String(r?.tags || '')) ||
    String(r?.source || '').trim().toLowerCase() === 'online';

  const region = (r) => {
    const sr = String(r?.store_region || '').toLowerCase();
    if (sr) return sr;
    const src = String(r?.source || '').toLowerCase();
    return (src === 'east' || src === 'west') ? src : '';
  };

  let filtered = rows;
  if (scope === 'east') filtered = rows.filter((r) => region(r) === 'east' && !isOnline(r));
  if (scope === 'west') filtered = rows.filter((r) => region(r) === 'west' && !isOnline(r));

  const todayYMD = new Date().toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD

  let sum = 0;
  for (const r of filtered) {
    const raw = pickDate(r);
    if (!raw) continue;
    const ymd =
      /^\d{4}-\d{2}-\d{2}$/.test(String(raw))
        ? String(raw)
        : new Date(raw).toLocaleDateString('en-CA', { timeZone: TZ });

    if (ymd === todayYMD) {
      sum += amountOf(r) || 0;
      if (sum > 0) return true; // early exit
    }
  }
  return false;
}

// Subtle podium glows: gold (1st), silver (2nd), bronze (3rd)
function podiumGlow(rankIndex) {
  switch (rankIndex) {
    case 0: // 🥇 gold — strongest
      return 'opacity-30 bg-[radial-gradient(120%_120%_at_50%_30%,rgba(251,191,36,0.26),rgba(251,191,36,0.10)_42%,transparent_70%)]';
    case 1: // 🥈 silver — softer + cooler gray
      return 'opacity-0 bg-[radial-gradient(120%_120%_at_50%_30%,rgba(206,212,218,0.20),rgba(206,212,218,0.06)_42%,transparent_70%)]';
    default: // 🥉 bronze — softer warm brown
      return 'opacity-0 bg-[radial-gradient(120%_120%_at_50%_30%,rgba(205,127,50,0.18),rgba(205,127,50,0.06)_42%,transparent_70%)]';
  }
}

function podiumNumberIcon(i) {
  return i === 0 ? 'ri-number-1' : i === 1 ? 'ri-number-2' : 'ri-number-3';
}



export default function DashboardPage({
  initialKpis,
  initialReps,
  initialHighlights,
  initialTargets,
  initialSalesLog,
  initialError = '',
}) {
  const hasInitialData = Boolean(initialKpis && initialReps && initialHighlights && initialTargets);

  const [kpis, setKpis] = useState(initialKpis || DEFAULT_KPIS);
  const [reps, setReps] = useState(initialReps || DEFAULT_REPS);
  const [loading, setLoading] = useState(() => !hasInitialData);
  const [err, setErr] = useState(initialError);
  const [high, setHigh] = useState(initialHighlights || null);
  const [targets, setTargets] = useState(initialTargets || DEFAULT_TARGETS);
  const [salesLog, setSalesLog] = useState(initialSalesLog || []);

  useEffect(() => {
    if (hasInitialData) {
      setKpis(initialKpis);
      setReps(initialReps);
      setHigh(initialHighlights);
      setTargets(initialTargets);
      setSalesLog(initialSalesLog || []);
      setLoading(false);
    }
  }, [hasInitialData, initialHighlights, initialKpis, initialReps, initialTargets, initialSalesLog]);

  useEffect(() => {
    setErr(initialError || '');
  }, [initialError]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr('');
      const ym = currentYearMonth();
      const bust = `?_=${Date.now()}`;

      const [k, r, h, t, sl] = await Promise.all([
        fetchJSON(`kpis/mtd${bust}`),
        fetchJSON(`rep-table${bust}`),
        fetchJSON(`kpis/highlights${bust}`),
        fetchJSON(`targets?month=${ym}${bust}`),
        fetchJSON(`sales-log${bust}`),
      ]);

      setKpis(k);
      setReps(r);
      setHigh(h);
      setTargets(t);
      setSalesLog(Array.isArray(sl) ? sl : (sl?.rows || sl || []));
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // keyboard shortcut: press "r" (not inside inputs)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() !== 'r') return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      if (!loading) load();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [load, loading]);

  const top = top3(reps.rows);
  // --- computed values for progress vs targets (org-level) ---
  const salesTarget = pickTarget(targets?.rows, 'sales');       // scope='org', key='all'
  const depositsTarget = pickTarget(targets?.rows, 'deposits');
  const onlineTarget = pickTarget(targets?.rows, 'sales', 'org', 'online');
  const partnerTarget = pickTarget(targets?.rows, 'sales', 'org', 'partner');


  const salesProgressPct = salesTarget
    ? Math.min(1, Number(kpis?.total_mtd || 0) / salesTarget)
    : 0;

  const depositsProgressPct = depositsTarget
    ? Math.min(1, Number(high?.totals?.total_deposits_mtd || 0) / depositsTarget)
    : 0;

  const onlineProgressPct = onlineTarget
    ? Math.min(1, Number(high?.totals?.online_sales_mtd || 0) / onlineTarget)
    : 0;

  const partnerProgressPct = partnerTarget
    ? Math.min(1, Number(high?.totals?.partner_sales_mtd || 0) / partnerTarget)
    : 0;

  const lineAll = makeSparkSeries(salesLog, { scope: 'all' });
  const lineEast = makeSparkSeries(salesLog, { scope: 'east' });
  const lineWest = makeSparkSeries(salesLog, { scope: 'west' });

  const eastHasSaleToday = hasSaleToday(salesLog, { scope: 'east' });
  const westHasSaleToday = hasSaleToday(salesLog, { scope: 'west' });
  const allHasSaleToday = hasSaleToday(salesLog, { scope: 'all' });

  const accentAll = allHasSaleToday ? 'text-emerald-400' : 'text-rose-400';
  const accentEast = eastHasSaleToday ? 'text-emerald-400' : 'text-rose-400';
  const accentWest = westHasSaleToday ? 'text-emerald-400' : 'text-rose-400';
  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Autospec MTD Sales Dashboard</h1>

        <div className="flex items-center gap-2">
          <Link
            href="/sales-log"
            className="rounded-xl bg-surface hover:bg-zinc-900 text-neutral-400 px-3 py-2 text-sm font-normal"
          >
            View Sales Log
          </Link>
          <RefreshButton onClick={load} loading={loading} />
        </div>
      </div>
      <p className="text-xs text-neutral-400 mt-4">
        As of {kpis.as_of || reps.as_of || high?.as_of || salesLog?.as_of || ''}
      </p>

      {err ? <p className="text-red-400 text-sm mb-4">Error: {err}</p> : null}

      {/* KPIs Section: shared bg, no inner borders/cards */}
      <section className="rounded-2xl bg-surface p-4 sm:p-6 lg:p-8">
        {/* HERO BAND */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          <KpiStat
            variant="plain"
            label="Total Sales"
            value={new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(kpis.total_mtd)}
            hint="vs last month"
            delta={kpis.delta_all_vs_last_month}
            deltaUp={(kpis.delta_all_vs_last_month ?? 0) >= 0}
            line={lineAll}
            accent={accentAll}
          />
          <KpiStat
            variant="plain"
            label="East"
            value={new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(kpis.east_mtd)}
            hint="vs last month"
            delta={kpis.delta_east_vs_last_month}
            deltaUp={(kpis.delta_east_vs_last_month ?? 0) >= 0}
            line={lineEast}
            accent={accentEast}
          />
          <KpiStat
            variant="plain"
            label="West"
            value={new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(kpis.west_mtd)}
            hint="vs last month"
            delta={kpis.delta_west_vs_last_month}
            deltaUp={(kpis.delta_west_vs_last_month ?? 0) >= 0}
            line={lineWest}
            accent={accentWest}
          />
        </div>

        {/* spacing only to keep it one section */}
        <div className="mt-8" />

        {/* PROGRESS CARDS (ensure these are borderless too) */}
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-4">

          <ProgressStat
            // add variant="plain" inside ProgressStat if it has its own card chrome
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
          <ProgressStat
            label="Online Sales vs Target"
            value={Number(high?.totals?.online_sales_mtd || 0)}
            target={Number(onlineTarget || 0)}
            percent={onlineProgressPct}
          />

          <ProgressStat
            label="Partner Sales vs Target"
            value={Number(high?.totals?.partner_sales_mtd || 0)}
            target={Number(partnerTarget || 0)}
            percent={partnerProgressPct}
          />
        </div>
      </section>


      {/* SECTION: Top Performers (podium style, borderless tiles) */}
      <section className="mt-8 rounded-2xl bg-neutral-900/70 p-4 sm:p-6 lg:p-8">
        {/* header row */}
        {/* <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Top Performers</h2>
            <p className="text-xs text-neutral-400">MTD sales — medals update live as orders land</p>
          </div>
          <span className="text-xs text-neutral-500">{(reps.rows || []).length} reps</span>
        </div> */}

        {(() => {
          const t = top; // you already compute top = top3(reps.rows)
          const teamTotal = (reps.rows || []).reduce((s, r) => s + Number(r.sales || 0), 0) || 1;

          return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

              {t.map((r, i) => {
                const share = Math.max(0, Math.min(1, Number(r.sales || 0) / teamTotal));
                const big = i === 0; // emphasize #1
                return (
                  <div key={`${r.rep}-${i}`} className="relative isolate rounded-xl p-4 sm:p-6">
                    {/* subtle glow for each rank, strongest for #1 */}
                    <div
                      className={`pointer-events-none absolute inset-0 -z-0 rounded-[20px] blur-2xl ${podiumGlow(i)}`}
                    />
                    {/* medal pill */}
                    <span
                      className="mb-8 grid h-10 w-10 place-items-center rounded-full bg-white/5 ring-1 ring-white/10 text-white/60"
                      aria-hidden="true"
                    >
                      <i className={`${podiumNumberIcon(i)} text-xl`} />
                    </span>


                    {/* name + value */}
                    <div className={`${big ? 'text-xl' : 'text-lg'} `}>{r.rep || 'Unassigned'}</div>
                    <div className="mt-2">
                      <span className="text-neutral-400 align-top mr-1">$</span>
                      <span className={`${big ? 'text-5xl' : 'text-4xl'} font-extrabold tabular-nums`}>
                        {fmtAUDNoSymbol(r.sales)}
                      </span>
                    </div>

                    {/* share-of-team progress */}
                    <div className="mt-3 text-[11px] text-neutral-400">Share of team MTD: {(share * 100).toFixed(0)}%</div>
                    <div className="mt-1 h-2 w-full rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-white/80"
                        style={{ width: `${(share * 100).toFixed(1)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {t.length === 0 && (
                <div className="sm:col-span-3 rounded-xl p-6 text-sm text-neutral-400">
                  No salesperson data yet.
                </div>
              )}
            </div>
          );
        })()}
        <div className="mt-4">
          <Highlights data={high} variant="plain" />
        </div>
        {/* <div className="mt-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Team Leaderboard</h2>
            <p className="text-xs text-neutral-400">MTD sales — medals update live as orders land</p>
          </div>
        </div> */}
        <div className="mt-8">
          <RepTable rows={reps.rows || []} />
        </div>
      </section>
    </main>
  );
}


