import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/Button';
import { FormRootError, SelectField, TextField } from '@/components/FormField';
import { applyServerErrors } from '@/lib/apiErrors';
import { useTemplateList } from '@/features/templates/hooks/useTemplates';
import {
  automationRuleSchema,
  emptyAutomationRule,
  type AutomationRuleFormValues,
} from '../schema';

interface Props {
  initialValues?: Partial<AutomationRuleFormValues>;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (values: AutomationRuleFormValues) => Promise<unknown>;
}

export function AutomationRuleForm({ initialValues, submitLabel, onCancel, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AutomationRuleFormValues>({
    resolver: zodResolver(automationRuleSchema),
    defaultValues: { ...emptyAutomationRule, ...initialValues },
  });
  const channel = useWatch({ control, name: 'channel' });
  const { data: templates, isLoading: templatesLoading } = useTemplateList({ channel });

  async function submit(values: AutomationRuleFormValues) {
    try {
      await onSubmit(values);
    } catch (error) {
      applyServerErrors(error, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <section className="grid grid-cols-1 gap-4 rounded-md border border-midnight-200 bg-white p-4 sm:grid-cols-2">
        <TextField
          label="Rule name"
          required
          className="sm:col-span-2"
          error={errors.name?.message}
          {...register('name')}
        />
        <SelectField label="Trigger" required error={errors.trigger?.message} {...register('trigger')}>
          <option value="follow_up_due">Follow-up due</option>
        </SelectField>
        <SelectField label="Channel" required error={errors.channel?.message} {...register('channel')}>
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
        </SelectField>
        <SelectField
          label="Template"
          required
          error={errors.template_id?.message}
          disabled={templatesLoading}
          {...register('template_id', { valueAsNumber: true })}
        >
          <option value={0}>{templatesLoading ? 'Loading templates…' : 'Select template'}</option>
          {(templates ?? []).map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Send offset (days)"
          type="number"
          hint="Use -1 for one day before, 0 for the due date."
          error={errors.offset_days?.message}
          {...register('offset_days', { valueAsNumber: true })}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-md border border-midnight-200 bg-white p-4 sm:grid-cols-3">
        <SelectField label="Timezone" required error={errors.timezone?.message} {...register('timezone')}>
          <option value="Asia/Kolkata">India (Asia/Kolkata)</option>
        </SelectField>
        <TextField
          label="Start hour"
          type="number"
          min={0}
          max={23}
          error={errors.send_window_start_hour?.message}
          {...register('send_window_start_hour', { valueAsNumber: true })}
        />
        <TextField
          label="End hour"
          type="number"
          min={0}
          max={23}
          error={errors.send_window_end_hour?.message}
          {...register('send_window_end_hour', { valueAsNumber: true })}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-md border border-midnight-200 bg-white p-4 sm:grid-cols-2">
        <TextField label="City filter" error={errors.filter_city?.message} {...register('filter_city')} />
        <TextField label="Rashi filter" error={errors.filter_rashi?.message} {...register('filter_rashi')} />
        <label className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" {...register('is_active')} />
          <span className="text-sm font-medium text-midnight-900">Rule enabled</span>
        </label>
      </section>

      <FormRootError message={errors.root?.serverError?.message as string | undefined} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
