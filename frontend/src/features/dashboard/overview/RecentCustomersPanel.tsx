import { Link } from 'react-router-dom';
import { PanelShell } from '../PanelShell';
import type { DashboardOverview } from './types';

export function RecentCustomersPanel({
  data,
  isLoading,
  isError,
}: {
  data?: DashboardOverview;
  isLoading: boolean;
  isError: boolean;
}) {
  const rows = data?.recent_customers ?? [];
  return (
    <PanelShell
      title="Recently added customers"
      subtitle="Walk-ins added by staff and self-registrations from the portal"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && rows.length === 0}
      emptyLabel="No customers yet."
    >
      <ul className="divide-y divide-amber-100">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-400 text-xs font-bold text-white"
              >
                {c.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <Link to={`/customers/${c.id}`} className="block truncate text-sm font-semibold text-midnight-900 hover:underline">
                  {c.name}
                </Link>
                <span className="text-xs text-midnight-600">
                  {c.phone ?? 'No phone'} · {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
            <span
              className={
                c.self_registered
                  ? 'shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800'
                  : 'shrink-0 rounded-full bg-midnight-100 px-2.5 py-0.5 text-xs font-semibold text-midnight-700'
              }
            >
              {c.self_registered ? 'Portal' : 'Staff'}
            </span>
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}
