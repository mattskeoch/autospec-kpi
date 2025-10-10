export default function RefreshButton({ onClick, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading ? 'true' : 'false'}
      className="rounded-xl bg-surface border border-white/10 hover:bg-zinc-900 disabled:opacity-60 text-neutral-400 px-3 py-2 text-sm font-semibold inline-flex items-center gap-2"
      title="Refresh data (R)"
    >
      {loading ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-refresh-line" />}
      <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
    </button>
  );
}
