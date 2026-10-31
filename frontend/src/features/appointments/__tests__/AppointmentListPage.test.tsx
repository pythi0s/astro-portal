import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, fakeAdminUser } from '@/test/msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { AppointmentListPage } from '@/features/appointments/pages/AppointmentListPage';
import { AppointmentStatusBadge } from '@/features/appointments/components/AppointmentStatusBadge';
import { useAuthStore } from '@/stores/auth';
import type { StaffAppointment } from '@/features/appointments/types';

const row = (id: number, patch: Partial<StaffAppointment> = {}): StaffAppointment => ({
  id,
  customer_id: 40 + id,
  start_at: '2099-05-10T10:00:00',
  end_at: '2099-05-10T10:30:00',
  duration_minutes: 30,
  status: 'booked',
  notes: 'Marriage muhurat',
  created_at: '2099-05-01T09:00:00',
  customer_name: `Customer ${id}`,
  customer_phone: '+910000000000',
  customer_email: null,
  ...patch,
});

describe('<AppointmentListPage />', () => {
  it('shows portal bookings with customer details and filters from today by default', async () => {
    useAuthStore.setState({ token: 'fake.jwt.token', user: fakeAdminUser, isBooting: false });
    const seen: URLSearchParams[] = [];
    server.use(
      http.get('/api/appointments/', ({ request }) => {
        seen.push(new URL(request.url).searchParams);
        return HttpResponse.json([row(1), row(2, { status: 'completed', customer_name: 'Ravi K' })]);
      }),
    );
    renderWithProviders(<AppointmentListPage />, { route: '/appointments?view=list' });

    expect(await screen.findByRole('link', { name: 'Customer 1' })).toHaveAttribute('href', '/customers/41');
    expect(screen.getByRole('link', { name: 'Ravi K' })).toBeInTheDocument();
    expect(screen.getAllByText('Marriage muhurat')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /complete/i })).toHaveLength(1);
    expect(seen[0]?.get('date_from')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('marks an appointment completed', async () => {
    useAuthStore.setState({ token: 'fake.jwt.token', user: fakeAdminUser, isBooting: false });
    let patched: unknown = null;
    server.use(
      http.get('/api/appointments/', () => HttpResponse.json([row(1)])),
      http.patch('/api/appointments/1', async ({ request }) => {
        patched = await request.json();
        return HttpResponse.json(row(1, { status: 'completed' }));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<AppointmentListPage />, { route: '/appointments?view=list' });

    await user.click(await screen.findByRole('button', { name: /complete/i }));
    await waitFor(() => expect(patched).toEqual({ status: 'completed' }));
  });

  it('asks for confirmation before cancelling', async () => {
    useAuthStore.setState({ token: 'fake.jwt.token', user: fakeAdminUser, isBooting: false });
    let patched: unknown = null;
    server.use(
      http.get('/api/appointments/', () => HttpResponse.json([row(1)])),
      http.patch('/api/appointments/1', async ({ request }) => {
        patched = await request.json();
        return HttpResponse.json(row(1, { status: 'cancelled' }));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<AppointmentListPage />, { route: '/appointments?view=list' });

    await user.click(await screen.findByRole('button', { name: /^cancel$/i }));
    await user.click(await screen.findByRole('button', { name: /^keep$/i }));
    expect(patched).toBeNull();

    await user.click(screen.getByRole('button', { name: /^cancel$/i }));
    await user.click(await screen.findByRole('button', { name: /cancel appointment/i }));
    await waitFor(() => expect(patched).toEqual({ status: 'cancelled' }));
  });

  it('passes the status filter to the API', async () => {
    useAuthStore.setState({ token: 'fake.jwt.token', user: fakeAdminUser, isBooting: false });
    const statuses: (string | null)[] = [];
    server.use(
      http.get('/api/appointments/', ({ request }) => {
        statuses.push(new URL(request.url).searchParams.get('status'));
        return HttpResponse.json([]);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<AppointmentListPage />, { route: '/appointments?view=list' });

    expect(await screen.findByText(/no appointments in this range/i)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/status/i), 'cancelled');
    await waitFor(() => expect(statuses).toContain('cancelled'));
  });
});

describe('<AppointmentStatusBadge />', () => {
  it.each([
    ['booked', 'Booked'],
    ['completed', 'Completed'],
    ['cancelled', 'Cancelled'],
  ] as const)('renders %s as %s', (status, label) => {
    renderWithProviders(<AppointmentStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
