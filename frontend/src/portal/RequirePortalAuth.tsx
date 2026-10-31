import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullPageSpinner } from '@/components/FullPageSpinner';
import { usePortalAuthStore } from './store';

export function RequirePortalAuth() {
  const account = usePortalAuthStore((s) => s.account);
  const isBooting = usePortalAuthStore((s) => s.isBooting);
  const location = useLocation();

  if (isBooting) return <FullPageSpinner label="Loading your account" />;
  if (!account) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/portal/login?next=${next}`} replace />;
  }
  return <Outlet />;
}
