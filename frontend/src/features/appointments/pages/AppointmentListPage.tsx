import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/Button';
import { useConfirm } from '@/components/ConfirmProvider';
import { useToast } from '@/components/Toast';
import { errorMessage } from '@/lib/apiErrors';
import { humanizeCategory } from '@/lib/format';
import { useUrlState } from '@/lib/urlState';
import { formatAppointmentWhen } from '@/portal/lib/slots';
import { useAppointmentList, useUpdateAppointmentStatus } from '../hooks/useAppointments';
import { AppointmentStatusBadge } from '../components/AppointmentStatusBadge';
import { AppointmentCalendar } from '../components/AppointmentCalendar';
import type { CalendarView } from '../lib/calendar';
import { APPOINTMENT_STATUSES, type AppointmentStatus, type StaffAppointment } from '../types';

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const inputClass =
  'rounded-md border border-midnight-200 bg-white px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';

export function AppointmentListPage() {
  const [state, setState] = useUrlState({
    view: 'calendar',
    cal: 'week',
    anchor: todayIso(),
    date_from: todayIso(),
    date_to: '',
    status: '',
  });
  const isList = state.view === 'list';
  const { data, isLoading, isError } = useAppointmentList(
    {
      date_from: state.date_from || undefined,
      date_to: state.date_to || undefined,
      status: state.status || undefined,
    },
    isList,
  );
  const update = useUpdateAppointmentStatus();
  const confirm = useConfirm();
  const toast = useToast();

  async function setStatus(row: StaffAppointment, status: AppointmentStatus) {
    if (status === 'cancelled') {
      const ok = await confirm({
        title: 'Cancel this appointment?',
        description: `${row.customer_name} · ${formatAppointmentWhen(row.start_at, row.end_at)}`,
        confirmLabel: 'Cancel appointment',
        cancelLabel: 'Keep',
        danger: true,
      });
      if (!ok) return;
    }
    update.mutate(
      { id: row.id, status },
      {
        onSuccess: () =>
          toast.push({ tone: 'success', message: `Appointment marked ${status}.` }),
        onError: (err) => toast.push({ tone: 'error', message: errorMessage(err) }),
      },
    );
  }

  const columns = useMemo<ColumnDef<StaffAppointment>[]>(
    () => [
      {
        id: 'when',
        header: 'When',
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-medium text-midnight-900">
            {formatAppointmentWhen(row.original.start_at, row.original.end_at)}
          </span>
        ),
      },
      {
        id: 'duration',
        header: 'Duration',
        cell: ({ row }) => `${row.original.duration_minutes} min`,
      },
      {
        id: 'customer',
        header: 'Customer',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Link
              to={`/customers/${row.original.customer_id}`}
              className="text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {row.original.customer_name}
            </Link>
            <span className="text-xs text-midnight-600">
              {row.original.customer_phone || row.original.customer_email || '—'}
            </span>
          </div>
        ),
      },
      {
        id: 'notes',
        header: 'Notes',
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-xs text-midnight-700">{row.original.notes || '—'}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <AppointmentStatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) =>
          row.original.status === 'booked' ? (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => void setStatus(row.original, 'completed')}>
                Complete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void setStatus(row.original, 'cancelled')}>
                Cancel
              </Button>
            </div>
          ) : null,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Guruji's calendar of in-person visits booked through the customer portal."
        actions={
          <a
            href="/portal"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-primary-700 hover:underline"
          >
            Open customer portal ↗
          </a>
        }
      />
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5">
        <div role="tablist" aria-label="Appointments view" className="inline-flex self-start rounded-full border border-amber-200 bg-white/80 p-1 shadow-sm">
          {(
            [
              ['calendar', 'Calendar'],
              ['list', 'List'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={state.view === value}
              onClick={() => setState({ view: value })}
              className={
                state.view === value
                  ? 'rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-1.5 text-sm font-semibold text-white shadow'
                  : 'rounded-full px-4 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-50'
              }
            >
              {label}
            </button>
          ))}
        </div>

        {!isList ? (
          <AppointmentCalendar
            view={state.cal as CalendarView}
            anchor={state.anchor}
            onNavigate={(patch) =>
              setState({
                ...(patch.view ? { cal: patch.view } : {}),
                ...(patch.anchor ? { anchor: patch.anchor } : {}),
              })
            }
            onSetStatus={(row, status) => void setStatus(row, status)}
          />
        ) : (
        <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-midnight-900">From</span>
            <input
              type="date"
              value={state.date_from}
              onChange={(e) => setState({ date_from: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-midnight-900">To</span>
            <input
              type="date"
              value={state.date_to}
              onChange={(e) => setState({ date_to: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-midnight-900">Status</span>
            <select
              value={state.status}
              onChange={(e) => setState({ status: e.target.value })}
              className={inputClass}
            >
              <option value="">All</option>
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {humanizeCategory(s)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <DataTable<StaffAppointment>
          caption="Appointments"
          columns={columns}
          data={data}
          isLoading={isLoading}
          error={isError || undefined}
          getRowId={(row) => String(row.id)}
          emptyTitle="No appointments in this range"
          emptyDescription="Bookings made through the customer portal will appear here."
        />
        </>
        )}
      </div>
    </>
  );
}

export default AppointmentListPage;
