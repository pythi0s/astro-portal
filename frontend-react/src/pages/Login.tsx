import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/auth/useAuth';
import { FullPageSpinner } from '@/components/FullPageSpinner';

export function Login() {
  const { login, isAuthenticated, isBooting } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const next = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset error when inputs change.
    if (error) setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  if (isBooting) {
    return <FullPageSpinner label="Restoring session" />;
  }

  if (isAuthenticated) {
    return <Navigate to={safeNext(next)} replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ email, password });
      navigate(safeNext(next), { replace: true });
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-midnight-900/5">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-midnight-900">Sign in to Astro Portal</h1>
          <p className="mt-1 text-sm text-midnight-700">
            Use your administrator-issued credentials.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-midnight-800">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-midnight-700/20 bg-white px-3 py-2 text-midnight-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40"
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-midnight-800">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-midnight-700/20 bg-white px-3 py-2 text-midnight-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40"
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            {error && (
              <div
                id="login-error"
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="flex w-full items-center justify-center rounded-md bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function safeNext(next: string): string {
  // Only allow same-origin absolute paths to prevent open-redirect abuse.
  if (!next.startsWith('/') || next.startsWith('//')) return '/';
  return next;
}

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 401) return 'Invalid email or password.';
    const detail = err.response?.data as { detail?: unknown } | undefined;
    if (detail && typeof detail.detail === 'string') return detail.detail;
    if (err.code === 'ECONNABORTED') return 'Request timed out. Try again.';
    if (!err.response) return 'Cannot reach the server. Check your connection.';
    return `Sign-in failed (HTTP ${err.response.status}).`;
  }
  return 'Sign-in failed. Try again.';
}
