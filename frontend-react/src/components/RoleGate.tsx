import type { ReactNode } from 'react';
import { useAuth } from '@/auth/useAuth';
import type { Role } from '@/types/api';

interface Props {
  allow: readonly Role[];
  /**
   * If true and the user lacks the role, render nothing (DOM-level hidden).
   * If false, render the fallback (default: null). Default: true.
   */
  hard?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Thin wrapper around `useAuth().hasAnyRole(...)` for DOM-level gating.
 *
 * Use this for nav links, admin-only panels, and role-gated action buttons
 * where the UI should not even appear in the DOM for unauthorized users.
 * For route-level gating, use `<RequireRole />` (which redirects to /403).
 *
 * This is a UX hint only — the server is still authoritative. Hiding a button
 * must never be the only safeguard on a mutation.
 */
export function RoleGate({ allow, hard = true, fallback = null, children }: Props) {
  const { hasAnyRole, isAuthenticated } = useAuth();
  if (!isAuthenticated || !hasAnyRole(allow)) {
    return hard ? <>{fallback}</> : null;
  }
  return <>{children}</>;
}
