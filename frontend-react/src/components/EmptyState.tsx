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
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-violet-300/50 bg-violet-50/40 px-6 py-12 text-center backdrop-blur-sm"
    >
      {/* Miniature mandala icon */}
      <svg
        aria-hidden="true"
        width="48"
        height="48"
        viewBox="0 0 100 100"
        className="opacity-30 animate-[mandala-spin_30s_linear_infinite]"
      >
        <g fill="none" stroke="#6D28D9" strokeWidth="2">
          <circle cx="50" cy="50" r="45" />
          <circle cx="50" cy="50" r="35" />
          <circle cx="50" cy="50" r="25" />
          <circle cx="50" cy="50" r="15" />
          <line x1="50" y1="5"  x2="50" y2="95" />
          <line x1="5"  y1="50" x2="95" y2="50" />
          <line x1="15" y1="15" x2="85" y2="85" />
          <line x1="85" y1="15" x2="15" y2="85" />
        </g>
      </svg>
      <p className="text-sm font-semibold text-violet-800">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-violet-600">{description}</p>
      ) : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}
