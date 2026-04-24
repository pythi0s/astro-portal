import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthProvider';
import { TopBar } from '@/components/TopBar';
import { useServerErrorToast } from '@/hooks/useServerErrorToast';

export function AppShell() {
  // Mount the global 403/5xx toast interceptor exactly once. The 401 refresh
  // interceptor is registered elsewhere (`api/client.ts`) and is independent.
  useServerErrorToast();

  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <TopBar />
        <Outlet />
      </div>
    </AuthProvider>
  );
}
