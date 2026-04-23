export function AdminDemo() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-midnight-900/5">
        <h1 className="text-2xl font-semibold text-midnight-900">Admin-only area</h1>
        <p className="mt-2 text-sm text-midnight-700">
          This placeholder route is guarded by <code>RequireRole allow=['admin']</code>.
          Non-admin users are redirected to <code>/403</code>. Feature pages arrive in later steps.
        </p>
      </div>
    </div>
  );
}
