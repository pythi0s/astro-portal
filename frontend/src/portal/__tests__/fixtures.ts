import { http, HttpResponse } from 'msw';
import type { Appointment, PortalAccount } from '@/portal/types';
import { usePortalAuthStore } from '@/portal/store';

export const fakeAccount: PortalAccount = {
  id: 7,
  customer_id: 42,
  phone: '+919800000000',
  email: 'meera@example.com',
  name: 'Meera Joshi',
};

export function signInPortal(account: PortalAccount = fakeAccount): void {
  usePortalAuthStore.setState({ token: 'portal.jwt', account, isBooting: false });
}

export function appointment(id: number, patch: Partial<Appointment> = {}): Appointment {
  return {
    id,
    customer_id: fakeAccount.customer_id,
    start_at: '2099-05-10T10:00:00',
    end_at: '2099-05-10T10:30:00',
    duration_minutes: 30,
    status: 'booked',
    notes: null,
    created_at: '2099-05-01T09:00:00',
    ...patch,
  };
}

/** Availability for `day`: 10:00–10:30 is taken, clock reads 08:00. */
export function availabilityFor(day: string) {
  return {
    day,
    open_time: '09:00',
    close_time: '19:00',
    min_duration: 15,
    max_duration: 60,
    slot_step_minutes: 15,
    now: `${day}T08:00:00`,
    busy: [{ start_at: `${day}T10:00:00`, end_at: `${day}T10:30:00` }],
  };
}

export const availabilityHandler = http.get('/api/portal/availability', ({ request }) =>
  HttpResponse.json(availabilityFor(new URL(request.url).searchParams.get('date') ?? '2099-05-10')),
);
