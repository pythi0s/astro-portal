import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  /** Right-aligned actions (buttons, links). */
  actions?: ReactNode;
  /** Optional slot below the title (e.g. tabs, breadcrumbs). */
  children?: ReactNode;
}

export function PageHeader({ title, description, actions, children }: Props) {
  return (
    <div className="border-b border-midnight-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold text-midnight-900">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-midnight-700">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {children ? <div className="mx-auto max-w-6xl px-4 pb-3">{children}</div> : null}
    </div>
  );
}
