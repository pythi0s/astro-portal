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
    <div
      className="mandala-bg flex min-h-screen items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #1A0A2E 0%, #2d1555 40%, #3d1f70 70%, #4c2889 100%)' }}
    >
      {/* Mandala decorative ring */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-10"
      >
        <svg width="700" height="700" viewBox="0 0 600 600" className="animate-[mandala-spin_80s_linear_infinite]">
          <g fill="none" stroke="#D4AF37" strokeWidth="0.8">
            <circle cx="300" cy="300" r="280" />
            <circle cx="300" cy="300" r="240" />
            <circle cx="300" cy="300" r="200" />
            <circle cx="300" cy="300" r="160" />
            <circle cx="300" cy="300" r="120" />
            <circle cx="300" cy="300" r="80"  />
            <circle cx="300" cy="300" r="40"  />
            <line x1="300" y1="20"  x2="300" y2="580" />
            <line x1="20"  y1="300" x2="580" y2="300" />
            <line x1="60"  y1="60"  x2="540" y2="540" />
            <line x1="540" y1="60"  x2="60"  y2="540" />
            <line x1="20"  y1="180" x2="580" y2="420" />
            <line x1="20"  y1="420" x2="580" y2="180" />
            <line x1="180" y1="20"  x2="420" y2="580" />
            <line x1="420" y1="20"  x2="180" y2="580" />
          </g>
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Glassmorphism card */}
        <div className="rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-gold-400/20">
          {/* Logo mark */}
          <div className="mb-6 flex flex-col items-center text-center">
            <span aria-hidden="true" className="text-4xl text-gold-400 drop-shadow-lg">✦</span>
            <h1 className="mt-2 text-2xl font-bold tracking-wide text-cream-50">Astro Portal</h1>
            <p className="mt-1 text-sm text-cream-50/90">Sign in with your administrator credentials</p>
          </div>

          <form onSubmit={onSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-cream-50">
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
                  className="mt-1 block w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-cream-50 placeholder-cream-100/30 shadow-sm outline-none backdrop-blur-sm transition focus:border-saffron-400/60 focus:ring-2 focus:ring-saffron-400/40"
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-cream-50">
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
                  className="mt-1 block w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-cream-50 placeholder-cream-100/30 shadow-sm outline-none backdrop-blur-sm transition focus:border-saffron-400/60 focus:ring-2 focus:ring-saffron-400/40"
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>

              {error && (
                <div
                  id="login-error"
                  role="alert"
                  className="rounded-lg border border-crimson-400/40 bg-crimson-500/20 px-3 py-2 text-sm text-rose-100 backdrop-blur-sm"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !email || !password}
                className="mt-2 flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron-400 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FFB830 0%, #FF8C00 100%)', boxShadow: submitting ? 'none' : '0 4px 20px rgba(255,140,0,0.4)' }}
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function safeNext(next: string): string {
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
