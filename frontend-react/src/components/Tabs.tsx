import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';

export interface TabDef {
  id: string;
  label: string;
  /** Optional count badge (e.g., "12"). */
  count?: number | string;
  content: ReactNode;
}

interface Props {
  tabs: TabDef[];
  /** Query-string key for the active tab. Default: "tab". Enables deep links. */
  paramKey?: string;
  /** Fallback when no param is set. Default: first tab id. */
  defaultTab?: string;
  /** ARIA label for the tab group (required for a11y). */
  ariaLabel: string;
}

export function Tabs({ tabs, paramKey = 'tab', defaultTab, ariaLabel }: Props) {
  const [params, setParams] = useSearchParams();
  const firstId = tabs[0]?.id;
  const activeFromParam = params.get(paramKey);
  const active =
    activeFromParam && tabs.some((t) => t.id === activeFromParam)
      ? activeFromParam
      : defaultTab ?? firstId;

  function setActive(id: string) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id === (defaultTab ?? firstId)) {
          next.delete(paramKey);
        } else {
          next.set(paramKey, id);
        }
        return next;
      },
      { replace: true },
    );
  }

  const activePanel = tabs.find((t) => t.id === active);

  return (
    <div>
      <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap gap-1 border-b border-midnight-200">
        {tabs.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-controls={`tabpanel-${t.id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(t.id)}
              className={clsx(
                'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                isActive
                  ? 'border-primary-600 text-midnight-900'
                  : 'border-transparent text-midnight-700 hover:text-midnight-900',
              )}
            >
              {t.label}
              {t.count !== undefined && t.count !== null ? (
                <span className="ml-2 rounded-full bg-midnight-100 px-2 py-0.5 text-xs font-semibold text-midnight-800">
                  {t.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {activePanel ? (
        <div
          role="tabpanel"
          id={`tabpanel-${activePanel.id}`}
          aria-labelledby={`tab-${activePanel.id}`}
          className="py-4"
        >
          {activePanel.content}
        </div>
      ) : null}
    </div>
  );
}
