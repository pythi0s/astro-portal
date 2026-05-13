import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { SelectField, TextField } from '@/components/FormField';
import { formatDateTime, humanizeEnum } from '@/lib/format';
import { useUrlState } from '@/lib/urlState';
import { MessageStatusBadge } from '../components/MessageStatusBadge';
import { useMessageLog } from '../hooks/useMessages';
import type { MessageLog } from '../types';

interface LogListState extends Record<string, string | number | boolean> {
  customer_id: string;
  channel: string;
  page: number;
  pageSize: number;
}

const DEFAULTS: LogListState = {
  customer_id: '',
  channel: '',
  page: 1,
  pageSize: 50,
};

export function MessageLogPage() {
  const [state, setState] = useUrlState<LogListState>(DEFAULTS);

  const params = useMemo(
    () => ({
      customer_id: state.customer_id ? Number(state.customer_id) : undefined,
      channel: state.channel || undefined,
      skip: (state.page - 1) * state.pageSize,
      limit: state.pageSize,
    }),
    [state],
  );

  const { data, isLoading, isError } = useMessageLog(params);
  const hasMore = (data?.length ?? 0) >= state.pageSize;

  const columns = useMemo<ColumnDef<MessageLog, unknown>[]>(
    () => [
      {
        id: 'created',
        header: 'When',
        cell: ({ row }) => formatDateTime(row.original.created_at),
      },
      {
        id: 'customer',
        header: 'Customer',
        cell: ({ row }) => (
          <Link
            to={`/customers/${row.original.customer_id}`}
            className="text-primary-700 hover:underline"
          >
            #{row.original.customer_id}
          </Link>
        ),
      },
      {
        id: 'channel',
        header: 'Channel',
        cell: ({ row }) => humanizeEnum(row.original.channel),
      },
      {
        id: 'recipient',
        header: 'Recipient',
        cell: ({ row }) => row.original.recipient,
      },
      {
        id: 'subject',
        header: 'Subject',
        cell: ({ row }) => row.original.subject ?? '—',
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <MessageStatusBadge status={row.original.status} />,
      },
      {
        id: 'sent',
        header: 'Sent at',
        cell: ({ row }) => (row.original.sent_at ? formatDateTime(row.original.sent_at) : '—'),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Message log"
        description="Outbound email and WhatsApp messages, newest first."
      />
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex flex-col gap-3 rounded-md border border-midnight-200 bg-white px-3 py-3 sm:flex-row sm:items-end">
          <TextField
            label="Customer ID"
            inputMode="numeric"
            value={state.customer_id}
            onChange={(e) => setState({ customer_id: e.target.value, page: 1 })}
          />
          <SelectField
            label="Channel"
            value={state.channel}
            onChange={(e) => setState({ channel: e.target.value, page: 1 })}
          >
            <option value="">All</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </SelectField>
        </div>

        <DataTable
          caption="Message log"
          columns={columns}
          data={data}
          isLoading={isLoading}
          error={isError ? true : undefined}
          emptyTitle="No messages sent yet"
          getRowId={(r) => String(r.id)}
        />

        <Pagination
          page={state.page}
          pageSize={state.pageSize}
          hasMore={hasMore}
          onChange={(patch) => setState(patch)}
        />
      </div>
    </div>
  );
}
