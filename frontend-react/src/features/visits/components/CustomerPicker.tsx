import { useEffect, useId, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listCustomers } from '@/features/customers/api';
import { customerKeys } from '@/features/customers/queryKeys';

interface Props {
  value: number;
  onChange: (id: number) => void;
  /** Preselects and disables editing when you know the customer from a deep link. */
  lockedLabel?: string;
  error?: string;
}

/**
 * Simple debounced typeahead for picking a customer. Full list-page
 * pagination would be overkill in a form context — users who can't find
 * their customer here jump to the Customers list to create a new one.
 */
export function CustomerPicker({ value, onChange, lockedLabel, error }: Props) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const inputId = useId();
  const listId = `${inputId}-list`;
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(q), 250);
    return () => window.clearTimeout(handle);
  }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: customerKeys.list({ search: debounced, picker: true }),
    queryFn: () => listCustomers({ search: debounced || undefined, is_active: true, limit: 20 }),
    enabled: open,
  });

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  if (lockedLabel) {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-midnight-900">
          Customer<span aria-hidden="true" className="ml-0.5 text-rose-600">*</span>
        </label>
        <input
          id={inputId}
          readOnly
          value={lockedLabel}
          className="w-full rounded-md border border-midnight-200 bg-midnight-50/40 px-3 py-2 text-sm text-midnight-900"
        />
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-midnight-900">
        Customer<span aria-hidden="true" className="ml-0.5 text-rose-600">*</span>
      </label>
      <input
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={error ? 'true' : undefined}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          onChange(0);
        }}
        onFocus={() => setOpen(true)}
        placeholder={value ? 'Selected ID ' + value : 'Type to search by name, phone, or email'}
        className="w-full rounded-md border border-midnight-200 bg-white px-3 py-2 text-sm text-midnight-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-midnight-200 bg-white shadow-md"
        >
          {isLoading ? (
            <li className="px-3 py-2 text-sm text-midnight-600">Searching…</li>
          ) : !data || data.length === 0 ? (
            <li className="px-3 py-2 text-sm text-midnight-600">No customers matched.</li>
          ) : (
            data.map((c) => (
              <li key={c.id} role="option" aria-selected={c.id === value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.id);
                    setQ(`${c.name}${c.phone ? ` · ${c.phone}` : ''}`);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-midnight-50 focus-visible:bg-midnight-50 focus-visible:outline-none"
                >
                  <span>
                    <span className="block font-medium text-midnight-900">{c.name}</span>
                    <span className="block text-xs text-midnight-600">
                      {c.phone ?? c.email ?? `#${c.id}`}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
