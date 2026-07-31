import { useEffect, useRef, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth';
import * as authApi from '@/api/auth';

/**
 * AuthProvider performs the boot sequence exactly once before any route renders:
 *   1. Read token from localStorage (already hydrated by the store).
 *   2. If no token: finish booting, land on /login.
 *   3. If token: call GET /auth/me to validate it and load the fresh user.
 *   4. On success: call POST /auth/refresh to extend the session by another window.
 *   5. On failure at any step: clear credentials.
 *
 * During this sequence, `isBooting` is true and every route is expected to render
 * a full-page spinner instead of its content. This prevents the "flash of Login"
 * problem when an already-authenticated user reloads the page.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const bootRef = useRef(false);

  useEffect(() => {
    // React 18 StrictMode double-invokes effects in development. Guard so the
    // boot network calls run only once per mount.
    if (bootRef.current) return;
    bootRef.current = true;

    const store = useAuthStore.getState();

    void (async () => {
      try {
        if (!store.token) {
          return;
        }
        const user = await authApi.getMe();
        store.setUser(user);
        try {
          const fresh = await authApi.refresh();
          store.setToken(fresh.access_token);
        } catch {
          // Refresh extension failed but /auth/me succeeded — keep the user
          // signed in; the next request will trigger the silent-refresh path.
        }
      } catch {
        // Invalid / expired token — clear and land on /login on next render.
        store.clear();
      } finally {
        store.setBooting(false);
      }
    })();
  }, []);

  return <>{children}</>;
}
