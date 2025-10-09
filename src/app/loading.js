import { SkeletonBox, SkeletonLine, SkeletonSection, SkeletonGrid, SkeletonStack } from '@/components/Skeleton';

export default function Loading() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Top bar (title + actions) */}
      <div className="mb-4 flex items-center justify-between">
        <SkeletonLine className="h-6 w-64" />
        <div className="flex gap-2">
          <SkeletonBox className="h-8 w-28 rounded-xl" />
          <SkeletonBox className="h-8 w-28 rounded-xl" />
        </div>
      </div>

      {/* KPIs + Progress (generic) */}
      <SkeletonSection>
        {/* Primary stats – 3 hero blocks */}
        <SkeletonGrid items={3} cols="sm:grid-cols-3" itemClass="h-24" gap="gap-12" />

        {/* Spacer that survives design changes */}
        <div className="mt-8" />

        {/* Secondary stats – up to 4 progress blocks */}
        <SkeletonGrid items={4} cols="sm:grid-cols-2 lg:grid-cols-4" itemClass="h-16" gap="gap-16" />
      </SkeletonSection>

      {/* Top performers + highlights (generic) */}
      <SkeletonSection className="mt-8">
        <div className="mb-5">
          <SkeletonLine className="h-5 w-44" />
          <SkeletonLine className="mt-2 w-64" />
        </div>

        {/* Podium tiles */}
        <SkeletonGrid items={3} cols="sm:grid-cols-3" itemClass="h-32" />

        {/* Highlights row */}
        <div className="mt-6">
          <SkeletonGrid items={4} cols="sm:grid-cols-2 lg:grid-cols-4" itemClass="h-20" />
        </div>
      </SkeletonSection>

      {/* Rep table (generic list) */}
      <SkeletonSection className="mt-8 p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-4 rounded-xl px-3 py-3">
            <div className="col-span-4 sm:col-span-3">
              <SkeletonLine className="w-20" />
              <SkeletonLine className="mt-2 w-40" />
            </div>
            <div className="col-span-4 sm:col-span-2">
              <SkeletonLine className="w-16" />
              <SkeletonLine className="mt-2 w-24" />
            </div>
            <div className="col-span-4 sm:col-span-2">
              <SkeletonLine className="w-20" />
              <SkeletonLine className="mt-2 w-24" />
            </div>
            <div className="col-span-12 sm:col-span-5">
              <SkeletonStack rows={2} widths={['w-24', 'w-32']} />
              <SkeletonBox className="mt-2 h-2 w-full rounded" />
            </div>
          </div>
        ))}
      </SkeletonSection>
    </main>
  );
}
