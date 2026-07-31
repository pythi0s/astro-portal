import { useMemo, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import clsx from 'clsx';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';

interface Props<T extends object> {
  /** Human-readable label for the whole table (becomes aria-label / caption). */
  caption: string;
  columns: ColumnDef<T, unknown>[];
  data: T[] | undefined;
  isLoading?: boolean;
  error?: unknown;
  /** Render when no rows (and not loading/error). */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** External sort state (URL-controlled). Pass undefined to let the table own it. */
  sorting?: SortingState;
  onSortingChange?: (s: SortingState) => void;
  /** Optional row click handler (makes the full row keyboard-navigable). */
  onRowClick?: (row: T) => void;
  /** Key for React list identity. Defaults to `row.id` if present. */
  getRowId?: (row: T, index: number) => string;
  /** Pagination footer (render-prop style so the caller owns the URL wiring). */
  footer?: ReactNode;
}

export function DataTable<T extends object>(props: Props<T>) {
  const {
    caption,
    columns,
    data,
    isLoading,
    error,
    emptyTitle = 'No results',
    emptyDescription,
    emptyAction,
    sorting,
    onSortingChange,
    onRowClick,
    getRowId,
    footer,
  } = props;

  const rows = useMemo(() => data ?? [], [data]);
  const table = useReactTable({
    data: rows,
    columns,
    state: sorting ? { sorting } : undefined,
    onSortingChange: onSortingChange
      ? (updater) => {
          const next = typeof updater === 'function' ? updater(sorting ?? []) : updater;
          onSortingChange(next);
        }
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: getRowId ? (row, idx) => getRowId(row, idx) : undefined,
    manualPagination: true,
  });

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-900"
      >
        Failed to load data. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-midnight-200 bg-white">
      <table className="min-w-full divide-y divide-midnight-200 text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-midnight-50/50">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                const sortDir = header.column.getIsSorted();
                const canSort = header.column.getCanSort();
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      sortDir === 'asc'
                        ? 'ascending'
                        : sortDir === 'desc'
                          ? 'descending'
                          : canSort
                            ? 'none'
                            : undefined
                    }
                    className="px-3 py-2 text-left font-semibold text-midnight-800"
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 rounded text-sm font-semibold text-midnight-800 hover:text-midnight-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span aria-hidden="true" className="text-xs text-midnight-500">
                          {sortDir === 'asc' ? '▲' : sortDir === 'desc' ? '▼' : '⇅'}
                        </span>
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-midnight-100">
          {isLoading && rows.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`sk-${i}`}>
                {columns.map((_col, c) => (
                  <td key={`sk-${i}-${c}`} className="px-3 py-3">
                    <Skeleton className="h-4 w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6">
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                  action={emptyAction}
                />
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row.original);
                        }
                      }
                    : undefined
                }
                className={clsx(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-midnight-50/60 focus:bg-midnight-50/60 focus:outline-none',
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 align-middle text-midnight-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {footer ? <div className="border-t border-midnight-200 px-3 py-2">{footer}</div> : null}
    </div>
  );
}

interface PaginationProps {
  page: number;
  pageSize: number;
  /** Undefined when count is not returned by the API (common case). */
  totalRows?: number;
  /** True if the current page is full; used to decide whether "Next" is active. */
  hasMore: boolean;
  onChange: (patch: { page?: number; pageSize?: number }) => void;
}

export function Pagination({ page, pageSize, totalRows, hasMore, onChange }: PaginationProps) {
  const canPrev = page > 1;
  const canNext = hasMore;
  const from = (page - 1) * pageSize + 1;
  const to = from + pageSize - 1;

  return (
    <div className="flex flex-col items-center justify-between gap-2 text-sm text-midnight-700 sm:flex-row">
      <p>
        Showing <strong>{from.toLocaleString()}</strong>–<strong>{to.toLocaleString()}</strong>
        {totalRows !== undefined ? (
          <>
            {' '}
            of <strong>{totalRows.toLocaleString()}</strong>
          </>
        ) : null}
      </p>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1">
          <span className="sr-only">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => onChange({ pageSize: Number(e.target.value), page: 1 })}
            className="rounded-md border border-midnight-200 bg-white px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {[10, 20, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s} / page
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onChange({ page: Math.max(1, page - 1) })}
          className="rounded-md border border-midnight-200 bg-white px-2.5 py-1 text-sm font-medium text-midnight-800 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-midnight-700/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onChange({ page: page + 1 })}
          className="rounded-md border border-midnight-200 bg-white px-2.5 py-1 text-sm font-medium text-midnight-800 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-midnight-700/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          Next
        </button>
      </div>
    </div>
  );
}
