import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { MiniMonthCalendar } from '@/features/appointments/components/MiniMonthCalendar';

describe('<MiniMonthCalendar />', () => {
  it('shows the selected month, marks today/selected and selects a day', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <MiniMonthCalendar
        selected="2026-11-12"
        today={new Date(2026, 10, 5)}
        markedDays={new Set(['2026-11-20'])}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('November 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '12 November 2026' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: '20 November 2026' }));
    expect(onSelect).toHaveBeenCalledWith('2026-11-20');
  });

  it('pages between months', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MiniMonthCalendar selected="2026-01-10" today={new Date(2026, 0, 1)} markedDays={new Set()} onSelect={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: /previous month/i }));
    expect(screen.getByText('December 2025')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next month/i }));
    await user.click(screen.getByRole('button', { name: /next month/i }));
    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });
});
