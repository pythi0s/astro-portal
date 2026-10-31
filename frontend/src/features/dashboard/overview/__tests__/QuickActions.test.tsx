import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { QuickActions } from '@/features/dashboard/overview/QuickActions';
import { fakeOverview } from '@/test/fakeBackend';
import type { DashboardOverview } from '@/features/dashboard/overview/types';

const base = fakeOverview as unknown as DashboardOverview;

describe('<QuickActions />', () => {
  it('offers "Start visit" with the customer when the next appointment is within the hour', () => {
    renderWithProviders(<QuickActions data={base} now={new Date(2026, 2, 15, 13, 20)} />);
    const start = screen.getByRole('link', { name: /start visit · aarav at 2:00 pm/i });
    expect(start).toHaveAttribute('href', '/visits/new?customer_id=1');
    expect(screen.queryByRole('link', { name: /^record visit$/i })).toBeNull();
    expect(screen.getByRole('link', { name: /today's schedule \(2\)/i })).toHaveAttribute('href', '/appointments?cal=day');
  });

  it('falls back to "Record visit" when nothing is about to start', () => {
    renderWithProviders(<QuickActions data={base} now={new Date(2026, 2, 15, 9, 0)} />);
    expect(screen.getByRole('link', { name: /record visit/i })).toHaveAttribute('href', '/visits/new');
    expect(screen.getByRole('link', { name: /new customer/i })).toHaveAttribute('href', '/customers/new');
  });

  it('hides the schedule shortcut on days without appointments', () => {
    renderWithProviders(
      <QuickActions data={{ ...base, appointments_today: 0, next_appointment: null }} now={new Date(2026, 2, 15, 9, 0)} />,
    );
    expect(screen.queryByRole('link', { name: /today's schedule/i })).toBeNull();
  });
});
