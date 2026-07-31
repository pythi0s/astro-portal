import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useToast } from '@/components/Toast';
import { TemplateForm } from '../components/TemplateForm';
import { toCreatePayload } from '../schema';
import { useCreateTemplate } from '../hooks/useTemplates';

export function TemplateNewPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const create = useCreateTemplate();

  return (
    <div>
      <PageHeader title="New template">
        <Breadcrumbs
          items={[
            { label: 'Templates', to: '/templates' },
            { label: 'New' },
          ]}
        />
      </PageHeader>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <TemplateForm
          submitLabel="Create template"
          onCancel={() => navigate('/templates')}
          onSubmit={async (values) => {
            const saved = await create.mutateAsync(toCreatePayload(values));
            push({ tone: 'success', message: `Created "${saved.name}".` });
            navigate('/templates');
          }}
        />
      </div>
    </div>
  );
}
