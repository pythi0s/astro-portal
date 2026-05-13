import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthProvider';
import { TopBar } from '@/components/TopBar';
import { useServerErrorToast } from '@/hooks/useServerErrorToast';

export function AppShell() {
  useServerErrorToast();

  return (
    <AuthProvider>
      <div className="mandala-bg min-h-screen">
        <TopBar />
        <Outlet />
      </div>
    </AuthProvider>
  );
}
