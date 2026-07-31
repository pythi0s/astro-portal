import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';
import { SolutionForm } from '../components/SolutionForm';
import { useCreateSolution } from '../hooks/useSolutions';

export function SolutionNewPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const create = useCreateSolution();

  return (
    <div>
      <PageHeader title="New solution" description="Add a new entry to the solutions catalogue.">
        <Breadcrumbs
          items={[
            { label: 'Solutions', to: '/solutions' },
            { label: 'New' },
          ]}
        />
      </PageHeader>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <SolutionForm
          submitLabel="Create solution"
          onCancel={() => navigate('/solutions')}
          onSubmit={async (payload) => {
            const saved = await create.mutateAsync(payload);
            push({ tone: 'success', message: `Created "${saved.name}".` });
            navigate('/solutions');
          }}
        />
      </div>
    </div>
  );
}
