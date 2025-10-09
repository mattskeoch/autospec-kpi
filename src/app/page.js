import DashboardPage from '@/components/DashboardPage';
import { currentYearMonth, fetchJSON } from '@/lib/api';

export const runtime = 'edge';

async function loadInitialData() {
  const ym = currentYearMonth();

  try {
    const [kpis, reps, highlights, targets, salesLog] = await Promise.all([
      fetchJSON('kpis/mtd'),
      fetchJSON('rep-table'),
      fetchJSON('kpis/highlights'),
      fetchJSON(`targets?month=${ym}`),
      fetchJSON('sales-log'),
    ]);

    return { kpis, reps, highlights, targets, salesLog };
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
      initialSalesLog={initial.salesLog}
      initialError={initial.error}
    />
  );
}
