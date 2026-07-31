/**
 * Locale- and currency-aware formatting helpers.
 *
 * Money is NEVER rendered with string concatenation or a hardcoded currency
 * symbol in the codebase. Every number-to-text conversion for money goes
 * through `formatMoney` so that changing `VITE_CURRENCY` flips the whole UI.
 *
 * Promoted from `features/dashboard/lib/format.ts` in Step 5 so the feature
 * pages (customers, visits, etc.) can share one source of truth.
 */

function getCurrency(): string {
  const v = (import.meta.env.VITE_CURRENCY as string | undefined)?.trim();
  return v && v.length === 3 ? v.toUpperCase() : 'INR';
}

function getLocale(): string {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }
  return 'en-IN';
}

/**
 * Parse a value that may arrive as a number, an integer-looking string, or a
 * Decimal-as-string ("1234.50"). Returns NaN only when the input is genuinely
 * non-numeric (null/undefined/""); callers decide how to render NaN.
 */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return Number.NaN;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  return Number.NaN;
}

export function formatMoney(value: unknown, opts?: { currency?: string; locale?: string }): string {
  const n = toNumber(value);
  const currency = opts?.currency ?? getCurrency();
  const locale = opts?.locale ?? getLocale();
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatInteger(value: unknown): string {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 }).format(n);
}

export function formatPercent(value: unknown, fractionDigits = 1): string {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(fractionDigits)}%`;
}

/**
 * Delta as a percentage. Returns undefined when previous is 0 or missing so
 * callers render an em-dash instead of Infinity/NaN.
 */
export function deltaPercent(current: number, previous: number | undefined): number | undefined {
  if (previous === undefined || !Number.isFinite(previous) || previous === 0) return undefined;
  if (!Number.isFinite(current)) return undefined;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function formatDeltaLabel(delta: number | undefined): string {
  if (delta === undefined) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const source = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso;
  const d = new Date(source);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(getLocale(), opts ?? { dateStyle: 'medium' }).format(d);
}

export function formatDateTime(iso: string): string {
  return formatDate(iso, { dateStyle: 'medium', timeStyle: 'short' });
}

/** Convert a Date to ISO YYYY-MM-DD in the user's local time zone. */
export function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Human label for a snake_case or __marker__ value. */
export function humanizeCategory(value: string): string {
  if (value === '__unassigned__') return 'Unassigned';
  const spaced = value.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Turn a snake_case enum value into a human sentence-case label.
 * "first_visit" -> "First visit", "follow_up" -> "Follow up".
 */
export function humanizeEnum(value: string | null | undefined): string {
  if (!value) return '—';
  return humanizeCategory(value);
}
