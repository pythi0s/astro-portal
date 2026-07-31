import clsx from 'clsx';
import type { PaymentStatus } from '../types';

const TONE: Record<PaymentStatus, string> = {
  paid: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  partial: 'bg-sky-100 text-sky-800',
  waived: 'bg-midnight-100 text-midnight-700',
};

const LABEL: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  partial: 'Partial',
  waived: 'Waived',
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
        TONE[status] ?? 'bg-midnight-100 text-midnight-700',
      )}
    >
      {LABEL[status] ?? status}
    </span>
  );
}
