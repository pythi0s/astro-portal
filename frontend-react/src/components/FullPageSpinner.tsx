interface FullPageSpinnerProps {
  label?: string;
}

export function FullPageSpinner({ label = 'Loading' }: FullPageSpinnerProps) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-white"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-midnight-700">{label}…</p>
      </div>
    </div>
  );
}
