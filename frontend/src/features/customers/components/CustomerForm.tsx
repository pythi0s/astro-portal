import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { FormRootError, SelectField, TextArea, TextField } from '@/components/FormField';
import { applyServerErrors } from '@/lib/apiErrors';
import { customerFormSchema, emptyCustomerForm, toApiPayload, type CustomerFormValues } from '../schema';
import type { Customer } from '../types';
import { GENDERS } from '../types';

interface Props {
  initialValues?: Customer;
  /** Sent the `CustomerCreate` / `CustomerUpdate` payload. */
  onSubmit: (payload: Record<string, unknown>) => Promise<Customer>;
  /** Called on success with the saved customer. */
  onSaved?: (c: Customer) => void;
  /** Where to return on cancel. */
  cancelTo: string;
  submitLabel?: string;
}

export function CustomerForm({ initialValues, onSubmit, onSaved, cancelTo, submitLabel = 'Save' }: Props) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: initialValues ? toFormValues(initialValues) : emptyCustomerForm,
  });

  async function submit(values: CustomerFormValues) {
    try {
      const payload = toApiPayload(values);
      const saved = await onSubmit(payload);
      onSaved?.(saved);
    } catch (err) {
      applyServerErrors<CustomerFormValues>(err, setError, {
        fallbackMessage: 'Failed to save customer. Please try again.',
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6" noValidate>
      <FormRootError message={errors.root?.serverError?.message as string | undefined} />

      <section aria-label="Personal details" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Full name"
          required
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Phone"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <SelectField
          label="Gender"
          error={errors.gender?.message}
          defaultValue=""
          {...register('gender')}
        >
          <option value="">—</option>
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Date of birth"
          type="date"
          error={errors.date_of_birth?.message}
          {...register('date_of_birth')}
        />
        <TextField
          label="Birth time"
          type="time"
          error={errors.birth_time?.message}
          {...register('birth_time')}
        />
        <TextField
          label="Birth place"
          error={errors.birth_place?.message}
          {...register('birth_place')}
        />
        <TextField
          label="Occupation"
          error={errors.occupation?.message}
          {...register('occupation')}
        />
        <TextField
          label="Marital status"
          error={errors.marital_status?.message}
          {...register('marital_status')}
        />
      </section>

      <section aria-label="Address" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextArea
          label="Address"
          rows={2}
          className="sm:col-span-2"
          error={errors.address?.message}
          {...register('address')}
        />
        <TextField label="City" error={errors.city?.message} {...register('city')} />
        <TextField label="State" error={errors.state?.message} {...register('state')} />
        <TextField label="Pincode" error={errors.pincode?.message} {...register('pincode')} />
      </section>

      <section aria-label="Astrological" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Rashi" error={errors.rashi?.message} {...register('rashi')} />
        <TextField label="Nakshatra" error={errors.nakshatra?.message} {...register('nakshatra')} />
        <TextField label="Gotra" error={errors.gotra?.message} {...register('gotra')} />
        <TextField label="Lagna" error={errors.lagna?.message} {...register('lagna')} />
      </section>

      <section>
        <TextArea label="Notes" rows={4} error={errors.notes?.message} {...register('notes')} />
      </section>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => navigate(cancelTo)}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function toFormValues(c: Customer): CustomerFormValues {
  return {
    name: c.name ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    gender: (c.gender as string | null) ?? '',
    date_of_birth: c.date_of_birth ?? '',
    birth_time: c.birth_time ?? '',
    birth_place: c.birth_place ?? '',
    occupation: c.occupation ?? '',
    marital_status: c.marital_status ?? '',
    address: c.address ?? '',
    city: c.city ?? '',
    state: c.state ?? '',
    pincode: c.pincode ?? '',
    rashi: c.rashi ?? '',
    nakshatra: c.nakshatra ?? '',
    gotra: c.gotra ?? '',
    lagna: c.lagna ?? '',
    notes: c.notes ?? '',
  };
}
