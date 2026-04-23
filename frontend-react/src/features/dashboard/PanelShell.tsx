import { type ReactNode } from 'react';
import clsx from 'clsx';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  emptyLabel?: string;
  errorLabel?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps every dashboard panel so loading/error/empty/normal rendering is
 * identical everywhere. The panel-scoped error means one failing widget
 * doesn't blank out the page — the other panels keep rendering their data.
 */
export function PanelShell({
  title,
  subtitle,
  actions,
  isLoading,
  isError,
  isEmpty,
  emptyLabel = 'No data for the selected range.',
  errorLabel = 'Could not load this panel.',
  children,
  className,
}: Props) {
  return (
    <section
      className={clsx(
        'rounded-xl bg-white p-4 ring-1 ring-midnight-900/10 shadow-sm',
        className,
      )}
    >
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-midnight-900">{title}</h2>
          {subtitle && <p className="text-xs text-midnight-700">{subtitle}</p>}
        </div>
        {actions}
      </header>

      {isError ? (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">
          {errorLabel}
        </div>
      ) : isLoading ? (
        <div aria-busy="true" aria-label="Loading" className="space-y-2">
          <div className="h-4 w-1/3 animate-pulse rounded bg-midnight-900/10" />
          <div className="h-24 w-full animate-pulse rounded bg-midnight-900/10" />
        </div>
      ) : isEmpty ? (
        <p className="py-6 text-center text-sm text-midnight-700/80">{emptyLabel}</p>
      ) : (
        children
      )}
    </section>
  );
}
