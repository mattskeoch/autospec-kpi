export default function ProgressStat({
  label,
  value,
  target,
  percent,
  variant = 'plain', // 'plain' (no bg/border) | 'card' (your old look)
}) {
  const hasTarget = Number(target) > 0 && isFinite(Number(target));
  const pct = hasTarget
    ? Math.max(0, Math.min(1, Number(percent || 0)))
    : 0;

  const badgeClass = hasTarget
    ? pct >= 1
      ? 'bg-emerald-500/15 text-emerald-300'
      : 'bg-neutral-700 text-neutral-300'
    : 'bg-neutral-800 text-neutral-500';

  const fmtAUD = (n) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(Number(n || 0));

  const shell =
    variant === 'card'
      ? 'rounded-2xl bg-neutral-900/60 backdrop-blur p-5 border border-white/10 shadow-sm'
      : 'p-4 bg-transparent border-0 rounded-none shadow-none backdrop-blur-0';

  return (
    <div className={shell}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm text-neutral-400">{label}</div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
          {hasTarget ? `${Math.round(pct * 100)}%` : '—'}
        </span>
      </div>

      <div className="mb-2 flex items-baseline justify-between">
        <div className="text-xl font-semibold tabular-nums">
          {fmtAUD(value)}{' '}
          <span className="text-sm text-neutral-500">
            / {hasTarget ? fmtAUD(target) : '—'}
          </span>
        </div>
      </div>

      {/* bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className={`h-full ${hasTarget ? 'bg-emerald-400' : 'bg-neutral-600/40'}`}
          style={{ width: `${(pct * 100).toFixed(1)}%` }}
        />
      </div>
    </div>
  );
}
