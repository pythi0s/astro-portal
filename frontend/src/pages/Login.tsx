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

  if (isBooting) return <FullPageSpinner label="Restoring session" />;
  if (isAuthenticated) return <Navigate to={safeNext(next)} replace />;

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
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background:
          'radial-gradient(circle at 15% 10%, rgba(251,191,36,0.16) 0%, transparent 32%), radial-gradient(circle at 85% 90%, rgba(217,119,6,0.12) 0%, transparent 36%), linear-gradient(160deg, #fffef8 0%, #fef8df 45%, #fdecc2 100%)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{ opacity: 0.2 }}
      >
        <svg width="700" height="700" viewBox="0 0 600 600" className="animate-[mandala-spin_80s_linear_infinite]">
          <g fill="none" stroke="#d97706" strokeWidth="0.9">
            <circle cx="300" cy="300" r="280" />
            <circle cx="300" cy="300" r="240" />
            <circle cx="300" cy="300" r="200" />
            <circle cx="300" cy="300" r="160" />
            <circle cx="300" cy="300" r="120" />
            <circle cx="300" cy="300" r="80" />
            <circle cx="300" cy="300" r="40" />
            <line x1="300" y1="20" x2="300" y2="580" />
            <line x1="20" y1="300" x2="580" y2="300" />
            <line x1="60" y1="60" x2="540" y2="540" />
            <line x1="540" y1="60" x2="60" y2="540" />
            <line x1="20" y1="180" x2="580" y2="420" />
            <line x1="20" y1="420" x2="580" y2="180" />
            <line x1="180" y1="20" x2="420" y2="580" />
            <line x1="420" y1="20" x2="180" y2="580" />
          </g>
        </svg>
      </div>


      <div aria-hidden="true" className="pointer-events-none absolute -left-28 top-4 opacity-28">
        <svg width="320" height="320" viewBox="0 0 220 220" className="animate-[mandala-spin_90s_linear_infinite]">
          <g fill="none" stroke="#f5c56c" strokeWidth="0.9">
            <circle cx="110" cy="110" r="95" />
            <circle cx="110" cy="110" r="70" />
            <circle cx="110" cy="110" r="45" />
            <circle cx="110" cy="110" r="20" />
            <line x1="110" y1="15" x2="110" y2="205" />
            <line x1="15" y1="110" x2="205" y2="110" />
            <line x1="42" y1="42" x2="178" y2="178" />
            <line x1="178" y1="42" x2="42" y2="178" />
            <polygon points="110,26 160,110 110,194 60,110" transform="rotate(22.5 110 110)" />
          </g>
        </svg>
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-24 opacity-24">
        <svg width="380" height="380" viewBox="0 0 260 260" className="animate-[mandala-spin_70s_linear_infinite_reverse]">
          <g fill="none" stroke="#f2bb5e" strokeWidth="0.8">
            <circle cx="130" cy="130" r="112" />
            <circle cx="130" cy="130" r="84" />
            <circle cx="130" cy="130" r="56" />
            <polygon points="130,18 242,130 130,242 18,130" />
            <polygon points="130,42 218,130 130,218 42,130" transform="rotate(22.5 130 130)" />
            <circle cx="130" cy="130" r="8" fill="#f8d79a" fillOpacity="0.22" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <ellipse key={a} cx="130" cy="46" rx="8" ry="14" transform={`rotate(${a} 130 130)`} />
            ))}
          </g>
        </svg>
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute right-4 top-16 opacity-25">
        <svg width="250" height="250" viewBox="-90 -90 180 180" className="animate-[mandala-spin_50s_linear_infinite_reverse]">
          <g fill="none" stroke="#eabf7a" strokeWidth="0.9">
            <polygon points="0,-78 22,-22 78,0 22,22 0,78 -22,22 -78,0 -22,-22" />
            <polygon points="0,-58 16,-16 58,0 16,16 0,58 -16,16 -58,0 -16,-16" transform="rotate(22.5)" />
            <circle r="78" />
            <circle r="58" />
            <circle r="38" />
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <line key={a} x1="0" y1="-38" x2="0" y2="-78" transform={`rotate(${a})`} />
            ))}
          </g>
        </svg>
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-38">
        {/* Twinkling stars */}
        {[
          { x: '8%', y: '18%', r: 2.2 }, { x: '14%', y: '66%', r: 1.7 }, { x: '24%', y: '34%', r: 2.6 },
          { x: '34%', y: '12%', r: 1.9 }, { x: '41%', y: '78%', r: 2.3 }, { x: '52%', y: '24%', r: 1.8 },
          { x: '62%', y: '65%', r: 2.5 }, { x: '72%', y: '30%', r: 1.6 }, { x: '82%', y: '14%', r: 2.1 },
          { x: '88%', y: '54%', r: 2.4 }, { x: '76%', y: '82%', r: 1.9 }, { x: '57%', y: '88%', r: 1.7 },
        ].map((star, i) => (
          <span
            key={`star-${i}`}
            className="absolute rounded-full bg-amber-100 animate-[shimmer_4s_ease-in-out_infinite]"
            style={{ left: star.x, top: star.y, width: star.r * 2, height: star.r * 2, boxShadow: '0 0 14px rgba(255,244,200,0.88)', animationDelay: `${i * 220}ms` }}
          />
        ))}

        {/* Spiral galaxy */}
        <div className="absolute right-[11%] top-[8%]">
          <svg width="180" height="180" viewBox="-90 -90 180 180" className="animate-[mandala-spin_95s_linear_infinite]">
            <g fill="none" stroke="#d4a861" strokeWidth="1.1" opacity="0.55">
              <path d="M 0 0 C 28 -8 42 -30 36 -54 C 22 -78 -12 -84 -42 -68 C -70 -52 -84 -22 -76 8 C -66 42 -28 66 12 66 C 56 64 86 34 88 -10" />
              <path d="M 0 0 C -24 10 -38 30 -34 54 C -24 76 6 86 34 74 C 64 60 82 32 78 0 C 72 -34 42 -62 4 -66 C -40 -70 -76 -44 -88 -8" />
              <circle r="8" fill="#ffe3a9" fillOpacity="0.48" />
            </g>
          </svg>
        </div>

        {/* Galaxy cluster 2 */}
        <div className="absolute left-[6%] bottom-[16%]">
          <svg width="150" height="150" viewBox="-75 -75 150 150" className="animate-[mandala-spin_110s_linear_infinite_reverse]">
            <g fill="none" stroke="#d5b17b" strokeWidth="1" opacity="0.5">
              <path d="M 0 0 C 18 -6 28 -20 24 -35 C 14 -52 -8 -56 -26 -46 C -42 -36 -50 -16 -45 4 C -38 24 -16 38 8 38 C 34 36 50 20 52 -4" />
              <path d="M 0 0 C -16 8 -26 20 -23 34 C -16 48 4 54 22 46 C 38 38 48 18 45 0 C 40 -20 24 -36 4 -39 C -20 -42 -42 -27 -52 -7" />
              <circle r="6" fill="#ffe8bd" fillOpacity="0.45" />
            </g>
          </svg>
        </div>

        {/* Galaxy cluster 3 */}
        <div className="absolute right-[4%] bottom-[40%]">
          <svg width="120" height="120" viewBox="-60 -60 120 120" className="animate-[mandala-spin_102s_linear_infinite]">
            <g fill="none" stroke="#c9a36d" strokeWidth="0.95" opacity="0.46">
              <path d="M 0 0 C 15 -4 24 -14 21 -25 C 12 -36 -6 -39 -19 -32 C -31 -25 -36 -12 -33 2 C -27 17 -11 27 6 27 C 24 26 36 14 37 -3" />
              <path d="M 0 0 C -12 6 -20 14 -18 24 C -12 34 3 38 16 32 C 27 27 34 13 32 0 C 29 -14 17 -26 3 -28 C -15 -30 -30 -19 -37 -5" />
            </g>
          </svg>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-amber-200/80 bg-white/92 p-7 shadow-[0_22px_50px_rgba(146,64,14,0.18)] backdrop-blur-sm sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src="/vynkatesh_pratishthan_logo.png"
              alt="व्यंकटेश प्रतिष्ठाण"
              className="h-48 w-auto object-contain drop-shadow-md sm:h-60"
            />
              <h1 className="mt-4 px-2 text-center text-3xl font-extrabold leading-[1.35] text-amber-900 sm:text-4xl">
              व्यंकटेश प्रतिष्ठाण
            </h1>
            <p className="mt-2 text-sm font-medium tracking-wide text-amber-800/75">
              Management Portal
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-amber-900">
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
                  className="mt-1.5 block w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-300/60"
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-amber-900">
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
                  className="mt-1.5 block w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-300/60"
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>

              {error && (
                <div
                  id="login-error"
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !email || !password}
                className="btn-glass mt-1 flex w-full items-center justify-center rounded-lg border border-amber-500/60 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                  boxShadow: submitting ? 'none' : '0 8px 24px rgba(217,119,6,0.35)',
                }}
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
  }
  return 'Something went wrong. Please try again.';
}
