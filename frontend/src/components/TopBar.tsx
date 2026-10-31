import { useState, type ComponentType, type SVGProps } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useAuth } from '@/auth/useAuth';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Sheet } from '@/components/ui/Sheet';
import { useConfirm } from '@/components/ConfirmProvider';
import {
  BoltIcon,
  CalendarIcon,
  ChatIcon,
  ClipboardIcon,
  DashboardIcon,
  GemIcon,
  LogoutIcon,
  MenuIcon,
  ShieldIcon,
  TemplateIcon,
  UsersIcon,
} from '@/components/icons';
import { humanizeEnum } from '@/lib/format';
import type { Role } from '@/types/api';

interface NavEntry {
  to: string;
  labelKey: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  roles?: readonly Role[];
}

const NAV: NavEntry[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: DashboardIcon },
  { to: '/customers', labelKey: 'nav.customers', icon: UsersIcon },
  { to: '/visits', labelKey: 'nav.visits', icon: ClipboardIcon },
  { to: '/appointments', labelKey: 'nav.appointments', icon: CalendarIcon },
  { to: '/solutions', labelKey: 'nav.solutions', icon: GemIcon, roles: ['admin', 'astrologer'] },
  { to: '/messages/send', labelKey: 'nav.messages', icon: ChatIcon, roles: ['admin', 'astrologer'] },
  { to: '/templates', labelKey: 'nav.templates', icon: TemplateIcon, roles: ['admin', 'astrologer'] },
  { to: '/admin/automation', labelKey: 'nav.automation', icon: BoltIcon, roles: ['admin'] },
  { to: '/admin/users', labelKey: 'nav.admin', icon: ShieldIcon, roles: ['admin'] },
];

export function TopBar() {
  const { user, isAuthenticated, isBooting, logout, hasAnyRole } = useAuth();
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

  const items = NAV.filter((n) => !n.roles || hasAnyRole(n.roles));
  const displayName = user.full_name?.trim() || user.email;
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-amber-200/70 bg-gradient-to-r from-cream-50/95 via-saffron-50/95 to-amber-100/95 shadow-[0_6px_24px_-12px_rgba(146,64,14,0.35)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label={t('app.openMenu')}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300/60 bg-white/80 text-amber-800 shadow-sm hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 xl:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <Link to="/dashboard" className="group flex shrink-0 items-center gap-2.5">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-amber-100 to-white shadow-inner ring-1 ring-amber-300/70">
              <BrandLogo className="h-8 w-8" priority />
            </span>
            <span className="hidden whitespace-nowrap text-[17px] font-extrabold tracking-tight text-amber-950 sm:block xl:hidden 2xl:block">
              व्यंकटेश प्रतिष्ठाण
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden min-w-0 flex-1 justify-center xl:flex">
            <ul className="flex items-center gap-0.5 rounded-full border border-amber-200/80 bg-white/60 p-1 shadow-inner">
              {items.map((item) => (
                <li key={item.to}>
                  <NavItem to={item.to} label={t(item.labelKey)} icon={item.icon} />
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <ThemeSwitcher />
            <Link
              to="/profile"
              title={displayName}
              className="flex items-center gap-2 rounded-full border border-amber-300/60 bg-white/80 py-1 pl-1 pr-1 shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 2xl:pr-3"
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white shadow"
              >
                {avatarInitial}
              </span>
              <span className="hidden flex-col leading-tight 2xl:flex">
                <span className="max-w-[9rem] truncate text-xs font-semibold text-amber-950">{displayName}</span>
                <span className="text-[11px] text-amber-800/80">{humanizeEnum(user.role)}</span>
              </span>
              <span className="sr-only">Profile</span>
            </Link>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-rose-200 bg-white/80 px-3 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              <LogoutIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('app.signOut')}</span>
            </button>
          </div>
        </div>
      </div>

      <Sheet open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} side="left" title={t('app.menu')}>
        <nav aria-label="Primary mobile" className="flex flex-col gap-1 p-3 text-sm">
          {items.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              label={t(item.labelKey)}
              icon={item.icon}
              block
              onNavigate={() => setMobileNavOpen(false)}
            />
          ))}
        </nav>
      </Sheet>
    </header>
  );
}

function NavItem({
  to,
  label,
  icon: IconCmp,
  block,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  block?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-1.5 whitespace-nowrap font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
          block ? 'rounded-lg px-3 py-2.5' : 'rounded-full px-3 py-1.5 text-[13px]',
          isActive
            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md shadow-amber-500/30'
            : 'text-amber-900 hover:bg-amber-100/80 hover:text-amber-950',
        )
      }
    >
      <IconCmp className={clsx('h-4 w-4 shrink-0', !block && 'hidden 2xl:block')} />
      {label}
    </NavLink>
  );
}
