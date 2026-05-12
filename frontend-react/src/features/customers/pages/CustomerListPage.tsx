import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Pagination } from '@/components/DataTable';
import { Button, LinkButton } from '@/components/Button';
import { SearchInput } from '@/components/SearchInput';
import { formatDate, humanizeCategory } from '@/lib/format';
import { useUrlState } from '@/lib/urlState';
import { useCustomerList } from '../hooks/useCustomerList';
import { CustomerKpiStrip } from '../components/CustomerKpiStrip';
import type { CustomerListRow } from '../types';

const DEFAULTS = {
  q: '',
  page: 1,
  pageSize: 20,
  active: 'active',
} as const;

function resolveUploadUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return path;
  return `/${path}`;
}

export default function CustomerListPage() {
  const navigate = useNavigate();
  const [state, setState] = useUrlState<{
    q: string;
    page: number;
    pageSize: number;
    active: string;
  }>({ ...DEFAULTS });

  const is_active = state.active === 'all' ? undefined : state.active !== 'inactive';
  const skip = (state.page - 1) * state.pageSize;
  const { data, isLoading, isError, isFetching } = useCustomerList({
    search: state.q || undefined,
    is_active,
    skip,
    limit: state.pageSize,
  });

  const columns = useMemo<ColumnDef<CustomerListRow>[]>(
    () => [
      {
        id: 'name',
        header: 'Customer',
        cell: ({ row }) => {
          const photoUrl = resolveUploadUrl(row.original.photo_path);
          const initial = row.original.name.charAt(0).toUpperCase();
          return (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border border-midnight-200 bg-midnight-100">
                {photoUrl ? (
                  <img src={photoUrl} alt={row.original.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-midnight-700">
                    {initial}
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-col">
                <Link
                  to={`/customers/${row.original.id}`}
                  className="truncate font-medium text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {row.original.name}
                </Link>
                <span className="text-xs text-midnight-600">{row.original.photo_path ? 'Photo added' : 'No photo yet'}</span>
              </div>
            </div>
          );
        },
      },
      {
        id: 'contact',
        header: 'Contact',
        cell: ({ row }) => (
          <div className="flex flex-col leading-tight">
            <span className="text-midnight-900">{row.original.phone ?? '—'}</span>
            <span className="text-xs text-midnight-600">{row.original.email ?? ''}</span>
          </div>
        ),
      },
      {
        id: 'gender',
        header: 'Gender',
        accessorFn: (r) => r.gender ?? '—',
        cell: ({ row }) => humanizeCategory(row.original.gender ?? '—'),
      },
      {
        id: 'city',
        header: 'City',
        accessorFn: (r) => r.city ?? '—',
      },
      {
        id: 'rashi',
        header: 'Rashi',
        accessorFn: (r) => r.rashi ?? '—',
      },
      {
        id: 'created_at',
        header: 'Created',
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        id: 'active',
        header: 'Status',
        cell: ({ row }) =>
          row.original.is_active ? (
            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              Active
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-midnight-100 px-2 py-0.5 text-xs font-semibold text-midnight-700">
              Inactive
            </span>
          ),
      },
      {
        id: 'actions',
        header: 'Assets',
        cell: ({ row }) => (
          <Link
            to={`/customers/${row.original.id}/edit`}
            className="text-xs font-semibold text-primary-700 underline-offset-2 hover:underline"
          >
            Upload photo/kundali
          </Link>
        ),
      },
    ],
    [],
  );

  const hasMore = (data?.length ?? 0) === state.pageSize;

  return (
    <>
      <PageHeader
        title="Customers"
        description="Client directory — search, manage details, and open customer profiles."
        actions={
          <LinkButton href="/customers/new" variant="primary">
            New customer
          </LinkButton>
        }
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5">
        <CustomerKpiStrip rows={data} isLoading={isLoading} />

        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={state.q}
            onChange={(q) => setState({ q, page: 1 })}
            label="Search customers by name, phone, or email"
            placeholder="Search name, phone, or email…"
            className="flex-1 sm:max-w-sm"
          />
          <div className="inline-flex rounded-md border border-midnight-200 bg-white p-0.5 text-sm">
            {(['active', 'all', 'inactive'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={state.active === opt}
                onClick={() => setState({ active: opt, page: 1 })}
                className={
                  state.active === opt
                    ? 'rounded bg-midnight-900 px-2.5 py-1 text-white'
                    : 'rounded px-2.5 py-1 text-midnight-800 hover:bg-midnight-700/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
                }
              >
                {opt === 'active' ? 'Active' : opt === 'all' ? 'All' : 'Deactivated'}
              </button>
            ))}
          </div>
          {isFetching && !isLoading ? (
            <span className="text-xs text-midnight-600" aria-live="polite">
              Updating…
            </span>
          ) : null}
        </div>

        <DataTable<CustomerListRow>
          caption="Customers"
          columns={columns}
          data={data}
          isLoading={isLoading}
          error={isError || undefined}
          emptyTitle="No customers yet"
          emptyDescription="Create the first customer to get started."
          emptyAction={
            <Button variant="primary" onClick={() => navigate('/customers/new')}>
              New customer
            </Button>
          }
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
