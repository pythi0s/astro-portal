import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { PanelShell } from '../PanelShell';
import { parseIsoDate } from '@/features/appointments/lib/calendar';
import type { DashboardOverview } from './types';

function relative(dateIso: string, todayIso: string): { label: string; tone: string } {
  const diff = Math.round((parseIsoDate(dateIso).getTime() - parseIsoDate(todayIso).getTime()) / 86_400_000);
  if (diff < 0) return { label: `${-diff}d overdue`, tone: 'bg-rose-100 text-rose-700' };
  if (diff === 0) return { label: 'Today', tone: 'bg-amber-100 text-amber-800' };
  if (diff === 1) return { label: 'Tomorrow', tone: 'bg-sky-100 text-sky-800' };
  return { label: `In ${diff} days`, tone: 'bg-midnight-100 text-midnight-700' };
}

export function FollowUpsPanel({ data, isLoading, isError }: { data?: DashboardOverview; isLoading: boolean; isError: boolean }) {
  const rows = data?.follow_ups_due ?? [];
  return (
    <PanelShell
      title="Follow-ups due"
      subtitle="Visits with a follow-up date in the last or next 7 days"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && rows.length === 0}
      emptyLabel="No follow-ups due this week."
    >
      <ul className="divide-y divide-amber-100">
        {rows.map((f) => {
          const r = relative(f.follow_up_date, data?.today ?? f.follow_up_date);
          return (
            <li key={f.visit_id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <Link to={`/customers/${f.customer_id}`} className="block truncate text-sm font-semibold text-midnight-900 hover:underline">
                  {f.customer_name}
                </Link>
                {f.customer_phone ? (
                  <a href={`tel:${f.customer_phone}`} className="text-xs text-primary-700 hover:underline">
                    {f.customer_phone}
                  </a>
                ) : (
                  <span className="text-xs text-midnight-500">No phone</span>
                )}
              </div>
              <span className={clsx('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold', r.tone)}>{r.label}</span>
            </li>
          );
        })}
      </ul>
    </PanelShell>
  );
}
