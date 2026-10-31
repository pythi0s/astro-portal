import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfirm } from '@/components/ConfirmProvider';
import { useToast } from '@/components/Toast';
import { ArrowRightIcon } from '@/components/icons';
import { errorMessage } from '@/lib/apiErrors';
import { AppointmentCalendar } from '@/features/appointments/components/AppointmentCalendar';
import { MiniMonthCalendar } from '@/features/appointments/components/MiniMonthCalendar';
import { useAppointmentList, useUpdateAppointmentStatus } from '@/features/appointments/hooks/useAppointments';
import { parseIsoDate, startOfMonth, toIsoDate, type CalendarView } from '@/features/appointments/lib/calendar';
import type { AppointmentStatus, StaffAppointment } from '@/features/appointments/types';

export function ScheduledAppointmentsPanel({ upcomingCount }: { upcomingCount?: number }) {
  const today = useMemo(() => new Date(), []);
  const [anchor, setAnchor] = useState(() => toIsoDate(today));
  const [view, setView] = useState<CalendarView>('week');
  const [search, setSearch] = useState('');
  const update = useUpdateAppointmentStatus();
  const confirm = useConfirm();
  const toast = useToast();

  const monthStart = startOfMonth(parseIsoDate(anchor));
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const month = useAppointmentList({ date_from: toIsoDate(monthStart), date_to: toIsoDate(monthEnd), limit: 500 });
  const markedDays = useMemo(
    () => new Set((month.data ?? []).filter((a) => a.status !== 'cancelled').map((a) => a.start_at.slice(0, 10))),
    [month.data],
  );

  async function setStatus(row: StaffAppointment, status: AppointmentStatus) {
    if (status === 'cancelled') {
      const ok = await confirm({
        title: 'Cancel this appointment?',
        description: row.customer_name,
        confirmLabel: 'Cancel appointment',
        cancelLabel: 'Keep',
        danger: true,
      });
      if (!ok) return;
    }
    update.mutate(
      { id: row.id, status },
      {
        onSuccess: () => toast.push({ tone: 'success', message: `Appointment marked ${status}.` }),
        onError: (err) => toast.push({ tone: 'error', message: errorMessage(err) }),
      },
    );
  }

  return (
    <section aria-labelledby="scheduled-heading" className="rounded-2xl border border-amber-200/70 bg-white/85 p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="scheduled-heading" className="text-base font-bold text-midnight-900">
            Scheduled appointments
          </h2>
          {upcomingCount !== undefined ? (
            <span
              className={
                upcomingCount > 0
                  ? 'rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm'
                  : 'rounded-full bg-midnight-100 px-2.5 py-0.5 text-xs font-semibold text-midnight-600'
              }
            >
              {upcomingCount === 0 ? 'None booked in the next 7 days' : `${upcomingCount} in the next 7 days`}
            </span>
          ) : null}
        </div>
        <Link
          to="/appointments"
          aria-label="Open full calendar"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300 text-amber-700 transition hover:bg-amber-400 hover:text-deep-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <ArrowRightIcon className="h-4 w-4 -rotate-45" />
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[16rem_1fr]">
        <aside className="flex flex-col gap-4">
          <MiniMonthCalendar
            selected={anchor}
            today={today}
            markedDays={markedDays}
            onSelect={(iso) => {
              setAnchor(iso);
              if (view === 'month') setView('day');
            }}
          />
          <div className="flex items-center gap-3 rounded-xl bg-amber-50/70 px-3 py-2 text-[11px] text-midnight-700">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500" />Booked</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-jade-500" />Completed</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-midnight-400" />Cancelled</span>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-3">
          <label className="relative block max-w-xs">
            <span className="sr-only">Search appointments</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-midnight-400" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer or mobile…"
              className="h-9 w-full rounded-lg border border-midnight-200 bg-white pl-9 pr-3 text-sm text-midnight-900 placeholder:text-midnight-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            />
          </label>
          <AppointmentCalendar
            view={view}
            anchor={anchor}
            search={search}
            onNavigate={(patch) => {
              if (patch.view) setView(patch.view);
              if (patch.anchor) setAnchor(patch.anchor);
            }}
            onSetStatus={(row, status) => void setStatus(row, status)}
          />
        </div>
      </div>
    </section>
  );
}
