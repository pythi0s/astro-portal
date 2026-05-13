import { useId, useState } from 'react';
import clsx from 'clsx';
import type { DateRange, Preset } from '@/features/dashboard/types';
import { PRESETS, daysInRange, isIsoDate, rangeForPreset } from '@/features/dashboard/lib/range';

interface Props {
  value: DateRange;
  onChange: (next: DateRange) => void;
}

/**
 * Presets + a disclosed custom range picker. Pure controlled component:
 * the parent owns the value (URL-backed) and receives every change.
 *
 * Accessibility:
 * - Preset buttons are a single-select group; active preset has aria-pressed.
 * - Custom-range disclosure uses native <details>/<summary> so it works
 *   keyboard-only without Headless UI's Disclosure overhead for this view.
 */
export function DateRangeFilter({ value, onChange }: Props) {
  const formId = useId();
  const [fromDraft, setFromDraft] = useState(value.from);
  const [toDraft, setToDraft] = useState(value.to);

  function handlePreset(id: Preset) {
    onChange(rangeForPreset(id));
  }

  function handleApplyCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!isIsoDate(fromDraft) || !isIsoDate(toDraft)) return;
    if (fromDraft > toDraft) return;
    onChange({ from: fromDraft, to: toDraft, preset: 'custom' });
  }

  const rangeLen = daysInRange(value);

  return (
    <section aria-label="Date range filter" className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Range presets" className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const active = value.preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePreset(p.id)}
              aria-pressed={active}
              className={clsx(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                active
                  ? 'bg-midnight-900 text-white'
                  : 'bg-white text-midnight-800 ring-1 ring-midnight-900/10 hover:bg-midnight-900/5',
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <details className="group">
        <summary
          className={clsx(
            'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-midnight-900/10',
            'hover:bg-midnight-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            value.preset === 'custom' && 'bg-midnight-900 text-white ring-0',
          )}
          aria-controls={formId}
        >
          Custom
        </summary>
        <form
          id={formId}
          onSubmit={handleApplyCustom}
          className="mt-2 flex flex-wrap items-end gap-3 rounded-lg border border-midnight-900/10 bg-white p-3 shadow-sm"
        >
          <label className="flex flex-col text-xs font-medium text-midnight-700">
            From
            <input
              type="date"
              value={fromDraft}
              max={toDraft || undefined}
              onChange={(e) => setFromDraft(e.target.value)}
              className="mt-1 rounded-md border border-midnight-900/20 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs font-medium text-midnight-700">
            To
            <input
              type="date"
              value={toDraft}
              min={fromDraft || undefined}
              onChange={(e) => setToDraft(e.target.value)}
              className="mt-1 rounded-md border border-midnight-900/20 px-2 py-1 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Apply
          </button>
        </form>
      </details>

      <span className="ml-1 text-xs text-midnight-700" aria-live="polite">
        Showing {rangeLen} {rangeLen === 1 ? 'day' : 'days'}
      </span>
    </section>
  );
}
