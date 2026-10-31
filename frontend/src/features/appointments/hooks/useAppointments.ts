import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listAppointments, updateAppointment, type AppointmentListParams } from '../api';
import { appointmentKeys } from '../queryKeys';
import type { AppointmentStatus } from '../types';

export function useAppointmentList(params: AppointmentListParams, enabled = true) {
  return useQuery({
    queryKey: appointmentKeys.list(params as Record<string, unknown>),
    queryFn: () => listAppointments(params),
    enabled,
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: AppointmentStatus }) =>
      updateAppointment(id, { status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}
