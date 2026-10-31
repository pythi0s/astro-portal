import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import {
  THEME_STORAGE_KEY,
  initTheme,
  nextPreference,
  readPreference,
  resolveTheme,
  useThemeStore,
} from '@/lib/theme';

type Listener = () => void;

function mockSystemTheme(initialDark: boolean) {
  let dark = initialDark;
  const listeners: Listener[] = [];
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        get matches() {
          return query.includes('dark') ? dark : false;
        },
        media: query,
        addEventListener: (_: string, l: Listener) => listeners.push(l),
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
  return {
    setDark(value: boolean) {
      dark = value;
      listeners.forEach((l) => l());
    },
  };
}

const isDark = () => document.documentElement.classList.contains('dark');

describe('theme helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    useThemeStore.setState({ preference: 'system', resolved: 'light' });
  });
  afterEach(() => vi.restoreAllMocks());

  it('defaults to following the system and ignores junk in storage', () => {
    expect(readPreference()).toBe('system');
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    expect(readPreference()).toBe('system');
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(readPreference()).toBe('dark');
  });

  it('resolves preferences and cycles system → light → dark', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(nextPreference('system')).toBe('light');
    expect(nextPreference('light')).toBe('dark');
    expect(nextPreference('dark')).toBe('system');
  });

  it('follows OS changes live only while in system mode', () => {
    const os = mockSystemTheme(false);
    const stop = initTheme();
    expect(isDark()).toBe(false);

    os.setDark(true);
    expect(isDark()).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');

    useThemeStore.getState().setPreference('light');
    expect(isDark()).toBe(false);
    os.setDark(true);
    expect(isDark()).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    stop();
  });
});

describe('<ThemeSwitcher />', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    useThemeStore.setState({ preference: 'system', resolved: 'light' });
  });
  afterEach(() => vi.restoreAllMocks());

  it('cycles through system, light and dark and applies the class', async () => {
    mockSystemTheme(false);
    const user = userEvent.setup();
    renderWithProviders(<ThemeSwitcher />);

    const button = screen.getByRole('button', { name: /theme: system \(light\)\. switch to light/i });
    await user.click(button);
    expect(screen.getByRole('button', { name: /theme: light\. switch to dark/i })).toBeInTheDocument();
    expect(isDark()).toBe(false);

    await user.click(screen.getByRole('button', { name: /theme: light/i }));
    expect(screen.getByRole('button', { name: /theme: dark\. switch to system/i })).toBeInTheDocument();
    expect(isDark()).toBe(true);

    await user.click(screen.getByRole('button', { name: /theme: dark/i }));
    expect(isDark()).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });
});
