import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button, LinkButton } from '@/components/Button';
import { Tabs } from '@/components/Tabs';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, formatMoney, humanizeCategory } from '@/lib/format';
import { useConfirm } from '@/components/ConfirmProvider';
import { useToast } from '@/components/Toast';
import { errorMessage } from '@/lib/apiErrors';
import { useCustomer, useCustomerVisits } from '../hooks/useCustomer';
import { useDeactivateCustomer } from '../hooks/useCustomerMutations';
import { TimelineTab } from '../components/TimelineTab';
import { SolutionsTab } from '../components/SolutionsTab';
import type { Customer } from '../types';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const customerId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, isLoading, isError } = useCustomer(customerId);
  const deactivate = useDeactivateCustomer();

  async function onDeactivate() {
    if (!data) return;
    const ok = await confirm({
      title: 'Deactivate this customer?',
      description:
        'Their profile and history will remain but they will no longer appear in the default Active list. You can re-activate from the Deactivated filter.',
      confirmLabel: 'Deactivate',
      danger: true,
    });
    if (!ok) return;
    try {
      await deactivate.mutateAsync(customerId);
      toast.push({ tone: 'success', message: 'Customer deactivated.' });
      navigate('/customers');
    } catch (err) {
      toast.push({ tone: 'error', message: errorMessage(err, 'Failed to deactivate.') });
    }
  }

  if (isLoading || !Number.isFinite(customerId)) {
    return (
      <>
        <PageHeader title="Customer">
          <Breadcrumbs items={[{ label: 'Customers', to: '/customers' }, { label: 'Loading…' }]} />
        </PageHeader>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="Customer">
          <Breadcrumbs items={[{ label: 'Customers', to: '/customers' }, { label: 'Not found' }]} />
        </PageHeader>
        <div className="mx-auto max-w-6xl px-4 py-5">
          <EmptyState
            title="Customer not found"
            description="This customer may have been deleted or you may not have access."
            action={<LinkButton href="/customers" variant="primary">Back to list</LinkButton>}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={data.name}
        description={data.city ? `${data.city}${data.state ? `, ${data.state}` : ''}` : undefined}
        actions={
          <>
            <LinkButton href={`/visits/new?customer_id=${data.id}`}>Add visit</LinkButton>
            <LinkButton href={`/customers/${data.id}/edit`} variant="primary">
              Edit
            </LinkButton>
            <Button
              variant="danger"
              onClick={onDeactivate}
              disabled={!data.is_active || deactivate.isPending}
              disabledReason={!data.is_active ? 'Customer already deactivated' : undefined}
            >
              {deactivate.isPending ? 'Deactivating…' : 'Deactivate'}
            </Button>
          </>
        }
      >
        <Breadcrumbs
          items={[{ label: 'Customers', to: '/customers' }, { label: data.name }]}
        />
      </PageHeader>

      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-5">
        <Tabs
          ariaLabel="Customer details tabs"
          tabs={[
            { id: 'details', label: 'Details', content: <DetailsTab customer={data} /> },
            {
              id: 'timeline',
              label: 'Timeline',
              content: <TimelineTab customerId={customerId} />,
            },
            {
              id: 'solutions',
              label: 'Solutions',
              count: data.customer_solutions?.length,
              content: <SolutionsTab customerId={customerId} />,
            },
            {
              id: 'visits',
              label: 'Visits',
              count: data.visits?.length,
              content: <VisitsTab customerId={customerId} />,
            },
          ]}
        />
      </div>
    </>
  );
}

function DetailsTab({ customer }: { customer: Customer }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <InfoCard title="Contact">
        <Row label="Email" value={customer.email} />
        <Row label="Phone" value={customer.phone} />
        <Row label="Gender" value={customer.gender} />
      </InfoCard>
      <InfoCard title="Birth">
        <Row label="Date" value={customer.date_of_birth ? formatDate(customer.date_of_birth) : null} />
        <Row label="Time" value={customer.birth_time} />
        <Row label="Place" value={customer.birth_place} />
      </InfoCard>
      <InfoCard title="Address">
        <Row label="Address" value={customer.address} />
        <Row label="City" value={customer.city} />
        <Row label="State" value={customer.state} />
        <Row label="Pincode" value={customer.pincode} />
      </InfoCard>
      <InfoCard title="Astrological">
        <Row label="Rashi" value={customer.rashi} />
        <Row label="Nakshatra" value={customer.nakshatra} />
        <Row label="Gotra" value={customer.gotra} />
        <Row label="Lagna" value={customer.lagna} />
      </InfoCard>
      {customer.notes ? (
        <InfoCard title="Notes" className="sm:col-span-2">
          <p className="text-sm text-midnight-900">{customer.notes}</p>
        </InfoCard>
      ) : null}
    </div>
  );
}

function VisitsTab({ customerId }: { customerId: number }) {
  const { data, isLoading, isError } = useCustomerVisits(customerId);
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }
  if (isError) {
    return (
      <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-900">
        Failed to load visits.
      </div>
    );
  }
  if (!data || data.length === 0) {
    return <EmptyState title="No visits yet" action={<LinkButton href={`/visits/new?customer_id=${customerId}`} variant="primary">Add first visit</LinkButton>} />;
  }
  return (
    <ol className="flex flex-col gap-2">
      {data.map((v) => (
        <li key={v.id} className="rounded-md border border-midnight-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-midnight-900">
              {humanizeCategory(v.consultation_type)}
            </p>
            <time className="text-xs text-midnight-700" dateTime={v.visit_date}>
              {formatDate(v.visit_date)}
            </time>
          </div>
          <p className="mt-1 text-sm text-midnight-700">
            {formatMoney(v.fees)} · {humanizeCategory(v.payment_status)}
          </p>
        </li>
      ))}
    </ol>
  );
}

function InfoCard({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-md border border-midnight-200 bg-white p-4 ${className ?? ''}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-midnight-600">{title}</h3>
      <dl className="mt-2 flex flex-col gap-1">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <dt className="w-24 flex-shrink-0 text-midnight-600">{label}</dt>
      <dd className="flex-1 text-midnight-900">{value || <span className="text-midnight-500">—</span>}</dd>
    </div>
  );
}
