import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { FormRootError, TextField } from '@/components/FormField';
import { useToast } from '@/components/Toast';
import { applyServerErrors } from '@/lib/apiErrors';
import { humanizeEnum } from '@/lib/format';
import { useAuth } from '@/auth/useAuth';
import {
  changePasswordSchema,
  profileSchema,
  toProfilePayload,
  type ChangePasswordValues,
  type ProfileValues,
} from '../schema';
import { useChangePassword, useUpdateProfile } from '../hooks/useProfile';

export function ProfilePage() {
  const { user } = useAuth();
  const { push } = useToast();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setError: setProfileError,
    formState: { errors: profileErrors, isSubmitting: isSavingProfile, isDirty: profileDirty },
    reset: resetProfile,
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: user
      ? {
          full_name: user.full_name ?? '',
          phone: user.phone ?? '',
        }
      : undefined,
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    setError: setPasswordError,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isChangingPassword },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  async function onSaveProfile(values: ProfileValues) {
    try {
      await updateProfile.mutateAsync(toProfilePayload(values));
      push({ tone: 'success', message: 'Profile updated.' });
      resetProfile({
        full_name: values.full_name.trim(),
        phone: values.phone?.trim() ?? '',
      });
    } catch (err) {
      applyServerErrors(err, setProfileError);
    }
  }

  async function onChangePassword(values: ChangePasswordValues) {
    try {
      await changePassword.mutateAsync({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      push({ tone: 'success', message: 'Password changed.' });
      resetPassword({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      applyServerErrors(err, setPasswordError);
    }
  }

  return (
    <div>
      <PageHeader title="Your profile" description="Update your display name, phone, and password." />
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-4 py-6 sm:grid-cols-2">
        <section className="space-y-3 rounded-md border border-midnight-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-midnight-900">Account</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-midnight-600">Email</dt>
            <dd className="text-midnight-900">{user?.email ?? '—'}</dd>
            <dt className="text-midnight-600">Role</dt>
            <dd className="text-midnight-900">{user ? humanizeEnum(user.role) : '—'}</dd>
          </dl>
          <p className="text-xs text-midnight-600">
            Email and role can only be changed by an admin.
          </p>
        </section>

        <form
          onSubmit={handleProfileSubmit(onSaveProfile)}
          className="space-y-3 rounded-md border border-midnight-200 bg-white p-4"
        >
          <h2 className="text-sm font-semibold text-midnight-900">Personal details</h2>
          <TextField
            label="Full name"
            error={profileErrors.full_name?.message}
            {...registerProfile('full_name')}
          />
          <TextField
            label="Phone"
            error={profileErrors.phone?.message}
            autoComplete="tel"
            {...registerProfile('phone')}
          />
          <FormRootError message={profileErrors.root?.serverError?.message as string | undefined} />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={isSavingProfile || !profileDirty}>
              {isSavingProfile ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>

        <form
          onSubmit={handlePasswordSubmit(onChangePassword)}
          className="space-y-3 rounded-md border border-midnight-200 bg-white p-4 sm:col-span-2"
        >
          <h2 className="text-sm font-semibold text-midnight-900">Change password</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TextField
              label="Current password"
              type="password"
              required
              error={passwordErrors.current_password?.message}
              autoComplete="current-password"
              {...registerPassword('current_password')}
            />
            <TextField
              label="New password"
              type="password"
              required
              error={passwordErrors.new_password?.message}
              autoComplete="new-password"
              {...registerPassword('new_password')}
            />
            <TextField
              label="Confirm new password"
              type="password"
              required
              error={passwordErrors.confirm_password?.message}
              autoComplete="new-password"
              {...registerPassword('confirm_password')}
            />
          </div>
          <FormRootError message={passwordErrors.root?.serverError?.message as string | undefined} />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={isChangingPassword}>
              {isChangingPassword ? 'Updating…' : 'Change password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
