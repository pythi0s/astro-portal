import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { PortalBook } from '@/portal/pages/PortalBook';
import { PortalAppointments } from '@/portal/pages/PortalAppointments';
import { appointment, availabilityFor, availabilityHandler, signInPortal } from './fixtures';

describe('<PortalBook />', () => {
  it('shows open slots and disables the ones overlapping an existing booking', async () => {
    signInPortal();
    server.use(availabilityHandler);
    renderWithProviders(<PortalBook />, { route: '/portal/book' });

    const group = await screen.findByRole('radiogroup', { name: /time slots/i });
    expect(within(group).getByRole('radio', { name: '9:30 AM' })).toBeEnabled();
    expect(within(group).getByRole('radio', { name: '9:45 AM' })).toBeDisabled();
    expect(within(group).getByRole('radio', { name: '10:00 AM' })).toBeDisabled();
    expect(within(group).getByRole('radio', { name: '10:30 AM' })).toBeEnabled();
    // 30-minute default: last slot must end by the 19:00 close.
    expect(within(group).getByRole('radio', { name: '6:30 PM' })).toBeEnabled();
    expect(within(group).queryByRole('radio', { name: '6:45 PM' })).toBeNull();
  });

  it('offers only 15 to 60 minute durations and recomputes slots', async () => {
    signInPortal();
    server.use(availabilityHandler);
    const user = userEvent.setup();
    renderWithProviders(<PortalBook />, { route: '/portal/book' });

    const durationGroup = await screen.findByRole('radiogroup', { name: /duration/i });
    await waitFor(() =>
      expect(within(durationGroup).getAllByRole('radio').map((o) => o.textContent)).toEqual([
        '15 min',
        '30 min',
        '45 min',
        '1 hour',
      ]),
    );

    await user.click(within(durationGroup).getByRole('radio', { name: '1 hour' }));
    expect(within(durationGroup).getByRole('radio', { name: '1 hour' })).toHaveAttribute('aria-checked', 'true');
    const group = await screen.findByRole('radiogroup', { name: /time slots/i });
    expect(within(group).getByRole('radio', { name: '9:00 AM' })).toBeEnabled();
    expect(within(group).getByRole('radio', { name: '9:15 AM' })).toBeDisabled();
    expect(within(group).getByRole('radio', { name: '6:00 PM' })).toBeEnabled();
    expect(within(group).queryByRole('radio', { name: '6:15 PM' })).toBeNull();
  });

  it('books the selected slot with the chosen duration and notes', async () => {
    signInPortal();
    let body: Record<string, unknown> | null = null;
    server.use(
      availabilityHandler,
      http.post('/api/portal/appointments', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          appointment(1, {
            start_at: body.start_at as string,
            end_at: (body.start_at as string).replace('10:30', '11:15'),
            duration_minutes: 45,
          }),
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<PortalBook />, {
      route: '/portal/book',
      extraRoutes: [{ path: '/portal/appointments', element: <div>my appointments</div> }],
    });

    const durationGroup = await screen.findByRole('radiogroup', { name: /duration/i });
    await user.click(within(durationGroup).getByRole('radio', { name: '45 min' }));
    await user.click(await screen.findByRole('radio', { name: '10:30 AM' }));
    expect(screen.getByRole('radio', { name: '10:30 AM' })).toHaveAttribute('aria-checked', 'true');
    await user.type(screen.getByLabelText(/notes/i), 'Career question');
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    expect(await screen.findByText('my appointments')).toBeInTheDocument();
    expect(body).toMatchObject({ duration_minutes: 45, notes: 'Career question' });
    expect(String((body as unknown as { start_at: string }).start_at)).toMatch(/T10:30:00$/);
  });

  it('keeps the confirm button disabled until a slot is picked', async () => {
    signInPortal();
    server.use(availabilityHandler);
    renderWithProviders(<PortalBook />, { route: '/portal/book' });
    await screen.findByRole('radiogroup', { name: /time slots/i });
    expect(screen.getByRole('button', { name: /confirm booking/i })).toBeDisabled();
  });

  it('shows the conflict message when someone else grabbed the slot first', async () => {
    signInPortal();
    let availabilityCalls = 0;
    server.use(
      http.get('/api/portal/availability', ({ request }) => {
        availabilityCalls += 1;
        return HttpResponse.json(availabilityFor(new URL(request.url).searchParams.get('date') ?? ''));
      }),
      http.post('/api/portal/appointments', () =>
        HttpResponse.json(
          { detail: 'This time slot is already booked. Please choose another time.' },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<PortalBook />, { route: '/portal/book' });

    await user.click(await screen.findByRole('radio', { name: '11:00 AM' }));
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/already booked/i);
    await waitFor(() => expect(availabilityCalls).toBeGreaterThanOrEqual(2));
    expect(screen.getByRole('button', { name: /confirm booking/i })).toBeDisabled();
  });
});

describe('<PortalAppointments />', () => {
  it('separates upcoming bookings from history', async () => {
    signInPortal();
    server.use(
      http.get('/api/portal/appointments', () =>
        HttpResponse.json([
          appointment(1),
          appointment(2, {
            start_at: '2020-01-01T10:00:00',
            end_at: '2020-01-01T10:15:00',
            duration_minutes: 15,
            status: 'completed',
          }),
          appointment(3, { status: 'cancelled', start_at: '2099-06-01T12:00:00', end_at: '2099-06-01T13:00:00' }),
        ]),
      ),
    );
    renderWithProviders(<PortalAppointments />, { route: '/portal/appointments' });

    const upcoming = await screen.findByRole('region', { name: /upcoming/i });
    expect(within(upcoming).getAllByRole('listitem')).toHaveLength(1);
    expect(within(upcoming).getByText(/10:00 AM – 10:30 AM/)).toBeInTheDocument();

    const history = screen.getByRole('region', { name: /history/i });
    expect(within(history).getAllByRole('listitem')).toHaveLength(2);
    expect(within(history).getByText('Completed')).toBeInTheDocument();
    expect(within(history).getByText('Cancelled')).toBeInTheDocument();
  });

  it('shows an empty state with a booking link', async () => {
    signInPortal();
    server.use(http.get('/api/portal/appointments', () => HttpResponse.json([])));
    renderWithProviders(<PortalAppointments />, { route: '/portal/appointments' });

    expect(await screen.findByText(/no upcoming appointments/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /book now/i })).toHaveAttribute('href', '/portal/book');
  });

  it('cancels an upcoming appointment after confirmation', async () => {
    signInPortal();
    let cancelled = false;
    server.use(
      http.get('/api/portal/appointments', () =>
        HttpResponse.json([appointment(5, cancelled ? { status: 'cancelled' } : {})]),
      ),
      http.post('/api/portal/appointments/5/cancel', () => {
        cancelled = true;
        return HttpResponse.json(appointment(5, { status: 'cancelled' }));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<PortalAppointments />, { route: '/portal/appointments' });

    await user.click(await screen.findByRole('button', { name: /^cancel$/i }));
    await user.click(await screen.findByRole('button', { name: /cancel appointment/i }));

    await waitFor(() => expect(cancelled).toBe(true));
    expect(await screen.findByText(/no upcoming appointments/i)).toBeInTheDocument();
  });

  it('reports load failures', async () => {
    signInPortal();
    server.use(http.get('/api/portal/appointments', () => new HttpResponse(null, { status: 500 })));
    renderWithProviders(<PortalAppointments />, { route: '/portal/appointments' });
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i);
  });
});
