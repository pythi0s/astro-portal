import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { errorMessage } from '@/lib/apiErrors';
import { portalLogin, portalMe } from '../api';
import { usePortalAuthStore } from '../store';
import { safePortalNext } from '../lib/next';
import { PortalAuthCard, portalInputClass, portalPrimaryButtonClass } from './PortalAuthCard';

export function PortalLogin() {
  const account = usePortalAuthStore((s) => s.account);
  const setToken = usePortalAuthStore((s) => s.setToken);
  const setAccount = usePortalAuthStore((s) => s.setAccount);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safePortalNext(params.get('next'));

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (account) return <Navigate to={next} replace />;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { access_token } = await portalLogin(identifier.trim(), password);
      setToken(access_token);
      setAccount(await portalMe());
      navigate(next, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Unable to sign in. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PortalAuthCard title="Welcome back" subtitle="Sign in to book and manage your visits with Guruji">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <label className="block text-sm font-semibold text-amber-900">
          Mobile number or email
          <input
            name="identifier"
            autoComplete="username"
            placeholder="98765 43210"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={portalInputClass}
          />
        </label>
        <label className="block text-sm font-semibold text-amber-900">
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={portalInputClass}
          />
        </label>
        {error ? (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error === 'Invalid credentials' ? 'Invalid mobile number/email or password.' : error}
          </div>
        ) : null}
        <button type="submit" disabled={submitting || !identifier.trim() || !password} className={portalPrimaryButtonClass}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-amber-900">
        New here?{' '}
        <Link to="/portal/register" className="font-semibold text-amber-700 underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>
    </PortalAuthCard>
  );
}
