import { apiClient } from '@/api/client';
import type {
  DateRange,
  EarningsSummary,
  Granularity,
  RevenueByCategory,
  RevenueSummary,
  VisitSummary,
} from '@/features/dashboard/types';

interface GetOpts {
  signal?: AbortSignal;
}

export async function getRevenueStats(range: DateRange, opts: GetOpts = {}): Promise<RevenueSummary> {
  const { data } = await apiClient.get<RevenueSummary>('/dashboard/revenue', {
    params: { from: range.from, to: range.to },
    signal: opts.signal,
  });
  return data;
}

export async function getEarnings(
  params: { period: Granularity; days: number },
  opts: GetOpts = {},
): Promise<EarningsSummary> {
  const { data } = await apiClient.get<EarningsSummary>('/dashboard/earnings', {
    params,
    signal: opts.signal,
  });
  return data;
}

export async function getRevenueByCategory(
  range: DateRange,
  opts: GetOpts = {},
): Promise<RevenueByCategory> {
  const { data } = await apiClient.get<RevenueByCategory>('/dashboard/revenue-by-category', {
    params: { from: range.from, to: range.to },
    signal: opts.signal,
  });
  return data;
}

export async function getRecentVisits(
  range: DateRange,
  opts: GetOpts & { limit?: number } = {},
): Promise<VisitSummary[]> {
  const { data } = await apiClient.get<VisitSummary[]>('/visits/', {
    params: {
      date_from: range.from,
      date_to: range.to,
      limit: opts.limit ?? 10,
    },
    signal: opts.signal,
  });
  return data;
}
