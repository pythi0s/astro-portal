import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { FormRootError, SelectField, TextArea, TextField } from '@/components/FormField';
import { humanizeEnum } from '@/lib/format';
import { applyServerErrors } from '@/lib/apiErrors';
import {
  emptyTemplateForm,
  templateFormSchema,
  type TemplateFormValues,
} from '../schema';
import { MESSAGE_CHANNELS, TEMPLATE_PLACEHOLDERS, TRIGGER_TYPES } from '../types';
import { PlaceholderPreview } from './PlaceholderPreview';

interface Props {
  initialValues?: Partial<TemplateFormValues>;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (values: TemplateFormValues) => Promise<unknown>;
}

export function TemplateForm({ initialValues, submitLabel, onCancel, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: { ...emptyTemplateForm, ...initialValues },
  });

  const channel = useWatch({ control, name: 'channel' });
  const subject = useWatch({ control, name: 'subject' });
  const body = useWatch({ control, name: 'body' });

  async function submit(values: TemplateFormValues) {
    try {
      await onSubmit(values);
    } catch (err) {
      applyServerErrors(err, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-4">
        <TextField label="Name" required error={errors.name?.message} {...register('name')} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Channel" required error={errors.channel?.message} {...register('channel')}>
            {MESSAGE_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {humanizeEnum(c)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Trigger type"
            required
            error={errors.trigger_type?.message}
            {...register('trigger_type')}
          >
            {TRIGGER_TYPES.map((t) => (
              <option key={t} value={t}>
                {humanizeEnum(t)}
              </option>
            ))}
          </SelectField>
        </div>

        {channel === 'email' ? (
          <TextField
            label="Subject"
            required
            error={errors.subject?.message}
            {...register('subject')}
          />
        ) : (
          <p className="text-xs text-midnight-600">
            WhatsApp templates don't use a subject line — only the body is sent.
          </p>
        )}

        <TextArea label="Body" required rows={10} error={errors.body?.message} {...register('body')} />

        <p className="text-xs text-midnight-700">
          Available placeholders: {TEMPLATE_PLACEHOLDERS.join(', ')}
        </p>

        <label className="flex items-center gap-2">
          <input type="checkbox" {...register('is_active')} />
          <span className="text-sm text-midnight-900">Active</span>
        </label>

        <FormRootError message={errors.root?.serverError?.message as string | undefined} />

        <div className="flex items-center justify-end gap-2">
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </section>
      <div>
        <PlaceholderPreview
          subject={channel === 'email' ? (subject ?? '') : null}
          body={body ?? ''}
        />
      </div>
    </form>
  );
}
