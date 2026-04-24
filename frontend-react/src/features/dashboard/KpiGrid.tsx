import { KpiCard } from '@/features/dashboard/KpiCard';
import type { RevenueSummary } from '@/features/dashboard/types';
import {
  formatInteger,
  formatMoney,
  formatPercent,
  toNumber,
} from '@/lib/format';

interface Props {
  current: RevenueSummary | undefined;
  previous: RevenueSummary | undefined;
  isLoading: boolean;
}

/** Six-up grid of KPIs. Stays stable at one / two / three columns as the
 *  viewport narrows; each card renders independently so a slow previous-window
 *  fetch doesn't block the primary numbers. */
export function KpiGrid({ current, previous, isLoading }: Props) {
  const c = current;
  const p = previous;

  const gross = toNumber(c?.gross);
  const collected = toNumber(c?.collected);
  const outstanding = toNumber(c?.outstanding);
  const visits = c?.visit_count ?? Number.NaN;
  const avgFee = toNumber(c?.avg_fee);
  const collectionRate = toNumber(c?.collection_rate);

  return (
    <div
      role="list"
      aria-label="Key revenue indicators"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div role="listitem">
        <KpiCard
          label="Total Revenue"
          value={formatMoney(gross)}
          rawValue={gross}
          previousValue={p ? toNumber(p.gross) : undefined}
          isLoading={isLoading}
          tooltip="Collected + outstanding + waived for the selected range"
        />
      </div>
      <div role="listitem">
        <KpiCard
          label="Collected"
          value={formatMoney(collected)}
          rawValue={collected}
          previousValue={p ? toNumber(p.collected) : undefined}
          isLoading={isLoading}
          tooltip="Sum of fees where payment status is 'paid'"
        />
      </div>
      <div role="listitem">
        <KpiCard
          label="Outstanding"
          value={formatMoney(outstanding)}
          rawValue={outstanding}
          previousValue={p ? toNumber(p.outstanding) : undefined}
          isLoading={isLoading}
          tooltip="Pending + partial payments still owed"
        />
      </div>
      <div role="listitem">
        <KpiCard
          label="Visits"
          value={formatInteger(visits)}
          rawValue={Number.isFinite(visits) ? visits : 0}
          previousValue={p ? p.visit_count : undefined}
          isLoading={isLoading}
          tooltip="Visit count in range"
        />
      </div>
      <div role="listitem">
        <KpiCard
          label="Avg Fee / Visit"
          value={formatMoney(avgFee)}
          rawValue={avgFee}
          previousValue={p ? toNumber(p.avg_fee) : undefined}
          isLoading={isLoading}
          tooltip="Gross / visit count"
        />
      </div>
      <div role="listitem">
        <KpiCard
          label="Collection Rate"
          value={formatPercent(collectionRate)}
          rawValue={collectionRate}
          previousValue={p ? toNumber(p.collection_rate) : undefined}
          isLoading={isLoading}
          tooltip="Collected / (collected + outstanding). Waived excluded."
        />
      </div>
    </div>
  );
}
