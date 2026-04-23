import { useMemo } from 'react';
import type { RevenueByCategory } from '@/features/dashboard/types';
import { formatMoney, humanizeCategory, toNumber } from '@/features/dashboard/lib/format';
import { PanelShell } from '@/features/dashboard/PanelShell';

interface Props {
  data: RevenueByCategory | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function TopCategoriesPanel({ data, isLoading, isError }: Props) {
  const rows = useMemo(() => {
    if (!data) return [];
    return data.rows.slice(0, 5).map((r) => ({
      category: r.category,
      label: humanizeCategory(r.category),
      total: toNumber(r.total_fees),
      visits: r.visit_count,
    }));
  }, [data]);

  const max = rows.reduce((m, r) => Math.max(m, r.total), 0);

  return (
    <PanelShell
      title="Top revenue by category"
      subtitle="Fees allocated equally across linked solutions"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !isError && rows.length === 0}
    >
      <ol className="space-y-2">
        {rows.map((r) => {
          const pct = max > 0 ? (r.total / max) * 100 : 0;
          return (
            <li key={r.category} className="group">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-midnight-900">{r.label}</span>
                <span className="tabular-nums text-midnight-900">{formatMoney(r.total)}</span>
              </div>
              <div
                className="mt-1 h-2 overflow-hidden rounded-full bg-midnight-900/5"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pct)}
                aria-label={`${r.label} relative share`}
              >
                <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-0.5 text-xs text-midnight-700">
                {r.visits} {r.visits === 1 ? 'visit' : 'visits'}
              </p>
            </li>
          );
        })}
      </ol>
    </PanelShell>
  );
}
