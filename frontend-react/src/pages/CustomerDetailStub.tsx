import { Link, useParams } from 'react-router-dom';

/**
 * Placeholder for the Step-5 customer detail page. Exists so the Recent
 * Visits panel on the dashboard can link to a real, non-crashing route
 * before Step 5 builds out the full customer UI.
 */
export function CustomerDetailStub() {
  const { id } = useParams<{ id: string }>();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-xl font-bold text-midnight-900">Customer #{id}</h1>
      <p className="mt-2 text-sm text-midnight-700">
        The customer detail page ships in Step 5. This placeholder keeps the
        revenue dashboard&apos;s recent-visits links navigable without JS errors.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
