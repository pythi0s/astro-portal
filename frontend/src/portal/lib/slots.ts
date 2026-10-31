import type { BusyRange } from '../types';

export interface Slot {
  /** Value sent to the API: `YYYY-MM-DDTHH:mm:00` (practice-local wall clock). */
  start: string;
  label: string;
  available: boolean;
  reason?: 'past' | 'booked';
}

const pad = (n: number) => String(n).padStart(2, '0');

export function hhmmToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToHhmm(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** Minute-of-day of a naive ISO datetime relative to `day`, clamped to [0, 1440]. */
function minuteOfDay(iso: string, day: string): number {
  const datePart = iso.slice(0, 10);
  if (datePart < day) return 0;
  if (datePart > day) return 24 * 60;
  return hhmmToMinutes(iso.slice(11, 16));
}

export function formatSlotLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${suffix}`;
}

export interface BuildSlotsInput {
  day: string;
  openTime: string;
  closeTime: string;
  step: number;
  duration: number;
  busy: BusyRange[];
  now: string;
}

export function buildSlots({
  day,
  openTime,
  closeTime,
  step,
  duration,
  busy,
  now,
}: BuildSlotsInput): Slot[] {
  const open = hhmmToMinutes(openTime);
  const close = hhmmToMinutes(closeTime);
  const nowDay = now.slice(0, 10);
  const nowMin = nowDay === day ? hhmmToMinutes(now.slice(11, 16)) : nowDay > day ? Infinity : -1;
  const ranges = busy.map((b) => [minuteOfDay(b.start_at, day), minuteOfDay(b.end_at, day)]);

  const slots: Slot[] = [];
  for (let start = open; start + duration <= close; start += step) {
    const end = start + duration;
    const isPast = start <= nowMin;
    const isBooked = ranges.some(([bs, be]) => start < (be as number) && end > (bs as number));
    slots.push({
      start: `${day}T${minutesToHhmm(start)}:00`,
      label: formatSlotLabel(start),
      available: !isPast && !isBooked,
      reason: isPast ? 'past' : isBooked ? 'booked' : undefined,
    });
  }
  return slots;
}

export function durationOptions(min: number, max: number, step = 15): number[] {
  const out: number[] = [];
  for (let d = min; d <= max; d += step) out.push(d);
  return out;
}

export function formatAppointmentWhen(startIso: string, endIso: string): string {
  const day = new Date(`${startIso.slice(0, 10)}T00:00:00`);
  const dateLabel = day.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const s = formatSlotLabel(hhmmToMinutes(startIso.slice(11, 16)));
  const e = formatSlotLabel(hhmmToMinutes(endIso.slice(11, 16)));
  return `${dateLabel} · ${s} – ${e}`;
}
