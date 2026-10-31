import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { errorMessage } from '@/lib/apiErrors';
import { portalMe, portalRegister } from '../api';
import { usePortalAuthStore } from '../store';
import {
  EMPTY_PROFILE,
  ProfileFields,
  profilePayload,
  type ProfileFormValues,
} from '../components/ProfileFields';
import { PortalAuthCard, portalInputClass, portalPrimaryButtonClass } from './PortalAuthCard';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MOBILE_RE = /^\+?[\d\s\-()]{10,16}$/;

export function PortalRegister() {
  const account = usePortalAuthStore((s) => s.account);
  const setToken = usePortalAuthStore((s) => s.setToken);
  const setAccount = usePortalAuthStore((s) => s.setAccount);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', phone: '', password: '', confirm: '' });
  const [profile, setProfile] = useState<ProfileFormValues>(EMPTY_PROFILE);
  const [remindersOptIn, setRemindersOptIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (account) return <Navigate to="/portal/appointments" replace />;

  function validate(): string | null {
    if (!form.name.trim()) return 'Please enter your name.';
    if (!MOBILE_RE.test(form.phone.trim())) return 'Please enter a valid 10-digit mobile number.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirm) return 'Passwords do not match.';
    if (profile.email.trim() && !EMAIL_RE.test(profile.email.trim())) return 'Please enter a valid email address.';
    return null;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const extras = Object.fromEntries(
        Object.entries(profilePayload(profile)).filter(([, v]) => v !== null),
      );
      const { access_token } = await portalRegister({
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password,
        ...extras,
        ...(remindersOptIn ? {} : { reminders_opt_in: false }),
      });
      setToken(access_token);
      setAccount(await portalMe());
      navigate('/portal/book', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Unable to create your account. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setError(null);
    },
    className: portalInputClass,
  });

  return (
    <PortalAuthCard
      wide
      title="Create your account"
      subtitle="Register once to book your visit with Guruji. Only the first section is required."
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        <fieldset className="rounded-2xl border border-amber-300/70 bg-white p-4 shadow-sm sm:p-5">
          <legend className="px-1 text-sm font-bold text-amber-950">
            Account details{' '}
            <span className="ml-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              Required
            </span>
          </legend>
          <div className="mt-1 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-amber-900">
              Full name
              <input name="name" autoComplete="name" required {...field('name')} />
            </label>
            <label className="block text-sm font-semibold text-amber-900">
              Mobile number
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="98765 43210"
                required
                {...field('phone')}
              />
              <span className="mt-1 block text-xs font-normal text-amber-800/70">
                You&apos;ll use this to sign in.
              </span>
            </label>
            <label className="block text-sm font-semibold text-amber-900">
              Password
              <input name="password" type="password" autoComplete="new-password" required {...field('password')} />
              <span className="mt-1 block text-xs font-normal text-amber-800/70">At least 8 characters.</span>
            </label>
            <label className="block text-sm font-semibold text-amber-900">
              Confirm password
              <input name="confirm" type="password" autoComplete="new-password" required {...field('confirm')} />
            </label>
          </div>
        </fieldset>

        <ProfileFields
          values={profile}
          onChange={(key, value) => {
            setProfile((p) => ({ ...p, [key]: value }));
            setError(null);
          }}
        />


        <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-white p-4 text-sm text-amber-950">
          <input
            type="checkbox"
            name="reminders_opt_in"
            checked={remindersOptIn}
            onChange={(e) => setRemindersOptIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-amber-500"
          />
          <span className="font-semibold">
            Send me booking confirmations and reminders
            <span className="block text-xs font-normal text-amber-900/70">
              On WhatsApp (and email, if provided) so you never miss your visit with Guruji. You can turn this off
              any time from your profile.
            </span>
          </span>
        </label>

        {error ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-amber-900">
            Already registered?{' '}
            <Link to="/portal/login" className="font-semibold text-amber-700 underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
          <button type="submit" disabled={submitting} className={`${portalPrimaryButtonClass} sm:w-56`}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </div>
      </form>
    </PortalAuthCard>
  );
}
