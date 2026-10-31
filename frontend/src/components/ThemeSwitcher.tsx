import clsx from 'clsx';
import { cn } from '@/lib/cn';
import { MonitorIcon, MoonIcon, SunIcon } from '@/components/icons';
import { nextPreference, useThemeStore, type ThemePreference } from '@/lib/theme';

const LABEL: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

export function ThemeSwitcher({ className }: { className?: string }) {
  const preference = useThemeStore((s) => s.preference);
  const resolved = useThemeStore((s) => s.resolved);
  const cycle = useThemeStore((s) => s.cycle);

  const Icon = preference === 'system' ? MonitorIcon : preference === 'dark' ? MoonIcon : SunIcon;
  const current = preference === 'system' ? `System (${resolved})` : LABEL[preference];
  const label = `Theme: ${current}. Switch to ${LABEL[nextPreference(preference)]}`;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      data-theme-preference={preference}
      className={cn(
        'relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300/60 bg-white/80 text-amber-800 shadow-sm transition hover:bg-amber-50 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
        className,
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
      {preference === 'system' ? (
        <span
          aria-hidden="true"
          className={clsx(
            'absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full ring-2 ring-white',
            resolved === 'dark' ? 'bg-violet-500' : 'bg-amber-400',
          )}
        />
      ) : null}
    </button>
  );
}
