import clsx from 'clsx';
import type { AppointmentStatus } from '@/portal/types';

const TONE: Record<AppointmentStatus, string> = {
  booked: 'bg-sky-100 text-sky-800 ring-sky-200',
  completed: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  cancelled: 'bg-midnight-100 text-midnight-600 ring-midnight-200',
};

const LABEL: Record<AppointmentStatus, string> = {
  booked: 'Booked',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
        TONE[status] ?? 'bg-midnight-100 text-midnight-700 ring-midnight-200',
      )}
    >
      {LABEL[status] ?? status}
    </span>
  );
}
