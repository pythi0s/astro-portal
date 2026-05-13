import { useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import * as authApi from '@/api/auth';
import type { LoginRequest, Role, User } from '@/types/api';

export interface UseAuth {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isBooting: boolean;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: readonly Role[]) => boolean;
  login: (body: LoginRequest) => Promise<User>;
  logout: () => void;
}

export function useAuth(): UseAuth {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isBooting = useAuthStore((s) => s.isBooting);
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  const login = useCallback(
    async (body: LoginRequest): Promise<User> => {
      const { access_token } = await authApi.login(body);
      setToken(access_token);
      const me = await authApi.getMe();
      setUser(me);
      return me;
    },
    [setToken, setUser],
  );

  const logout = useCallback(() => {
    clear();
  }, [clear]);

  const hasRole = useCallback(
    (role: Role): boolean => user?.role === role,
    [user],
  );

  const hasAnyRole = useCallback(
    (roles: readonly Role[]): boolean => !!user && roles.includes(user.role),
    [user],
  );

  return {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isBooting,
    hasRole,
    hasAnyRole,
    login,
    logout,
  };
}
