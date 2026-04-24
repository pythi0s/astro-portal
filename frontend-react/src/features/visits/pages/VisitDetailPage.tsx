import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button, LinkButton } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { useConfirm } from '@/components/ConfirmProvider';
import { useToast } from '@/components/Toast';
import { formatDate, formatMoney, humanizeCategory } from '@/lib/format';
import { errorMessage } from '@/lib/apiErrors';
import { useDeactivateVisit, useVisit } from '../hooks/useVisits';
import { PaymentStatusBadge } from '../components/PaymentStatusBadge';

export default function VisitDetailPage() {
  const { id } = useParams();
  const visitId = Number(id);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const { data, isLoading, isError } = useVisit(visitId);
  const deactivate = useDeactivateVisit();

  async function onDelete() {
    if (!data) return;
    const ok = await confirm({
      title: 'Deactivate this visit?',
      description: 'It will disappear from the default list but remain in the customer history.',
      confirmLabel: 'Deactivate',
      danger: true,
    });
    if (!ok) return;
    try {
      await deactivate.mutateAsync(visitId);
      toast.push({ tone: 'success', message: 'Visit deactivated.' });
      navigate('/visits');
    } catch (err) {
      toast.push({ tone: 'error', message: errorMessage(err, 'Failed to deactivate.') });
    }
  }

  if (isLoading || !Number.isFinite(visitId)) {
    return (
      <>
        <PageHeader title="Visit" />
        <div className="mx-auto max-w-3xl px-4 py-5">
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="Visit" />
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
      <PageHeader
        title={`Visit #${data.id}`}
        description={`${humanizeCategory(data.consultation_type)} on ${formatDate(data.visit_date)}`}
        actions={
          <>
            <LinkButton href={`/visits/${data.id}/edit`} variant="primary">
              Edit
            </LinkButton>
            <Button variant="danger" onClick={onDelete} disabled={deactivate.isPending}>
              {deactivate.isPending ? 'Deactivating…' : 'Deactivate'}
            </Button>
          </>
        }
      >
        <Breadcrumbs
          items={[
            { label: 'Visits', to: '/visits' },
            { label: `#${data.id}` },
          ]}
        />
      </PageHeader>

      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5">
        <section className="rounded-md border border-midnight-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoBlock
              label="Customer"
              value={
                <Link
                  to={`/customers/${data.customer_id}`}
                  className="text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  #{data.customer_id}
                </Link>
              }
            />
            <InfoBlock label="Fees" value={formatMoney(data.fees)} />
            <InfoBlock label="Payment" value={<PaymentStatusBadge status={data.payment_status} />} />
            <InfoBlock label="Method" value={data.payment_method ? humanizeCategory(data.payment_method) : '—'} />
            <InfoBlock
              label="Follow-up"
              value={data.follow_up_date ? formatDate(data.follow_up_date) : '—'}
            />
            <InfoBlock label="Created" value={formatDate(data.created_at)} />
          </div>
        </section>

        {data.problems_discussed || data.analysis || data.recommendations || data.notes ? (
          <section className="rounded-md border border-midnight-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-midnight-600">Consultation</h2>
            <dl className="mt-3 flex flex-col gap-3">
              <LongRow label="Problems discussed" value={data.problems_discussed} />
              <LongRow label="Analysis" value={data.analysis} />
              <LongRow label="Recommendations" value={data.recommendations} />
              <LongRow label="Notes" value={data.notes} />
            </dl>
          </section>
        ) : null}

        {data.solutions && data.solutions.length > 0 ? (
          <section className="rounded-md border border-midnight-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-midnight-600">Solutions given</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {data.solutions.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/solutions/${s.id}/edit`}
                    className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-sm text-primary-800 hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    {s.name}
                    <span className="ml-1 text-xs text-primary-700">
                      · {humanizeCategory(s.category)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}

function InfoBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-midnight-600">{label}</p>
      <p className="mt-1 text-sm text-midnight-900">{value}</p>
    </div>
  );
}

function LongRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-midnight-600">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-midnight-900">{value}</dd>
    </div>
  );
}
