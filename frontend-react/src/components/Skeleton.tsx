import clsx from 'clsx';

interface Props {
  className?: string;
  /** Show as a block row (default) vs an inline span. */
  inline?: boolean;
  /** Accessible label for screen readers — omit if purely decorative. */
  label?: string;
}

export function Skeleton({ className, inline, label }: Props) {
  const Tag = inline ? 'span' : 'div';
  return (
    <Tag
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'status' : undefined}
      className={clsx(
        'animate-pulse rounded bg-midnight-200/70',
        inline ? 'inline-block align-middle' : 'block',
        !className && !inline && 'h-4 w-full',
        className,
      )}
    />
  );
}
