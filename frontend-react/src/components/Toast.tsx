import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastOptions {
  title?: string;
  message: string;
  tone?: ToastTone;
  /** milliseconds before auto-dismiss. Use 0 to require manual dismiss. */
  durationMs?: number;
}

interface Toast extends Required<Omit<ToastOptions, 'durationMs' | 'title'>> {
  id: number;
  title?: string;
  durationMs: number;
}

interface ToastContextValue {
  push: (opts: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, number>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (opts: ToastOptions): number => {
      const id = ++idRef.current;
      const toast: Toast = {
        id,
        title: opts.title,
        message: opts.message,
        tone: opts.tone ?? 'info',
        durationMs: opts.durationMs ?? 4000,
      };
      setToasts((list) => [...list, toast]);
      if (toast.durationMs > 0) {
        const handle = window.setTimeout(() => dismiss(id), toast.durationMs);
        timersRef.current.set(id, handle);
      }
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    return () => {
      const timers = timersRef.current;
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRegion toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastRegion({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'error' ? 'alert' : 'status'}
          className={clsx(
            'pointer-events-auto w-full max-w-md rounded-md border px-4 py-3 shadow-sm',
            t.tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
            t.tone === 'error' && 'border-rose-200 bg-rose-50 text-rose-900',
            t.tone === 'info' && 'border-midnight-200 bg-white text-midnight-900',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {t.title ? <p className="text-sm font-semibold">{t.title}</p> : null}
              <p className="text-sm">{t.message}</p>
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(t.id)}
              className="rounded text-sm font-medium text-midnight-700/70 hover:text-midnight-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
