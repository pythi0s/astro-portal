import { useEffect } from 'react';
import { AxiosError } from 'axios';
import { useToast } from '@/components/Toast';

/**
 * A single global response interceptor that surfaces 403 and 5xx errors as
 * non-blocking toasts without forcing a navigation. 401 is still handled by
 * the axios refresh interceptor registered in `api/client.ts` — we deliberately
 * do NOT toast on 401 to avoid flashing a message during the silent refresh.
 *
 * Using a hook rather than a top-level interceptor means:
 * - The toast dispatcher is React-owned (subject to provider teardown).
 * - Multiple tabs / stories can mount/unmount it safely.
 * - Tests can render components without a global interceptor leaking between.
 *
 * This hook is mounted exactly once from `AppShell`.
 */
import { apiClient } from '@/api/client';

export function useServerErrorToast() {
  const { push } = useToast();

  useEffect(() => {
    const handle = apiClient.interceptors.response.use(
      (res) => res,
      (error: unknown) => {
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          if (status === 403) {
            push({
              tone: 'error',
              title: 'Not allowed',
              message: "You don't have permission to do that.",
            });
          } else if (status && status >= 500) {
            push({
              tone: 'error',
              title: 'Something went wrong',
              message: 'A server error occurred. Please try again.',
            });
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      apiClient.interceptors.response.eject(handle);
    };
  }, [push]);
}
