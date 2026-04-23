import { useMemo } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { RevenueSummary } from '@/features/dashboard/types';
import { formatMoney, toNumber } from '@/features/dashboard/lib/format';
import { PanelShell } from '@/features/dashboard/PanelShell';

interface Props {
  data: RevenueSummary | undefined;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Doughnut of collected / outstanding / waived. Outstanding is a single slice
 * because the /revenue endpoint already rolls partial + pending together.
 * If/when the backend splits pending vs partial we can add the fourth slice
 * without changing the shell.
 */
const SLICE_COLORS: Record<string, string> = {
  Collected: '#059669',
  Outstanding: '#d97706',
  Waived: '#64748b',
};

export function PaymentStatusChart({ data, isLoading, isError }: Props) {
  const slices = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Collected', value: toNumber(data.collected) },
      { name: 'Outstanding', value: toNumber(data.outstanding) },
      { name: 'Waived', value: toNumber(data.waived) },
    ].filter((s) => Number.isFinite(s.value) && s.value > 0);
  }, [data]);

  const total = useMemo(() => slices.reduce((acc, s) => acc + s.value, 0), [slices]);

  return (
    <PanelShell
      title="Payment status breakdown"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !isError && slices.length === 0}
      emptyLabel="No visits with fees in the selected range."
    >
      <figure className="h-64">
        <figcaption className="sr-only">
          Doughnut chart of payment status: {slices.map((s) => `${s.name} ${formatMoney(s.value)}`).join(', ')}.
          Total revenue {formatMoney(total)}.
        </figcaption>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={86}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell key={s.name} fill={SLICE_COLORS[s.name] ?? '#4338ca'} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => [formatMoney(v), 'Amount']} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(legendValue) => {
                const slice = slices.find((s) => s.name === legendValue);
                const amount = slice ? formatMoney(slice.value) : '—';
                return (
                  <span className="text-xs text-midnight-800">
                    {legendValue} <span className="text-midnight-700">{amount}</span>
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </figure>
    </PanelShell>
  );
}
