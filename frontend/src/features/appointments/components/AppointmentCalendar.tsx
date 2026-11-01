import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { formatSlotLabel } from '@/portal/lib/slots';
import { useAppointmentList } from '../hooks/useAppointments';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import type { AppointmentStatus, StaffAppointment } from '../types';
import {
  layoutLanes,
  minuteOfDay,
  parseIsoDate,
  rangeTitle,
  sameDay,
  shiftAnchor,
  toIsoDate,
  visibleDays,
  type CalendarView,
} from '../lib/calendar';

const HOUR_PX = 64;
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 20;

const EVENT_TONE: Record<AppointmentStatus, string> = {
  booked: 'border-l-orange-500 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-950 hover:from-amber-200 hover:to-orange-200',
  completed: 'border-l-jade-500 bg-jade-50 text-jade-800 hover:bg-jade-100',
  cancelled: 'border-l-midnight-400 bg-midnight-50 text-midnight-500 line-through opacity-80 hover:bg-midnight-100',
};

const DOT_TONE: Record<AppointmentStatus, string> = {
  booked: 'bg-orange-500',
  completed: 'bg-jade-500',
  cancelled: 'bg-midnight-400',
};

const timeLabel = (iso: string) => formatSlotLabel(minuteOfDay(iso));

export interface AppointmentCalendarProps {
  view: CalendarView;
  anchor: string;
  onNavigate: (patch: { view?: CalendarView; anchor?: string }) => void;
  onSetStatus: (row: StaffAppointment, status: AppointmentStatus) => void;
  /** Case-insensitive customer name / phone filter. */
  search?: string;
  /** Injectable clock for tests. */
  now?: Date;
}

export function AppointmentCalendar({
  view,
  anchor,
  onNavigate,
  onSetStatus,
  search = '',
  now,
}: AppointmentCalendarProps) {
  const anchorDate = parseIsoDate(anchor);
  const days = visibleDays(view, anchorDate);
  const first = days[0] as Date;
  const last = days[days.length - 1] as Date;
  const [showCancelled, setShowCancelled] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [clock, setClock] = useState(() => now ?? new Date());

  useEffect(() => {
    if (now) return;
    const t = window.setInterval(() => setClock(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, [now]);

  const { data, isLoading, isError } = useAppointmentList({
    date_from: toIsoDate(first),
    date_to: toIsoDate(last),
    limit: 500,
  });

  const events = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (a) =>
        (showCancelled || a.status !== 'cancelled') &&
        (!q || a.customer_name.toLowerCase().includes(q) || (a.customer_phone ?? '').includes(q)),
    );
  }, [data, showCancelled, search]);
  const selected = (data ?? []).find((a) => a.id === selectedId) ?? null;
  const bookedCount = (data ?? []).filter((a) => a.status === 'booked').length;

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200/70 bg-white/85 shadow-[0_20px_45px_-28px_rgba(146,64,14,0.45)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-cream-50 via-white to-saffron-50 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => onNavigate({ anchor: toIsoDate(clock) })}>
            Today
          </Button>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => onNavigate({ anchor: toIsoDate(shiftAnchor(view, anchorDate, -1)) })}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => onNavigate({ anchor: toIsoDate(shiftAnchor(view, anchorDate, 1)) })}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            ›
          </button>
        </div>
        <h2 className="text-lg font-bold text-amber-950" aria-live="polite">
          {rangeTitle(view, anchorDate)}
        </h2>
        {!isLoading ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            {bookedCount} upcoming
          </span>
        ) : null}

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-midnight-700">
            <input
              type="checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
              className="h-4 w-4 accent-amber-500"
            />
            Show cancelled
          </label>
          <div role="radiogroup" aria-label="Calendar view" className="inline-flex rounded-full border border-amber-200 bg-white p-0.5">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                onClick={() => onNavigate({ view: v })}
                className={clsx(
                  'rounded-full px-3.5 py-1 text-sm font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                  view === v ? 'bg-deep-900 text-gold-300 shadow' : 'text-amber-900 hover:bg-amber-50',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isError ? (
        <p role="alert" className="px-4 py-10 text-center text-sm text-rose-700">
          Could not load appointments.
        </p>
      ) : isLoading ? (
        <div className="space-y-2 p-4" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : view === 'month' ? (
        <MonthGrid
          days={days}
          anchor={anchorDate}
          today={clock}
          events={events}
          onSelect={setSelectedId}
          onOpenDay={(d) => onNavigate({ view: 'day', anchor: toIsoDate(d) })}
        />
      ) : (
        <TimeGrid days={days} today={clock} events={events} onSelect={setSelectedId} />
      )}

      <Sheet
        open={selected !== null}
        onClose={() => setSelectedId(null)}
        side="right"
        title="Appointment"
        description={selected ? timeRangeText(selected) : undefined}
      >
        {selected ? (
          <AppointmentDetails
            appointment={selected}
            onSetStatus={(s) => {
              onSetStatus(selected, s);
              setSelectedId(null);
            }}
          />
        ) : null}
      </Sheet>
    </div>
  );
}

function timeRangeText(a: StaffAppointment): string {
  const d = parseIsoDate(a.start_at).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${d} · ${timeLabel(a.start_at)} – ${timeLabel(a.end_at)}`;
}

function TimeGrid({
  days,
  today,
  events,
  onSelect,
}: {
  days: Date[];
  today: Date;
  events: StaffAppointment[];
  onSelect: (id: number) => void;
}) {
  const startHour = Math.min(
    DEFAULT_START_HOUR,
    ...events.map((e) => Math.floor(minuteOfDay(e.start_at) / 60)),
  );
  const endHour = Math.max(DEFAULT_END_HOUR, ...events.map((e) => Math.ceil(minuteOfDay(e.end_at) / 60)));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const gridStart = startHour * 60;
  const height = hours.length * HOUR_PX;
  const nowMinute = today.getHours() * 60 + today.getMinutes();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[44rem]" style={days.length === 1 ? { minWidth: 0 } : undefined}>
        <div className="grid border-b border-amber-100" style={{ gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))` }}>
          <div />
          {days.map((d) => {
            const isToday = sameDay(d, today);
            return (
              <div key={d.toISOString()} className="flex flex-col items-center gap-0.5 border-l border-amber-100 py-2">
                <span className={clsx('text-[11px] font-semibold uppercase tracking-wider', isToday ? 'text-orange-600' : 'text-midnight-600')}>
                  {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                </span>
                <span
                  className={clsx(
                    'flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold',
                    isToday ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md' : 'text-midnight-900',
                  )}
                >
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        <div className="relative grid max-h-[70vh] overflow-y-auto" style={{ gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))` }}>
          <div className="relative" style={{ height }}>
            {hours.map((h, i) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-midnight-500"
                style={{ top: i * HOUR_PX }}
              >
                {i === 0 ? '' : formatSlotLabel(h * 60).replace(':00', '')}
              </span>
            ))}
          </div>

          {days.map((d) => {
            const iso = toIsoDate(d);
            const dayEvents = events.filter((e) => e.start_at.slice(0, 10) === iso);
            const placed = layoutLanes(dayEvents, (e) => minuteOfDay(e.start_at), (e) => minuteOfDay(e.end_at));
            const isToday = sameDay(d, today);
            return (
              <div
                key={iso}
                data-testid={`day-column-${iso}`}
                className={clsx('relative border-l border-amber-100', isToday && 'bg-amber-50/40')}
                style={{ height }}
              >
                {hours.map((h, i) => (
                  <div key={h} className="absolute inset-x-0 border-t border-amber-100/80" style={{ top: i * HOUR_PX }}>
                    <div className="border-t border-dashed border-amber-50" style={{ marginTop: HOUR_PX / 2 }} />
                  </div>
                ))}

                {placed.map(({ item, lane, lanes }) => {
                  const top = ((minuteOfDay(item.start_at) - gridStart) / 60) * HOUR_PX;
                  const h = Math.max(22, (item.duration_minutes / 60) * HOUR_PX - 2);
                  const compact = h < 40;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelect(item.id)}
                      aria-label={`${item.customer_name}, ${timeLabel(item.start_at)} to ${timeLabel(item.end_at)}, ${item.status}`}
                      className={clsx(
                        'absolute overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left text-xs shadow-sm transition hover:z-10 hover:shadow-md focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                        EVENT_TONE[item.status],
                      )}
                      style={{
                        top: top + 1,
                        height: h,
                        left: `calc(${(lane / lanes) * 100}% + 2px)`,
                        width: `calc(${100 / lanes}% - 4px)`,
                      }}
                    >
                      <span className={clsx('block truncate font-semibold', compact && 'inline')}>{item.customer_name}</span>
                      <span className={clsx('truncate opacity-80', compact ? 'ml-1 inline' : 'block')}>
                        {timeLabel(item.start_at)} – {timeLabel(item.end_at)}
                      </span>
                    </button>
                  );
                })}

                {isToday && nowMinute >= gridStart && nowMinute <= endHour * 60 ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 z-20 flex -translate-y-1/2 items-center"
                    style={{ top: ((nowMinute - gridStart) / 60) * HOUR_PX }}
                  >
                    <span className="-ml-1.5 h-3 w-3 rounded-full bg-rose-500 shadow" />
                    <span className="h-0.5 flex-1 bg-rose-500" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthGrid({
  days,
  anchor,
  today,
  events,
  onSelect,
  onOpenDay,
}: {
  days: Date[];
  anchor: Date;
  today: Date;
  events: StaffAppointment[];
  onSelect: (id: number) => void;
  onOpenDay: (d: Date) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-amber-100 bg-amber-50/40">
        {days.slice(0, 7).map((d) => (
          <div key={d.getDay()} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-midnight-600">
            {d.toLocaleDateString('en-IN', { weekday: 'short' })}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const iso = toIsoDate(d);
          const dayEvents = events
            .filter((e) => e.start_at.slice(0, 10) === iso)
            .sort((a, b) => a.start_at.localeCompare(b.start_at));
          const inMonth = d.getMonth() === anchor.getMonth();
          const isToday = sameDay(d, today);
          return (
            <div
              key={iso}
              data-testid={`month-cell-${iso}`}
              className={clsx('min-h-[7rem] border-b border-l border-amber-100 p-1.5', !inMonth && 'bg-midnight-50/60')}
            >
              <button
                type="button"
                onClick={() => onOpenDay(d)}
                aria-label={`Open ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`}
                className={clsx(
                  'mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition hover:bg-amber-100',
                  isToday ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : inMonth ? 'text-midnight-900' : 'text-midnight-400',
                )}
              >
                {d.getDate()}
              </button>
              <ul className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(e.id)}
                      className={clsx(
                        'flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-left text-[11px] hover:bg-amber-50',
                        e.status === 'cancelled' && 'line-through opacity-60',
                      )}
                    >
                      <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', DOT_TONE[e.status])} />
                      <span className="font-semibold text-midnight-800">{timeLabel(e.start_at)}</span>
                      <span className="truncate text-midnight-700">{e.customer_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {dayEvents.length > 3 ? (
                <button
                  type="button"
                  onClick={() => onOpenDay(d)}
                  className="mt-0.5 px-1.5 text-[11px] font-semibold text-amber-700 hover:underline"
                >
                  +{dayEvents.length - 3} more
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppointmentDetails({
  appointment: a,
  onSetStatus,
}: {
  appointment: StaffAppointment;
  onSetStatus: (s: AppointmentStatus) => void;
}) {
  const initials = a.customer_name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-base font-bold text-white shadow">
          {initials}
        </span>
        <div className="min-w-0">
          <Link to={`/customers/${a.customer_id}`} className="block truncate text-base font-bold text-primary-700 hover:underline">
            {a.customer_name}
          </Link>
          <AppointmentStatusBadge status={a.status} />
        </div>
      </div>

      <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-sm">
        <dt className="text-midnight-600">When</dt>
        <dd className="font-medium text-midnight-900">{timeRangeText(a)}</dd>
        <dt className="text-midnight-600">Duration</dt>
        <dd className="font-medium text-midnight-900">{a.duration_minutes} minutes</dd>
        <dt className="text-midnight-600">Mobile</dt>
        <dd className="font-medium text-midnight-900">
          {a.customer_phone ? (
            <a href={`tel:${a.customer_phone}`} className="text-primary-700 hover:underline">
              {a.customer_phone}
            </a>
          ) : (
            '—'
          )}
        </dd>
        <dt className="text-midnight-600">Email</dt>
        <dd className="truncate font-medium text-midnight-900">{a.customer_email || '—'}</dd>
        <dt className="text-midnight-600">Notes</dt>
        <dd className="whitespace-pre-wrap text-midnight-800">{a.notes || '—'}</dd>
      </dl>

      {a.status === 'booked' ? (
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => onSetStatus('completed')}>
            Mark completed
          </Button>
          <Button variant="secondary" onClick={() => onSetStatus('cancelled')}>
            Cancel appointment
          </Button>
        </div>
      ) : null}
      <Link
        to={`/visits/new?customer_id=${a.customer_id}`}
        className="text-sm font-semibold text-amber-700 hover:underline"
      >
        Record a visit for this customer →
      </Link>
    </div>
  );
}

