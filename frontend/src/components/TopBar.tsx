import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useAuth } from '@/auth/useAuth';
import { RoleGate } from '@/components/RoleGate';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { Sheet } from '@/components/ui/Sheet';
import { useConfirm } from '@/components/ConfirmProvider';
import { humanizeEnum } from '@/lib/format';

export function TopBar() {
  const { user, isAuthenticated, isBooting, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const confirm = useConfirm();
  const { t } = useTranslation();

  if (isBooting || !isAuthenticated || !user) return null;

  async function onLogout() {
    const ok = await confirm({
      title: t('app.signOutConfirmTitle'),
      description: t('app.signOutConfirmBody'),
      confirmLabel: t('app.signOut'),
      cancelLabel: t('app.cancel'),
      danger: true,
    });
    if (!ok) return;
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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 text-sm font-bold tracking-wide transition-colors sm:text-base"
            style={{ color: '#1f2937' }}
          >
            <img
              src="/vynkatesh_pratishthan_logo.png"
              alt="व्यंकटेश प्रतिष्ठाण"
              className="h-9 w-auto object-contain sm:h-10"
            />
            व्यंकटेश प्रतिष्ठाण
          </Link>
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label={t('app.openMenu')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-amber-300/60 bg-white/70 text-amber-800 backdrop-blur-sm hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 md:hidden dark:border-violet-600/60 dark:bg-slate-800/70 dark:text-amber-300 dark:hover:bg-slate-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <nav aria-label="Primary" className="hidden md:flex flex-wrap items-center gap-1 text-sm">
            <NavItem to="/dashboard" label={t('nav.dashboard')} />
            <NavItem to="/customers" label={t('nav.customers')} />
            <NavItem to="/visits" label={t('nav.visits')} />
            <NavItem to="/solutions" label={t('nav.solutions')} />
            <NavItem to="/messages/send" label={t('nav.messages')} />
            <NavItem to="/templates" label={t('nav.templates')} />
            <RoleGate allow={['admin']}>
              <NavItem to="/admin/users" label={t('nav.admin')} />
            </RoleGate>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <LanguageSwitch />
          <ThemeToggle />
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
            onClick={onLogout}
            className="btn-glass rounded-xl border border-red-300/70 bg-gradient-to-r from-red-100 via-red-200 to-red-100 px-3.5 py-1.5 text-sm font-semibold text-red-700 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            {t('app.signOut')}
          </button>
        </div>
      </div>
      <Sheet
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        side="left"
        title={t('app.menu')}
      >
        <nav
          aria-label="Primary mobile"
          className="flex flex-col gap-1 p-3 text-sm"
          onClick={() => setMobileNavOpen(false)}
        >
          <NavItem to="/dashboard" label={t('nav.dashboard')} />
          <NavItem to="/customers" label={t('nav.customers')} />
          <NavItem to="/visits" label={t('nav.visits')} />
          <NavItem to="/solutions" label={t('nav.solutions')} />
          <NavItem to="/messages/send" label={t('nav.messages')} />
          <NavItem to="/templates" label={t('nav.templates')} />
          <RoleGate allow={['admin']}>
            <NavItem to="/admin/users" label={t('nav.admin')} />
          </RoleGate>
        </nav>
      </Sheet>
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
