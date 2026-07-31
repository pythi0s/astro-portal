import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * Design-system Button.
 *
 * The public API (`variant`, `size`, `disabled`, `disabledReason`, forwardRef,
 * plus the `LinkButton` sibling) is preserved from the pre-cva version so no
 * consumer needs to change.  Variants are now declared with
 * `class-variance-authority` so `Button` and `LinkButton` share a single
 * source of truth.
 */
const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ),
  {
    variants: {
      variant: {
        primary: cn(
          'btn-glass relative overflow-hidden',
          'bg-gradient-to-r from-saffron-400 to-saffron-500 text-deep-900 font-semibold shadow-md',
          'hover:from-saffron-500 hover:to-saffron-600 focus-visible:ring-saffron-400',
        ),
        secondary: cn(
          'btn-glass relative overflow-hidden',
          'border border-violet-200 bg-white/70 backdrop-blur-sm text-violet-800',
          'hover:bg-violet-50 focus-visible:ring-violet-400',
        ),
        ghost: 'text-midnight-800 hover:bg-midnight-700/5 focus-visible:ring-primary-500',
        danger: cn(
          'btn-glass relative overflow-hidden',
          'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-400',
        ),
      },
      size: {
        sm: 'px-2.5 py-1 text-sm',
        md: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export type ButtonVariant = NonNullable<ButtonVariantProps['variant']>;
export type ButtonSize = NonNullable<ButtonVariantProps['size']>;

interface Props extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {
  disabledReason?: string;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant, size, disabled, disabledReason, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={rest.type ?? 'button'}
      disabled={disabled}
      title={disabled && disabledReason ? disabledReason : undefined}
      aria-disabled={disabled ? 'true' : undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...rest}
    >
      {children}
    </button>
  );
});

export function LinkButton({
  href,
  variant,
  size,
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
    <a href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </a>
  );
}
