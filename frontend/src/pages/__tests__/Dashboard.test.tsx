import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server, fakeAdminUser } from '@/test/msw';
import { fakeOverview } from '@/test/fakeBackend';
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
  server.use(
    // The page fires TWO /revenue queries in parallel (current window and
    // previous-equal-length window via usePreviousRevenueStats). Since the
    // default range is derived from `new Date()` at runtime, hard-coding
    // fixture dates and switching on query params makes the test fragile.
    // Returning the same payload for both calls keeps the assertions on the
    // current-window numbers deterministic; delta KPIs will be 0% but the
    // test does not assert on them.
    http.get('/api/dashboard/revenue', () => HttpResponse.json(sampleRevenue)),
    http.get('/api/dashboard/earnings', () => HttpResponse.json(emptyEarnings)),
    http.get('/api/dashboard/revenue-by-category', () => HttpResponse.json(emptyCategories)),
    http.get('/api/visits/', () => HttpResponse.json(emptyVisits)),
    http.get('/api/dashboard/overview', () => HttpResponse.json(fakeOverview)),
    http.get('/api/appointments/', () => HttpResponse.json([])),
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

    // Always re-query the KPI list inside waitFor. Capturing DOM nodes into
    // variables and asserting later breaks when React Query re-renders and
    // swaps subtrees — the old nodes go detached and the assertion error is
    // a confusing "element could not be found in the document".
    await waitFor(() => {
      const list = screen.getByRole('list', { name: /key revenue indicators/i });
      const items = within(list).getAllByRole('listitem');
      expect(items).toHaveLength(6);

      // items[0] = "Total Revenue" = gross = 150,000 → formatted via Intl
      // as ₹1,50,000 (en-IN) or ₹150,000 (en-US); the regex matches both.
      expect(within(items[0]).getByText(/total revenue/i)).toBeInTheDocument();
      expect(within(items[0]).getByText((t) => /1.*50.*000/.test(t))).toBeInTheDocument();

      // items[5] = "Collection Rate" = "80.0%" via formatPercent.
      expect(within(items[5]).getByText(/collection rate/i)).toBeInTheDocument();
      expect(within(items[5]).getByText(/80\.0%/)).toBeInTheDocument();
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

  it('greets the user and shows today-at-a-glance cards from /dashboard/overview', async () => {
    useAuthStore.setState({ token: 'fake.jwt.token', user: fakeAdminUser, isBooting: false });
    installDashboardHandlers();
    renderWithProviders(<Dashboard />, { route: '/dashboard' });

    expect(screen.getByRole('heading', { level: 1, name: /good (morning|afternoon|evening), admin/i })).toBeInTheDocument();
    const cards = await screen.findByRole('list', { name: /today at a glance/i });
    const items = within(cards).getAllByRole('listitem').filter((li) => li.parentElement === cards);
    expect(items).toHaveLength(4);

    expect(within(items[0] as HTMLElement).getByText('02')).toBeInTheDocument();
    expect(within(items[0] as HTMLElement).getByText(/2:00 PM/)).toBeInTheDocument();
    expect(within(items[0] as HTMLElement).getByText(/aarav sharma/i)).toBeInTheDocument();
    expect(within(items[1] as HTMLElement).getByText('5')).toBeInTheDocument();
    expect(within(items[2] as HTMLElement).getByText('+25%')).toBeInTheDocument();
    expect(within(items[3] as HTMLElement).getByText('Portal')).toBeInTheDocument();
    expect(within(items[3] as HTMLElement).getByText('3')).toBeInTheDocument();
  });

  it('shows the scheduled-appointments calendar, follow-ups and recent customers', async () => {
    useAuthStore.setState({ token: 'fake.jwt.token', user: fakeAdminUser, isBooting: false });
    installDashboardHandlers();
    renderWithProviders(<Dashboard />, { route: '/dashboard' });

    const scheduled = await screen.findByRole('region', { name: /scheduled appointments/i });
    expect(within(scheduled).getByRole('radiogroup', { name: /calendar view/i })).toBeInTheDocument();
    expect(within(scheduled).getByRole('searchbox', { name: /search appointments/i })).toBeInTheDocument();
    expect(within(scheduled).getByRole('button', { name: /previous month/i })).toBeInTheDocument();
    expect(await within(scheduled).findByText('5 in the next 7 days')).toBeInTheDocument();

    expect(await screen.findByText(/1d overdue/i)).toBeInTheDocument();
    expect(screen.getByText(/recently added customers/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Revenue' })).toBeInTheDocument();
  });
});
