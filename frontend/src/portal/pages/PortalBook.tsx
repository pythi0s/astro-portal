import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import clsx from 'clsx';
import { useToast } from '@/components/Toast';
import { Skeleton } from '@/components/Skeleton';
import { CalendarIcon, CheckCircleIcon, ClockIcon } from '@/components/icons';
import { errorMessage } from '@/lib/apiErrors';
import { bookAppointment, getAvailability } from '../api';
import { buildSlots, durationOptions, formatAppointmentWhen, hhmmToMinutes, type Slot } from '../lib/slots';
import { portalAppointmentKeys } from '../queryKeys';

function localIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nextDays(count: number): { iso: string; weekday: string; day: number; month: string }[] {
  const out = [];
  const base = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    out.push({
      iso: localIsoDate(d),
      weekday: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      day: d.getDate(),
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
    });
  }
  return out;
}

const PERIODS: { label: string; from: number; to: number }[] = [
  { label: 'Morning', from: 0, to: 12 * 60 },
  { label: 'Afternoon', from: 12 * 60, to: 16 * 60 },
  { label: 'Evening', from: 16 * 60, to: 24 * 60 },
];

export function PortalBook() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const today = localIsoDate(new Date());
  const quickDays = useMemo(() => nextDays(7), []);

  const [day, setDay] = useState(today);
  const [duration, setDuration] = useState(30);
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const availability = useQuery({
    queryKey: portalAppointmentKeys.availability(day),
    queryFn: () => getAvailability(day),
    enabled: !!day,
  });

  const slots = useMemo(() => {
    const a = availability.data;
    if (!a) return [];
    return buildSlots({
      day,
      openTime: a.open_time,
      closeTime: a.close_time,
      step: a.slot_step_minutes,
      duration,
      busy: a.busy,
      now: a.now,
    });
  }, [availability.data, day, duration]);

  const durations = availability.data
    ? durationOptions(availability.data.min_duration, availability.data.max_duration)
    : [15, 30, 45, 60];

  const book = useMutation({
    mutationFn: bookAppointment,
    onSuccess: (appt) => {
      toast.push({
        tone: 'success',
        title: 'Appointment booked',
        message: formatAppointmentWhen(appt.start_at, appt.end_at),
      });
      void qc.invalidateQueries({ queryKey: ['portal'] });
      navigate('/portal/appointments');
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setSelected(null);
        void availability.refetch();
      }
      setError(errorMessage(err, 'Could not book this slot. Please try again.'));
    },
  });

  function pickDay(iso: string) {
    setDay(iso);
    setSelected(null);
    setError(null);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) {
      setError('Please choose a time slot.');
      return;
    }
    setError(null);
    book.mutate({ start_at: selected, duration_minutes: duration, notes: notes.trim() || undefined });
  }

  const freeCount = slots.filter((s) => s.available).length;
  const grouped = PERIODS.map((p) => ({
    ...p,
    slots: slots.filter((s) => {
      const m = hhmmToMinutes(s.start.slice(11, 16));
      return m >= p.from && m < p.to;
    }),
  })).filter((g) => g.slots.length > 0);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">New booking</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-amber-950">Book an appointment with Guruji</h1>
        <p className="mt-1 text-sm text-amber-900/70">
          Consultations are in person at the Pratishthan. Choose a date, how long you need (15 minutes to 1 hour), and an open time slot.
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          <Step number={1} title="Choose a date">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quickDays.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => pickDay(d.iso)}
                  aria-pressed={day === d.iso}
                  className={clsx(
                    'flex w-20 shrink-0 flex-col items-center rounded-2xl border px-2 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                    day === d.iso
                      ? 'border-transparent bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                      : 'border-amber-200 bg-white text-amber-950 hover:-translate-y-0.5 hover:border-amber-400',
                  )}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{d.weekday}</span>
                  <span className="text-2xl font-extrabold leading-tight">{d.day}</span>
                  <span className="text-[11px] font-medium opacity-80">{d.month}</span>
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-3 text-sm font-medium text-amber-900">
              Date
              <input
                type="date"
                name="date"
                min={today}
                value={day}
                onChange={(e) => pickDay(e.target.value)}
                className="h-10 rounded-xl border border-amber-200 bg-white px-3 text-midnight-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              />
            </label>
          </Step>

          <Step number={2} title="Session length">
            <div role="radiogroup" aria-label="Duration" className="inline-flex flex-wrap gap-2">
              {durations.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={duration === d}
                  onClick={() => {
                    setDuration(d);
                    setSelected(null);
                    setError(null);
                  }}
                  className={clsx(
                    'rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                    duration === d
                      ? 'border-transparent bg-deep-900 text-gold-300 shadow-md'
                      : 'border-amber-200 bg-white text-amber-900 hover:border-amber-400',
                  )}
                >
                  {d === 60 ? '1 hour' : `${d} min`}
                </button>
              ))}
            </div>
          </Step>

          <Step
            number={3}
            title="Pick a time"
            aside={
              availability.data ? (
                <span className="rounded-full bg-jade-50 px-2.5 py-0.5 text-xs font-semibold text-jade-700 ring-1 ring-jade-200">
                  {freeCount} open · {availability.data.open_time}–{availability.data.close_time}
                </span>
              ) : null
            }
          >
            {availability.isLoading ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" aria-busy="true">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : availability.isError ? (
              <p role="alert" className="text-sm text-rose-700">
                Could not load availability for this date.
              </p>
            ) : freeCount === 0 ? (
              <p className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-8 text-center text-sm text-amber-900">
                No open slots for this date and duration. Try another day or a shorter session.
              </p>
            ) : (
              <div role="radiogroup" aria-label="Time slots" className="flex flex-col gap-4">
                {grouped.map((g) => (
                  <div key={g.label}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-800/70">{g.label}</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {g.slots.map((s) => (
                        <SlotButton
                          key={s.start}
                          slot={s}
                          selected={selected === s.start}
                          onSelect={() => {
                            setSelected(s.start);
                            setError(null);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Step>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-amber-200/80 bg-white/90 shadow-[0_24px_50px_-24px_rgba(146,64,14,0.45)] backdrop-blur-md">
            <div className="theme-static bg-gradient-to-br from-deep-900 via-violet-900 to-[#5b2a0a] px-5 py-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Your booking</p>
              <p className="mt-1 text-lg font-bold">In-person visit with Guruji</p>
            </div>
            <dl className="space-y-3 px-5 py-4 text-sm">
              <SummaryRow icon={<CalendarIcon className="h-4 w-4" />} label="When">
                {selected ? formatAppointmentWhen(selected, endOf(selected, duration)) : 'No time selected yet.'}
              </SummaryRow>
              <SummaryRow icon={<ClockIcon className="h-4 w-4" />} label="Length">
                {duration === 60 ? '1 hour' : `${duration} minutes`}
              </SummaryRow>
            </dl>
            <div className="border-t border-amber-100 px-5 py-4">
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-amber-900">
                Notes <span className="-mt-1 text-xs font-normal text-amber-800/70">Optional</span>
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What would you like to discuss with Guruji?"
                  className="rounded-xl border border-amber-200 bg-white px-3 py-2 font-normal text-midnight-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                />
              </label>
              {error ? (
                <div role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={book.isPending || !selected}
                className="btn-glass mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircleIcon className="h-4 w-4" />
                {book.isPending ? 'Booking…' : 'Confirm booking'}
              </button>
            </div>
          </div>
        </aside>
      </form>
    </main>
  );
}

function Step({
  number,
  title,
  aside,
  children,
}: {
  number: number;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-amber-200/70 bg-white/85 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-base font-bold text-amber-950">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-extrabold text-white shadow">
            {number}
          </span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function SlotButton({ slot, selected, onSelect }: { slot: Slot; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={!slot.available}
      title={slot.reason === 'booked' ? 'Already booked' : slot.reason === 'past' ? 'In the past' : undefined}
      onClick={onSelect}
      className={clsx(
        'rounded-xl border px-2 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
        selected
          ? 'border-transparent bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30'
          : slot.available
            ? 'border-amber-200 bg-white text-amber-950 hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md'
            : 'cursor-not-allowed border-midnight-100 bg-midnight-50 text-midnight-400 line-through',
      )}
    >
      {slot.label}
    </button>
  );
}

function SummaryRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
        {icon}
      </span>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-amber-800/70">{label}</dt>
        <dd className="font-medium text-midnight-900">{children}</dd>
      </div>
    </div>
  );
}

function endOf(startIso: string, minutes: number): string {
  const total = hhmmToMinutes(startIso.slice(11, 16)) + minutes;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${startIso.slice(0, 10)}T${pad(Math.floor(total / 60))}:${pad(total % 60)}:00`;
}
