import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { server } from '@/test/msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { PortalLogin } from '@/portal/pages/PortalLogin';
import { safePortalNext } from '@/portal/lib/next';
import { PortalRegister } from '@/portal/pages/PortalRegister';
import { RequirePortalAuth } from '@/portal/RequirePortalAuth';
import { usePortalAuthStore } from '@/portal/store';
import { useAuthStore } from '@/stores/auth';
import { fakeAccount, signInPortal } from './fixtures';

const meHandler = http.get('/api/portal/auth/me', () => HttpResponse.json(fakeAccount));

describe('portal sign-in', () => {
  it('signs in with a mobile number, keeps the portal session separate from staff and navigates', async () => {
    let sent: unknown = null;
    server.use(
      http.post('/api/portal/auth/login', async ({ request }) => {
        sent = await request.json();
        const body = sent as { identifier: string; password: string };
        return body.password === 'right-password'
          ? HttpResponse.json({ access_token: 'portal.jwt', token_type: 'bearer' })
          : HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
      }),
      meHandler,
    );
    const user = userEvent.setup();
    renderWithProviders(<PortalLogin />, {
      route: '/portal/login',
      extraRoutes: [{ path: '/portal/appointments', element: <div>appointments page</div> }],
    });

    await user.type(screen.getByLabelText(/mobile number or email/i), ' 98000 00000 ');
    await user.type(screen.getByLabelText(/password/i), 'right-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('appointments page')).toBeInTheDocument();
    expect(sent).toEqual({ identifier: '98000 00000', password: 'right-password' });
    expect(usePortalAuthStore.getState().account?.phone).toBe(fakeAccount.phone);
    expect(localStorage.getItem('astro_portal_token')).toBe('portal.jwt');
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('shows a friendly error for bad credentials', async () => {
    server.use(
      http.post('/api/portal/auth/login', () =>
        HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<PortalLogin />, { route: '/portal/login' });

    await user.type(screen.getByLabelText(/mobile number or email/i), '9000000000');
    await user.type(screen.getByLabelText(/password/i), 'nope-nope');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid mobile number\/email or password/i);
    expect(usePortalAuthStore.getState().token).toBeNull();
  });

  it('only honours ?next targets inside the portal', () => {
    expect(safePortalNext('/portal/book')).toBe('/portal/book');
    expect(safePortalNext('/admin/users')).toBe('/portal/appointments');
    expect(safePortalNext('//evil.example.com')).toBe('/portal/appointments');
    expect(safePortalNext(null)).toBe('/portal/appointments');
  });
});

async function fillRequired(user: ReturnType<typeof userEvent.setup>, confirm = 'longenough') {
  await user.type(screen.getByLabelText(/full name/i), 'Meera Joshi');
  await user.type(screen.getByLabelText(/mobile number/i), '98000 00000');
  await user.type(screen.getByLabelText(/^password/i), 'longenough');
  await user.type(screen.getByLabelText(/confirm password/i), confirm);
}

describe('portal registration', () => {
  it('marks account details as required and the rest as optional', () => {
    renderWithProviders(<PortalRegister />, { route: '/portal/register' });
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getAllByText('Optional')).toHaveLength(3);
    for (const label of [/^email/i, /gender/i, /date of birth/i, /birth time/i, /birth place/i, /occupation/i, /rashi/i, /nakshatra/i, /gotra/i, /city/i, /pin code/i]) {
      expect(screen.getByLabelText(label)).not.toBeRequired();
    }
  });

  it('validates the form client-side before calling the API', async () => {
    let called = false;
    server.use(
      http.post('/api/portal/auth/register', () => {
        called = true;
        return HttpResponse.json({ access_token: 't', token_type: 'bearer' }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<PortalRegister />, { route: '/portal/register' });

    await fillRequired(user, 'different!');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/do not match/i);

    await user.clear(screen.getByLabelText(/confirm password/i));
    await user.type(screen.getByLabelText(/confirm password/i), 'longenough');
    await user.clear(screen.getByLabelText(/mobile number/i));
    await user.type(screen.getByLabelText(/mobile number/i), '12345');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/valid 10-digit mobile/i);
    expect(called).toBe(false);
  });

  it('registers with only the required fields', async () => {
    let payload: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/portal/auth/register', async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ access_token: 'portal.jwt', token_type: 'bearer' }, { status: 201 });
      }),
      meHandler,
    );
    const user = userEvent.setup();
    renderWithProviders(<PortalRegister />, {
      route: '/portal/register',
      extraRoutes: [{ path: '/portal/book', element: <div>booking page</div> }],
    });

    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('booking page')).toBeInTheDocument();
    expect(payload).toEqual({ name: 'Meera Joshi', phone: '98000 00000', password: 'longenough' });
    expect(usePortalAuthStore.getState().account?.id).toBe(fakeAccount.id);
  });

  it('opts in to reminders by default and sends opt-out when unticked', async () => {
    let payload: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/portal/auth/register', async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ access_token: 'portal.jwt', token_type: 'bearer' }, { status: 201 });
      }),
      meHandler,
    );
    const user = userEvent.setup();
    renderWithProviders(<PortalRegister />, {
      route: '/portal/register',
      extraRoutes: [{ path: '/portal/book', element: <div>booking page</div> }],
    });

    const consent = screen.getByRole('checkbox', { name: /booking confirmations and reminders/i });
    expect(consent).toBeChecked();
    await fillRequired(user);
    await user.click(consent);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await screen.findByText('booking page');
    expect(payload).toMatchObject({ reminders_opt_in: false });
  });

  it('sends the optional details that were filled in', async () => {
    let payload: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/portal/auth/register', async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ access_token: 'portal.jwt', token_type: 'bearer' }, { status: 201 });
      }),
      meHandler,
    );
    const user = userEvent.setup();
    renderWithProviders(<PortalRegister />, {
      route: '/portal/register',
      extraRoutes: [{ path: '/portal/book', element: <div>booking page</div> }],
    });

    await fillRequired(user);
    await user.type(screen.getByLabelText(/^email/i), 'meera@example.com');
    await user.selectOptions(screen.getByLabelText(/gender/i), 'female');
    await user.type(screen.getByLabelText(/birth place/i), 'Nashik');
    await user.type(screen.getByLabelText(/^rashi/i), 'Kanya');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await screen.findByText('booking page');
    expect(payload).toEqual({
      name: 'Meera Joshi',
      phone: '98000 00000',
      password: 'longenough',
      email: 'meera@example.com',
      gender: 'female',
      birth_place: 'Nashik',
      rashi: 'Kanya',
    });
  });

  it('surfaces a duplicate-mobile error from the server', async () => {
    server.use(
      http.post('/api/portal/auth/register', () =>
        HttpResponse.json({ detail: 'An account with this mobile number already exists' }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<PortalRegister />, { route: '/portal/register' });

    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/i);
  });
});

describe('<RequirePortalAuth />', () => {
  function Guarded() {
    return (
      <Routes>
        <Route element={<RequirePortalAuth />}>
          <Route path="/portal/book" element={<div>secret booking</div>} />
        </Route>
        <Route path="/portal/login" element={<div>portal login</div>} />
      </Routes>
    );
  }

  it('redirects anonymous visitors to the portal login', async () => {
    renderWithProviders(<Guarded />, { route: '/portal/book' });
    expect(await screen.findByText('portal login')).toBeInTheDocument();
  });

  it('does not accept a staff session as a portal session', async () => {
    useAuthStore.setState({ token: 'staff.jwt', user: null, isBooting: false });
    renderWithProviders(<Guarded />, { route: '/portal/book' });
    expect(await screen.findByText('portal login')).toBeInTheDocument();
  });

  it('renders protected content for a signed-in customer', async () => {
    signInPortal();
    renderWithProviders(<Guarded />, { route: '/portal/book' });
    await waitFor(() => expect(screen.getByText('secret booking')).toBeInTheDocument());
  });
});
