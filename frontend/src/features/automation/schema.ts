import { z } from 'zod';

export const automationRuleSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    trigger: z.literal('follow_up_due'),
    template_id: z.number().int().positive('Select a template'),
    channel: z.enum(['email', 'whatsapp']),
    offset_days: z.number().int().min(-365).max(365),
    timezone: z.literal('Asia/Kolkata'),
    send_window_start_hour: z.number().int().min(0).max(23),
    send_window_end_hour: z.number().int().min(0).max(23),
    filter_city: z.string().trim().max(120),
    filter_rashi: z.string().trim().max(120),
    is_active: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.send_window_start_hour >= values.send_window_end_hour) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['send_window_end_hour'],
        message: 'End hour must be after start hour',
      });
    }
  });

export type AutomationRuleFormValues = z.infer<typeof automationRuleSchema>;

export const emptyAutomationRule: AutomationRuleFormValues = {
  name: '',
  trigger: 'follow_up_due',
  template_id: 0,
  channel: 'email',
  offset_days: -1,
  timezone: 'Asia/Kolkata',
  send_window_start_hour: 9,
  send_window_end_hour: 18,
  filter_city: '',
  filter_rashi: '',
  is_active: true,
};

export function toAutomationRulePayload(
  values: AutomationRuleFormValues,
): Record<string, unknown> {
  const filter: Record<string, string> = {};
  if (values.filter_city) filter.city = values.filter_city;
  if (values.filter_rashi) filter.rashi = values.filter_rashi;
  return {
    name: values.name.trim(),
    trigger: values.trigger,
    template_id: values.template_id,
    channel: values.channel,
    offset_days: values.offset_days,
    timezone: values.timezone,
    send_window_start_hour: values.send_window_start_hour,
    send_window_end_hour: values.send_window_end_hour,
    filter,
    is_active: values.is_active,
  };
}
