import { cn } from '@/lib/cn';

/**
 * Optimised brand mark. `sm` (≤48px on screen) ships a ~6 KB WebP; `lg` is for
 * the big login hero. PNG fallbacks cover browsers without WebP.
 */
export function BrandLogo({
  size = 'sm',
  alt = '',
  className,
  priority,
}: {
  size?: 'sm' | 'lg';
  alt?: string;
  className?: string;
  /** Above-the-fold hero image: fetch eagerly with high priority. */
  priority?: boolean;
}) {
  const px = size === 'sm' ? 96 : 480;
  return (
    <picture>
      <source srcSet={`/brand/logo-${px}.webp`} type="image/webp" />
      <img
        src={`/brand/logo-${px}.png`}
        alt={alt}
        width={px}
        height={px}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        {...(priority ? { fetchpriority: 'high' } : {})}
        className={cn('object-contain', className)}
      />
    </picture>
  );
}
