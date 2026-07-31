import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Pagination } from '@/components/DataTable';
import { LinkButton } from '@/components/Button';
import { formatDate, formatMoney, humanizeCategory } from '@/lib/format';
import { useUrlState } from '@/lib/urlState';
import { useVisitList } from '../hooks/useVisits';
import type { PaymentStatus, VisitRow } from '../types';
import { PAYMENT_STATUSES } from '../types';
import { PaymentStatusBadge } from '../components/PaymentStatusBadge';

const DEFAULTS = {
  customer_id: 0,
  payment_status: '',
  date_from: '',
  date_to: '',
  include_inactive: false,
  page: 1,
  pageSize: 20,
};

export default function VisitListPage() {
  const [state, setState] = useUrlState({ ...DEFAULTS });

  const skip = (state.page - 1) * state.pageSize;
  const { data, isLoading, isError } = useVisitList({
    customer_id: state.customer_id || undefined,
    payment_status: state.payment_status || undefined,
    date_from: state.date_from || undefined,
    date_to: state.date_to || undefined,
    include_inactive: state.include_inactive ? true : undefined,
    skip,
    limit: state.pageSize,
  });

  const columns = useMemo<ColumnDef<VisitRow>[]>(
    () => [
      {
        id: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <Link
            to={`/visits/${row.original.id}`}
            className="text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            #{row.original.id}
          </Link>
        ),
      },
      {
        id: 'customer',
        header: 'Customer',
        cell: ({ row }) => (
          <Link
            to={`/customers/${row.original.customer_id}`}
            className="text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            #{row.original.customer_id}
          </Link>
        ),
      },
      {
        id: 'visit_date',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.visit_date),
      },
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => humanizeCategory(row.original.consultation_type),
      },
      {
        id: 'fees',
        header: 'Fees',
        cell: ({ row }) => formatMoney(row.original.fees),
      },
      {
        id: 'payment',
        header: 'Payment',
        cell: ({ row }) => <PaymentStatusBadge status={row.original.payment_status} />,
      },
      {
        id: 'follow_up',
        header: 'Follow up',
        cell: ({ row }) => (row.original.follow_up_date ? formatDate(row.original.follow_up_date) : '—'),
      },
    ],
    [],
  );

  const hasMore = (data?.length ?? 0) === state.pageSize;

  return (
    <>
      <PageHeader
        title="Visits"
        description="Consultation log with filters for customer, payment status, and date range."
        actions={<LinkButton href="/visits/new" variant="primary">New visit</LinkButton>}
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-midnight-900">Customer ID</span>
            <input
              type="number"
              min={0}
              value={state.customer_id || ''}
              onChange={(e) =>
                setState({ customer_id: Number(e.target.value) || 0, page: 1 })
              }
              className="rounded-md border border-midnight-200 bg-white px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-midnight-900">Payment</span>
            <select
              value={state.payment_status}
              onChange={(e) => setState({ payment_status: e.target.value, page: 1 })}
              className="rounded-md border border-midnight-200 bg-white px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <option value="">All</option>
              {PAYMENT_STATUSES.map((s: PaymentStatus) => (
                <option key={s} value={s}>
                  {humanizeCategory(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-midnight-900">From</span>
            <input
              type="date"
              value={state.date_from}
              onChange={(e) => setState({ date_from: e.target.value, page: 1 })}
              className="rounded-md border border-midnight-200 bg-white px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-midnight-900">To</span>
            <input
              type="date"
              value={state.date_to}
              onChange={(e) => setState({ date_to: e.target.value, page: 1 })}
              className="rounded-md border border-midnight-200 bg-white px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
          </label>
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.include_inactive}
              onChange={(e) => setState({ include_inactive: e.target.checked, page: 1 })}
              className="h-4 w-4"
            />
            <span className="font-medium text-midnight-900">Show deactivated</span>
          </label>
        </div>

        <DataTable<VisitRow>
          caption="Visits"
          columns={columns}
          data={data}
          isLoading={isLoading}
          error={isError || undefined}
          emptyTitle="No visits match these filters"
          emptyDescription="Clear the filters or add a new visit."
          footer={
            <Pagination
              page={state.page}
              pageSize={state.pageSize}
              hasMore={hasMore}
              onChange={(patch) => setState(patch)}
            />
          }
        />
      </div>
    </>
  );
}
