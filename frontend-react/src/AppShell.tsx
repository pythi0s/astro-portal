import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthProvider';
import { TopBar } from '@/components/TopBar';

export function AppShell() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <TopBar />
        <Outlet />
      </div>
    </AuthProvider>
  );
}
