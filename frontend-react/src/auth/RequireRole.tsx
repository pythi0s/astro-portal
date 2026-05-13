import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { FullPageSpinner } from '@/components/FullPageSpinner';
import type { Role } from '@/types/api';

interface RequireRoleProps {
  allow: readonly Role[];
}

export function RequireRole({ allow }: RequireRoleProps) {
  const { user, isAuthenticated, isBooting } = useAuth();
  const location = useLocation();

  if (isBooting) {
    return <FullPageSpinner label="Checking permissions" />;
  }

  if (!isAuthenticated || !user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (!allow.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
