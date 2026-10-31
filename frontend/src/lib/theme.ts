import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'astro_theme';
const ORDER: ThemePreference[] = ['system', 'light', 'dark'];
const DARK_QUERY = '(prefers-color-scheme: dark)';

export function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.(DARK_QUERY).matches;
}

export function resolveTheme(pref: ThemePreference, prefersDark = systemPrefersDark()): ResolvedTheme {
  if (pref === 'system') return prefersDark ? 'dark' : 'light';
  return pref;
}

export function nextPreference(pref: ThemePreference): ThemePreference {
  return ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length] as ThemePreference;
}

export function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1b1626' : '#fff8e7');
}

interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (pref: ThemePreference) => void;
  cycle: () => void;
  syncWithSystem: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: readPreference(),
  resolved: resolveTheme(readPreference()),
  setPreference: (preference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // storage unavailable: preference still applies for this tab
    }
    const resolved = resolveTheme(preference);
    applyTheme(resolved);
    set({ preference, resolved });
  },
  cycle: () => get().setPreference(nextPreference(get().preference)),
  syncWithSystem: () => {
    if (get().preference !== 'system') return;
    const resolved = resolveTheme('system');
    applyTheme(resolved);
    set({ resolved });
  },
}));

/** Applies the stored theme and follows OS changes while in "system" mode. */
export function initTheme(): () => void {
  const { preference } = useThemeStore.getState();
  applyTheme(resolveTheme(preference));
  const mq = window.matchMedia?.(DARK_QUERY);
  const onChange = () => useThemeStore.getState().syncWithSystem();
  mq?.addEventListener?.('change', onChange);
  return () => mq?.removeEventListener?.('change', onChange);
}
