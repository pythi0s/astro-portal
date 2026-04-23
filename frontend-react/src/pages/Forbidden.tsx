import { Link } from 'react-router-dom';

export function Forbidden() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">403</p>
        <h1 className="mt-2 text-2xl font-semibold text-midnight-900">Access denied</h1>
        <p className="mt-2 text-sm text-midnight-700">
          You do not have permission to view this page. If you think this is a mistake,
          contact your administrator.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
