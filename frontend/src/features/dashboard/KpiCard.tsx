import clsx from 'clsx';
import { deltaPercent, formatDeltaLabel } from '@/lib/format';

export type KpiAccent = 'saffron' | 'crimson' | 'violet' | 'jade' | 'gold' | 'slate';

const ACCENT_CONFIG: Record<KpiAccent, {
  bg: string; border: string; label: string; value: string; badge: string;
}> = {
  saffron: {
    bg:     'bg-kpi-saffron',
    border: 'border-saffron-400/30',
    label:  'text-saffron-700',
    value:  'text-saffron-700',
    badge:  'bg-saffron-500/10 text-saffron-700',
  },
  crimson: {
    bg:     'bg-kpi-crimson',
    border: 'border-crimson-400/30',
    label:  'text-crimson-600',
    value:  'text-crimson-700',
    badge:  'bg-crimson-500/10 text-crimson-600',
  },
  violet: {
    bg:     'bg-kpi-violet',
    border: 'border-violet-400/30',
    label:  'text-violet-700',
    value:  'text-violet-800',
    badge:  'bg-violet-500/10 text-violet-700',
  },
  jade: {
    bg:     'bg-kpi-jade',
    border: 'border-jade-500/30',
    label:  'text-jade-700',
    value:  'text-jade-800',
    badge:  'bg-jade-500/10 text-jade-700',
  },
  gold: {
    bg:     'bg-kpi-gold',
    border: 'border-gold-500/30',
    label:  'text-gold-600',
    value:  'text-gold-700',
    badge:  'bg-gold-500/10 text-gold-600',
  },
  slate: {
    bg:     'bg-kpi-deep',
    border: 'border-midnight-200',
    label:  'text-midnight-700',
    value:  'text-midnight-900',
    badge:  'bg-midnight-100 text-midnight-700',
  },
};

interface Props {
  label: string;
  value: string;
  rawValue: number;
  previousValue: number | undefined;
  tooltip?: string;
  isLoading?: boolean;
  helper?: string;
  accent?: KpiAccent;
  /** stagger index for animation delay */
  index?: number;
}

export function KpiCard({
  label, value, rawValue, previousValue, tooltip, isLoading, helper,
  accent = 'slate', index = 0,
}: Props) {
  const delta = deltaPercent(rawValue, previousValue);
  const deltaLabel = formatDeltaLabel(delta);
  const direction: 'up' | 'down' | 'flat' =
    delta === undefined ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  const cfg = ACCENT_CONFIG[accent];

  return (
    <div
      className={clsx(
        'relative rounded-xl p-4 shadow-sm ring-1 transition-shadow duration-200',
        'hover:shadow-md hover:ring-2 focus-within:ring-2',
        cfg.bg, cfg.border,
        'animate-kpi-pop',
      )}
      style={{ animationDelay: `${index * 80}ms` }}
      title={tooltip}
    >
      <p className={clsx('text-xs font-semibold uppercase tracking-widest', cfg.label)}>{label}</p>
      <p className={clsx('mt-2 text-2xl font-bold tabular-nums', cfg.value)}>
        {isLoading
          ? <span className="inline-block h-6 w-24 animate-pulse rounded bg-midnight-900/10" />
          : value}
      </p>
      {helper && <p className="mt-1 text-xs text-midnight-700/70">{helper}</p>}
      <div className="mt-2 flex items-center gap-1 text-xs font-medium">
        <DeltaGlyph direction={direction} />
        <span
          className={clsx(
            'tabular-nums',
            direction === 'up'   && 'text-emerald-700',
            direction === 'down' && 'text-red-700',
            direction === 'flat' && 'text-midnight-700',
          )}
          aria-label={
            delta === undefined
              ? 'No previous-window comparison available'
              : `\${deltaLabel} vs. previous window`
          }
        >
          {deltaLabel}
        </span>
        <span className="text-midnight-700/50">vs. previous</span>
      </div>
    </div>
  );
}

function DeltaGlyph({ direction }: { direction: 'up' | 'down' | 'flat' }) {
  if (direction === 'up')   return <span aria-hidden="true">▲</span>;
  if (direction === 'down') return <span aria-hidden="true">▼</span>;
  return <span aria-hidden="true">–</span>;
}
