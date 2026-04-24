import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { LinkButton } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { CustomerForm } from '../components/CustomerForm';
import { PhotoUploader } from '../components/PhotoUploader';
import { KundaliUploader } from '../components/KundaliUploader';
import { useCustomer } from '../hooks/useCustomer';
import {
  useUpdateCustomer,
  useUploadKundali,
  useUploadPhoto,
} from '../hooks/useCustomerMutations';

export default function CustomerEditPage() {
  const { id } = useParams();
  const customerId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { data, isLoading, isError } = useCustomer(customerId);
  const update = useUpdateCustomer(customerId);
  const uploadPhoto = useUploadPhoto(customerId);
  const uploadKundali = useUploadKundali(customerId);

  if (isLoading || !Number.isFinite(customerId)) {
    return (
      <>
        <PageHeader title="Edit customer" />
        <div className="mx-auto max-w-3xl px-4 py-5">
          <Skeleton className="h-96 w-full" />
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="Edit customer" />
        <div className="mx-auto max-w-3xl px-4 py-5">
          <EmptyState
            title="Customer not found"
            action={<LinkButton href="/customers" variant="primary">Back to list</LinkButton>}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`Edit: ${data.name}`}>
        <Breadcrumbs
          items={[
            { label: 'Customers', to: '/customers' },
            { label: data.name, to: `/customers/${data.id}` },
            { label: 'Edit' },
          ]}
        />
      </PageHeader>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-5">
        <section className="rounded-md border border-midnight-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-midnight-600">Photo</h2>
          <div className="mt-3">
            <PhotoUploader
              currentPath={data.photo_path}
              onUpload={(file) => uploadPhoto.mutateAsync(file).then(() => undefined)}
            />
          </div>
        </section>
        <section className="rounded-md border border-midnight-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-midnight-600">Kundali</h2>
          <div className="mt-3">
            <KundaliUploader
              currentFilePath={data.kundali_file_path}
              currentOriginalName={data.kundali_original_name}
              onUpload={(file) => uploadKundali.mutateAsync(file).then(() => undefined)}
            />
          </div>
        </section>

        <CustomerForm
          initialValues={data}
          cancelTo={`/customers/${data.id}`}
          submitLabel="Save changes"
          onSubmit={(payload) => update.mutateAsync(payload)}
          onSaved={() => {
            toast.push({ tone: 'success', message: 'Customer updated.' });
            navigate(`/customers/${data.id}`);
          }}
        />
      </div>
    </>
  );
}
