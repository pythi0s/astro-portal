import clsx from 'clsx';
import { deltaPercent, formatDeltaLabel } from '@/lib/format';

interface Props {
  label: string;
  value: string;
  rawValue: number;
  previousValue: number | undefined;
  tooltip?: string;
  isLoading?: boolean;
  /** Optional helper text shown under the value (e.g. "of gross"). */
  helper?: string;
}

/**
 * Numeric KPI card with a previous-window delta. Delta direction is
 * signalled by BOTH an icon/sign AND a color — color alone never.
 */
export function KpiCard({ label, value, rawValue, previousValue, tooltip, isLoading, helper }: Props) {
  const delta = deltaPercent(rawValue, previousValue);
  const deltaLabel = formatDeltaLabel(delta);
  const direction: 'up' | 'down' | 'flat' = delta === undefined ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  return (
    <div
      className={clsx(
        'relative rounded-xl bg-white p-4 ring-1 ring-midnight-900/10 shadow-sm',
        'focus-within:ring-2 focus-within:ring-primary-500',
      )}
      title={tooltip}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-midnight-700">{label}</p>
      <p className="mt-2 text-2xl font-bold text-midnight-900 tabular-nums">
        {isLoading ? <span className="inline-block h-6 w-24 animate-pulse rounded bg-midnight-900/10" /> : value}
      </p>
      {helper && <p className="mt-1 text-xs text-midnight-700/80">{helper}</p>}
      <div className="mt-2 flex items-center gap-1 text-xs font-medium">
        <DeltaGlyph direction={direction} />
        <span
          className={clsx(
            'tabular-nums',
            direction === 'up' && 'text-emerald-700',
            direction === 'down' && 'text-red-700',
            direction === 'flat' && 'text-midnight-700',
          )}
          aria-label={
            delta === undefined
              ? 'No previous-window comparison available'
              : `${deltaLabel} vs. previous window`
          }
        >
          {deltaLabel}
        </span>
        <span className="text-midnight-700/60">vs. previous</span>
      </div>
    </div>
  );
}

function DeltaGlyph({ direction }: { direction: 'up' | 'down' | 'flat' }) {
  if (direction === 'up') {
    return <span aria-hidden="true">▲</span>;
  }
  if (direction === 'down') {
    return <span aria-hidden="true">▼</span>;
  }
  return <span aria-hidden="true">–</span>;
}
