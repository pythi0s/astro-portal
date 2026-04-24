import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createVisit,
  deactivateVisit,
  getVisit,
  listVisits,
  updateVisit,
  type VisitListParams,
} from '../api';
import { visitKeys } from '../queryKeys';
import { customerKeys } from '@/features/customers/queryKeys';

export function useVisitList(params: VisitListParams) {
  return useQuery({
    queryKey: visitKeys.list(params as Record<string, unknown>),
    queryFn: () => listVisits(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useVisit(id: number | undefined) {
  return useQuery({
    queryKey: id ? visitKeys.detail(id) : visitKeys.details(),
    queryFn: () => getVisit(id as number),
    enabled: id !== undefined && Number.isFinite(id),
  });
}

export function useCreateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createVisit(payload),
    onSuccess: (visit) => {
      qc.invalidateQueries({ queryKey: visitKeys.lists() });
      qc.invalidateQueries({ queryKey: customerKeys.visits(visit.customer_id) });
      qc.invalidateQueries({ queryKey: customerKeys.timeline(visit.customer_id) });
    },
  });
}

export function useUpdateVisit(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateVisit(id, payload),
    onSuccess: (visit) => {
      qc.setQueryData(visitKeys.detail(id), (old: unknown) => {
        if (old && typeof old === 'object') {
          return { ...(old as object), ...visit };
        }
        return visit;
      });
      qc.invalidateQueries({ queryKey: visitKeys.lists() });
      qc.invalidateQueries({ queryKey: customerKeys.visits(visit.customer_id) });
      qc.invalidateQueries({ queryKey: customerKeys.timeline(visit.customer_id) });
    },
  });
}

export function useDeactivateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateVisit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: visitKeys.all });
      qc.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}
