import { describe, expect, it } from 'vitest';
import {
  buildSlots,
  durationOptions,
  formatAppointmentWhen,
  formatSlotLabel,
  hhmmToMinutes,
  minutesToHhmm,
} from '@/portal/lib/slots';

const base = {
  day: '2099-05-10',
  openTime: '09:00',
  closeTime: '11:00',
  step: 15,
  busy: [],
  now: '2099-05-09T12:00:00',
};

describe('slot helpers', () => {
  it('converts between HH:mm and minutes', () => {
    expect(hhmmToMinutes('09:30')).toBe(570);
    expect(minutesToHhmm(570)).toBe('09:30');
    expect(minutesToHhmm(5)).toBe('00:05');
  });

  it('formats 12-hour labels', () => {
    expect(formatSlotLabel(0)).toBe('12:00 AM');
    expect(formatSlotLabel(9 * 60 + 5)).toBe('9:05 AM');
    expect(formatSlotLabel(12 * 60)).toBe('12:00 PM');
    expect(formatSlotLabel(18 * 60 + 45)).toBe('6:45 PM');
  });

  it('offers durations from min to max in 15 minute steps', () => {
    expect(durationOptions(15, 60)).toEqual([15, 30, 45, 60]);
  });

  it('generates slots that fit fully inside opening hours', () => {
    const slots = buildSlots({ ...base, duration: 60 });
    expect(slots.map((s) => s.start)).toEqual([
      '2099-05-10T09:00:00',
      '2099-05-10T09:15:00',
      '2099-05-10T09:30:00',
      '2099-05-10T09:45:00',
      '2099-05-10T10:00:00',
    ]);
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it('marks slots overlapping a booking as unavailable but keeps adjacent ones', () => {
    const slots = buildSlots({
      ...base,
      duration: 30,
      busy: [{ start_at: '2099-05-10T10:00:00', end_at: '2099-05-10T10:30:00' }],
    });
    const byStart = Object.fromEntries(slots.map((s) => [s.start.slice(11, 16), s]));
    expect(byStart['09:30']?.available).toBe(true); // ends exactly at 10:00
    expect(byStart['09:45']?.reason).toBe('booked');
    expect(byStart['10:00']?.reason).toBe('booked');
    expect(byStart['10:15']?.reason).toBe('booked');
    expect(byStart['10:30']?.available).toBe(true); // starts exactly at 10:30
  });

  it('handles bookings that spill over from neighbouring days', () => {
    const slots = buildSlots({
      ...base,
      duration: 15,
      busy: [{ start_at: '2099-05-09T23:00:00', end_at: '2099-05-10T09:30:00' }],
    });
    expect(slots.find((s) => s.start.endsWith('09:15:00'))?.available).toBe(false);
    expect(slots.find((s) => s.start.endsWith('09:30:00'))?.available).toBe(true);
  });

  it('marks past slots on the current day and everything on past days', () => {
    const today = buildSlots({ ...base, duration: 15, now: '2099-05-10T09:20:00' });
    expect(today.find((s) => s.start.endsWith('09:15:00'))?.reason).toBe('past');
    expect(today.find((s) => s.start.endsWith('09:30:00'))?.available).toBe(true);

    const pastDay = buildSlots({ ...base, duration: 15, now: '2099-05-11T08:00:00' });
    expect(pastDay.every((s) => s.reason === 'past')).toBe(true);
  });

  it('formats an appointment window', () => {
    const text = formatAppointmentWhen('2099-05-10T10:00:00', '2099-05-10T10:45:00');
    expect(text).toContain('10:00 AM – 10:45 AM');
    expect(text).toContain('2099');
  });
});
