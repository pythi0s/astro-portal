import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, fakeAdminUser } from '@/test/msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import CustomerListPage from '@/features/customers/pages/CustomerListPage';
import { useAuthStore } from '@/stores/auth';
import type { CustomerListRow } from '@/features/customers/types';

const baseRow = (id: number, patch: Partial<CustomerListRow> = {}): CustomerListRow => ({
  id,
  name: `Customer ${id}`,
  email: `customer${id}@example.com`,
  phone: `+91-90000000${id.toString().padStart(2, '0')}`,
  gender: 'female',
  city: 'Bengaluru',
  rashi: 'Mesha',
  photo_path: null,
  is_active: true,
  created_at: '2026-03-15T10:00:00Z',
  ...patch,
});

const firstPage: CustomerListRow[] = [
  baseRow(1, { name: 'Aarav Sharma' }),
  baseRow(2, { name: 'Priya Nair' }),
  baseRow(3, { name: 'Rohan Patel' }),
];

describe('<CustomerListPage />', () => {
  it('lists customers returned from /customers/ and links to each detail page', async () => {
    useAuthStore.setState({
      token: 'fake.jwt.token',
      user: fakeAdminUser,
      isBooting: false,
    });

    server.use(
      http.get('/customers/', () => HttpResponse.json(firstPage)),
    );

    renderWithProviders(<CustomerListPage />, { route: '/customers' });

    expect(await screen.findByRole('link', { name: /aarav sharma/i })).toHaveAttribute(
      'href',
      '/customers/1',
    );
    expect(screen.getByRole('link', { name: /priya nair/i })).toHaveAttribute(
      'href',
      '/customers/2',
    );
    expect(screen.getByRole('link', { name: /rohan patel/i })).toHaveAttribute(
      'href',
      '/customers/3',
    );
  });

  it('debounces search input and re-queries with the new term', async () => {
    useAuthStore.setState({
      token: 'fake.jwt.token',
      user: fakeAdminUser,
      isBooting: false,
    });

    const seenSearches: string[] = [];
    server.use(
      http.get('/customers/', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');
        if (search) seenSearches.push(search);
        if (search && /priya/i.test(search)) {
          return HttpResponse.json([baseRow(2, { name: 'Priya Nair' })]);
        }
        return HttpResponse.json(firstPage);
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<CustomerListPage />, { route: '/customers' });

    // Wait for the initial list to land.
    await screen.findByRole('link', { name: /aarav sharma/i });

    // SearchInput debounces at 300ms; userEvent.type fires key events
    // synchronously, so awaiting the debounced state change requires
    // waitFor, which advances real time.
    const searchBox = screen.getByRole('searchbox');
    await user.type(searchBox, 'Priya');

    await waitFor(
      () => {
        expect(seenSearches).toContain('Priya');
      },
      { timeout: 2000 },
    );

    // Once the debounced refetch lands, the list should narrow to one row.
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /priya nair/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /aarav sharma/i })).not.toBeInTheDocument();
    });
  });

  it('renders the empty-state CTA when the list is empty', async () => {
    useAuthStore.setState({
      token: 'fake.jwt.token',
      user: fakeAdminUser,
      isBooting: false,
    });

    server.use(
      http.get('/customers/', () => HttpResponse.json([])),
    );

    renderWithProviders(<CustomerListPage />, { route: '/customers' });

    expect(await screen.findByText(/no customers yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/create the first customer to get started/i),
    ).toBeInTheDocument();
  });
});
