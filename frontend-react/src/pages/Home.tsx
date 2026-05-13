import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { humanizeEnum } from '@/lib/format';

/**
 * Legacy landing page. The app redirects `/` to `/dashboard`, so this is
 * rarely rendered directly — it stays as a simple account summary linked
 * from the top bar for debugging and as a soft landing for first-time
 * users before the dashboard loads.
 */
export function Home() {
  const { user, hasRole } = useAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-midnight-900/5">
        <h1 className="text-2xl font-semibold text-midnight-900">
          Welcome {user.full_name || user.email}
        </h1>
        <p className="mt-1 text-sm text-midnight-700">
          Role: <span className="font-medium">{humanizeEnum(user.role)}</span>
        </p>
        <p className="mt-4 text-sm text-midnight-700">
          Jump to the parts of the portal you use most often.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/dashboard"
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Revenue dashboard
          </Link>
          <Link
            to="/customers"
            className="rounded-md border border-midnight-200 bg-white px-4 py-2 text-sm font-medium text-midnight-800 hover:bg-midnight-700/5"
          >
            Customers
          </Link>
          <Link
            to="/visits"
            className="rounded-md border border-midnight-200 bg-white px-4 py-2 text-sm font-medium text-midnight-800 hover:bg-midnight-700/5"
          >
            Visits
          </Link>
          {hasRole('admin') ? (
            <Link
              to="/admin/users"
              className="rounded-md bg-midnight-900 px-4 py-2 text-sm font-medium text-white hover:bg-midnight-800"
            >
              Manage users
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
