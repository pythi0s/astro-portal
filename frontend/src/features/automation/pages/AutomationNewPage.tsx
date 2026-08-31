import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';
import { AutomationRuleForm } from '../components/AutomationRuleForm';
import { useCreateAutomationRule } from '../hooks/useAutomation';
import { toAutomationRulePayload } from '../schema';

export function AutomationNewPage() {
  const navigate = useNavigate();
  const create = useCreateAutomationRule();
  const toast = useToast();

  return (
    <div>
      <PageHeader title="New follow-up rule">
        <Breadcrumbs
          items={[
            { label: 'Automation', to: '/admin/automation' },
            { label: 'New' },
          ]}
        />
      </PageHeader>
      <div className="mx-auto max-w-4xl px-4 py-6">
        <AutomationRuleForm
          submitLabel="Create rule"
          onCancel={() => navigate('/admin/automation')}
          onSubmit={async (values) => {
            const rule = await create.mutateAsync(toAutomationRulePayload(values));
            toast.push({ tone: 'success', message: `Created "${rule.name}".` });
            navigate('/admin/automation');
          }}
        />
      </div>
    </div>
  );
}
