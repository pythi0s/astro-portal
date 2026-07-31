import { useQuery } from '@tanstack/react-query';
import { getRevenueStats } from '@/api/dashboard';
import type { DateRange } from '@/features/dashboard/types';
import { previousWindow } from '@/features/dashboard/lib/range';

export function useRevenueStats(range: DateRange) {
  return useQuery({
    queryKey: ['dashboard', 'revenue', range.from, range.to],
    queryFn: ({ signal }) => getRevenueStats(range, { signal }),
    staleTime: 60_000,
  });
}

/**
 * Previous-equal-length window. Used to compute KPI deltas. Separate query so
 * it has its own loading state and doesn't block the primary number from
 * rendering while the delta is still computing.
 */
export function usePreviousRevenueStats(range: DateRange) {
  const prev = previousWindow(range);
  return useQuery({
    queryKey: ['dashboard', 'revenue', 'previous', prev.from, prev.to],
    queryFn: ({ signal }) => getRevenueStats(prev, { signal }),
    staleTime: 5 * 60_000,
  });
}
