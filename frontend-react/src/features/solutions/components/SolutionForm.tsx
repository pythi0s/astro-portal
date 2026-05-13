import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormRootError, SelectField, TextArea, TextField } from '@/components/FormField';
import { Button } from '@/components/Button';
import { humanizeCategory } from '@/lib/format';
import { applyServerErrors } from '@/lib/apiErrors';
import { emptySolutionForm, solutionFormSchema, toApiPayload, type SolutionFormValues } from '../schema';
import { SOLUTION_CATEGORIES } from '../types';

interface Props {
  initialValues?: Partial<SolutionFormValues>;
  submitLabel: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<unknown>;
  onCancel?: () => void;
}

export function SolutionForm({ initialValues, submitLabel, onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SolutionFormValues>({
    resolver: zodResolver(solutionFormSchema),
    defaultValues: { ...emptySolutionForm, ...initialValues },
  });

  async function submit(values: SolutionFormValues) {
    try {
      await onSubmit(toApiPayload(values));
    } catch (err) {
      applyServerErrors(err, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TextField
        label="Name"
        required
        error={errors.name?.message}
        className="sm:col-span-2"
        {...register('name')}
      />
      <SelectField label="Category" required error={errors.category?.message} {...register('category')}>
        {SOLUTION_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {humanizeCategory(c)}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Typical duration"
        hint="e.g. 40 days, 3 months"
        error={errors.typical_duration?.message}
        {...register('typical_duration')}
      />
      <TextArea
        label="Description"
        error={errors.description?.message}
        className="sm:col-span-2"
        {...register('description')}
      />
      <TextArea
        label="Instructions"
        error={errors.instructions?.message}
        className="sm:col-span-2"
        {...register('instructions')}
      />
      <label className="flex items-center gap-2 sm:col-span-2">
        <input type="checkbox" {...register('is_active')} />
        <span className="text-sm text-midnight-900">Active</span>
      </label>
      <FormRootError message={errors.root?.serverError?.message as string | undefined} />
      <div className="flex items-center justify-end gap-2 sm:col-span-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
