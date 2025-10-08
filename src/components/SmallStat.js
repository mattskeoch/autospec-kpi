export default function SmallStat({ label, value }) {
  return (
    <div className="rounded-xl bg-neutral-900/60 border border-white/10 p-4">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
