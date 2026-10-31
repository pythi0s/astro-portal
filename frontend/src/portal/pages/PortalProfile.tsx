import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/Toast';
import { Skeleton } from '@/components/Skeleton';
import { errorMessage } from '@/lib/apiErrors';
import { getProfile, updateProfile } from '../api';
import {
  EMPTY_PROFILE,
  ProfileFields,
  portalFieldClass,
  profilePayload,
  profileToForm,
  type ProfileFormValues,
} from '../components/ProfileFields';
import { portalAppointmentKeys } from '../queryKeys';
import { usePortalAuthStore } from '../store';
import { portalPrimaryButtonClass } from './PortalAuthCard';

export function PortalProfile() {
  const qc = useQueryClient();
  const toast = useToast();
  const account = usePortalAuthStore((s) => s.account);
  const setAccount = usePortalAuthStore((s) => s.setAccount);
  const { data, isLoading, isError } = useQuery({
    queryKey: portalAppointmentKeys.profile,
    queryFn: getProfile,
  });

  const [name, setName] = useState('');
  const [values, setValues] = useState<ProfileFormValues>(EMPTY_PROFILE);
  const [remindersOptIn, setRemindersOptIn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setName(data.name);
      setValues(profileToForm(data));
      setRemindersOptIn(data.reminders_opt_in);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      qc.setQueryData(portalAppointmentKeys.profile, profile);
      if (account) setAccount({ ...account, name: profile.name, email: profile.email ?? null });
      toast.push({ tone: 'success', message: 'Your details have been saved.' });
    },
    onError: (err) => setError(errorMessage(err, 'Could not save your details.')),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setError(null);
    save.mutate({ name: name.trim(), reminders_opt_in: remindersOptIn, ...profilePayload(values) });
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">My profile</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-amber-950">Your details</h1>
        <p className="mt-1 text-sm text-amber-900/70">
          Keep your details up to date so Guruji can prepare for your visit.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : isError || !data ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Could not load your details. Please refresh the page.
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col gap-6 rounded-3xl border border-amber-200/80 bg-white/90 p-6 shadow-[0_24px_50px_-24px_rgba(146,64,14,0.35)] backdrop-blur-md sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-amber-900">
              Full name
              <input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className={portalFieldClass}
              />
            </label>
            <label className="block text-sm font-semibold text-amber-900">
              Mobile number
              <input name="phone" value={data.phone} readOnly disabled className={`${portalFieldClass} bg-amber-50/60 text-slate-500`} />
              <span className="mt-1 block text-xs font-normal text-amber-800/70">
                Your sign-in ID. Contact us to change it.
              </span>
            </label>
          </div>

          <ProfileFields values={values} onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))} />


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

          <div className="flex justify-end">
            <button type="submit" disabled={save.isPending} className={`${portalPrimaryButtonClass} sm:w-48`}>
              {save.isPending ? 'Saving…' : 'Save details'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
