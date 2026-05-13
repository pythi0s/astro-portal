import { formatInteger } from '@/lib/format';
import { Skeleton } from '@/components/Skeleton';
import type { CustomerListRow } from '../types';

interface Props {
  rows: CustomerListRow[] | undefined;
  isLoading: boolean;
}

/**
 * Derived KPIs computed on the visible page only. True totals require a
 * count endpoint (TODO: step-6 adds `GET /customers/count` if prioritised).
 */
export function CustomerKpiStrip({ rows, isLoading }: Props) {
  const visible = rows?.length ?? 0;
  const active = rows?.filter((r) => r.is_active).length ?? 0;
  const withPhone = rows?.filter((r) => !!r.phone).length ?? 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <KpiBox label="On this page" value={visible} isLoading={isLoading} />
      <KpiBox label="Active" value={active} isLoading={isLoading} />
      <KpiBox label="With phone" value={withPhone} isLoading={isLoading} />
    </div>
  );
}

function KpiBox({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: number;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-md border border-midnight-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-midnight-600">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-1 h-6 w-16" />
      ) : (
        <p className="mt-1 text-xl font-semibold text-midnight-900">{formatInteger(value)}</p>
      )}
    </div>
  );
}
