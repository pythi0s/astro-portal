import { useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { EarningsSummary, Granularity } from '@/features/dashboard/types';
import { formatMoney, toNumber } from '@/features/dashboard/lib/format';
import { PanelShell } from '@/features/dashboard/PanelShell';

interface Props {
  data: EarningsSummary | undefined;
  autoGranularity: Granularity;
  isLoading: boolean;
  isError: boolean;
  onGranularityChange: (g: Granularity) => void;
  granularity: Granularity;
}

type ChartKind = 'bar' | 'line';

const GRANULARITIES: Granularity[] = ['day', 'week', 'month'];

export function EarningsChart({
  data,
  autoGranularity,
  isLoading,
  isError,
  granularity,
  onGranularityChange,
}: Props) {
  const [kind, setKind] = useState<ChartKind>('bar');

  const series = useMemo(() => {
    if (!data) return [];
    return data.breakdown.map((b) => ({
      label: b.label,
      total: toNumber(b.total_fees),
      visits: b.visit_count,
    }));
  }, [data]);

  const overrideActive = granularity !== autoGranularity;

  return (
    <PanelShell
      title="Earnings over time"
      subtitle={`Granularity: ${granularity}${overrideActive ? ' (manual override)' : ' (auto)'}`}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !isError && series.length === 0}
      actions={
        <div className="flex items-center gap-2">
          <ToggleGroup
            label="Granularity"
            value={granularity}
            options={GRANULARITIES}
            onChange={onGranularityChange}
          />
          <ToggleGroup
            label="Chart kind"
            value={kind}
            options={['bar', 'line'] as ChartKind[]}
            onChange={(v) => setKind(v)}
          />
        </div>
      }
    >
      <p role="status" aria-live="polite" className="sr-only">
        Earnings chart. {series.length} points at {granularity} granularity.
        {overrideActive ? ' Granularity override active.' : ''}
      </p>
      <figure className="h-72">
        <figcaption className="sr-only">
          Earnings over time, {granularity} bars. Each value is total fees for the period.
        </figcaption>
        <ResponsiveContainer width="100%" height="100%">
          {kind === 'bar' ? (
            <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => formatMoney(v, { currency: undefined })} tick={{ fontSize: 12 }} width={80} />
              <Tooltip
                formatter={(v: number) => [formatMoney(v), 'Total']}
                labelClassName="font-medium"
              />
              <Bar dataKey="total" fill="#4338ca" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => formatMoney(v, { currency: undefined })} tick={{ fontSize: 12 }} width={80} />
              <Tooltip
                formatter={(v: number) => [formatMoney(v), 'Total']}
                labelClassName="font-medium"
              />
              <Line type="monotone" dataKey="total" stroke="#4338ca" strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </figure>
    </PanelShell>
  );
}

function ToggleGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (next: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md ring-1 ring-midnight-900/10">
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className={clsx(
            'px-2.5 py-1 text-xs font-medium capitalize',
            i === 0 && 'rounded-l-md',
            i === options.length - 1 && 'rounded-r-md',
            value === opt ? 'bg-midnight-900 text-white' : 'bg-white text-midnight-800 hover:bg-midnight-900/5',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
