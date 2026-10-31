import { useState } from 'react';
import clsx from 'clsx';
import { parseIsoDate, sameDay, startOfMonth, toIsoDate, visibleDays } from '../lib/calendar';

export function MiniMonthCalendar({
  selected,
  today,
  markedDays,
  onSelect,
}: {
  selected: string;
  today: Date;
  /** ISO dates that have at least one appointment. */
  markedDays: ReadonlySet<string>;
  onSelect: (iso: string) => void;
}) {
  const selectedDate = parseIsoDate(selected);
  const [month, setMonth] = useState(() => startOfMonth(selectedDate));
  const [lastSelected, setLastSelected] = useState(selected);
  if (lastSelected !== selected) {
    // Follow external navigation (e.g. the big calendar's Next button).
    setLastSelected(selected);
    setMonth(startOfMonth(selectedDate));
  }
  const days = visibleDays('month', month);
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <div className="w-full select-none">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-midnight-900" aria-live="polite">
          {month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex gap-1">
          <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className="flex h-7 w-7 items-center justify-center rounded-full text-midnight-700 hover:bg-amber-100">
            ‹
          </button>
          <button type="button" aria-label="Next month" onClick={() => shift(1)} className="flex h-7 w-7 items-center justify-center rounded-full text-midnight-700 hover:bg-amber-100">
            ›
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <span key={d} className="text-[11px] font-semibold uppercase text-midnight-500">
            {d}
          </span>
        ))}
        {days.map((d) => {
          const iso = toIsoDate(d);
          const inMonth = d.getMonth() === month.getMonth();
          const isSelected = iso === selected;
          const isToday = sameDay(d, today);
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              aria-label={d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              aria-pressed={isSelected}
              className={clsx(
                'relative mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                isSelected
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 font-bold text-white shadow'
                  : isToday
                    ? 'ring-1 ring-amber-400 text-amber-800'
                    : inMonth
                      ? 'text-midnight-800 hover:bg-amber-100'
                      : 'text-midnight-400 hover:bg-amber-50',
              )}
            >
              {d.getDate()}
              {markedDays.has(iso) && !isSelected ? (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-orange-500" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
