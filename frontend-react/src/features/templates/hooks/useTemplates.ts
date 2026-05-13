import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTemplate,
  deactivateTemplate,
  listTemplates,
  updateTemplate,
  type TemplateListParams,
} from '../api';
import { templateKeys } from '../queryKeys';

export function useTemplateList(params: TemplateListParams) {
  return useQuery({
    queryKey: templateKeys.list(params as Record<string, unknown>),
    queryFn: () => listTemplates(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createTemplate(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.lists() }),
  });
}

export function useUpdateTemplate(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateTemplate(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.lists() }),
  });
}

export function useDeactivateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  });
}
