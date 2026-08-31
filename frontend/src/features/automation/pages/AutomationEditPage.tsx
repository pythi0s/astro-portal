import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/Button';
import { useConfirm } from '@/components/ConfirmProvider';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { AutomationRuleForm } from '../components/AutomationRuleForm';
import {
  useAutomationRule,
  useDeactivateAutomationRule,
  useUpdateAutomationRule,
} from '../hooks/useAutomation';
import { toAutomationRulePayload } from '../schema';

export function AutomationEditPage() {
  const { id } = useParams<{ id: string }>();
  const ruleId = Number(id);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const rule = useAutomationRule(ruleId);
  const update = useUpdateAutomationRule(ruleId);
  const deactivate = useDeactivateAutomationRule();

  if (!Number.isFinite(ruleId)) {
    return <div className="mx-auto max-w-4xl px-4 py-6">Invalid automation rule.</div>;
  }

  return (
    <div>
      <PageHeader
        title={rule.data ? `Edit ${rule.data.name}` : 'Edit automation rule'}
        actions={
          rule.data?.is_active ? (
            <Button
              variant="danger"
              disabled={deactivate.isPending}
              onClick={async () => {
                const confirmed = await confirm({
                  title: 'Disable automation rule?',
                  description: 'No new reminders will be scheduled for this rule.',
                  confirmLabel: 'Disable',
                  danger: true,
                });
                if (!confirmed) return;
                await deactivate.mutateAsync(ruleId);
                toast.push({ tone: 'success', message: 'Automation rule disabled.' });
                navigate('/admin/automation');
              }}
            >
              Disable
            </Button>
          ) : null
        }
      >
        <Breadcrumbs
          items={[
            { label: 'Automation', to: '/admin/automation' },
            { label: rule.data?.name ?? `#${ruleId}` },
          ]}
        />
      </PageHeader>
      <div className="mx-auto max-w-4xl px-4 py-6">
        {rule.isLoading ? (
          <Skeleton className="h-80 w-full" />
        ) : rule.isError || !rule.data ? (
          <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            Automation rule not found.
          </div>
        ) : (
          <AutomationRuleForm
            submitLabel="Save changes"
            initialValues={{
              name: rule.data.name,
              trigger: rule.data.trigger,
              template_id: rule.data.template_id,
              channel: rule.data.channel,
              offset_days: rule.data.offset_days,
              timezone: 'Asia/Kolkata',
              send_window_start_hour: rule.data.send_window_start_hour,
              send_window_end_hour: rule.data.send_window_end_hour,
              filter_city: String(rule.data.filter?.city ?? ''),
              filter_rashi: String(rule.data.filter?.rashi ?? ''),
              is_active: rule.data.is_active,
            }}
            onCancel={() => navigate('/admin/automation')}
            onSubmit={async (values) => {
              await update.mutateAsync(toAutomationRulePayload(values));
              toast.push({ tone: 'success', message: 'Automation rule updated.' });
              navigate('/admin/automation');
            }}
          />
        )}
      </div>
    </div>
  );
}
