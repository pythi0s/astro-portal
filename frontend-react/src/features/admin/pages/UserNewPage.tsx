import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { FormRootError, TextField } from '@/components/FormField';
import { useToast } from '@/components/Toast';
import { applyServerErrors } from '@/lib/apiErrors';
import { emptyCreateUser, toCreatePayload, userCreateSchema, type UserCreateValues } from '../schema';
import { useCreateUser } from '../hooks/useAdmin';
import { UserRoleSelect } from '../components/UserRoleSelect';

export function UserNewPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const create = useCreateUser();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserCreateValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: emptyCreateUser,
  });

  async function submit(values: UserCreateValues) {
    try {
      const saved = await create.mutateAsync(toCreatePayload(values));
      push({ tone: 'success', message: `Created ${saved.email}.` });
      navigate(`/admin/users/${saved.id}`);
    } catch (err) {
      applyServerErrors(err, setError);
    }
  }

  return (
    <div>
      <PageHeader title="New user">
        <Breadcrumbs
          items={[
            { label: 'Admin', to: '/admin/users' },
            { label: 'Users', to: '/admin/users' },
            { label: 'New' },
          ]}
        />
      </PageHeader>
      <div className="mx-auto max-w-3xl px-4 py-6">
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
          <TextField
            label="Temporary password"
            type="password"
            required
            hint="Minimum 8 characters. Ask the user to change it on first login."
            error={errors.password?.message}
            autoComplete="new-password"
            {...register('password')}
          />
          <UserRoleSelect required error={errors.role?.message} {...register('role')} />

          <FormRootError message={errors.root?.serverError?.message as string | undefined} />

          <div className="flex items-center justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => navigate('/admin/users')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create user'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
