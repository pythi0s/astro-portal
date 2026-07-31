import { z } from 'zod';
import { CONSULTATION_TYPES, PAYMENT_METHODS, PAYMENT_STATUSES } from './types';

export const visitFormSchema = z.object({
  customer_id: z.coerce
    .number({ invalid_type_error: 'Select a customer' })
    .int()
    .positive('Select a customer'),
  visit_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')
    .optional()
    .or(z.literal('')),
  consultation_type: z.enum(CONSULTATION_TYPES as readonly [string, ...string[]]),
  problems_discussed: z.string().trim().max(2000).optional().or(z.literal('')),
  analysis: z.string().trim().max(2000).optional().or(z.literal('')),
  recommendations: z.string().trim().max(2000).optional().or(z.literal('')),
  fees: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'string' ? v.trim() : v))
    .pipe(
      z
        .union([z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid fee'), z.number().nonnegative()])
        .transform((v) => (typeof v === 'string' ? Number.parseFloat(v) : v)),
    ),
  payment_status: z.enum(PAYMENT_STATUSES as readonly [string, ...string[]]),
  payment_method: z.enum(PAYMENT_METHODS as readonly [string, ...string[]]).optional().or(z.literal('')),
  follow_up_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')
    .optional()
    .or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  solution_ids: z.array(z.number().int().positive()).default([]),
});

export type VisitFormValues = z.infer<typeof visitFormSchema>;

export const emptyVisitForm: VisitFormValues = {
  customer_id: 0 as unknown as number,
  visit_date: new Date().toISOString().slice(0, 10),
  consultation_type: 'follow_up',
  problems_discussed: '',
  analysis: '',
  recommendations: '',
  fees: 0,
  payment_status: 'pending',
  payment_method: '',
  follow_up_date: '',
  notes: '',
  solution_ids: [],
};

export function toCreatePayload(values: VisitFormValues): Record<string, unknown> {
  const out: Record<string, unknown> = {
    customer_id: values.customer_id,
    consultation_type: values.consultation_type,
    payment_status: values.payment_status,
    fees: values.fees,
    solution_ids: values.solution_ids,
  };
  if (values.visit_date) out.visit_date = values.visit_date;
  if (values.problems_discussed) out.problems_discussed = values.problems_discussed;
  if (values.analysis) out.analysis = values.analysis;
  if (values.recommendations) out.recommendations = values.recommendations;
  if (values.payment_method) out.payment_method = values.payment_method;
  if (values.follow_up_date) out.follow_up_date = values.follow_up_date;
  if (values.notes) out.notes = values.notes;
  return out;
}

export function toUpdatePayload(values: VisitFormValues): Record<string, unknown> {
  // Update has all optional fields; include each so blanking is respected.
  return {
    visit_date: values.visit_date || null,
    consultation_type: values.consultation_type,
    problems_discussed: values.problems_discussed || null,
    analysis: values.analysis || null,
    recommendations: values.recommendations || null,
    fees: values.fees,
    payment_status: values.payment_status,
    payment_method: values.payment_method || null,
    follow_up_date: values.follow_up_date || null,
    notes: values.notes || null,
  };
}
