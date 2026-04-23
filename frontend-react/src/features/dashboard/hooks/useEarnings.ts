import { useQuery } from '@tanstack/react-query';
import { getEarnings } from '@/api/dashboard';
import type { DateRange, Granularity } from '@/features/dashboard/types';
import { daysInRange } from '@/features/dashboard/lib/range';

export function useEarnings(range: DateRange, granularity: Granularity) {
  // /dashboard/earnings accepts `days`, not from/to. Convert the range into
  // a `days` value (inclusive). The backend then re-derives a start_date of
  // today - days, which can overshoot the requested `from` by up to 1 day on
  // the edges — acceptable for the chart's visual trend.
  const days = Math.max(7, Math.min(365, daysInRange(range)));
  return useQuery({
    queryKey: ['dashboard', 'earnings', granularity, days],
    queryFn: ({ signal }) => getEarnings({ period: granularity, days }, { signal }),
    staleTime: 60_000,
  });
}
