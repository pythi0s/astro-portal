import { formatInteger, humanizeCategory } from '@/lib/format';
import { Skeleton } from '@/components/Skeleton';
import type { Solution } from '../types';

interface Props {
  rows: Solution[] | undefined;
  isLoading: boolean;
}

/**
 * Derived KPIs: total on page, count of active, and top category (mode).
 * Full totals would require a count endpoint; surfaces are consistent with
 * the customer KPI strip so the grid reads the same.
 */
export function SolutionKpiStrip({ rows, isLoading }: Props) {
  const visible = rows?.length ?? 0;
  const active = rows?.filter((r) => r.is_active).length ?? 0;

  const topCategory = (() => {
    if (!rows || rows.length === 0) return null;
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    let best: [string, number] | null = null;
    for (const [cat, c] of counts) {
      if (!best || c > best[1]) best = [cat, c];
    }
    return best ? humanizeCategory(best[0]) : null;
  })();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Box label="On this page" value={isLoading ? undefined : formatInteger(visible)} isLoading={isLoading} />
      <Box label="Active" value={isLoading ? undefined : formatInteger(active)} isLoading={isLoading} />
      <Box label="Top category" value={isLoading ? undefined : topCategory ?? '—'} isLoading={isLoading} />
    </div>
  );
}

function Box({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: string | undefined;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-md border border-midnight-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-midnight-600">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-1 h-6 w-20" />
      ) : (
        <p className="mt-1 text-xl font-semibold text-midnight-900">{value}</p>
      )}
    </div>
  );
}
