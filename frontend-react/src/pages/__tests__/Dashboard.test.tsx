import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server, fakeAdminUser } from '@/test/msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { Dashboard } from '@/pages/Dashboard';
import { useAuthStore } from '@/stores/auth';
import type {
  EarningsSummary,
  RevenueByCategory,
  RevenueSummary,
  VisitSummary,
} from '@/features/dashboard/types';

// Note: we intentionally render the Dashboard *directly* rather than going
// through the router + RequireAuth guards. The auth store is pre-seeded with
// an admin user so hasRole('admin') returns true and StaffCollectionRow
// renders. Each test installs handlers for the five endpoints the page
// fans out to on mount.

const sampleRevenue: RevenueSummary = {
  from_date: '2026-03-01',
  to_date: '2026-03-30',
  collected: 120_000,
  outstanding: 30_000,
  waived: 0,
  gross: 150_000,
  visit_count: 48,
  avg_fee: 3_125,
  collection_rate: 80,
};

const earlierRevenue: RevenueSummary = {
  ...sampleRevenue,
  from_date: '2026-01-30',
  to_date: '2026-02-28',
  collected: 90_000,
  outstanding: 25_000,
  gross: 115_000,
  visit_count: 36,
  avg_fee: 3_194,
  collection_rate: 78,
};

const emptyEarnings: EarningsSummary = {
  period: 'day',
  start_date: '2026-03-01',
  end_date: '2026-03-30',
  breakdown: [],
  grand_total: 0,
};

const emptyCategories: RevenueByCategory = {
  from_date: '2026-03-01',
  to_date: '2026-03-30',
  rows: [],
  grand_total: 0,
};

const emptyVisits: VisitSummary[] = [];

function installDashboardHandlers() {
  let revenueCall = 0;
  server.use(
    http.get('/dashboard/revenue', () => {
      // The page fires two /revenue queries in parallel: current + previous
      // window. The store keys differ so React Query issues two separate
      // HTTP requests; we hand the first the "current" payload and the
      // second the "previous" payload. Order is deterministic in React
      // Query v5.
      revenueCall += 1;
      return HttpResponse.json(revenueCall === 1 ? sampleRevenue : earlierRevenue);
    }),
    http.get('/dashboard/earnings', () => HttpResponse.json(emptyEarnings)),
    http.get('/dashboard/revenue-by-category', () => HttpResponse.json(emptyCategories)),
    http.get('/visits/', () => HttpResponse.json(emptyVisits)),
  );
}

describe('<Dashboard />', () => {
  it('renders formatted KPI values once the revenue endpoint resolves', async () => {
    useAuthStore.setState({
      token: 'fake.jwt.token',
      user: fakeAdminUser,
      isBooting: false,
    });
    installDashboardHandlers();

    renderWithProviders(<Dashboard />, { route: '/dashboard' });

    const kpiList = await screen.findByRole('list', { name: /key revenue indicators/i });
    const items = within(kpiList).getAllByRole('listitem');
    expect(items).toHaveLength(6);

    // The first card is "Total Revenue" = gross = 150,000 → formatted as ₹1,50,000 (INR default).
    const totalRevenue = within(items[0]);
    expect(totalRevenue.getByText(/total revenue/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(totalRevenue.getByText((t) => /1.*50.*000/.test(t))).toBeInTheDocument();
    });

    // Collection rate (last card) should show the 80% value once loaded.
    const collectionRate = within(items[5]);
    expect(collectionRate.getByText(/collection rate/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(collectionRate.getByText(/80/)).toBeInTheDocument();
    });
  });

  it('renders the admin-only Staff Collection panel when the user has role=admin', async () => {
    useAuthStore.setState({
      token: 'fake.jwt.token',
      user: fakeAdminUser,
      isBooting: false,
    });
    installDashboardHandlers();

    renderWithProviders(<Dashboard />, { route: '/dashboard' });

    expect(await screen.findByText(/staff collection rate/i)).toBeInTheDocument();
    expect(screen.getByText(/admin only/i)).toBeInTheDocument();
  });

  it('hides the Staff Collection panel for non-admin roles', async () => {
    useAuthStore.setState({
      token: 'fake.jwt.token',
      user: { ...fakeAdminUser, role: 'astrologer' },
      isBooting: false,
    });
    installDashboardHandlers();

    renderWithProviders(<Dashboard />, { route: '/dashboard' });

    // Wait for at least one KPI so the page has actually rendered, then
    // assert the admin panel is absent. Otherwise we might assert before
    // the page mounts and get a trivially-true result.
    await screen.findByRole('list', { name: /key revenue indicators/i });
    expect(screen.queryByText(/staff collection rate/i)).not.toBeInTheDocument();
  });
});
