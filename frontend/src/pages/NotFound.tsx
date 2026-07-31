import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-midnight-700">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-midnight-900">Page not found</h1>
        <p className="mt-2 text-sm text-midnight-700">
          The page you are looking for does not exist or has moved.
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
