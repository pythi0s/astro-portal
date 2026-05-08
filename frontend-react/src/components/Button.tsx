import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shown when `disabled` — rendered as `title` attribute and `aria-describedby`. */
  disabledReason?: string;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-saffron-400 to-saffron-500 text-deep-900 font-semibold shadow-md hover:from-saffron-500 hover:to-saffron-600 focus-visible:ring-saffron-400',
  secondary: 'border border-violet-200 bg-white/70 backdrop-blur-sm text-violet-800 hover:bg-violet-50 focus-visible:ring-violet-400',
  ghost: 'text-midnight-800 hover:bg-midnight-700/5 focus-visible:ring-primary-500',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-400',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-sm',
  md: 'px-3 py-1.5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'secondary', size = 'md', disabled, disabledReason, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={rest.type ?? 'button'}
      disabled={disabled}
      title={disabled && disabledReason ? disabledReason : undefined}
      aria-disabled={disabled ? 'true' : undefined}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

export function LinkButton({
  href,
  variant = 'secondary',
  size = 'md',
  children,
  className,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
    >
      {children}
    </a>
  );
}
