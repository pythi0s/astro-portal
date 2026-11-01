import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'astro_theme';

export function readPreference(): ThemePreference {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function nextPreference(pref: ThemePreference): ThemePreference {
  return pref === 'dark' ? 'light' : 'dark';
}

export function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1b1626' : '#fff8e7');
}

interface ThemeState {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  cycle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: readPreference(),
  setPreference: (preference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // storage unavailable: preference still applies for this tab
    }
    applyTheme(preference);
    set({ preference });
  },
  cycle: () => get().setPreference(nextPreference(get().preference)),
}));

export function initTheme(): void {
  applyTheme(useThemeStore.getState().preference);
}
