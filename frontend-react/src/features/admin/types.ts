import type { Role, User } from '@/types/api';

export type { Role, User };

export interface AdminStats {
  total_users: number;
  active_users: number;
  admin_count: number;
}
