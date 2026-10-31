import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { DashboardOverview } from './types';

export async function getOverview(): Promise<DashboardOverview> {
  const { data } = await apiClient.get<DashboardOverview>('/dashboard/overview');
  return data;
}

export function useOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: getOverview,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
