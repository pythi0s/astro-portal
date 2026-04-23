import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

export function TopBar() {
  const { user, isAuthenticated, isBooting, logout } = useAuth();
  const navigate = useNavigate();

  // Hide the top bar on the login page and during boot to keep the initial paint calm.
  if (isBooting || !isAuthenticated || !user) return null;

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="border-b border-midnight-900/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-base font-semibold text-midnight-900">
          Astro Portal
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-midnight-700">
            {user.full_name || user.email}
            <span className="ml-1 rounded-full bg-midnight-700/10 px-2 py-0.5 text-xs font-medium text-midnight-800">
              {user.role}
            </span>
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-md border border-midnight-700/20 bg-white px-3 py-1.5 text-sm font-medium text-midnight-800 hover:bg-midnight-700/5"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
