import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listLogs, sendEmail, sendWhatsApp, type LogListParams } from '../api';
import { messageKeys } from '../queryKeys';

export function useMessageLog(params: LogListParams) {
  return useQuery({
    queryKey: messageKeys.log(params as Record<string, unknown>),
    queryFn: () => listLogs(params),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useSendEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendEmail,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.logs() });
    },
  });
}

export function useSendWhatsApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendWhatsApp,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.logs() });
    },
  });
}
