import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, fakeAdminUser } from '@/test/msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { Login } from '@/pages/Login';
import { useAuthStore } from '@/stores/auth';

describe('<Login />', () => {
  it('signs in with valid credentials and navigates to the home route', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Login />, {
      route: '/login',
      extraRoutes: [
        { path: '/', element: <div data-testid="home">home page</div> },
      ],
    });

    await user.type(screen.getByLabelText(/email/i), fakeAdminUser.email);
    await user.type(screen.getByLabelText(/password/i), 'correct-horse-battery-staple');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId('home')).toBeInTheDocument();
    });

    // Auth store should be populated.
    const state = useAuthStore.getState();
    expect(state.token).toBe('fake.jwt.token');
    expect(state.user?.email).toBe(fakeAdminUser.email);
  });

  it('shows a user-friendly error on 401 and does not navigate', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Login />, {
      route: '/login',
      extraRoutes: [
        { path: '/', element: <div data-testid="home">home page</div> },
      ],
    });

    await user.type(screen.getByLabelText(/email/i), fakeAdminUser.email);
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/invalid email or password/i);
    expect(screen.queryByTestId('home')).not.toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('disables the submit button while a request is in flight', async () => {
    const user = userEvent.setup();

    // Never-resolving handler so we can observe the in-flight state.
    server.use(
      http.post('/auth/login', async () => {
        await new Promise((r) => setTimeout(r, 10_000));
        return HttpResponse.json({ access_token: 't', token_type: 'bearer' });
      }),
    );

    renderWithProviders(<Login />, { route: '/login' });

    await user.type(screen.getByLabelText(/email/i), fakeAdminUser.email);
    await user.type(screen.getByLabelText(/password/i), 'correct-horse-battery-staple');
    const submit = screen.getByRole('button', { name: /sign in/i });
    await user.click(submit);

    await waitFor(() => {
      expect(submit).toBeDisabled();
      expect(submit).toHaveTextContent(/signing in/i);
    });
  });
});
