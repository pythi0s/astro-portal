import { useQuery } from '@tanstack/react-query';
import { getRecentVisits } from '@/api/dashboard';
import type { DateRange } from '@/features/dashboard/types';

export function useRecentVisits(range: DateRange, limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'recent-visits', range.from, range.to, limit],
    queryFn: ({ signal }) => getRecentVisits(range, { signal, limit }),
    staleTime: 60_000,
  });
}
