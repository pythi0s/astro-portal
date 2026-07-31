import { z } from 'zod';
import { MESSAGE_CHANNELS, TRIGGER_TYPES } from './types';

const channelEnum = z.enum(MESSAGE_CHANNELS as readonly [string, ...string[]]);
const triggerEnum = z.enum(TRIGGER_TYPES as readonly [string, ...string[]]);

export const templateFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(160),
    channel: channelEnum,
    trigger_type: triggerEnum,
    subject: z.string().trim().max(200).optional().or(z.literal('')),
    body: z.string().trim().min(1, 'Body is required'),
    is_active: z.boolean().default(true),
  })
  .superRefine((values, ctx) => {
    if (values.channel === 'email' && (!values.subject || values.subject.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subject'],
        message: 'Subject is required for email templates',
      });
    }
  });

export type TemplateFormValues = z.infer<typeof templateFormSchema>;

export const emptyTemplateForm: TemplateFormValues = {
  name: '',
  channel: 'email',
  trigger_type: 'custom',
  subject: '',
  body: '',
  is_active: true,
};

export function toCreatePayload(values: TemplateFormValues): Record<string, unknown> {
  return {
    name: values.name.trim(),
    channel: values.channel,
    trigger_type: values.trigger_type,
    subject: values.channel === 'email' ? (values.subject || '').trim() || null : null,
    body: values.body.trim(),
  };
}

export function toUpdatePayload(values: TemplateFormValues): Record<string, unknown> {
  return {
    name: values.name.trim(),
    channel: values.channel,
    trigger_type: values.trigger_type,
    subject: values.channel === 'email' ? (values.subject || '').trim() || null : null,
    body: values.body.trim(),
    is_active: values.is_active,
  };
}
