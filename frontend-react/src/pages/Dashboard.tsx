import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import { DateRangeFilter } from '@/features/dashboard/DateRangeFilter';
import { KpiGrid } from '@/features/dashboard/KpiGrid';
import { EarningsChart } from '@/features/dashboard/EarningsChart';
import { PaymentStatusChart } from '@/features/dashboard/PaymentStatusChart';
import { RecentVisitsPanel } from '@/features/dashboard/RecentVisitsPanel';
import { TopCategoriesPanel } from '@/features/dashboard/TopCategoriesPanel';
import { StaffCollectionRow } from '@/features/dashboard/StaffCollectionRow';

import {
  useRevenueStats,
  usePreviousRevenueStats,
} from '@/features/dashboard/hooks/useRevenueStats';
import { useEarnings } from '@/features/dashboard/hooks/useEarnings';
import { useRecentVisits } from '@/features/dashboard/hooks/useRecentVisits';
import { useTopCategories } from '@/features/dashboard/hooks/useTopCategories';

import { autoGranularity, parseRange, serializeRange } from '@/features/dashboard/lib/range';
import type { DateRange, Granularity } from '@/features/dashboard/types';

export function Dashboard() {
  const { hasRole } = useAuth();
  const [params, setParams] = useSearchParams();

  // URL is the single source of truth for the date range. Re-computing on
  // every render is cheap (URLSearchParams read + regex match).
  const range: DateRange = useMemo(() => parseRange(params), [params]);

  function setRange(next: DateRange) {
    setParams(serializeRange(next), { replace: true });
    // Granularity auto-follows unless the user has explicitly overridden it
    // during this session. We reset the override flag on every range change
    // so the new range gets a sensible default.
    setGranularityOverride(null);
  }

  const autoG = autoGranularity(range);
  const [granularityOverride, setGranularityOverride] = useState<Granularity | null>(null);
  const granularity: Granularity = granularityOverride ?? autoG;

  const revenue = useRevenueStats(range);
  const previous = usePreviousRevenueStats(range);
  const earnings = useEarnings(range, granularity);
  const recent = useRecentVisits(range);
  const categories = useTopCategories(range);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-midnight-900">Revenue Dashboard</h1>
          <p className="text-sm text-midnight-700">
            Cash in, cash outstanding, and trend for the selected range.
          </p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </header>

      <KpiGrid
        current={revenue.data}
        previous={previous.data}
        isLoading={revenue.isLoading}
      />

      {hasRole('admin') && <StaffCollectionRow />}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <EarningsChart
            data={earnings.data}
            autoGranularity={autoG}
            granularity={granularity}
            onGranularityChange={(g) => setGranularityOverride(g === autoG ? null : g)}
            isLoading={earnings.isLoading}
            isError={earnings.isError}
          />
        </div>
        <div className="lg:col-span-2">
          <PaymentStatusChart
            data={revenue.data}
            isLoading={revenue.isLoading}
            isError={revenue.isError}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentVisitsPanel
          data={recent.data}
          isLoading={recent.isLoading}
          isError={recent.isError}
        />
        <TopCategoriesPanel
          data={categories.data}
          isLoading={categories.isLoading}
          isError={categories.isError}
        />
      </div>
    </main>
  );
}
