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

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red-styled confirm button for destructive actions. */
  danger?: boolean;
}

interface ActiveConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveConfirm | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setActive({ ...opts, resolve });
    });
  }, []);

  const respond = useCallback(
    (ok: boolean) => {
      setActive((current) => {
        current?.resolve(ok);
        return null;
      });
    },
    [],
  );

  useEffect(() => {
    if (!active) return;
    // Focus the cancel button by default on dangerous confirms to prevent
    // accidental "enter"-to-confirm. On non-danger dialogs, focus the primary.
    const target = active.danger ? cancelBtnRef.current : confirmBtnRef.current;
    target?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        respond(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, respond]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-900/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby={active.description ? 'confirm-desc' : undefined}
          ref={dialogRef}
          onClick={(e) => {
            if (e.target === dialogRef.current) respond(false);
          }}
        >
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <h2 id="confirm-title" className="text-base font-semibold text-midnight-900">
              {active.title}
            </h2>
            {active.description ? (
              <p id="confirm-desc" className="mt-2 text-sm text-midnight-700">
                {active.description}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                ref={cancelBtnRef}
                type="button"
                className="rounded-md border border-midnight-200 bg-white px-3 py-1.5 text-sm font-medium text-midnight-800 hover:bg-midnight-700/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                onClick={() => respond(false)}
              >
                {active.cancelLabel ?? 'Cancel'}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                className={clsx(
                  'rounded-md px-3 py-1.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2',
                  active.danger
                    ? 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-400'
                    : 'bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-500',
                )}
                onClick={() => respond(true)}
              >
                {active.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): (opts: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return ctx.confirm;
}
