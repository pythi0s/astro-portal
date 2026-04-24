import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { FormRootError, TextField } from '@/components/FormField';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmProvider';
import { applyServerErrors } from '@/lib/apiErrors';
import { useAuth } from '@/auth/useAuth';
import { useDeactivateUser, useUpdateUser, useUser } from '../hooks/useAdmin';
import { toUpdatePayload, userUpdateSchema, type UserUpdateValues } from '../schema';
import { UserRoleSelect } from '../components/UserRoleSelect';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id);
  const navigate = useNavigate();
  const { push } = useToast();
  const confirm = useConfirm();
  const { user: current } = useAuth();

  const { data, isLoading, isError } = useUser(Number.isFinite(numId) ? numId : undefined);
  const update = useUpdateUser(numId);
  const deactivate = useDeactivateUser();

  const isSelf = current?.id === numId;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UserUpdateValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      email: '',
      full_name: '',
      phone: '',
      role: 'astrologer',
      is_active: true,
      new_password: '',
    },
    values: data
      ? {
          email: data.email,
          full_name: data.full_name,
          phone: data.phone ?? '',
          role: data.role,
          is_active: data.is_active,
          new_password: '',
        }
      : undefined,
  });

  if (!Number.isFinite(numId)) {
    return <div className="mx-auto max-w-3xl px-4 py-6">Invalid user id.</div>;
  }

  async function submit(values: UserUpdateValues) {
    try {
      const saved = await update.mutateAsync(toUpdatePayload(values));
      push({ tone: 'success', message: `Updated ${saved.email}.` });
      reset({
        email: saved.email,
        full_name: saved.full_name,
        phone: saved.phone ?? '',
        role: saved.role,
        is_active: saved.is_active,
        new_password: '',
      });
    } catch (err) {
      applyServerErrors(err, setError);
    }
  }

  return (
    <div>
      <PageHeader
        title={data ? `Edit ${data.full_name || data.email}` : 'Edit user'}
        actions={
          data?.is_active && !isSelf ? (
            <Button
              variant="danger"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Deactivate user?',
                  description: 'They will no longer be able to log in.',
                  confirmLabel: 'Deactivate',
                  danger: true,
                });
                if (!ok) return;
                await deactivate.mutateAsync(numId);
                push({ tone: 'success', message: 'User deactivated.' });
                navigate('/admin/users');
              }}
            >
              Deactivate
            </Button>
          ) : null
        }
      >
        <Breadcrumbs
          items={[
            { label: 'Admin', to: '/admin/users' },
            { label: 'Users', to: '/admin/users' },
            { label: data?.email ?? `#${numId}` },
          ]}
        />
      </PageHeader>
      <div className="mx-auto max-w-3xl px-4 py-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError || !data ? (
          <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-900">
            Failed to load user.
          </div>
        ) : (
          <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Full name"
              error={errors.full_name?.message}
              className="sm:col-span-2"
              {...register('full_name')}
            />
            <TextField
              label="Email"
              type="email"
              required
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />
            <TextField
              label="Phone"
              error={errors.phone?.message}
              autoComplete="tel"
              {...register('phone')}
            />
            <UserRoleSelect
              required
              error={errors.role?.message}
              disabled={isSelf}
              {...register('role')}
            />
            <label className="flex items-center gap-2">
              <input type="checkbox" disabled={isSelf} {...register('is_active')} />
              <span className="text-sm text-midnight-900">Active</span>
              {isSelf ? (
                <span className="text-xs text-midnight-600">(cannot deactivate yourself)</span>
              ) : null}
            </label>

            <TextField
              label="New password"
              type="password"
              hint="Leave blank to keep the current password."
              error={errors.new_password?.message}
              autoComplete="new-password"
              className="sm:col-span-2"
              {...register('new_password')}
            />

            <FormRootError message={errors.root?.serverError?.message as string | undefined} />

            <div className="flex items-center justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => navigate('/admin/users')}>
                Back
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
