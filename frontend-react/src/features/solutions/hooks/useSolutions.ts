import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSolution,
  deactivateSolution,
  getSolution,
  listSolutions,
  updateSolution,
  type SolutionListParams,
} from '../api';
import { solutionKeys } from '../queryKeys';

export function useSolutionList(params: SolutionListParams) {
  return useQuery({
    queryKey: solutionKeys.list(params as Record<string, unknown>),
    queryFn: () => listSolutions(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useSolution(id: number | undefined) {
  return useQuery({
    queryKey: id ? solutionKeys.detail(id) : solutionKeys.details(),
    queryFn: () => getSolution(id as number),
    enabled: id !== undefined && Number.isFinite(id),
  });
}

export function useCreateSolution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createSolution(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: solutionKeys.lists() });
    },
  });
}

export function useUpdateSolution(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateSolution(id, payload),
    onSuccess: (saved) => {
      qc.setQueryData(solutionKeys.detail(id), saved);
      qc.invalidateQueries({ queryKey: solutionKeys.lists() });
    },
  });
}

export function useDeactivateSolution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateSolution(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: solutionKeys.all });
    },
  });
}
