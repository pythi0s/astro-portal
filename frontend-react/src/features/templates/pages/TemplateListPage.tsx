import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import { LinkButton } from '@/components/Button';
import { PageHeader } from '@/components/PageHeader';
import { Tabs } from '@/components/Tabs';
import { formatDateTime, humanizeEnum } from '@/lib/format';
import { useTemplateList } from '../hooks/useTemplates';
import type { MessageChannel, MessageTemplate } from '../types';

export function TemplateListPage() {
  return (
    <div>
      <PageHeader
        title="Message templates"
        description="Email and WhatsApp templates used when sending messages to customers."
        actions={
          <LinkButton href="/templates/new" variant="primary">
            New template
          </LinkButton>
        }
      />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Tabs
          ariaLabel="Template channels"
          tabs={[
            { id: 'email', label: 'Email', content: <ChannelTable channel="email" /> },
            { id: 'whatsapp', label: 'WhatsApp', content: <ChannelTable channel="whatsapp" /> },
          ]}
          defaultTab="email"
          paramKey="channel"
        />
      </div>
    </div>
  );
}

function ChannelTable({ channel }: { channel: MessageChannel }) {
  const { data, isLoading, isError } = useTemplateList({ channel });

  const columns = useMemo<ColumnDef<MessageTemplate, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorKey: 'name',
        cell: ({ row }) => (
          <Link to={`/templates/${row.original.id}/edit`} className="font-medium text-midnight-900 hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      {
        id: 'trigger',
        header: 'Trigger',
        cell: ({ row }) => humanizeEnum(row.original.trigger_type),
      },
      ...(channel === 'email'
        ? [
            {
              id: 'subject',
              header: 'Subject',
              cell: ({ row }) => row.original.subject ?? '—',
            } satisfies ColumnDef<MessageTemplate, unknown>,
          ]
        : []),
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (row.original.is_active ? 'Active' : 'Inactive'),
      },
      {
        id: 'updated',
        header: 'Updated',
        cell: ({ row }) => formatDateTime(row.original.updated_at),
      },
    ],
    [channel],
  );

  return (
    <DataTable
      caption={`${humanizeEnum(channel)} templates`}
      columns={columns}
      data={data}
      isLoading={isLoading}
      error={isError ? true : undefined}
      emptyTitle="No templates yet"
      emptyDescription="Create your first template to standardise outbound messages."
      emptyAction={
        <Link to="/templates/new" className="text-sm font-medium text-primary-600 hover:underline">
          + New template
        </Link>
      }
      getRowId={(r) => String(r.id)}
    />
  );
}
