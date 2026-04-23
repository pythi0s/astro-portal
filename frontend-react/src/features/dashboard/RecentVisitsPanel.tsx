import clsx from 'clsx';
import { Link } from 'react-router-dom';
import type { VisitSummary } from '@/features/dashboard/types';
import { formatDate, formatMoney } from '@/features/dashboard/lib/format';
import { PanelShell } from '@/features/dashboard/PanelShell';

interface Props {
  data: VisitSummary[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

const STATUS_TONE: Record<VisitSummary['payment_status'], string> = {
  paid: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  partial: 'bg-amber-100 text-amber-800',
  waived: 'bg-slate-100 text-slate-700',
};

export function RecentVisitsPanel({ data, isLoading, isError }: Props) {
  const rows = (data ?? []).slice(0, 10);
  return (
    <PanelShell
      title="Recent visits"
      subtitle="Last 10 visits in the selected range"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !isError && rows.length === 0}
    >
      <ul className="divide-y divide-midnight-900/5">
        {rows.map((v) => (
          <li key={v.id} className="flex items-center justify-between py-2 text-sm">
            <div className="min-w-0">
              <Link
                to={`/customers/${v.customer_id}`}
                className="truncate font-medium text-midnight-900 hover:underline focus-visible:underline focus-visible:outline-none"
              >
                Customer #{v.customer_id}
              </Link>
              <p className="text-xs text-midnight-700">
                {formatDate(v.visit_date)} · {v.consultation_type.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                  STATUS_TONE[v.payment_status],
                )}
              >
                {v.payment_status}
              </span>
              <span className="w-24 text-right font-semibold tabular-nums text-midnight-900">
                {formatMoney(v.fees)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}
