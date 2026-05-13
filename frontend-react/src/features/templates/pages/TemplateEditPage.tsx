import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmProvider';
import { TemplateForm } from '../components/TemplateForm';
import { toUpdatePayload } from '../schema';
import {
  useDeactivateTemplate,
  useTemplateList,
  useUpdateTemplate,
} from '../hooks/useTemplates';

export function TemplateEditPage() {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id);
  const navigate = useNavigate();
  const { push } = useToast();
  const confirm = useConfirm();

  // The backend has no GET-by-id for templates; list the active set and find
  // by id. This keeps the edit flow simple without adding a new endpoint.
  const { data: templates, isLoading, isError } = useTemplateList({});
  const template = templates?.find((t) => t.id === numId);

  const update = useUpdateTemplate(numId);
  const deactivate = useDeactivateTemplate();

  if (!Number.isFinite(numId)) {
    return <div className="mx-auto max-w-4xl px-4 py-6">Invalid template id.</div>;
  }

  return (
    <div>
      <PageHeader
        title={template ? `Edit ${template.name}` : 'Edit template'}
        actions={
          template?.is_active ? (
            <Button
              variant="danger"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Deactivate template?',
                  description: 'Inactive templates cannot be used when sending new messages.',
                  confirmLabel: 'Deactivate',
                  danger: true,
                });
                if (!ok) return;
                await deactivate.mutateAsync(numId);
                push({ tone: 'success', message: 'Template deactivated.' });
                navigate('/templates');
              }}
            >
              Deactivate
            </Button>
          ) : null
        }
      >
        <Breadcrumbs
          items={[
            { label: 'Templates', to: '/templates' },
            { label: template?.name ?? `#${numId}` },
          ]}
        />
      </PageHeader>
      <div className="mx-auto max-w-5xl px-4 py-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : isError || !template ? (
          <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-900">
            Template not found (it may have been deactivated).
          </div>
        ) : (
          <TemplateForm
            submitLabel="Save changes"
            initialValues={{
              name: template.name,
              channel: template.channel,
              trigger_type: template.trigger_type,
              subject: template.subject ?? '',
              body: template.body,
              is_active: template.is_active,
            }}
            onCancel={() => navigate('/templates')}
            onSubmit={async (values) => {
              await update.mutateAsync(toUpdatePayload(values));
              push({ tone: 'success', message: 'Template updated.' });
              navigate('/templates');
            }}
          />
        )}
      </div>
    </div>
  );
}
