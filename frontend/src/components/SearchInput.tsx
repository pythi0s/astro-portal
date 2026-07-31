import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  label: string;
  /** Debounce in ms before firing `onChange`. Default: 300. */
  debounceMs?: number;
  className?: string;
}

/**
 * Debounced search input. Keeps local state while the user types and only
 * forwards to the URL after the debounce. Pressing Escape clears the field.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label,
  debounceMs = 300,
  className,
}: Props) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (local === value) return;
    const handle = window.setTimeout(() => onChange(local), debounceMs);
    timerRef.current = handle;
    return () => window.clearTimeout(handle);
  }, [local, value, onChange, debounceMs]);

  return (
    <label className={className ?? 'relative block w-full sm:max-w-xs'}>
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            setLocal('');
            onChange('');
          }
        }}
        className="w-full rounded-md border border-midnight-200 bg-white px-3 py-1.5 text-sm text-midnight-900 shadow-sm placeholder:text-midnight-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      />
    </label>
  );
}
