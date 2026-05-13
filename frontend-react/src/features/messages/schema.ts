import { z } from 'zod';

export const sendEmailSchema = z
  .object({
    customer_id: z.number().int().positive(),
    template_id: z.number().int().positive().optional(),
    visit_id: z.number().int().positive().optional(),
    subject: z.string().trim().max(200).optional().or(z.literal('')),
    body: z.string().trim().max(10000).optional().or(z.literal('')),
  })
  .superRefine((values, ctx) => {
    if (!values.template_id) {
      if (!values.subject || values.subject.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['subject'],
          message: 'Subject is required when no template is chosen',
        });
      }
      if (!values.body || values.body.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['body'],
          message: 'Body is required when no template is chosen',
        });
      }
    }
  });

export type SendEmailValues = z.infer<typeof sendEmailSchema>;

export const sendWhatsAppSchema = z.object({
  customer_id: z.number().int().positive(),
  template_id: z.number().int().positive({ message: 'Template is required' }),
  visit_id: z.number().int().positive().optional(),
});

export type SendWhatsAppValues = z.infer<typeof sendWhatsAppSchema>;
