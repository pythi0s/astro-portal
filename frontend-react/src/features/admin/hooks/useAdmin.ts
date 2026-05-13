import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createUser,
  deactivateUser,
  getAdminStats,
  getUser,
  listUsers,
  updateUser,
  type UserListParams,
} from '../api';
import { adminKeys } from '../queryKeys';

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: getAdminStats,
    staleTime: 30_000,
  });
}

export function useUserList(params: UserListParams) {
  return useQuery({
    queryKey: adminKeys.userList(params as Record<string, unknown>),
    queryFn: () => listUsers(params),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useUser(id: number | undefined) {
  return useQuery({
    queryKey: id ? adminKeys.userDetail(id) : adminKeys.users(),
    queryFn: () => getUser(id as number),
    enabled: id !== undefined && Number.isFinite(id),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createUser(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users() });
      qc.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

export function useUpdateUser(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateUser(id, payload),
    onSuccess: (user) => {
      qc.setQueryData(adminKeys.userDetail(id), user);
      qc.invalidateQueries({ queryKey: adminKeys.users() });
      qc.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}
