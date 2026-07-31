import { apiClient } from '@/api/client';
import type { Role, User } from '@/types/api';
import type { AdminStats } from './types';

export interface UserListParams {
  role?: Role;
  is_active?: boolean;
}

export async function listUsers(params: UserListParams = {}): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/admin/users', { params });
  return data;
}

export async function getUser(id: number): Promise<User> {
  const { data } = await apiClient.get<User>(`/admin/users/${id}`);
  return data;
}

export async function createUser(body: Record<string, unknown>): Promise<User> {
  const { data } = await apiClient.post<User>('/admin/users', body);
  return data;
}

export async function updateUser(id: number, body: Record<string, unknown>): Promise<User> {
  const { data } = await apiClient.put<User>(`/admin/users/${id}`, body);
  return data;
}

export async function deactivateUser(id: number): Promise<{ detail: string }> {
  const { data } = await apiClient.delete<{ detail: string }>(`/admin/users/${id}`);
  return data;
}

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>('/admin/stats');
  return data;
}
