import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Persisted, system-aware dark-mode provider.
 *
 * Storage: `localStorage['theme']` = `'light' | 'dark' | 'system'`.
 * When resolved is `'dark'`, the `dark` class is toggled on <html>, which
 * activates Tailwind's `dark:` variants (see `tailwind.config.js`).
 *
 * `resolved` is the actual applied theme; `theme` is the user preference
 * (which may be `'system'`).
 */
export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemePreference;
  resolved: ResolvedTheme;
  setTheme: (t: ThemePreference) => void;
  toggle: () => void;
}

const STORAGE_KEY = 'theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    /* localStorage inaccessible (private mode, etc.) — fall back to system */
  }
  return 'system';
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return pref;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(readInitialPreference);
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(readInitialPreference()));

  // Apply resolved theme to <html> and keep it in sync with system when pref === 'system'.
  useEffect(() => {
    const applied = resolve(theme);
    setResolved(applied);
    const root = document.documentElement;
    root.classList.toggle('dark', applied === 'dark');
    root.dataset.theme = applied;
    root.style.colorScheme = applied;
  }, [theme]);

  // React to OS-level scheme changes only while pref === 'system'.
  useEffect(() => {
    if (theme !== 'system' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      const next: ResolvedTheme = mq.matches ? 'dark' : 'light';
      setResolved(next);
      const root = document.documentElement;
      root.classList.toggle('dark', next === 'dark');
      root.dataset.theme = next;
      root.style.colorScheme = next;
    };
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore write failures */
    }
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    // Simple 2-state toggle: light ↔ dark. If the user was on 'system' we
    // resolve first, so the toggle produces the visually-opposite theme.
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolved, setTheme, toggle }),
    [theme, resolved, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}
