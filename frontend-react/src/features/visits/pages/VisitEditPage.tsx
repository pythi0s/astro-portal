import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { LinkButton } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { VisitForm } from '../components/VisitForm';
import { useUpdateVisit, useVisit } from '../hooks/useVisits';

export default function VisitEditPage() {
  const { id } = useParams();
  const visitId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { data, isLoading, isError } = useVisit(visitId);
  const update = useUpdateVisit(visitId);

  if (isLoading || !Number.isFinite(visitId)) {
    return (
      <>
        <PageHeader title="Edit visit" />
        <div className="mx-auto max-w-3xl px-4 py-5">
          <Skeleton className="h-96 w-full" />
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="Edit visit" />
        <div className="mx-auto max-w-3xl px-4 py-5">
          <EmptyState
            title="Visit not found"
            action={<LinkButton href="/visits" variant="primary">Back to list</LinkButton>}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`Edit visit #${data.id}`}>
        <Breadcrumbs
          items={[
            { label: 'Visits', to: '/visits' },
            { label: `#${data.id}`, to: `/visits/${data.id}` },
            { label: 'Edit' },
          ]}
        />
      </PageHeader>
      <div className="mx-auto max-w-3xl px-4 py-5">
        <VisitForm
          mode="edit"
          initial={data}
          cancelTo={`/visits/${data.id}`}
          onSubmit={(payload) => update.mutateAsync(payload)}
          onSaved={() => {
            toast.push({ tone: 'success', message: 'Visit updated.' });
            navigate(`/visits/${data.id}`);
          }}
        />
      </div>
    </>
  );
}
