import DashboardPage from '@/components/DashboardPage';
import { currentYearMonth, fetchJSON } from '@/lib/api';

export const runtime = 'edge';

async function loadInitialData() {
  const ym = currentYearMonth();

  try {
    const [kpis, reps, highlights, targets] = await Promise.all([
      fetchJSON('kpis/mtd'),
      fetchJSON('rep-table'),
      fetchJSON('kpis/highlights'),
      fetchJSON(`targets?month=${ym}`),
    ]);

    return { kpis, reps, highlights, targets };
  } catch (error) {
    console.error('Failed to prefetch dashboard data', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export default async function Page() {
  const initial = await loadInitialData();

  return (
    <DashboardPage
      initialKpis={initial.kpis}
      initialReps={initial.reps}
      initialHighlights={initial.highlights}
      initialTargets={initial.targets}
      initialError={initial.error}
    />
  );
}
