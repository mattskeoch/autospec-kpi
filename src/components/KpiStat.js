import Sparkline from '@/components/Sparkline';

function Pill({ up = true, children }) {
  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold';
  return (
    <span className={`${base} ${up ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
      <span className="text-[12px]">{up ? '↑' : '↓'}</span>{children}
    </span>
  );
}

export default function KpiStat({
  label,
  value,
  hint = 'vs last period',
  delta = null,           // number like 0.368 -> 36.8%
  deltaUp = true,         // green vs red
  line = [],              // sparkline numbers
  accent = 'text-emerald-400', // stroke colour for the line
}) {
  return (
    <div className="rounded-2xl bg-neutral-900/70 border border-white/10 p-5 sm:p-6 flex items-center justify-between gap-6">
      <div>
        <div className="text-sm text-neutral-300 flex items-center gap-1">
          {label}
          {/* <span className="text-neutral-500">?</span> */}
        </div>
        <div className="mt-1">
          <span className="text-neutral-400 align-top mr-1">$</span>
          <span className="text-4xl sm:text-5xl font-extrabold tabular-nums">{value}</span>
        </div>
        <div className="mt-2 text-xs text-neutral-400 flex items-center gap-2">
          {delta != null && <Pill up={deltaUp}>{Math.round(delta * 1000) / 10}%</Pill>}
          <span>{hint}</span>
        </div>
      </div>
      <div className={`w-36 sm:w-44 h-16 sm:h-16 ${accent}`}>
        <Sparkline points={line} className="w-full h-full" />
      </div>
    </div>
  );
}
