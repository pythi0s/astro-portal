import { apiClient } from '@/api/client';
import type { User } from '@/types/api';

export async function updateProfile(body: Record<string, unknown>): Promise<User> {
  const { data } = await apiClient.put<User>('/auth/me', body);
  return data;
}

export async function changePassword(body: {
  current_password: string;
  new_password: string;
}): Promise<void> {
  await apiClient.post('/auth/change-password', body);
}
