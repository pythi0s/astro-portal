import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmProvider';
import { SolutionForm } from '../components/SolutionForm';
import { useDeactivateSolution, useSolution, useUpdateSolution } from '../hooks/useSolutions';

export function SolutionEditPage() {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id);
  const navigate = useNavigate();
  const { push } = useToast();
  const confirm = useConfirm();
  const { data, isLoading, isError } = useSolution(Number.isFinite(numId) ? numId : undefined);
  const update = useUpdateSolution(numId);
  const deactivate = useDeactivateSolution();

  if (!Number.isFinite(numId)) {
    return <div className="mx-auto max-w-3xl px-4 py-6">Invalid solution id.</div>;
  }

  return (
    <div>
      <PageHeader
        title={data?.name ? `Edit ${data.name}` : 'Edit solution'}
        actions={
          data ? (
            <Button
              variant="danger"
              disabled={!data.is_active}
              disabledReason={data.is_active ? undefined : 'Already inactive'}
              onClick={async () => {
                const ok = await confirm({
                  title: 'Deactivate solution?',
                  description: 'The solution will be hidden from active lists but existing links remain.',
                  confirmLabel: 'Deactivate',
                  danger: true,
                });
                if (!ok) return;
                await deactivate.mutateAsync(numId);
                push({ tone: 'success', message: 'Solution deactivated.' });
                navigate('/solutions');
              }}
            >
              Deactivate
            </Button>
          ) : null
        }
      >
        <Breadcrumbs
          items={[
            { label: 'Solutions', to: '/solutions' },
            { label: data?.name ?? `#${numId}` },
          ]}
        />
      </PageHeader>
      <div className="mx-auto max-w-3xl px-4 py-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isError || !data ? (
          <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-900">
            Failed to load solution.
          </div>
        ) : (
          <SolutionForm
            submitLabel="Save changes"
            initialValues={{
              name: data.name,
              category: data.category,
              description: data.description ?? '',
              instructions: data.instructions ?? '',
              typical_duration: data.typical_duration ?? '',
              is_active: data.is_active,
            }}
            onCancel={() => navigate('/solutions')}
            onSubmit={async (payload) => {
              await update.mutateAsync(payload);
              push({ tone: 'success', message: 'Solution updated.' });
              navigate('/solutions');
            }}
          />
        )}
      </div>
    </div>
  );
}
