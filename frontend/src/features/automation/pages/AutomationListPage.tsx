import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import { LinkButton } from '@/components/Button';
import { PageHeader } from '@/components/PageHeader';
import { formatDateTime, humanizeEnum } from '@/lib/format';
import { useAutomationRules, useAutomationRuns } from '../hooks/useAutomation';
import type { AutomationRule, AutomationRun } from '../types';

export function AutomationListPage() {
  const rules = useAutomationRules();
  const runs = useAutomationRuns();

  const ruleColumns = useMemo<ColumnDef<AutomationRule, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Rule',
        cell: ({ row }) => (
          <Link
            to={`/admin/automation/${row.original.id}/edit`}
            className="font-medium text-midnight-900 hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      { id: 'channel', header: 'Channel', cell: ({ row }) => humanizeEnum(row.original.channel) },
      {
        id: 'timing',
        header: 'Timing',
        cell: ({ row }) => {
          const offset = row.original.offset_days;
          if (offset === 0) return 'On due date';
          return offset < 0 ? `${Math.abs(offset)} day(s) before` : `${offset} day(s) after`;
        },
      },
      {
        id: 'window',
        header: 'Send window',
        cell: ({ row }) => `${row.original.send_window_start_hour}:00–${row.original.send_window_end_hour}:00`,
      },
      { id: 'status', header: 'Status', cell: ({ row }) => (row.original.is_active ? 'Enabled' : 'Disabled') },
      { id: 'updated', header: 'Updated', cell: ({ row }) => formatDateTime(row.original.updated_at) },
    ],
    [],
  );

  const runColumns = useMemo<ColumnDef<AutomationRun, unknown>[]>(
    () => [
      { id: 'when', header: 'Run', cell: ({ row }) => formatDateTime(row.original.scheduled_for) },
      { id: 'rule', header: 'Rule ID', cell: ({ row }) => `#${row.original.automation_rule_id}` },
      { id: 'channel', header: 'Channel', cell: ({ row }) => humanizeEnum(row.original.channel) },
      { id: 'status', header: 'Status', cell: ({ row }) => humanizeEnum(row.original.status) },
      {
        id: 'result',
        header: 'Result',
        cell: ({ row }) => `${row.original.sent_count} sent · ${row.original.failed_count} failed · ${row.original.total_count} total`,
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Follow-up automation"
        description="Schedule email or WhatsApp reminders from visit follow-up dates."
        actions={<LinkButton href="/admin/automation/new" variant="primary">New rule</LinkButton>}
      />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        <section aria-labelledby="automation-rules-heading" className="space-y-3">
          <h2 id="automation-rules-heading" className="text-base font-semibold text-midnight-900">Rules</h2>
          <DataTable
            caption="Automation rules"
            columns={ruleColumns}
            data={rules.data}
            isLoading={rules.isLoading}
            error={rules.isError ? true : undefined}
            emptyTitle="No automation rules"
            emptyDescription="Create a follow-up rule to start scheduling reminders."
            getRowId={(rule) => String(rule.id)}
          />
        </section>
        <section aria-labelledby="automation-runs-heading" className="space-y-3">
          <h2 id="automation-runs-heading" className="text-base font-semibold text-midnight-900">Recent runs</h2>
          <DataTable
            caption="Recent automation runs"
            columns={runColumns}
            data={runs.data}
            isLoading={runs.isLoading}
            error={runs.isError ? true : undefined}
            emptyTitle="No runs yet"
            emptyDescription="Runs appear after an enabled rule matches a follow-up date."
            getRowId={(run) => String(run.id)}
          />
        </section>
      </div>
    </div>
  );
}
