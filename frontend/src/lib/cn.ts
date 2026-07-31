import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names deterministically.
 *
 * Combines `clsx` (conditional class composition) with `tailwind-merge`
 * (last-wins conflict resolution across Tailwind utility classes).
 *
 * Prefer this over raw `clsx` in UI primitives so that overrides passed via
 * `className` reliably win against internal defaults.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
