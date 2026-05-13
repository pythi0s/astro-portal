import { create } from 'zustand';
import type { User, UserSnapshot } from '@/types/api';

const TOKEN_KEY = 'astro_access_token';
const USER_SNAPSHOT_KEY = 'astro_user_snapshot';

export interface AuthState {
  token: string | null;
  user: User | null;
  isBooting: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setBooting: (booting: boolean) => void;
  clear: () => void;
}

function readTokenFromStorage(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeTokenToStorage(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage may be unavailable (private mode, quota). Silent failure is acceptable;
    // auth still works within the current tab via in-memory state.
  }
}

function writeUserSnapshotToStorage(user: User | null): void {
  try {
    if (!user) {
      localStorage.removeItem(USER_SNAPSHOT_KEY);
      return;
    }
    const snapshot: UserSnapshot = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };
    localStorage.setItem(USER_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: readTokenFromStorage(),
  user: null,
  isBooting: true,
  setToken: (token) => {
    writeTokenToStorage(token);
    set({ token });
  },
  setUser: (user) => {
    writeUserSnapshotToStorage(user);
    set({ user });
  },
  setBooting: (isBooting) => set({ isBooting }),
  clear: () => {
    writeTokenToStorage(null);
    writeUserSnapshotToStorage(null);
    set({ token: null, user: null });
  },
}));

export function getStoredToken(): string | null {
  return useAuthStore.getState().token;
}

export function setStoredToken(token: string | null): void {
  useAuthStore.getState().setToken(token);
}
