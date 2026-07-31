import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

/**
 * Sheet — a portal-rendered, edge-anchored slide-in panel.
 *
 * Chosen over a full `Dialog` primitive here because our current UX need is
 * predominantly mobile navigation and filter drawers.  Sheets can be swapped
 * for a Radix `Dialog` later without changing consumer call-sites — the API
 * intentionally mirrors Radix's mental model (open/onOpenChange, side, size).
 *
 * A11y notes:
 *  - Rendered with `role="dialog"` + `aria-modal="true"`.
 *  - Escape and backdrop click both close.
 *  - Focus is moved to the panel on open and restored to the previously
 *    focused element on close.
 *  - Body scroll is locked while open.
 */

export type SheetSide = 'left' | 'right' | 'top' | 'bottom';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: SheetSide;
  /** Accessible label for the dialog.  Rendered visually as the header title. */
  title?: string;
  /** Optional short subtitle rendered beneath the title. */
  description?: string;
  children: ReactNode;
  /** Extra classes for the panel surface. */
  className?: string;
}

const sideClasses: Record<SheetSide, string> = {
  left: 'inset-y-0 left-0 h-full w-[85vw] max-w-sm border-r',
  right: 'inset-y-0 right-0 h-full w-[85vw] max-w-sm border-l',
  top: 'inset-x-0 top-0 w-full max-h-[85vh] border-b',
  bottom: 'inset-x-0 bottom-0 w-full max-h-[85vh] border-t',
};

const enterAnim: Record<SheetSide, string> = {
  left: 'animate-[sheet-in-left_180ms_ease-out]',
  right: 'animate-[sheet-in-right_180ms_ease-out]',
  top: 'animate-[sheet-in-top_180ms_ease-out]',
  bottom: 'animate-[sheet-in-bottom_180ms_ease-out]',
};

export function Sheet({
  open,
  onClose,
  side = 'right',
  title,
  description,
  children,
  className,
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    // Defer focus to next frame so the panel is mounted.
    const raf = window.requestAnimationFrame(() => {
      panelRef.current?.focus();
    });
    document.addEventListener('keydown', handleKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = originalOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, handleKey]);

  if (!open) return null;

  const content = (
    <div
      className="fixed inset-0 z-[70] flex"
      aria-hidden={false}
    >
      <button
        type="button"
        aria-label="Close overlay"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50 backdrop-blur-sm animate-[sheet-fade_150ms_ease-out]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'fixed z-[71] flex flex-col bg-white shadow-2xl outline-none border-slate-200',
          'dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100',
          sideClasses[side],
          enterAnim[side],
          className,
        )}
      >
        {(title || description) && (
          <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            {title && (
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                {description}
              </p>
            )}
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
