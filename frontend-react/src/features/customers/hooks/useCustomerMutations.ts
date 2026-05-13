import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCustomer,
  deactivateCustomer,
  updateCustomer,
  uploadKundali,
  uploadPhoto,
} from '../api';
import type { Customer } from '../types';
import { customerKeys } from '../queryKeys';

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createCustomer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useUpdateCustomer(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateCustomer(id, payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: customerKeys.detail(id) });
      const prev = qc.getQueryData<Customer>(customerKeys.detail(id));
      if (prev) {
        qc.setQueryData<Customer>(customerKeys.detail(id), { ...prev, ...payload } as Customer);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(customerKeys.detail(id), ctx.prev);
      }
    },
    onSuccess: (data) => {
      // PUT returns the slim CustomerRead (no `visits`/`customer_solutions`),
      // so merge into the cached detail to keep the eager-loaded relationships
      // populated by GET /customers/{id}.
      qc.setQueryData<Customer>(customerKeys.detail(id), (prev) =>
        prev ? { ...prev, ...data } : data,
      );
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useDeactivateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateCustomer(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      qc.invalidateQueries({ queryKey: customerKeys.detail(id) });
    },
  });
}

export function useUploadPhoto(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadPhoto(id, file),
    onSuccess: (data) => {
      qc.setQueryData<Customer>(customerKeys.detail(id), (prev) =>
        prev ? { ...prev, ...data } : data,
      );
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useUploadKundali(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadKundali(id, file),
    onSuccess: (data) => {
      qc.setQueryData<Customer>(customerKeys.detail(id), (prev) =>
        prev ? { ...prev, ...data } : data,
      );
    },
  });
}
