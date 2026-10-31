import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, fakeAdminUser } from '@/test/msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { AppointmentCalendar } from '@/features/appointments/components/AppointmentCalendar';
import { AppointmentListPage } from '@/features/appointments/pages/AppointmentListPage';
import { useAuthStore } from '@/stores/auth';
import type { StaffAppointment } from '@/features/appointments/types';

const appt = (id: number, patch: Partial<StaffAppointment> = {}): StaffAppointment => ({
  id,
  customer_id: 40 + id,
  start_at: '2026-11-05T10:00:00',
  end_at: '2026-11-05T10:30:00',
  duration_minutes: 30,
  status: 'booked',
  notes: 'Marriage muhurat',
  created_at: '2026-11-01T09:00:00',
  customer_name: `Customer ${id}`,
  customer_phone: '+919800000000',
  customer_email: null,
  ...patch,
});

const NOW = new Date(2026, 10, 5, 9, 30);

function mockList(rows: StaffAppointment[], seen?: URLSearchParams[]) {
  server.use(
    http.get('/api/appointments/', ({ request }) => {
      seen?.push(new URL(request.url).searchParams);
      return HttpResponse.json(rows);
    }),
  );
}

describe('<AppointmentCalendar />', () => {
  it('week view queries the whole Monday–Sunday range and places events in their day column', async () => {
    useAuthStore.setState({ token: 't', user: fakeAdminUser, isBooting: false });
    const seen: URLSearchParams[] = [];
    mockList([appt(1), appt(2, { start_at: '2026-11-07T15:00:00', end_at: '2026-11-07T16:00:00', duration_minutes: 60, customer_name: 'Ravi K' })], seen);

    renderWithProviders(
      <AppointmentCalendar view="week" anchor="2026-11-05" onNavigate={vi.fn()} onSetStatus={vi.fn()} now={NOW} />,
    );

    const thursday = await screen.findByTestId('day-column-2026-11-05');
    expect(within(thursday).getByRole('button', { name: /customer 1, 10:00 am to 10:30 am, booked/i })).toBeInTheDocument();
    expect(within(screen.getByTestId('day-column-2026-11-07')).getByRole('button', { name: /ravi k/i })).toBeInTheDocument();
    expect(seen[0]?.get('date_from')).toBe('2026-11-02');
    expect(seen[0]?.get('date_to')).toBe('2026-11-08');
    expect(screen.getByText(/2 upcoming/i)).toBeInTheDocument();
  });

  it('hides cancelled appointments unless requested', async () => {
    useAuthStore.setState({ token: 't', user: fakeAdminUser, isBooting: false });
    mockList([appt(1), appt(2, { status: 'cancelled', customer_name: 'Cancelled Person' })]);
    const user = userEvent.setup();
    renderWithProviders(
      <AppointmentCalendar view="week" anchor="2026-11-05" onNavigate={vi.fn()} onSetStatus={vi.fn()} now={NOW} />,
    );

    await screen.findByRole('button', { name: /customer 1/i });
    expect(screen.queryByRole('button', { name: /cancelled person/i })).toBeNull();
    await user.click(screen.getByLabelText(/show cancelled/i));
    expect(screen.getByRole('button', { name: /cancelled person/i })).toBeInTheDocument();
  });

  it('opens a details panel with contact info and actions', async () => {
    useAuthStore.setState({ token: 't', user: fakeAdminUser, isBooting: false });
    mockList([appt(1)]);
    const onSetStatus = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <AppointmentCalendar view="week" anchor="2026-11-05" onNavigate={vi.fn()} onSetStatus={onSetStatus} now={NOW} />,
    );

    await user.click(await screen.findByRole('button', { name: /customer 1/i }));
    const panel = await screen.findByRole('dialog');
    expect(within(panel).getByRole('link', { name: 'Customer 1' })).toHaveAttribute('href', '/customers/41');
    expect(within(panel).getByRole('link', { name: '+919800000000' })).toHaveAttribute('href', 'tel:+919800000000');
    expect(within(panel).getByText('Marriage muhurat')).toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: /mark completed/i }));
    expect(onSetStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 'completed');
  });

  it('filters events by customer name or mobile', async () => {
    useAuthStore.setState({ token: 't', user: fakeAdminUser, isBooting: false });
    mockList([appt(1, { customer_name: 'Asha Patil' }), appt(2, { customer_name: 'Ravi K', customer_phone: '+919811111111', start_at: '2026-11-06T11:00:00', end_at: '2026-11-06T11:30:00' })]);
    renderWithProviders(
      <AppointmentCalendar view="week" anchor="2026-11-05" search="9811" onNavigate={vi.fn()} onSetStatus={vi.fn()} now={NOW} />,
    );
    expect(await screen.findByRole('button', { name: /ravi k/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /asha patil/i })).toBeNull();
  });

  it('navigates with Today / Previous / Next and switches views', async () => {
    useAuthStore.setState({ token: 't', user: fakeAdminUser, isBooting: false });
    mockList([]);
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <AppointmentCalendar view="week" anchor="2026-11-12" onNavigate={onNavigate} onSetStatus={vi.fn()} now={NOW} />,
    );

    await screen.findByTestId('day-column-2026-11-12');
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onNavigate).toHaveBeenLastCalledWith({ anchor: '2026-11-05' });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onNavigate).toHaveBeenLastCalledWith({ anchor: '2026-11-19' });
    await user.click(screen.getByRole('button', { name: 'Today' }));
    expect(onNavigate).toHaveBeenLastCalledWith({ anchor: '2026-11-05' });
    await user.click(screen.getByRole('radio', { name: 'month' }));
    expect(onNavigate).toHaveBeenLastCalledWith({ view: 'month' });
  });

  it('month view lists events per day and collapses extras', async () => {
    useAuthStore.setState({ token: 't', user: fakeAdminUser, isBooting: false });
    const busyDay = [9, 10, 11, 12].map((h, i) =>
      appt(10 + i, {
        start_at: `2026-11-05T${String(h).padStart(2, '0')}:00:00`,
        end_at: `2026-11-05T${String(h).padStart(2, '0')}:30:00`,
      }),
    );
    mockList(busyDay);
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <AppointmentCalendar view="month" anchor="2026-11-05" onNavigate={onNavigate} onSetStatus={vi.fn()} now={NOW} />,
    );

    const cell = await screen.findByTestId('month-cell-2026-11-05');
    await waitFor(() => expect(within(cell).getAllByRole('listitem')).toHaveLength(3));
    await user.click(within(cell).getByRole('button', { name: '+1 more' }));
    expect(onNavigate).toHaveBeenLastCalledWith({ view: 'day', anchor: '2026-11-05' });
  });
});

describe('<AppointmentListPage /> calendar tab', () => {
  it('shows the calendar by default with a tab to switch to the list', async () => {
    useAuthStore.setState({ token: 't', user: fakeAdminUser, isBooting: false });
    mockList([]);
    const user = userEvent.setup();
    renderWithProviders(<AppointmentListPage />, { route: '/appointments' });

    expect(screen.getByRole('tab', { name: 'Calendar' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('radiogroup', { name: /calendar view/i })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'List' }));
    expect(await screen.findByText(/no appointments in this range/i)).toBeInTheDocument();
  });
});
