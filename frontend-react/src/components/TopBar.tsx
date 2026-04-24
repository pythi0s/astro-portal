import { Link, NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '@/auth/useAuth';
import { RoleGate } from '@/components/RoleGate';
import { humanizeEnum } from '@/lib/format';

export function TopBar() {
  const { user, isAuthenticated, isBooting, logout } = useAuth();
  const navigate = useNavigate();

  if (isBooting || !isAuthenticated || !user) return null;

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="border-b border-midnight-900/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-base font-semibold text-midnight-900">
            Astro Portal
          </Link>
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-1 text-sm">
            <NavItem to="/dashboard" label="Dashboard" />
            <NavItem to="/customers" label="Customers" />
            <NavItem to="/visits" label="Visits" />
            <NavItem to="/solutions" label="Solutions" />
            <NavItem to="/messages/send" label="Messages" />
            <NavItem to="/templates" label="Templates" />
            <RoleGate allow={['admin']}>
              <NavItem to="/admin/users" label="Admin" />
            </RoleGate>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link
            to="/profile"
            className="rounded-md px-2 py-1 text-midnight-700 hover:bg-midnight-700/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {user.full_name || user.email}
            <span className="ml-1 rounded-full bg-midnight-700/10 px-2 py-0.5 text-xs font-medium text-midnight-800">
              {humanizeEnum(user.role)}
            </span>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-md border border-midnight-700/20 bg-white px-3 py-1.5 text-sm font-medium text-midnight-800 hover:bg-midnight-700/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          isActive ? 'bg-midnight-900 text-white' : 'text-midnight-800 hover:bg-midnight-900/5',
        )
      }
    >
      {label}
    </NavLink>
  );
}
