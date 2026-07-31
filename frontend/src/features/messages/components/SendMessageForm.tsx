import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { FormRootError, SelectField, TextArea, TextField } from '@/components/FormField';
import { applyServerErrors } from '@/lib/apiErrors';
import { humanizeEnum } from '@/lib/format';
import { CustomerPicker } from '@/features/visits/components/CustomerPicker';
import { useTemplateList } from '@/features/templates/hooks/useTemplates';
import type { MessageChannel } from '@/features/templates/types';
import { sendEmailSchema, sendWhatsAppSchema, type SendEmailValues, type SendWhatsAppValues } from '../schema';
import { PlaceholderPreview } from '@/features/templates/components/PlaceholderPreview';

interface Props {
  channel: MessageChannel;
  onSend: (payload: SendEmailValues | SendWhatsAppValues) => Promise<unknown>;
  initialCustomerId?: number;
}

export function SendMessageForm({ channel, onSend, initialCustomerId }: Props) {
  if (channel === 'email') {
    return <EmailForm onSend={onSend as (v: SendEmailValues) => Promise<unknown>} initialCustomerId={initialCustomerId} />;
  }
  return <WhatsAppForm onSend={onSend as (v: SendWhatsAppValues) => Promise<unknown>} initialCustomerId={initialCustomerId} />;
}

function EmailForm({
  onSend,
  initialCustomerId,
}: {
  onSend: (v: SendEmailValues) => Promise<unknown>;
  initialCustomerId?: number;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SendEmailValues>({
    resolver: zodResolver(sendEmailSchema),
    defaultValues: {
      customer_id: initialCustomerId ?? 0,
      template_id: undefined,
      subject: '',
      body: '',
    },
  });

  const { data: templates } = useTemplateList({ channel: 'email' });
  const [useTemplate, setUseTemplate] = useState(false);
  const templateId = watch('template_id');
  const subject = watch('subject');
  const body = watch('body');

  const selected = useMemo(
    () => templates?.find((t) => t.id === Number(templateId)),
    [templates, templateId],
  );

  async function submit(values: SendEmailValues) {
    try {
      const payload: SendEmailValues = {
        ...values,
        customer_id: Number(values.customer_id),
        template_id: useTemplate ? Number(values.template_id) || undefined : undefined,
        subject: useTemplate ? undefined : values.subject,
        body: useTemplate ? undefined : values.body,
      };
      await onSend(payload);
    } catch (err) {
      applyServerErrors(err, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-4">
        <CustomerPicker
          value={Number(watch('customer_id')) || 0}
          onChange={(id) => setValue('customer_id', id, { shouldValidate: true })}
          error={errors.customer_id?.message as string | undefined}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useTemplate}
            onChange={(e) => {
              setUseTemplate(e.target.checked);
              if (!e.target.checked) setValue('template_id', undefined);
            }}
          />
          <span className="text-sm text-midnight-900">Use a template</span>
        </label>

        {useTemplate ? (
          <SelectField
            label="Template"
            required
            error={errors.template_id?.message as string | undefined}
            {...register('template_id', { valueAsNumber: true })}
          >
            <option value="">— Pick a template —</option>
            {templates?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {humanizeEnum(t.trigger_type)}
              </option>
            ))}
          </SelectField>
        ) : (
          <>
            <TextField label="Subject" required error={errors.subject?.message} {...register('subject')} />
            <TextArea label="Body" required rows={10} error={errors.body?.message} {...register('body')} />
          </>
        )}

        <FormRootError message={errors.root?.serverError?.message as string | undefined} />

        <div className="flex items-center justify-end">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send email'}
          </Button>
        </div>
      </section>
      <div>
        <PlaceholderPreview
          subject={useTemplate ? selected?.subject ?? '' : subject ?? ''}
          body={useTemplate ? selected?.body ?? '' : body ?? ''}
        />
      </div>
    </form>
  );
}

function WhatsAppForm({
  onSend,
  initialCustomerId,
}: {
  onSend: (v: SendWhatsAppValues) => Promise<unknown>;
  initialCustomerId?: number;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SendWhatsAppValues>({
    resolver: zodResolver(sendWhatsAppSchema),
    defaultValues: {
      customer_id: initialCustomerId ?? 0,
      template_id: 0,
    },
  });

  const { data: templates } = useTemplateList({ channel: 'whatsapp' });
  const templateId = Number(watch('template_id'));
  const selected = templates?.find((t) => t.id === templateId);

  async function submit(values: SendWhatsAppValues) {
    try {
      await onSend({
        ...values,
        customer_id: Number(values.customer_id),
        template_id: Number(values.template_id),
      });
    } catch (err) {
      applyServerErrors(err, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-4">
        <CustomerPicker
          value={Number(watch('customer_id')) || 0}
          onChange={(id) => setValue('customer_id', id, { shouldValidate: true })}
          error={errors.customer_id?.message as string | undefined}
        />

        <SelectField
          label="Template"
          required
          error={errors.template_id?.message as string | undefined}
          {...register('template_id', { valueAsNumber: true })}
        >
          <option value="">— Pick a WhatsApp template —</option>
          {templates?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} · {humanizeEnum(t.trigger_type)}
            </option>
          ))}
        </SelectField>

        <FormRootError message={errors.root?.serverError?.message as string | undefined} />

        <div className="flex items-center justify-end">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send WhatsApp'}
          </Button>
        </div>
      </section>
      <div>
        <PlaceholderPreview subject={null} body={selected?.body ?? ''} />
      </div>
    </form>
  );
}
