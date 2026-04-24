import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server, fakeAdminUser } from '@/test/msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { UserListPage } from '@/features/admin/pages/UserListPage';
import { useAuthStore } from '@/stores/auth';
import type { User } from '@/types/api';
import type { AdminStats } from '@/features/admin/types';

const makeUser = (id: number, patch: Partial<User> = {}): User => ({
  id,
  email: `user${id}@example.com`,
  full_name: `Staff Member ${id}`,
  phone: null,
  role: 'astrologer',
  is_active: true,
  created_at: '2026-03-01T00:00:00Z',
  ...patch,
});

const sampleStats: AdminStats = {
  total_users: 7,
  active_users: 6,
  admin_count: 2,
};

describe('<UserListPage />', () => {
  it('renders the stats card and user table rows', async () => {
    useAuthStore.setState({
      token: 'fake.jwt.token',
      user: fakeAdminUser,
      isBooting: false,
    });

    server.use(
      http.get('/admin/stats', () => HttpResponse.json(sampleStats)),
      http.get('/admin/users', () =>
        HttpResponse.json([
          makeUser(10, { full_name: 'Meera Rao', role: 'admin' }),
          makeUser(11, { full_name: 'Arun Iyer', role: 'astrologer' }),
          makeUser(12, { full_name: 'Divya Menon', role: 'receptionist' }),
        ]),
      ),
    );

    renderWithProviders(<UserListPage />, { route: '/admin/users' });

    // AdminStatsCard shows three labelled tiles. Wait for stats to land.
    // Use exact-match regex because the page subtitle prose also contains the
    // word "admins" ("Manage the admins, astrologers, and receptionists …"),
    // which would make /admins/i match two elements and throw.
    expect(await screen.findByText(/^total users$/i)).toBeInTheDocument();
    expect(screen.getByText(/^active users$/i)).toBeInTheDocument();
    expect(screen.getByText(/^admins$/i)).toBeInTheDocument();

    // The three counts should appear as "7", "6", "2" respectively.
    const valueStrings = ['7', '6', '2'];
    for (const v of valueStrings) {
      expect(await screen.findByText(v)).toBeInTheDocument();
    }

    // User rows show their full_name as a link to the detail page.
    const meeraLink = await screen.findByRole('link', { name: /meera rao/i });
    expect(meeraLink).toHaveAttribute('href', '/admin/users/10');

    expect(screen.getByRole('link', { name: /arun iyer/i })).toHaveAttribute(
      'href',
      '/admin/users/11',
    );
    expect(screen.getByRole('link', { name: /divya menon/i })).toHaveAttribute(
      'href',
      '/admin/users/12',
    );

    // The role column should humanize enum values.
    const table = screen.getByRole('table');
    expect(within(table).getByText(/^admin$/i)).toBeInTheDocument();
    expect(within(table).getByText(/astrologer/i)).toBeInTheDocument();
    expect(within(table).getByText(/receptionist/i)).toBeInTheDocument();
  });

  it('surfaces a user-facing error when stats loading fails', async () => {
    useAuthStore.setState({
      token: 'fake.jwt.token',
      user: fakeAdminUser,
      isBooting: false,
    });

    server.use(
      http.get('/admin/stats', () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
      http.get('/admin/users', () => HttpResponse.json([])),
    );

    renderWithProviders(<UserListPage />, { route: '/admin/users' });

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to load stats/i);
  });

  it('sends the selected role filter as a query parameter', async () => {
    useAuthStore.setState({
      token: 'fake.jwt.token',
      user: fakeAdminUser,
      isBooting: false,
    });

    const seenRoleParams: Array<string | null> = [];
    server.use(
      http.get('/admin/stats', () => HttpResponse.json(sampleStats)),
      http.get('/admin/users', ({ request }) => {
        const url = new URL(request.url);
        seenRoleParams.push(url.searchParams.get('role'));
        return HttpResponse.json([makeUser(99, { role: 'admin' })]);
      }),
    );

    // Initial route filters to admin via the query string; the Select is
    // bound to URL state via useUrlState, so the fetch on mount should
    // include role=admin.
    renderWithProviders(<UserListPage />, { route: '/admin/users?role=admin' });

    expect(await screen.findByRole('link', { name: /staff member 99/i })).toBeInTheDocument();
    expect(seenRoleParams).toContain('admin');
  });
});
