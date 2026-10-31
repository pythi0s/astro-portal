export type CalendarView = 'day' | 'week' | 'month';

const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses `YYYY-MM-DD` (or a naive ISO datetime) as a local date at midnight. */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function startOfWeek(d: Date): Date {
  // Monday-first week, as used in India and by Teams/Outlook defaults.
  const offset = (d.getDay() + 6) % 7;
  return addDays(d, -offset);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Days rendered for a view; month view always shows 6 full Monday-first weeks. */
export function visibleDays(view: CalendarView, anchor: Date): Date[] {
  if (view === 'day') return [anchor];
  if (view === 'week') {
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }
  const start = startOfWeek(startOfMonth(anchor));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function shiftAnchor(view: CalendarView, anchor: Date, direction: 1 | -1): Date {
  if (view === 'day') return addDays(anchor, direction);
  if (view === 'week') return addDays(anchor, 7 * direction);
  return new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
}

export function rangeTitle(view: CalendarView, anchor: Date): string {
  const days = visibleDays(view, anchor);
  if (view === 'day') {
    return anchor.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (view === 'month') {
    return anchor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }
  const first = days[0] as Date;
  const last = days[6] as Date;
  const sameMonth = first.getMonth() === last.getMonth();
  const left = first.toLocaleDateString('en-IN', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' });
  const right = last.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${left} – ${right}`;
}

/** Minutes since midnight for a naive ISO datetime string. */
export function minuteOfDay(iso: string): number {
  const [h, m] = iso.slice(11, 16).split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export interface Positioned<T> {
  item: T;
  lane: number;
  lanes: number;
}

/** Assigns side-by-side lanes to overlapping events (Teams-style). */
export function layoutLanes<T>(items: T[], start: (t: T) => number, end: (t: T) => number): Positioned<T>[] {
  const sorted = [...items].sort((a, b) => start(a) - start(b) || end(b) - end(a));
  const result: Positioned<T>[] = [];
  let cluster: Positioned<T>[] = [];
  let clusterEnd = -1;
  let laneEnds: number[] = [];

  const flush = () => {
    const lanes = Math.max(1, laneEnds.length);
    for (const p of cluster) p.lanes = lanes;
    result.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const item of sorted) {
    const s = start(item);
    const e = end(item);
    if (cluster.length && s >= clusterEnd) flush();
    let lane = laneEnds.findIndex((le) => le <= s);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(e);
    } else {
      laneEnds[lane] = e;
    }
    cluster.push({ item, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, e);
  }
  flush();
  return result;
}
