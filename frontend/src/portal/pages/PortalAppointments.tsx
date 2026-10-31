import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useConfirm } from '@/components/ConfirmProvider';
import { useToast } from '@/components/Toast';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ArrowRightIcon, CalendarPlusIcon, ClockIcon } from '@/components/icons';
import { errorMessage } from '@/lib/apiErrors';
import { AppointmentStatusBadge } from '@/features/appointments/components/AppointmentStatusBadge';
import { cancelAppointment, listMyAppointments } from '../api';
import { formatAppointmentWhen, formatSlotLabel, hhmmToMinutes } from '../lib/slots';
import { usePortalAuthStore } from '../store';
import type { Appointment } from '../types';
import { portalAppointmentKeys } from '../queryKeys';

function isUpcoming(a: Appointment): boolean {
  return a.status === 'booked' && new Date(a.start_at).getTime() > Date.now();
}

function timeRange(a: Appointment): string {
  return `${formatSlotLabel(hhmmToMinutes(a.start_at.slice(11, 16)))} – ${formatSlotLabel(
    hhmmToMinutes(a.end_at.slice(11, 16)),
  )}`;
}

export function PortalAppointments() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const toast = useToast();
  const account = usePortalAuthStore((s) => s.account);
  const { data, isLoading, isError } = useQuery({
    queryKey: portalAppointmentKeys.mine,
    queryFn: listMyAppointments,
  });

  const cancel = useMutation({
    mutationFn: (id: number) => cancelAppointment(id),
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Appointment cancelled.' });
      void qc.invalidateQueries({ queryKey: ['portal'] });
    },
    onError: (err) => toast.push({ tone: 'error', message: errorMessage(err) }),
  });

  async function onCancel(a: Appointment) {
    const ok = await confirm({
      title: 'Cancel appointment?',
      description: formatAppointmentWhen(a.start_at, a.end_at),
      confirmLabel: 'Cancel appointment',
      cancelLabel: 'Keep it',
      danger: true,
    });
    if (ok) cancel.mutate(a.id);
  }

  const upcoming = (data ?? []).filter(isUpcoming).sort((a, b) => a.start_at.localeCompare(b.start_at));
  const past = (data ?? []).filter((a) => !isUpcoming(a));
  const completedCount = (data ?? []).filter((a) => a.status === 'completed').length;
  const firstName = account?.name.split(/\s+/)[0] ?? '';
  const next = upcoming[0];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl theme-static bg-gradient-to-br from-deep-900 via-violet-900 to-[#5b2a0a] p-6 text-white shadow-2xl sm:p-8">
        <svg
          viewBox="0 0 200 200"
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 animate-[mandala-spin_90s_linear_infinite] opacity-20"
        >
          <g fill="none" stroke="#E8C14A" strokeWidth="0.8">
            {[90, 70, 50, 30].map((r) => (
              <circle key={r} cx="100" cy="100" r={r} />
            ))}
            {[0, 30, 60, 90, 120, 150].map((a) => (
              <line key={a} x1="100" y1="10" x2="100" y2="190" transform={`rotate(${a} 100 100)`} />
            ))}
          </g>
        </svg>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-300">Namaste</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {firstName ? `Welcome, ${firstName}` : 'My appointments'}
            </h1>
            <p className="mt-2 max-w-lg text-sm text-violet-100/80">
              Your in-person appointments with Guruji. Please arrive a few minutes before your slot.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Stat label="Upcoming" value={upcoming.length} />
              <Stat label="Completed" value={completedCount} />
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            {next ? (
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm lg:min-w-[18rem]">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-300">Next visit with Guruji</p>
                <p className="mt-1 text-lg font-bold">{formatAppointmentWhen(next.start_at, next.end_at).split(' · ')[0]}</p>
                <p className="flex items-center gap-1.5 text-sm text-violet-100/90">
                  <ClockIcon className="h-4 w-4" />
                  {next.duration_minutes} min · in person
                </p>
              </div>
            ) : null}
            <Link
              to="/portal/book"
              className="btn-glass inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-600/40 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <CalendarPlusIcon className="h-4 w-4" />
              Book an appointment
            </Link>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Could not load your appointments. Please refresh the page.
        </div>
      ) : (
        <>
          <section aria-labelledby="upcoming-heading" className="space-y-4">
            <SectionHeading id="upcoming-heading">Upcoming</SectionHeading>
            {upcoming.length === 0 ? (
              <EmptyState
                title="No upcoming appointments"
                description="Pick a convenient time to meet Guruji at the Pratishthan."
                action={
                  <Link
                    to="/portal/book"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:underline"
                  >
                    Book now <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                }
              />
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {upcoming.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} highlight>
                    <button
                      type="button"
                      onClick={() => void onCancel(a)}
                      disabled={cancel.isPending}
                      className="rounded-full border border-rose-200 bg-white px-3.5 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </AppointmentCard>
                ))}
              </ul>
            )}
          </section>

          {past.length > 0 ? (
            <section aria-labelledby="history-heading" className="space-y-4">
              <SectionHeading id="history-heading">History</SectionHeading>
              <ul className="grid gap-4 md:grid-cols-2">
                {past.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-violet-100/80">{label}</p>
    </div>
  );
}

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.18em] text-amber-900/80">
      {children}
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-amber-300/80 to-transparent" />
    </h2>
  );
}

function AppointmentCard({
  appointment,
  highlight,
  children,
}: {
  appointment: Appointment;
  highlight?: boolean;
  children?: ReactNode;
}) {
  const d = new Date(`${appointment.start_at.slice(0, 10)}T00:00:00`);
  const month = d.toLocaleDateString('en-IN', { month: 'short' });
  const weekday = d.toLocaleDateString('en-IN', { weekday: 'short' });
  return (
    <li
      className={
        highlight
          ? 'flex items-center gap-4 rounded-2xl border border-amber-200/80 bg-white/90 p-4 shadow-[0_12px_30px_-18px_rgba(146,64,14,0.45)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-18px_rgba(146,64,14,0.55)]'
          : 'flex items-center gap-4 rounded-2xl border border-midnight-200/70 bg-white/70 p-4 backdrop-blur-sm'
      }
    >
      <div
        className={
          highlight
            ? 'flex w-16 shrink-0 flex-col items-center rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 py-2 text-white shadow-md'
            : 'flex w-16 shrink-0 flex-col items-center rounded-xl bg-midnight-100 py-2 text-midnight-700'
        }
      >
        <span className="text-[11px] font-bold uppercase tracking-wider">{month}</span>
        <span className="text-2xl font-extrabold leading-none">{d.getDate()}</span>
        <span className="text-[11px] font-medium">{weekday}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-midnight-900">
          {timeRange(appointment)}
        </p>
        <p className="mt-0.5 truncate text-sm text-midnight-600">
          {appointment.duration_minutes} min · in-person visit
          {appointment.notes ? ` · ${appointment.notes}` : ''}
        </p>
        <div className="mt-2">
          <AppointmentStatusBadge status={appointment.status} />
        </div>
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </li>
  );
}
