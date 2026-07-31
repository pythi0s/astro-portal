import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Single QueryClient for the whole app.
 *
 * - `staleTime: 60_000` — aggressively dedupe the KPI / chart fetches that
 *   happen in parallel on /dashboard. A minute is short enough that manual
 *   refresh is rarely needed but long enough to eliminate chatter on tab
 *   re-focus.
 * - `retry: 1` — one retry on transient failures; don't hammer the backend
 *   while auth is being refreshed by the axios interceptor.
 * - `refetchOnWindowFocus: false` — the existing axios 401/refresh dance is
 *   sufficient; we don't need a burst of refetches every time the tab
 *   regains focus. Revisit if Step 5 adds near-real-time panels.
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // Lazy-init inside state so HMR / StrictMode double-invoke doesn't recreate
  // the client on every render and wipe the cache mid-session.
  const [client] = useState(makeQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
