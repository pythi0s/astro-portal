import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { THEME_STORAGE_KEY, initTheme, nextPreference, readPreference, useThemeStore } from '@/lib/theme';

const isDark = () => document.documentElement.classList.contains('dark');

describe('theme helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    useThemeStore.setState({ preference: 'dark' });
  });

  it('defaults to dark, including legacy "system" and junk values', () => {
    expect(readPreference()).toBe('dark');
    localStorage.setItem(THEME_STORAGE_KEY, 'system');
    expect(readPreference()).toBe('dark');
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    expect(readPreference()).toBe('dark');
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(readPreference()).toBe('light');
  });

  it('toggles between dark and light only', () => {
    expect(nextPreference('dark')).toBe('light');
    expect(nextPreference('light')).toBe('dark');
  });

  it('applies the stored preference on init', () => {
    initTheme();
    expect(isDark()).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });
});

describe('<ThemeSwitcher />', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    useThemeStore.setState({ preference: 'dark' });
  });

  it('toggles dark → light → dark and persists the choice', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeSwitcher />);

    await user.click(screen.getByRole('button', { name: /theme: dark\. switch to light/i }));
    expect(isDark()).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    await user.click(screen.getByRole('button', { name: /theme: light\. switch to dark/i }));
    expect(isDark()).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });
});
