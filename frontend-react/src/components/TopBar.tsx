import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '@/auth/useAuth';
import { RoleGate } from '@/components/RoleGate';
import { humanizeEnum } from '@/lib/format';

export function TopBar() {
  const { user, isAuthenticated, isBooting, logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setShowConfirm(false);
    }
  }, [isAuthenticated, user]);

  if (isBooting || !isAuthenticated || !user) return null;

  function onLogout() {
    setShowConfirm(false);
    logout();
    navigate('/login', { replace: true });
  }

  const displayName = user.full_name?.trim() || user.email;
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <header
      className="sticky top-0 z-40 border-b border-slate-200/80 shadow-md"
      style={{ background: 'linear-gradient(135deg, #fffdf5 0%, #fef9e7 45%, #fef3c7 75%, #fde68a 100%)' }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-base font-bold tracking-wide transition-colors"
            style={{ color: '#1f2937' }}
          >
            <img
              src="/logo.png"
              alt="व्यंकटेश प्रतिष्ठाण"
              className="h-14 w-auto object-contain sm:h-16"
            />
            व्यंकटेश प्रतिष्ठाण
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
            title={displayName}
            className="group flex items-center justify-center rounded-full border border-amber-400/60 bg-gradient-to-br from-amber-200 to-amber-400 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{ width: 38, height: 38 }}
          >
            <span
              aria-hidden="true"
              className="text-sm font-bold text-amber-900"
            >
              {avatarInitial}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="btn-glass rounded-xl border border-red-300/70 bg-gradient-to-r from-red-100 via-red-200 to-red-100 px-3.5 py-1.5 text-sm font-semibold text-red-700 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            Sign out
          </button>
          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <div className="rounded-2xl border border-red-200/80 bg-white p-6 shadow-2xl ring-1 ring-red-100 w-72 text-center">
                <p className="mb-1 text-lg font-semibold text-slate-800">Sign out?</p>
                <p className="mb-5 text-sm text-slate-500">You will be returned to the login screen.</p>
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({ color: isActive ? '#451a03' : '#78350f' })}
      className={({ isActive }) =>
        clsx(
          'rounded-md px-2.5 py-1 text-sm font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300',
          isActive
            ? 'bg-amber-400/80 !text-amber-950 shadow-sm ring-1 ring-amber-500/50 font-semibold'
            : '!text-amber-900 visited:!text-amber-900 hover:!text-amber-950 hover:bg-amber-200/60',
        )
      }
    >
      {label}
    </NavLink>
  );
}
