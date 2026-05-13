export type Role = 'admin' | 'astrologer' | 'receptionist';

export const ALL_ROLES: readonly Role[] = ['admin', 'astrologer', 'receptionist'] as const;

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ALL_ROLES as readonly string[]).includes(value);
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface UserSnapshot {
  id: number;
  email: string;
  full_name: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  status: number;
  detail: string;
}
