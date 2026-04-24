import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/ConfirmProvider';

export interface RouteEntry {
  path: string;
  element: ReactElement;
}

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial URL for the in-memory router. Defaults to `/`. */
  route?: string;
  /**
   * Additional routes to register alongside the component under test. Useful
   * when the UI navigates somewhere after a user action; the navigation
   * target needs a matching <Route> or the assertion "home landed" becomes
   * flaky.
   */
  extraRoutes?: RouteEntry[];
}

/**
 * Wraps `render` with every top-level provider the app uses in production:
 * React Query, toast, confirm dialog, and a memory router.
 *
 * The component under test is registered as a catch-all route (`path="*"`),
 * so the caller can just pass `<Login />` without worrying about route
 * registration. If the component navigates after an action, pass the target
 * route(s) via `extraRoutes`.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
) {
  const { route = '/', extraRoutes = [], ...rest } = options;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  function Wrapper() {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ConfirmProvider>
            <MemoryRouter initialEntries={[route]}>
              <Routes>
                {extraRoutes.map((r) => (
                  <Route key={r.path} path={r.path} element={r.element} />
                ))}
                <Route path="*" element={ui} />
              </Routes>
            </MemoryRouter>
          </ConfirmProvider>
        </ToastProvider>
      </QueryClientProvider>
    );
  }

  return render(<Wrapper />, rest);
}
