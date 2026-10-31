import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import { OverviewCards } from '@/features/dashboard/overview/OverviewCards';
import { QuickActions } from '@/features/dashboard/overview/QuickActions';
import { FollowUpsPanel } from '@/features/dashboard/overview/FollowUpsPanel';
import { RecentCustomersPanel } from '@/features/dashboard/overview/RecentCustomersPanel';
import { ScheduledAppointmentsPanel } from '@/features/dashboard/overview/ScheduledAppointmentsPanel';
import { useOverview } from '@/features/dashboard/overview/useOverview';
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
  const { hasRole, user } = useAuth();
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
  const overview = useOverview();

  const firstName = user?.full_name?.trim().split(/\s+/)[0] || '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-amber-800/80">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-gold-700">
            {greeting}
            {firstName ? `, ${firstName}` : ''}
          </h1>
        </div>
        <QuickActions data={overview.data} />
      </header>

      <OverviewCards data={overview.data} isLoading={overview.isLoading} />

      <ScheduledAppointmentsPanel upcomingCount={overview.data?.upcoming_7_days} />

      <div className="grid gap-6 lg:grid-cols-2">
        <FollowUpsPanel data={overview.data} isLoading={overview.isLoading} isError={overview.isError} />
        <RecentCustomersPanel data={overview.data} isLoading={overview.isLoading} isError={overview.isError} />
      </div>

      <section id="revenue" aria-labelledby="revenue-heading" className="flex scroll-mt-24 flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="revenue-heading" className="text-xl font-bold text-gold-700">Revenue</h2>
            <p className="text-sm text-yellow-800">
              Cash in, cash outstanding, and trend for the selected range.
            </p>
          </div>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
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
      </section>
    </main>
  );
}
