import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRightIcon } from '@/components/icons';
import { Skeleton } from '@/components/Skeleton';
import { formatInteger, formatMoney, toNumber } from '@/lib/format';
import { formatSlotLabel } from '@/portal/lib/slots';
import { minuteOfDay, parseIsoDate, sameDay } from '@/features/appointments/lib/calendar';
import type { DashboardOverview } from './types';

const ARROW_CLASS =
  'flex h-8 w-8 items-center justify-center rounded-full border border-amber-300 text-amber-700 transition group-hover:bg-amber-400 group-hover:text-deep-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400';

function Card({
  title,
  to,
  linkLabel,
  children,
  tone,
}: {
  title: string;
  to: string;
  linkLabel: string;
  children: ReactNode;
  tone: string;
}) {
  return (
    <li className="group flex flex-col rounded-2xl border border-amber-200/70 bg-white/90 p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-midnight-800">{title}</h2>
        {to.startsWith('#') ? (
          <button
            type="button"
            aria-label={linkLabel}
            className={ARROW_CLASS}
            onClick={(e) => {
              e.currentTarget.blur();
              document.getElementById(to.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <ArrowRightIcon className="h-4 w-4 rotate-45" />
          </button>
        ) : (
          <Link to={to} aria-label={linkLabel} className={ARROW_CLASS}>
            <ArrowRightIcon className="h-4 w-4 -rotate-45" />
          </Link>
        )}
      </div>
      <div className={clsx('flex flex-1 flex-col rounded-xl p-3', tone)}>{children}</div>
    </li>
  );
}

function Sparkline({ values, positive }: { values: number[]; positive: boolean }) {
  if (values.length < 2) return null;
  let running = 0;
  const cumulative = values.map((v) => (running += v));
  const max = Math.max(...cumulative, 1);
  const w = 120;
  const h = 40;
  const points = cumulative
    .map((v, i) => `${((i / (cumulative.length - 1)) * w).toFixed(1)},${(h - (v / max) * (h - 4) - 2).toFixed(1)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-28" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={positive ? 'stroke-jade-500' : 'stroke-rose-500'}
      />
    </svg>
  );
}

export function OverviewCards({ data, isLoading }: { data?: DashboardOverview; isLoading: boolean }) {
  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  const next = data.next_appointment;
  const nextIsToday = next ? sameDay(parseIsoDate(next.start_at), parseIsoDate(data.today)) : false;
  const nextWhen = next
    ? `${nextIsToday ? '' : parseIsoDate(next.start_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', '}${formatSlotLabel(minuteOfDay(next.start_at))}`
    : null;
  const change = data.collected_change_pct;
  const positive = change === null || change >= 0;

  return (
    <ul aria-label="Today at a glance" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card title="Today's appointments" to="/appointments?cal=day" linkLabel="Open today's calendar" tone="bg-saffron-50">
        <p className="truncate text-xs text-midnight-600">
          {next ? (
            <>
              Next: <span className="font-semibold text-midnight-800">{nextWhen}</span> · {next.customer_name}
            </>
          ) : (
            'No upcoming appointments'
          )}
        </p>
        <p className="mt-auto pt-3 text-3xl font-extrabold text-midnight-900">
          {String(data.appointments_today).padStart(2, '0')}
        </p>
        <p className="text-xs text-midnight-600">
          {data.remaining_today} still to come today
        </p>
      </Card>

      <Card title="Upcoming appointments" to="/appointments?view=list" linkLabel="Open appointment list" tone="bg-violet-50">
        <p className="text-xs text-midnight-600">
          This month: <span className="font-semibold text-midnight-800">{data.appointments_this_month}</span> · All
          time: <span className="font-semibold text-midnight-800">{data.appointments_total}</span>
        </p>
        <p className="mt-auto pt-3 text-3xl font-extrabold text-midnight-900">{formatInteger(data.upcoming_7_days)}</p>
        <p className="text-xs text-midnight-600">Booked in the next 7 days</p>
      </Card>

      <Card title="Collected this month" to="#revenue" linkLabel="Jump to revenue" tone="bg-jade-50">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-midnight-600">
            Outstanding: <span className="font-semibold text-midnight-800">{formatMoney(data.outstanding_total)}</span>
          </p>
          <Sparkline values={data.collected_daily.map((d) => toNumber(d.amount) || 0)} positive={positive} />
        </div>
        <p className="mt-auto flex items-center gap-2 pt-1 text-2xl font-extrabold text-midnight-900">
          {formatMoney(data.collected_this_month)}
          {change !== null ? (
            <span
              className={clsx(
                'rounded-full px-2 py-0.5 text-xs font-bold',
                positive ? 'bg-jade-100 text-jade-700' : 'bg-rose-100 text-rose-700',
              )}
            >
              {positive ? '+' : ''}
              {change}%
            </span>
          ) : null}
        </p>
        <p className="text-xs text-midnight-600">
          {change === null
            ? 'No collections in the same period last month'
            : `${positive ? 'Up' : 'Down'} vs. same days last month (${formatMoney(data.collected_last_month)})`}
        </p>
      </Card>

      <Card title="New customers" to="/customers" linkLabel="Open customers" tone="bg-sky-50">
        <ul className="space-y-1.5">
          {data.recent_customers.slice(0, 2).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
              <Link to={`/customers/${c.id}`} className="truncate font-semibold text-midnight-800 hover:underline">
                {c.name}
              </Link>
              {c.self_registered ? (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                  Portal
                </span>
              ) : null}
            </li>
          ))}
          {data.recent_customers.length === 0 ? <li className="text-xs text-midnight-600">No customers yet</li> : null}
        </ul>
        <p className="mt-auto pt-3 text-3xl font-extrabold text-midnight-900">{formatInteger(data.new_customers_this_month)}</p>
        <p className="text-xs text-midnight-600">Joined this month</p>
      </Card>
    </ul>
  );
}
