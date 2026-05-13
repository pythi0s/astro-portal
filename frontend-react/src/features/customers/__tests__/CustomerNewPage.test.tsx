import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, fakeAdminUser } from '@/test/msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import CustomerNewPage from '@/features/customers/pages/CustomerNewPage';
import { useAuthStore } from '@/stores/auth';
import { useServerErrorToast } from '@/hooks/useServerErrorToast';
import type { Customer } from '@/features/customers/types';

/**
 * Bridge component that installs the global 5xx interceptor (normally mounted
 * inside AppShell). We mount it via a tiny wrapper so the
 * `renderWithProviders` helper stays unchanged.
 */
function WithServerErrorToast({ children }: { children: React.ReactNode }) {
  useServerErrorToast();
  return <>{children}</>;
}

function makeSlimCustomer(patch: Partial<Customer> = {}): Customer {
  return {
    id: 42,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: null,
    gender: null,
    date_of_birth: null,
    birth_time: null,
    birth_place: null,
    occupation: null,
    marital_status: null,
    address: null,
    city: null,
    state: null,
    pincode: null,
    rashi: null,
    nakshatra: null,
    gotra: null,
    lagna: null,
    photo_path: null,
    kundali_file_path: null,
    kundali_original_name: null,
    notes: null,
    is_active: true,
    created_by: 1,
    created_at: '2026-05-12T10:00:00Z',
    updated_at: '2026-05-12T10:00:00Z',
    // No `visits` / `customer_solutions` — that's the whole point of the slim
    // CustomerRead schema returned by POST /customers/.
    ...patch,
  };
}

describe('<CustomerNewPage />', () => {
  it('submits the form, navigates to the detail page, and shows a success toast', async () => {
    useAuthStore.setState({
      token: 'fake.jwt.token',
      user: fakeAdminUser,
      isBooting: false,
    });

    let receivedBody: Record<string, unknown> | null = null;
    server.use(
      http.post('/customers/', async ({ request }) => {
        receivedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeSlimCustomer({ id: 42, name: 'Ada Lovelace' }));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <WithServerErrorToast>
        <CustomerNewPage />
      </WithServerErrorToast>,
      {
        route: '/customers/new',
        extraRoutes: [
          { path: '/customers/:id', element: <div data-testid="detail-landing">detail</div> },
        ],
      },
    );

    await user.type(screen.getByLabelText(/full name/i), 'Ada Lovelace');
    await user.click(screen.getByRole('button', { name: /create customer/i }));

    // After mutation success: toast + navigation to /customers/42.
    expect(await screen.findByTestId('detail-landing')).toBeInTheDocument();
    expect(
      await screen.findByText((text) => /customer "ada lovelace" created/i.test(text)),
    ).toBeInTheDocument();

    expect(receivedBody).toMatchObject({ name: 'Ada Lovelace' });
  });

  it('shows the global 5xx toast when the backend returns 500 (schema-split regression guard)', async () => {
    useAuthStore.setState({
      token: 'fake.jwt.token',
      user: fakeAdminUser,
      isBooting: false,
    });

    server.use(
      http.post('/customers/', () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <WithServerErrorToast>
        <CustomerNewPage />
      </WithServerErrorToast>,
      { route: '/customers/new' },
    );

    await user.type(screen.getByLabelText(/full name/i), 'Errored Customer');
    await user.click(screen.getByRole('button', { name: /create customer/i }));

    // Toast copy lives in src/hooks/useServerErrorToast.ts — assert both
    // pieces so a refactor that drops the global interceptor is caught.
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/a server error occurred\. please try again\./i)).toBeInTheDocument();
    });
  });
});
