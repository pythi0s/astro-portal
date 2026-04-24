import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/auth';
import { server } from './msw';

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
