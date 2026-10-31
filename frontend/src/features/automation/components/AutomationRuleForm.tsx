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
import { TRIGGER_LABELS, isAppointmentTrigger, type AutomationTrigger } from '../types';

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
  const trigger = useWatch({ control, name: 'trigger' });
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
          {(Object.keys(TRIGGER_LABELS) as AutomationTrigger[]).map((t) => (
            <option key={t} value={t}>
              {TRIGGER_LABELS[t]}
            </option>
          ))}
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
        {trigger === 'follow_up_due' ? (
          <TextField
            label="Send offset (days)"
            type="number"
            hint="Use -1 for one day before, 0 for the due date."
            error={errors.offset_days?.message}
            {...register('offset_days', { valueAsNumber: true })}
          />
        ) : trigger === 'appointment_reminder' ? (
          <TextField
            label="Hours before appointment"
            type="number"
            min={1}
            max={168}
            list="reminder-hour-presets"
            hint="e.g. 24 for the day before, 2 for a same-day nudge."
            error={errors.offset_hours?.message}
            {...register('offset_hours', { valueAsNumber: true })}
          />
        ) : (
          <p className="self-end rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Sent within a couple of minutes after a customer books.
          </p>
        )}
        <datalist id="reminder-hour-presets">
          {[1, 2, 3, 6, 12, 24, 48].map((h) => (
            <option key={h} value={h} />
          ))}
        </datalist>
      </section>

      {isAppointmentTrigger(trigger) ? (
        <p className="rounded-md border border-midnight-200 bg-white p-4 text-sm text-midnight-700">
          Appointment messages ignore the send window — their timing follows the appointment. Customers who
          turned off reminders in their portal profile are skipped. Use{' '}
          <code className="rounded bg-midnight-100 px-1">{'{{appointment_date}}'}</code>,{' '}
          <code className="rounded bg-midnight-100 px-1">{'{{appointment_time}}'}</code> and{' '}
          <code className="rounded bg-midnight-100 px-1">{'{{appointment_duration}}'}</code> in the template.
        </p>
      ) : null}

      <section
        hidden={isAppointmentTrigger(trigger)}
        className="grid grid-cols-1 gap-4 rounded-md border border-midnight-200 bg-white p-4 sm:grid-cols-3"
      >
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
