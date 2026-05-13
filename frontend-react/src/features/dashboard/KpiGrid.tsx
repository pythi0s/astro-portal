import { KpiCard, type KpiAccent } from '@/features/dashboard/KpiCard';
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

const CARD_ACCENTS: KpiAccent[] = ['jade', 'crimson', 'slate', 'violet', 'violet', 'crimson'];

export function KpiGrid({ current, previous, isLoading }: Props) {
  const c = current;
  const p = previous;

  const gross           = toNumber(c?.gross);
  const collected       = toNumber(c?.collected);
  const outstanding     = toNumber(c?.outstanding);
  const visits          = c?.visit_count ?? Number.NaN;
  const avgFee          = toNumber(c?.avg_fee);
  const collectionRate  = toNumber(c?.collection_rate);

  const cards = [
    {
      label: 'Total Revenue',
      value: formatMoney(gross),
      rawValue: gross,
      previousValue: p ? toNumber(p.gross) : undefined,
      tooltip: 'Collected + outstanding + waived for the selected range',
    },
    {
      label: 'Collected',
      value: formatMoney(collected),
      rawValue: collected,
      previousValue: p ? toNumber(p.collected) : undefined,
      tooltip: "Sum of fees where payment status is 'paid'",
    },
    {
      label: 'Outstanding',
      value: formatMoney(outstanding),
      rawValue: outstanding,
      previousValue: p ? toNumber(p.outstanding) : undefined,
      tooltip: 'Pending + partial payments still owed',
    },
    {
      label: 'Visits',
      value: formatInteger(visits),
      rawValue: Number.isFinite(visits) ? visits : 0,
      previousValue: p ? p.visit_count : undefined,
      tooltip: 'Visit count in range',
    },
    {
      label: 'Avg Fee / Visit',
      value: formatMoney(avgFee),
      rawValue: avgFee,
      previousValue: p ? toNumber(p.avg_fee) : undefined,
      tooltip: 'Gross / visit count',
    },
    {
      label: 'Collection Rate',
      value: formatPercent(collectionRate),
      rawValue: collectionRate,
      previousValue: p ? toNumber(p.collection_rate) : undefined,
      tooltip: 'Collected / (collected + outstanding). Waived excluded.',
    },
  ];

  return (
    <div
      role="list"
      aria-label="Key revenue indicators"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {cards.map((card, i) => (
        <div key={card.label} role="listitem">
          <KpiCard {...card} accent={CARD_ACCENTS[i]} index={i} isLoading={isLoading} />
        </div>
      ))}
    </div>
  );
}
