import { useEffect, useRef, type ReactNode } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { CalendarIcon, CalendarPlusIcon, LogoutIcon, UsersIcon } from '@/components/icons';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { usePortalAuthStore } from './store';
import { portalMe } from './api';

export function PortalShell() {
  const account = usePortalAuthStore((s) => s.account);
  const isBooting = usePortalAuthStore((s) => s.isBooting);
  const clear = usePortalAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const bootRef = useRef(false);

  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    const store = usePortalAuthStore.getState();
    if (!store.token || store.account) {
      store.setBooting(false);
      return;
    }
    portalMe()
      .then((me) => store.setAccount(me))
      .catch(() => store.clear())
      .finally(() => store.setBooting(false));
  }, []);

  function signOut() {
    clear();
    navigate('/portal/login', { replace: true });
  }

  const initials = account
    ? account.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join('')
    : '';

  return (
    <div className="mandala-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-amber-200/70 bg-gradient-to-r from-cream-50/95 via-saffron-50/95 to-amber-100/95 shadow-[0_6px_24px_-12px_rgba(146,64,14,0.35)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/portal" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-amber-100 to-white shadow-inner ring-1 ring-amber-300/70">
              <BrandLogo className="h-8 w-8" priority />
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="whitespace-nowrap text-[17px] font-extrabold tracking-tight text-amber-950">
                व्यंकटेश प्रतिष्ठाण
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700/80">
                Book a visit with Guruji
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <ThemeSwitcher />
            {account ? (
              <>
                <nav aria-label="Portal" className="hidden items-center gap-0.5 rounded-full border border-amber-200/80 bg-white/60 p-1 shadow-inner md:flex">
                  <PortalNavItem to="/portal/appointments" label="My appointments" icon={<CalendarIcon className="h-4 w-4" />} />
                  <PortalNavItem to="/portal/book" label="Book" icon={<CalendarPlusIcon className="h-4 w-4" />} />
                  <PortalNavItem to="/portal/profile" label="My profile" icon={<UsersIcon className="h-4 w-4" />} />
                </nav>
                <Link
                  to="/portal/profile"
                  title={account.phone}
                  className="flex items-center gap-2 rounded-full border border-amber-300/60 bg-white/80 py-1 pl-1 pr-1 shadow-sm sm:pr-3"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white shadow"
                  >
                    {initials}
                  </span>
                  <span className="hidden max-w-[8rem] truncate text-xs font-semibold text-amber-950 sm:inline">
                    {account.name}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-rose-200 bg-white/80 px-3 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                >
                  <LogoutIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : !isBooting ? (
              <>
                <NavLink
                  to="/portal/login"
                  className={({ isActive }) =>
                    clsx(
                      'whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold sm:px-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                      isActive ? 'bg-amber-100 text-amber-950' : 'text-amber-900 hover:bg-amber-100/70',
                    )
                  }
                >
                  Sign in
                </NavLink>
                <NavLink
                  to="/portal/register"
                  className="btn-glass whitespace-nowrap rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-3 py-2 sm:px-4 text-sm font-semibold text-white shadow-md shadow-amber-500/30 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  Create account
                </NavLink>
              </>
            ) : null}
          </div>
        </div>
        {account ? (
          <nav aria-label="Portal mobile" className="flex gap-1 border-t border-amber-200/60 px-4 py-2 md:hidden">
            <PortalNavItem to="/portal/appointments" label="My appointments" icon={<CalendarIcon className="h-4 w-4" />} />
            <PortalNavItem to="/portal/book" label="Book" icon={<CalendarPlusIcon className="h-4 w-4" />} />
            <PortalNavItem to="/portal/profile" label="Profile" icon={<UsersIcon className="h-4 w-4" />} />
          </nav>
        ) : null}
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="border-t border-amber-200/60 bg-white/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-amber-900/70 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} व्यंकटेश प्रतिष्ठाण · All rights reserved</span>
          <span>Your details are private and only visible to Guruji and our staff.</span>
        </div>
      </footer>
    </div>
  );
}

function PortalNavItem({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
          isActive
            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md shadow-amber-500/30'
            : 'text-amber-900 hover:bg-amber-100/80',
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
