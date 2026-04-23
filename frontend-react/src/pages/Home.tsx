import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

export function Home() {
  const { user, hasRole } = useAuth();

  if (!user) return null; // guarded by RequireAuth; defensive.

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-midnight-900/5">
        <h1 className="text-2xl font-semibold text-midnight-900">
          Welcome {user.full_name || user.email}
        </h1>
        <p className="mt-1 text-sm text-midnight-700">
          Role: <span className="font-medium">{user.role}</span>
        </p>
        <p className="mt-4 text-sm text-midnight-700">
          Auth foundation is live. Feature pages land in Steps 4 and 5.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/admin-demo"
            className="rounded-md bg-midnight-800 px-4 py-2 text-sm font-medium text-white hover:bg-midnight-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-midnight-800"
          >
            Visit admin-only route
          </Link>
          {hasRole('admin') ? (
            <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
              Admin access
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-midnight-700/10 px-3 py-1 text-xs font-medium text-midnight-700">
              Standard access
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
