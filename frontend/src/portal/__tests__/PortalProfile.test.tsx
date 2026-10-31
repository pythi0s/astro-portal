import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { PortalProfile } from '@/portal/pages/PortalProfile';
import { usePortalAuthStore } from '@/portal/store';
import { fakeAccount, signInPortal } from './fixtures';

const profile = {
  name: 'Meera Joshi',
  phone: '+919800000000',
  reminders_opt_in: true,
  email: null,
  gender: 'female',
  date_of_birth: '1992-04-18',
  birth_time: '06:45:00',
  birth_place: 'Nashik',
  occupation: null,
  marital_status: null,
  address: null,
  city: 'Pune',
  state: null,
  pincode: null,
  rashi: null,
  nakshatra: null,
  gotra: null,
};

describe('<PortalProfile />', () => {
  it('loads saved details with the mobile number read-only', async () => {
    signInPortal();
    server.use(http.get('/api/portal/profile', () => HttpResponse.json(profile)));
    renderWithProviders(<PortalProfile />, { route: '/portal/profile' });

    expect(await screen.findByDisplayValue('Nashik')).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Meera Joshi');
    expect(screen.getByLabelText(/birth time/i)).toHaveValue('06:45');
    expect(screen.getByLabelText(/mobile number/i)).toBeDisabled();
    expect(screen.getByLabelText(/mobile number/i)).toHaveValue('+919800000000');
  });

  it('saves edits and clears emptied fields', async () => {
    signInPortal();
    let body: Record<string, unknown> | null = null;
    server.use(
      http.get('/api/portal/profile', () => HttpResponse.json(profile)),
      http.put('/api/portal/profile', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...profile, ...body });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<PortalProfile />, { route: '/portal/profile' });

    await screen.findByDisplayValue('Nashik');
    await user.type(screen.getByLabelText(/occupation/i), 'Teacher');
    await user.clear(screen.getByLabelText(/^city/i));
    await user.clear(screen.getByLabelText(/full name/i));
    await user.type(screen.getByLabelText(/full name/i), 'Meera Patil');
    await user.click(screen.getByRole('button', { name: /save details/i }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toMatchObject({
      name: 'Meera Patil',
      occupation: 'Teacher',
      city: null,
      birth_place: 'Nashik',
      reminders_opt_in: true,
    });
    expect(await screen.findByText(/details have been saved/i)).toBeInTheDocument();
    expect(usePortalAuthStore.getState().account).toMatchObject({ id: fakeAccount.id, name: 'Meera Patil' });
  });

  it('lets the customer switch reminders off', async () => {
    signInPortal();
    let body: Record<string, unknown> | null = null;
    server.use(
      http.get('/api/portal/profile', () => HttpResponse.json(profile)),
      http.put('/api/portal/profile', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...profile, ...body });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<PortalProfile />, { route: '/portal/profile' });

    const toggle = await screen.findByRole('checkbox', { name: /booking confirmations and reminders/i });
    expect(toggle).toBeChecked();
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: /save details/i }));
    await waitFor(() => expect(body).toMatchObject({ reminders_opt_in: false }));
  });
});
