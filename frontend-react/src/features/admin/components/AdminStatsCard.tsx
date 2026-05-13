import { Skeleton } from '@/components/Skeleton';
import { formatInteger } from '@/lib/format';
import { useAdminStats } from '../hooks/useAdmin';

export function AdminStatsCard() {
  const { data, isLoading, isError } = useAdminStats();

  if (isError) {
    return (
      <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-900">
        Failed to load stats.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Box label="Total users" value={isLoading ? undefined : formatInteger(data?.total_users ?? 0)} />
      <Box label="Active users" value={isLoading ? undefined : formatInteger(data?.active_users ?? 0)} />
      <Box label="Admins" value={isLoading ? undefined : formatInteger(data?.admin_count ?? 0)} />
    </div>
  );
}

function Box({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="rounded-md border border-midnight-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-midnight-600">{label}</p>
      {value === undefined ? (
        <Skeleton className="mt-1 h-6 w-20" />
      ) : (
        <p className="mt-1 text-xl font-semibold text-midnight-900">{value}</p>
      )}
    </div>
  );
}
