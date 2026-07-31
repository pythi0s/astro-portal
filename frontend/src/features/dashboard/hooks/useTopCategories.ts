import { useQuery } from '@tanstack/react-query';
import { getRevenueByCategory } from '@/api/dashboard';
import type { DateRange } from '@/features/dashboard/types';

export function useTopCategories(range: DateRange) {
  return useQuery({
    queryKey: ['dashboard', 'revenue-by-category', range.from, range.to],
    queryFn: ({ signal }) => getRevenueByCategory(range, { signal }),
    staleTime: 60_000,
  });
}
