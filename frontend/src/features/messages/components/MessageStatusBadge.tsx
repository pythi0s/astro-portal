import clsx from 'clsx';
import type { MessageStatus } from '../types';

export function MessageStatusBadge({ status }: { status: MessageStatus }) {
  const tone: Record<MessageStatus, string> = {
    pending: 'bg-amber-100 text-amber-800',
    sent: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-rose-100 text-rose-800',
  };
  const label: Record<MessageStatus, string> = {
    pending: 'Pending',
    sent: 'Sent',
    failed: 'Failed',
  };
  return (
    <span className={clsx('rounded-full px-2 py-0.5 text-xs font-semibold', tone[status])}>
      {label[status]}
    </span>
  );
}
