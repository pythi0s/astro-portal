import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useToast } from '@/components/Toast';
import { CustomerForm } from '../components/CustomerForm';
import { useCreateCustomer } from '../hooks/useCustomerMutations';

export default function CustomerNewPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateCustomer();

  return (
    <>
      <PageHeader title="New customer">
        <Breadcrumbs
          items={[
            { label: 'Customers', to: '/customers' },
            { label: 'New' },
          ]}
        />
      </PageHeader>
      <div className="mx-auto max-w-3xl px-4 py-5">
        <CustomerForm
          cancelTo="/customers"
          submitLabel="Create customer"
          onSubmit={(payload) => create.mutateAsync(payload)}
          onSaved={(saved) => {
            toast.push({ tone: 'success', message: `Customer "${saved.name}" created.` });
            navigate(`/customers/${saved.id}`);
          }}
        />
      </div>
    </>
  );
}
