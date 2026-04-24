import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { humanizeCategory } from '@/lib/format';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import type { Solution } from '../types';

interface Props {
  solutions: Solution[] | undefined;
  isLoading: boolean;
  isError: boolean;
  emptyAction?: React.ReactNode;
}

export function SolutionGrid({ solutions, isLoading, isError, emptyAction }: Props) {
  if (isError) {
    return (
      <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-900">
        Failed to load solutions. Please refresh the page.
      </div>
    );
  }

  if (isLoading && (!solutions || solutions.length === 0)) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (!solutions || solutions.length === 0) {
    return (
      <EmptyState
        title="No solutions match"
        description="Try clearing the filters or add a new solution."
        action={emptyAction}
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {solutions.map((s) => (
        <li key={s.id}>
          <Link
            to={`/solutions/${s.id}/edit`}
            className={clsx(
              'block rounded-md border border-midnight-200 bg-white p-4 shadow-sm transition-shadow',
              'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-midnight-900">{s.name}</p>
              <span
                className={clsx(
                  'rounded-full px-2 py-0.5 text-xs font-semibold',
                  s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-midnight-100 text-midnight-700',
                )}
              >
                {s.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="mt-1 text-xs text-midnight-600">{humanizeCategory(s.category)}</p>
            {s.description ? (
              <p className="mt-2 line-clamp-3 text-sm text-midnight-800">{s.description}</p>
            ) : null}
            {s.typical_duration ? (
              <p className="mt-2 text-xs text-midnight-600">Duration: {s.typical_duration}</p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
