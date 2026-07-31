import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { FormRootError, SelectField, TextArea, TextField } from '@/components/FormField';
import { applyServerErrors } from '@/lib/apiErrors';
import {
  CONSULTATION_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type VisitRow,
} from '../types';
import {
  emptyVisitForm,
  toCreatePayload,
  toUpdatePayload,
  visitFormSchema,
  type VisitFormValues,
} from '../schema';
import { CustomerPicker } from './CustomerPicker';
import { SolutionPicker } from './SolutionPicker';
import { humanizeCategory } from '@/lib/format';

interface Props {
  mode: 'create' | 'edit';
  initial?: VisitRow;
  /**
   * For the create form: pre-fill customer_id from query. The picker becomes
   * read-only and shows the provided label.
   */
  lockedCustomerId?: number;
  lockedCustomerLabel?: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<VisitRow>;
  onSaved?: (v: VisitRow) => void;
  cancelTo: string;
}

export function VisitForm({
  mode,
  initial,
  lockedCustomerId,
  lockedCustomerLabel,
  onSubmit,
  onSaved,
  cancelTo,
}: Props) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: initial
      ? toFormValues(initial)
      : { ...emptyVisitForm, customer_id: lockedCustomerId ?? 0 },
  });

  async function submit(values: VisitFormValues) {
    try {
      const payload = mode === 'create' ? toCreatePayload(values) : toUpdatePayload(values);
      const saved = await onSubmit(payload);
      onSaved?.(saved);
    } catch (err) {
      applyServerErrors<VisitFormValues>(err, setError, {
        fallbackMessage: 'Failed to save visit. Please try again.',
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6" noValidate>
      <FormRootError message={errors.root?.serverError?.message as string | undefined} />

      {mode === 'create' ? (
        <Controller
          name="customer_id"
          control={control}
          render={({ field }) => (
            <CustomerPicker
              value={field.value}
              onChange={field.onChange}
              lockedLabel={lockedCustomerId ? lockedCustomerLabel : undefined}
              error={errors.customer_id?.message}
            />
          )}
        />
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Visit date"
          type="date"
          error={errors.visit_date?.message}
          {...register('visit_date')}
        />
        <SelectField
          label="Consultation type"
          required
          error={errors.consultation_type?.message}
          {...register('consultation_type')}
        >
          {CONSULTATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {humanizeCategory(t)}
            </option>
          ))}
        </SelectField>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField
          label="Fees"
          required
          inputMode="decimal"
          placeholder="0.00"
          error={errors.fees?.message as string | undefined}
          {...register('fees')}
        />
        <SelectField
          label="Payment status"
          required
          error={errors.payment_status?.message}
          {...register('payment_status')}
        >
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {humanizeCategory(s)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Payment method"
          error={errors.payment_method?.message}
          defaultValue=""
          {...register('payment_method')}
        >
          <option value="">—</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {humanizeCategory(m)}
            </option>
          ))}
        </SelectField>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <TextArea
          label="Problems discussed"
          rows={3}
          error={errors.problems_discussed?.message}
          {...register('problems_discussed')}
        />
        <TextArea
          label="Analysis"
          rows={3}
          error={errors.analysis?.message}
          {...register('analysis')}
        />
        <TextArea
          label="Recommendations"
          rows={3}
          error={errors.recommendations?.message}
          {...register('recommendations')}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Follow-up date"
          type="date"
          error={errors.follow_up_date?.message}
          {...register('follow_up_date')}
        />
        <TextField label="Notes" error={errors.notes?.message} {...register('notes')} />
      </section>

      {mode === 'create' ? (
        <section>
          <p className="text-sm font-medium text-midnight-900">Solutions given</p>
          <p className="mt-1 text-xs text-midnight-600">
            Optional. Selected solutions will be linked to this visit.
          </p>
          <div className="mt-2">
            <Controller
              name="solution_ids"
              control={control}
              render={({ field }) => (
                <SolutionPicker value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </section>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => navigate(cancelTo)}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create visit' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

function toFormValues(v: VisitRow): VisitFormValues {
  return {
    customer_id: v.customer_id,
    visit_date: v.visit_date ?? '',
    consultation_type: v.consultation_type,
    problems_discussed: v.problems_discussed ?? '',
    analysis: v.analysis ?? '',
    recommendations: v.recommendations ?? '',
    fees: typeof v.fees === 'string' ? Number.parseFloat(v.fees) : v.fees,
    payment_status: v.payment_status,
    payment_method: v.payment_method ?? '',
    follow_up_date: v.follow_up_date ?? '',
    notes: v.notes ?? '',
    solution_ids: [],
  };
}
