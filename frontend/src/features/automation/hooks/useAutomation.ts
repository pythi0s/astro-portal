import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAutomationRule,
  deactivateAutomationRule,
  getAutomationRule,
  listAutomationRules,
  listAutomationRuns,
  updateAutomationRule,
} from '../api';
import { automationKeys } from '../queryKeys';

export function useAutomationRules() {
  return useQuery({
    queryKey: automationKeys.rules(),
    queryFn: listAutomationRules,
    staleTime: 15_000,
  });
}

export function useAutomationRule(id: number) {
  return useQuery({
    queryKey: automationKeys.rule(id),
    queryFn: () => getAutomationRule(id),
    enabled: Number.isFinite(id),
  });
}

export function useAutomationRuns(ruleId?: number) {
  return useQuery({
    queryKey: automationKeys.runList(ruleId),
    queryFn: () => listAutomationRuns(ruleId),
    refetchInterval: 30_000,
  });
}

export function useCreateAutomationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createAutomationRule(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: automationKeys.rules() }),
  });
}

export function useUpdateAutomationRule(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateAutomationRule(id, payload),
    onSuccess: (rule) => {
      queryClient.setQueryData(automationKeys.rule(id), rule);
      queryClient.invalidateQueries({ queryKey: automationKeys.rules() });
    },
  });
}

export function useDeactivateAutomationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateAutomationRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: automationKeys.all }),
  });
}
