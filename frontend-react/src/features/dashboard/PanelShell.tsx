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
        'rounded-xl bg-white/70 backdrop-blur-sm p-4 ring-1 ring-gold-500/20 shadow-sm hover:shadow-md transition-shadow',
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
        <div role="alert" className="rounded-lg border border-crimson-400/30 bg-crimson-50 p-3 text-sm text-crimson-700 ring-1 ring-crimson-200">
          {errorLabel}
        </div>
      ) : isLoading ? (
        <div aria-busy="true" aria-label="Loading" className="space-y-2">
          <div className="h-4 w-1/3 rounded bg-gradient-to-r from-violet-200/60 via-gold-200/40 to-violet-200/60 animate-shimmer" style={{backgroundSize:"800px 100%"}} />
          <div className="h-24 w-full rounded bg-gradient-to-r from-violet-200/60 via-gold-200/40 to-violet-200/60 animate-shimmer" style={{backgroundSize:"800px 100%"}} />
        </div>
      ) : isEmpty ? (
        <p className="py-6 text-center text-sm text-midnight-700/80">{emptyLabel}</p>
      ) : (
        children
      )}
    </section>
  );
}
