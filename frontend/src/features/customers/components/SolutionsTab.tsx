import { useCustomerSolutions } from '../hooks/useCustomer';
import { formatDate, humanizeCategory } from '@/lib/format';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';

export function SolutionsTab({ customerId }: { customerId: number }) {
  const { data, isLoading, isError } = useCustomerSolutions(customerId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-900">
        Failed to load solutions. Please refresh the page.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No solutions assigned yet"
        description="Assign a solution from a visit, and it will appear here."
      />
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {data.map((cs) => (
        <li key={cs.id} className="rounded-md border border-midnight-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-midnight-900">{cs.solution_name}</p>
            <time className="text-xs text-midnight-700" dateTime={cs.given_date}>
              {formatDate(cs.given_date)}
            </time>
          </div>
          <p className="mt-1 text-sm text-midnight-700">
            {humanizeCategory(cs.solution_category)} · {humanizeCategory(cs.status)}
            {cs.notes ? <> · {cs.notes}</> : null}
          </p>
        </li>
      ))}
    </ol>
  );
}
