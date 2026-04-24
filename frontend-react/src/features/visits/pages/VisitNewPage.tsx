import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useToast } from '@/components/Toast';
import { getCustomer } from '@/features/customers/api';
import { customerKeys } from '@/features/customers/queryKeys';
import { VisitForm } from '../components/VisitForm';
import { useCreateVisit } from '../hooks/useVisits';

export default function VisitNewPage() {
  const [params] = useSearchParams();
  const customerParam = params.get('customer_id');
  const customerId = customerParam ? Number(customerParam) : 0;
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateVisit();

  const { data: customer } = useQuery({
    queryKey: customerId ? customerKeys.detail(customerId) : ['customers', 'detail', 'picker'],
    queryFn: () => getCustomer(customerId),
    enabled: !!customerId,
  });

  return (
    <>
      <PageHeader title="New visit">
        <Breadcrumbs items={[{ label: 'Visits', to: '/visits' }, { label: 'New' }]} />
      </PageHeader>
      <div className="mx-auto max-w-3xl px-4 py-5">
        <VisitForm
          mode="create"
          lockedCustomerId={customerId || undefined}
          lockedCustomerLabel={customer ? `${customer.name}${customer.phone ? ` · ${customer.phone}` : ''}` : undefined}
          cancelTo={customerId ? `/customers/${customerId}` : '/visits'}
          onSubmit={(payload) => create.mutateAsync(payload)}
          onSaved={(saved) => {
            toast.push({ tone: 'success', message: 'Visit created.' });
            navigate(`/visits/${saved.id}`);
          }}
        />
      </div>
    </>
  );
}
