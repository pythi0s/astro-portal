/**
 * Centralised query-key factory so cache invalidations are type-safe and
 * grep-able. Never inline `['customers', ...]` arrays elsewhere.
 */
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: number) => [...customerKeys.details(), id] as const,
  visits: (id: number) => [...customerKeys.all, 'visits', id] as const,
  solutions: (id: number) => [...customerKeys.all, 'solutions', id] as const,
  timeline: (id: number) => [...customerKeys.all, 'timeline', id] as const,
};
