import { describe, expect, it } from 'vitest';
import {
  layoutLanes,
  minuteOfDay,
  parseIsoDate,
  rangeTitle,
  shiftAnchor,
  startOfWeek,
  toIsoDate,
  visibleDays,
} from '@/features/appointments/lib/calendar';

const d = (iso: string) => parseIsoDate(iso);

describe('calendar helpers', () => {
  it('round-trips ISO dates in local time', () => {
    expect(toIsoDate(d('2026-11-05'))).toBe('2026-11-05');
    expect(toIsoDate(d('2026-11-05T23:30:00'))).toBe('2026-11-05');
  });

  it('starts weeks on Monday', () => {
    expect(toIsoDate(startOfWeek(d('2026-11-05')))).toBe('2026-11-02'); // Thu -> Mon
    expect(toIsoDate(startOfWeek(d('2026-11-08')))).toBe('2026-11-02'); // Sun -> Mon
    expect(toIsoDate(startOfWeek(d('2026-11-02')))).toBe('2026-11-02');
  });

  it('computes visible days for each view', () => {
    expect(visibleDays('day', d('2026-11-05')).map(toIsoDate)).toEqual(['2026-11-05']);
    const week = visibleDays('week', d('2026-11-05')).map(toIsoDate);
    expect(week).toHaveLength(7);
    expect(week[0]).toBe('2026-11-02');
    expect(week[6]).toBe('2026-11-08');
    const month = visibleDays('month', d('2026-11-15'));
    expect(month).toHaveLength(42);
    expect(toIsoDate(month[0] as Date)).toBe('2026-10-26');
  });

  it('moves the anchor by a day, week or month', () => {
    expect(toIsoDate(shiftAnchor('day', d('2026-11-30'), 1))).toBe('2026-12-01');
    expect(toIsoDate(shiftAnchor('week', d('2026-11-05'), -1))).toBe('2026-10-29');
    expect(toIsoDate(shiftAnchor('month', d('2026-01-31'), 1))).toBe('2026-02-01');
  });

  it('builds readable titles', () => {
    expect(rangeTitle('week', d('2026-11-05'))).toMatch(/2.*8 Nov 2026/);
    expect(rangeTitle('month', d('2026-11-05'))).toMatch(/November 2026/);
    expect(rangeTitle('day', d('2026-11-05'))).toMatch(/Thursday/);
  });

  it('reads minute of day from naive datetimes', () => {
    expect(minuteOfDay('2026-11-05T09:45:00')).toBe(585);
  });

  it('puts overlapping events side by side and keeps separate clusters full width', () => {
    type E = { id: string; s: number; e: number };
    const events: E[] = [
      { id: 'a', s: 600, e: 660 },
      { id: 'b', s: 615, e: 645 },
      { id: 'c', s: 660, e: 690 },
      { id: 'd', s: 720, e: 750 },
    ];
    const placed = Object.fromEntries(
      layoutLanes(events, (x) => x.s, (x) => x.e).map((p) => [p.item.id, p]),
    );
    expect(placed.a).toMatchObject({ lane: 0, lanes: 2 });
    expect(placed.b).toMatchObject({ lane: 1, lanes: 2 });
    expect(placed.c).toMatchObject({ lane: 0, lanes: 1 });
    expect(placed.d).toMatchObject({ lane: 0, lanes: 1 });
  });
});
