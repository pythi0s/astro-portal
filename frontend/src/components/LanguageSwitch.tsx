import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import { cn } from '@/lib/cn';

/**
 * Two-state language switch (en ↔ hi) rendered as a compact pill button.
 *
 * The button shows the *other* language's short code (e.g. displays "हि"
 * when the current language is `en`) so that clicking it makes visual sense
 * ("switch to this").
 */

const LABELS: Record<SupportedLanguage, { short: string; full: string }> = {
  en: { short: 'EN', full: 'English' },
  hi: { short: 'हि', full: 'हिन्दी' },
};

function nextLanguage(current: string): SupportedLanguage {
  const idx = SUPPORTED_LANGUAGES.indexOf(current as SupportedLanguage);
  if (idx === -1) return SUPPORTED_LANGUAGES[0];
  return SUPPORTED_LANGUAGES[(idx + 1) % SUPPORTED_LANGUAGES.length];
}

export function LanguageSwitch({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'en') as SupportedLanguage;
  const next = nextLanguage(current);
  const label = `Switch language to ${LABELS[next].full}`;
  return (
    <button
      type="button"
      onClick={() => void i18n.changeLanguage(next)}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-xs font-semibold transition-colors',
        'border-amber-300/60 bg-white/70 text-amber-800 backdrop-blur-sm',
        'hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
        'dark:border-violet-600/60 dark:bg-slate-800/70 dark:text-amber-300 dark:hover:bg-slate-800',
        className,
      )}
    >
      {LABELS[next].short}
    </button>
  );
}
