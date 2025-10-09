// src/components/Skeleton.js
export function SkeletonBox({ className = '' }) {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />;
}

export function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse h-3 rounded bg-white/10 ${className}`} />;
}

export function SkeletonSection({ className = '', children }) {
  return (
    <section className={`rounded-2xl bg-neutral-900/70 p-4 sm:p-6 lg:p-8 ${className}`}>
      {children}
    </section>
  );
}

/** Render N blocks in a grid (generic placeholder for “cards”, “stats”, etc.) */
export function SkeletonGrid({ items = 3, cols = 'sm:grid-cols-3', itemClass = 'h-20', gap = 'gap-4' }) {
  return (
    <div className={`grid grid-cols-1 ${cols} ${gap}`}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonBox key={i} className={itemClass} />
      ))}
    </div>
  );
}

/** Render N stacked lines with varying widths for realism */
export function SkeletonStack({
  rows = 3,
  widths = ['w-3/4', 'w-1/2', 'w-2/3'],
  className = 'space-y-2',
}) {
  return (
    <div className={className}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} className={widths[i % widths.length]} />
      ))}
    </div>
  );
}
