import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Generic URL-backed state for list pages. The URL is the single source of
 * truth: query strings drive query keys, and hard-refresh restores the exact
 * view. Keys with the default value (or empty string) are stripped from the
 * URL to keep it clean and shareable.
 *
 * Values are always string-based on the URL. Consumers that need numbers,
 * booleans, or enums should use a typed wrapper that narrows on read and
 * stringifies on write — see `useListParams` below for the canonical shape.
 */
export type UrlStateValue = string | number | boolean | null | undefined;

export function useUrlState<T extends Record<string, UrlStateValue>>(
  defaults: T,
): [T, (patch: Partial<T>) => void] {
  const [params, setParams] = useSearchParams();

  const current = useMemo(() => {
    const out = { ...defaults } as T;
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const raw = params.get(String(key));
      if (raw === null) continue;
      const def = defaults[key];
      if (typeof def === 'number') {
        const n = Number.parseInt(raw, 10);
        if (Number.isFinite(n)) (out as Record<string, UrlStateValue>)[String(key)] = n;
      } else if (typeof def === 'boolean') {
        (out as Record<string, UrlStateValue>)[String(key)] = raw === 'true';
      } else {
        (out as Record<string, UrlStateValue>)[String(key)] = raw;
      }
    }
    return out;
  }, [params, defaults]);

  const setState = useCallback(
    (patch: Partial<T>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            const def = (defaults as Record<string, UrlStateValue>)[key];
            if (
              value === undefined ||
              value === null ||
              value === '' ||
              value === def ||
              (typeof value === 'number' && Number.isNaN(value))
            ) {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams, defaults],
  );

  return [current, setState];
}

/**
 * Convenience shape for list pages: every list page uses this exact set of
 * keys so bookmarks and deep links look consistent across the app.
 */
export interface ListParams {
  q: string;
  page: number;
  pageSize: number;
  sort: string;
}

export const DEFAULT_LIST_PARAMS: ListParams = {
  q: '',
  page: 1,
  pageSize: 20,
  sort: '',
};
