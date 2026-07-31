import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/auth';
import { server } from './msw';

// ---------------------------------------------------------------------------
// jsdom polyfills.
//
// Recharts' <ResponsiveContainer> instantiates `new ResizeObserver(...)` while
// rendering, which jsdom does not ship. Because we deliberately do NOT wrap
// tests in an error boundary (production render paths don't have one either),
// a ReferenceError bubbles up through the component tree and React 18 unmounts
// the entire subtree — which is why the Dashboard test saw an empty
// `<body><div/></body>` even though <Dashboard /> renders `<main>` synchronously.
//
// Installing noop stubs on globalThis (and window, for the rare module that
// reads `window.ResizeObserver` directly) is the de-facto jsdom fix and does
// not change production behaviour — the real browser's ResizeObserver still
// wins because these assignments are guarded by existence checks.
// ---------------------------------------------------------------------------
class ResizeObserverStub {
  observe(): void {
    /* no-op under jsdom; charts just render at 0×0 which is fine for tests */
  }
  unobserve(): void {}
  disconnect(): void {}
}

const g = globalThis as unknown as {
  ResizeObserver?: typeof ResizeObserver;
  matchMedia?: Window['matchMedia'];
};

if (!g.ResizeObserver) {
  g.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// Some UI libs read matchMedia during render. jsdom may or may not have it
// depending on version; a never-matching stub is safe.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// Start MSW once per test run. Individual tests can override handlers with
// `server.use(...)` and they will be reset to the defaults after each test.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  // Pre-test reset: force the auth store back to a signed-out, non-booting
  // state. The real app starts with `isBooting: true` and the AuthProvider
  // flips it to false after /auth/me; tests usually don't want that ceremony.
  useAuthStore.setState({ token: null, user: null, isBooting: false });
});

afterEach(() => {
  // React Testing Library only auto-cleans when vitest runs with globals:true
  // (and even then only if you import from '@testing-library/react/vitest').
  // We keep globals:false for explicit imports, so we wire cleanup manually.
  // Without this, DOM from the prior test leaks forward and getBy* queries
  // match "multiple elements" or type into stale inputs.
  cleanup();
  server.resetHandlers();
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch {
    // jsdom should never throw, but be defensive.
  }
});

afterAll(() => {
  server.close();
});
