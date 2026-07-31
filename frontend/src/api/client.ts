import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getStoredToken, setStoredToken, useAuthStore } from '@/stores/auth';

type RefreshHandler = () => Promise<string>;

// An internal flag on a request config that marks it as already having been
// retried after a silent refresh. Prevents infinite loops.
interface RetriableRequest extends InternalAxiosRequestConfig {
  _authRetried?: boolean;
}

let refreshInFlight: Promise<string> | null = null;
let refreshHandler: RefreshHandler | null = null;

/**
 * Register the refresh implementation. Called once from api/auth.ts to avoid
 * a circular import between client and the auth endpoint module.
 */
export function registerRefreshHandler(handler: RefreshHandler): void {
  refreshHandler = handler;
}

async function runRefresh(): Promise<string> {
  if (!refreshHandler) {
    throw new Error('No refresh handler registered');
  }
  if (!refreshInFlight) {
    refreshInFlight = refreshHandler()
      .then((token) => {
        setStoredToken(token);
        return token;
      })
      .catch((err: unknown) => {
        // Failure: clear credentials so the next 401 short-circuits to logout.
        useAuthStore.getState().clear();
        throw err;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.set?.('Authorization', `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequest | undefined;
    const status = error.response?.status;

    // Only attempt silent refresh on 401, once, and never for the refresh call itself.
    if (
      status === 401 &&
      original &&
      !original._authRetried &&
      !isRefreshRequest(original) &&
      !isLoginRequest(original)
    ) {
      original._authRetried = true;
      try {
        const newToken = await runRefresh();
        original.headers?.set?.('Authorization', `Bearer ${newToken}`);
        return apiClient.request(original);
      } catch {
        // Refresh failed — fall through to reject. The auth store has been cleared
        // by runRefresh; the router guard will redirect to /login on next render.
        redirectToLogin();
      }
    }

    return Promise.reject(error);
  },
);

function isRefreshRequest(config: AxiosRequestConfig): boolean {
  return !!config.url && /\/auth\/refresh\/?$/.test(config.url);
}

function isLoginRequest(config: AxiosRequestConfig): boolean {
  return !!config.url && /\/auth\/login\/?$/.test(config.url);
}

function redirectToLogin(): void {
  const here = window.location.pathname + window.location.search;
  const next = here && here !== '/login' ? `?next=${encodeURIComponent(here)}` : '';
  // Using assign (not replace) so the user can go "back" to see the stale page
  // if they want to — this matches the Vue app's behavior.
  if (window.location.pathname !== '/login') {
    window.location.assign(`/login${next}`);
  }
}
