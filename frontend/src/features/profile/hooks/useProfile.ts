import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { changePassword, updateProfile } from '../api';

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateProfile(payload),
    onSuccess: (user) => {
      setUser(user);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}
