import { cn } from '@/lib/cn';
import { MoonIcon, SunIcon } from '@/components/icons';
import { nextPreference, useThemeStore, type ThemePreference } from '@/lib/theme';

const LABEL: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
};

export function ThemeSwitcher({ className }: { className?: string }) {
  const preference = useThemeStore((s) => s.preference);
  const cycle = useThemeStore((s) => s.cycle);

  const Icon = preference === 'dark' ? MoonIcon : SunIcon;
  const label = `Theme: ${LABEL[preference]}. Switch to ${LABEL[nextPreference(preference)]}`;

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
    </button>
  );
}
