import { create } from 'zustand';
import type { PortalAccount } from './types';

// Separate key from the staff token so both sessions can coexist in one browser.
const TOKEN_KEY = 'astro_portal_token';

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage failures; session still works in-memory
  }
}

export interface PortalAuthState {
  token: string | null;
  account: PortalAccount | null;
  isBooting: boolean;
  setToken: (token: string | null) => void;
  setAccount: (account: PortalAccount | null) => void;
  setBooting: (booting: boolean) => void;
  clear: () => void;
}

export const usePortalAuthStore = create<PortalAuthState>((set) => ({
  token: readToken(),
  account: null,
  isBooting: true,
  setToken: (token) => {
    writeToken(token);
    set({ token });
  },
  setAccount: (account) => set({ account }),
  setBooting: (isBooting) => set({ isBooting }),
  clear: () => {
    writeToken(null);
    set({ token: null, account: null });
  },
}));
