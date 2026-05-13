import type { DateRange, Granularity, Preset } from '@/features/dashboard/types';
import { toIsoDate } from '@/lib/format';

export const PRESETS: ReadonlyArray<{ id: Preset; label: string; days: number }> = [
  { id: '7D', label: '7D', days: 7 },
  { id: '30D', label: '30D', days: 30 },
  { id: '90D', label: '90D', days: 90 },
  { id: '365D', label: '365D', days: 365 },
];

export function presetByDays(days: number): Preset | undefined {
  const hit = PRESETS.find((p) => p.days === days);
  return hit?.id;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function rangeForPreset(preset: Preset, today: Date = new Date()): DateRange {
  if (preset === 'custom') {
    // Caller is responsible for providing custom from/to; fall back to 30D.
    return rangeForPreset('30D', today);
  }
  const hit = PRESETS.find((p) => p.id === preset);
  const days = hit ? hit.days : 30;
  const to = toIsoDate(today);
  const from = toIsoDate(addDays(today, -(days - 1)));
  return { from, to, preset };
}

export const DEFAULT_RANGE = (today: Date = new Date()): DateRange => rangeForPreset('30D', today);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(v: string | null | undefined): v is string {
  return !!v && DATE_RE.test(v);
}

/** Parse a DateRange from URLSearchParams. Returns DEFAULT_RANGE() when both
 *  values are missing or invalid, to keep the page bootable from a bare URL. */
export function parseRange(params: URLSearchParams): DateRange {
  const from = params.get('from');
  const to = params.get('to');
  if (isIsoDate(from) && isIsoDate(to) && from <= to) {
    const days = daysInRange({ from, to });
    return { from, to, preset: presetByDays(days) ?? 'custom' };
  }
  return DEFAULT_RANGE();
}

export function serializeRange(range: DateRange): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set('from', range.from);
  sp.set('to', range.to);
  return sp;
}

export function daysInRange(range: { from: string; to: string }): number {
  const f = new Date(`${range.from}T00:00:00`);
  const t = new Date(`${range.to}T00:00:00`);
  const ms = t.getTime() - f.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000)) + 1; // inclusive on both ends
}

/** The "previous window" is the equal-length range ending the day before `from`. */
export function previousWindow(range: DateRange): DateRange {
  const len = daysInRange(range);
  const from = new Date(`${range.from}T00:00:00`);
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(len - 1));
  return { from: toIsoDate(prevFrom), to: toIsoDate(prevTo) };
}

/** Auto-granularity rule per prompt: <=31d → day, <=120d → week, else month. */
export function autoGranularity(range: DateRange): Granularity {
  const d = daysInRange(range);
  if (d <= 31) return 'day';
  if (d <= 120) return 'week';
  return 'month';
}
