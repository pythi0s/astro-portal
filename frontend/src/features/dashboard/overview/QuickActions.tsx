import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { CalendarIcon, ClipboardIcon, UsersIcon } from '@/components/icons';
import { formatSlotLabel } from '@/portal/lib/slots';
import { minuteOfDay, parseIsoDate, sameDay } from '@/features/appointments/lib/calendar';
import type { DashboardOverview } from './types';

const BASE =
  'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400';
const PRIMARY = clsx(BASE, 'btn-glass bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30 hover:-translate-y-0.5');
const SECONDARY = clsx(BASE, 'btn-glass border border-amber-300 bg-white text-amber-900 hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50 hover:shadow-md hover:shadow-amber-500/20');

/** Minutes before a booking when "Start visit" replaces the generic "Record visit". */
const START_VISIT_LEAD_MINUTES = 60;

export function QuickActions({ data, now = new Date() }: { data?: DashboardOverview; now?: Date }) {
  const next = data?.next_appointment;
  const startsSoon =
    next &&
    sameDay(parseIsoDate(next.start_at), now) &&
    minuteOfDay(next.start_at) - (now.getHours() * 60 + now.getMinutes()) <= START_VISIT_LEAD_MINUTES;
  const firstName = next?.customer_name.split(/\s+/)[0];

  return (
    <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
      {startsSoon && next ? (
        <Link to={`/visits/new?customer_id=${next.customer_id}`} className={PRIMARY}>
          <ClipboardIcon className="h-4 w-4" />
          Start visit · {firstName} at {formatSlotLabel(minuteOfDay(next.start_at))}
        </Link>
      ) : (
        <Link to="/visits/new" className={PRIMARY}>
          <ClipboardIcon className="h-4 w-4" />
          Record visit
        </Link>
      )}
      <Link to="/customers/new" className={SECONDARY}>
        <UsersIcon className="h-4 w-4" />
        New customer
      </Link>
      {data && data.appointments_today > 0 ? (
        <Link to="/appointments?cal=day" className={SECONDARY}>
          <CalendarIcon className="h-4 w-4" />
          Today&apos;s schedule ({data.appointments_today})
        </Link>
      ) : null}
    </nav>
  );
}
