import { apiClient, registerRefreshHandler } from '@/api/client';
import type { LoginRequest, TokenResponse, User } from '@/types/api';

export async function login(body: LoginRequest): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>('/auth/login', body);
  return res.data;
}

export async function refresh(): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>('/auth/refresh');
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>('/auth/me');
  return res.data;
}

// Register the refresh implementation with the axios client.
// This indirection avoids a circular import between client.ts and auth.ts.
registerRefreshHandler(async () => {
  const res = await refresh();
  return res.access_token;
});
