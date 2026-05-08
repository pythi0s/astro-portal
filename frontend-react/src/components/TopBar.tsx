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
    <header
      className="sticky top-0 z-40 border-b border-violet-900/30 shadow-md"
      style={{ background: 'linear-gradient(135deg, #1A0A2E 0%, #2d1555 50%, #3d1f70 100%)' }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-base font-bold tracking-wide transition-colors"
            style={{ color: "#fcd34d" }}
          >
            <span aria-hidden="true" className="text-xl">✦</span>
            Astro Portal
          </Link>
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-1 text-sm">
            <NavItem to="/dashboard"    label="Dashboard" />
            <NavItem to="/customers"   label="Customers" />
            <NavItem to="/visits"      label="Visits" />
            <NavItem to="/solutions"   label="Solutions" />
            <NavItem to="/messages/send" label="Messages" />
            <NavItem to="/templates"   label="Templates" />
            <RoleGate allow={['admin']}>
              <NavItem to="/admin/users" label="Admin" />
            </RoleGate>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link
            to="/profile"
            className="rounded-md px-2 py-1 hover:bg-violet-700/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400"
            style={{ color: "#ffffff" }}
          >
            {user.full_name || user.email}
            <span className="ml-2 rounded-full bg-saffron-500/20 border border-saffron-400/30 px-2 py-0.5 text-xs font-medium"
              style={{ color: "#fde68a" }}>
              {humanizeEnum(user.role)}
            </span>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-md border border-cream-200/20 bg-white/5 px-3 py-1.5 text-sm font-medium hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400"
            style={{ color: "#ffffff" }}
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
      style={({ isActive }) => ({ color: isActive ? "#fcd34d" : "#ffffff" })}
      className={({ isActive }) =>
        clsx(
          'rounded-md px-2.5 py-1 text-sm font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400',
          isActive
            ? 'bg-violet-700/80 !text-gold-200 shadow-sm ring-1 ring-gold-400/50'
            : '!text-white visited:!text-white hover:!text-yellow-200 hover:bg-violet-700/40',
        )
      }
    >
      {label}
    </NavLink>
  );
}
