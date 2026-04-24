import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-midnight-200 bg-midnight-50/40 px-6 py-10 text-center"
    >
      <p className="text-sm font-semibold text-midnight-900">{title}</p>
      {description ? <p className="max-w-md text-sm text-midnight-700">{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}
