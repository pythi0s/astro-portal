import { AxiosError, isAxiosError } from 'axios';
import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';

/**
 * Parse a FastAPI/Pydantic 422 body and dispatch errors to react-hook-form.
 *
 * FastAPI's 422 payload looks like:
 *   { "detail": [ { "loc": ["body", "email"], "msg": "field required", ... } ] }
 *
 * Non-422 errors are mapped to a single form-level error under `formRootKey`
 * (default: "root.serverError"); the calling form decides how to render it.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  opts?: { formRootKey?: string; fallbackMessage?: string },
): void {
  const fallback = opts?.fallbackMessage ?? 'Request failed. Please try again.';

  if (!isAxiosError(error)) {
    setError((opts?.formRootKey ?? 'root.serverError') as Path<T>, { message: fallback });
    return;
  }

  const status = error.response?.status;
  const payload = error.response?.data as unknown;

  if (status === 422 && payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (Array.isArray(detail)) {
      let matched = false;
      for (const entry of detail as Array<{ loc?: unknown; msg?: unknown }>) {
        if (Array.isArray(entry.loc) && typeof entry.msg === 'string') {
          // Skip the leading "body"/"query" segment.
          const path = entry.loc.slice(1).join('.') as Path<T>;
          if (path) {
            setError(path, { message: String(entry.msg) });
            matched = true;
          }
        }
      }
      if (matched) return;
    }
  }

  // 400/409/etc. with a plain string detail
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === 'string') {
      setError((opts?.formRootKey ?? 'root.serverError') as Path<T>, { message: detail });
      return;
    }
  }

  setError((opts?.formRootKey ?? 'root.serverError') as Path<T>, { message: fallback });
}

/** Extract a single human-readable message from any error (for toasts). */
export function errorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as unknown;
    if (data && typeof data === 'object' && 'detail' in data) {
      const detail = (data as { detail: unknown }).detail;
      if (typeof detail === 'string') return detail;
    }
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}
