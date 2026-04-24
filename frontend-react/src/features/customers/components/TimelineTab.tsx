import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { formatDate, formatMoney, humanizeCategory } from '@/lib/format';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { customerKeys } from '../queryKeys';
import clsx from 'clsx';

interface VisitEvent {
  type: 'visit';
  date: string;
  id: number;
  consultation_type: string;
  fees: number;
  payment_status: string;
  problems_discussed: string | null;
  notes: string | null;
}

interface SolutionEvent {
  type: 'solution';
  date: string;
  id: number;
  solution_name: string;
  solution_category: string;
  status: string;
  notes: string | null;
}

interface MessageEvent {
  type: 'message';
  date: string;
  id: number;
  channel: string;
  subject: string | null;
  status: string;
}

type TimelineEvent = VisitEvent | SolutionEvent | MessageEvent;

async function fetchTimeline(customerId: number): Promise<TimelineEvent[]> {
  const { data } = await apiClient.get<TimelineEvent[]>(`/timeline/${customerId}`);
  return data;
}

export function TimelineTab({ customerId }: { customerId: number }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: customerKeys.timeline(customerId),
    queryFn: () => fetchTimeline(customerId),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-900">
        Failed to load timeline. Please refresh the page.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title="No timeline events yet" description="Visits, solutions, and messages will appear here." />;
  }

  return (
    <ol className="flex flex-col gap-3">
      {data.map((event) => (
        <li
          key={`${event.type}-${event.id}`}
          className="rounded-md border border-midnight-200 bg-white p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  'rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
                  event.type === 'visit' && 'bg-primary-100 text-primary-800',
                  event.type === 'solution' && 'bg-emerald-100 text-emerald-800',
                  event.type === 'message' && 'bg-amber-100 text-amber-800',
                )}
              >
                {event.type}
              </span>
              <p className="text-sm font-semibold text-midnight-900">{renderTitle(event)}</p>
            </div>
            <time className="text-xs text-midnight-700" dateTime={event.date}>
              {formatDate(event.date)}
            </time>
          </div>
          {renderSubtitle(event)}
        </li>
      ))}
    </ol>
  );
}

function renderTitle(event: TimelineEvent): string {
  if (event.type === 'visit') return humanizeCategory(event.consultation_type);
  if (event.type === 'solution') return event.solution_name;
  return event.subject ?? `${humanizeCategory(event.channel)} message`;
}

function renderSubtitle(event: TimelineEvent) {
  if (event.type === 'visit') {
    return (
      <p className="mt-1 text-sm text-midnight-700">
        {formatMoney(event.fees)} · {humanizeCategory(event.payment_status)}
        {event.problems_discussed ? <> · {truncate(event.problems_discussed)}</> : null}
      </p>
    );
  }
  if (event.type === 'solution') {
    return (
      <p className="mt-1 text-sm text-midnight-700">
        {humanizeCategory(event.solution_category)} · {humanizeCategory(event.status)}
        {event.notes ? <> · {truncate(event.notes)}</> : null}
      </p>
    );
  }
  return (
    <p className="mt-1 text-sm text-midnight-700">
      {humanizeCategory(event.channel)} · {humanizeCategory(event.status)}
    </p>
  );
}

function truncate(text: string, max = 120): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}
