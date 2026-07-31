import { z } from 'zod';
import { GENDERS } from './types';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')
  .optional()
  .or(z.literal(''));

const isoTime = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Use HH:MM or HH:MM:SS')
  .optional()
  .or(z.literal(''));

/**
 * Zod schema shared between POST and PUT. The form always renders optional
 * fields as empty strings; we strip those on submit so we send a true
 * `null`/undefined to the backend rather than "".
 */
export const customerFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Too long'),
  email: z
    .string()
    .trim()
    .email('Invalid email')
    .or(z.literal(''))
    .optional(),
  phone: z.string().trim().max(32, 'Too long').optional().or(z.literal('')),
  gender: z.enum(GENDERS as readonly [string, ...string[]]).optional().or(z.literal('')),
  date_of_birth: isoDate,
  birth_time: isoTime,
  birth_place: z.string().trim().max(160).optional().or(z.literal('')),
  occupation: z.string().trim().max(120).optional().or(z.literal('')),
  marital_status: z.string().trim().max(32).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  city: z.string().trim().max(120).optional().or(z.literal('')),
  state: z.string().trim().max(120).optional().or(z.literal('')),
  pincode: z.string().trim().max(16).optional().or(z.literal('')),
  rashi: z.string().trim().max(64).optional().or(z.literal('')),
  nakshatra: z.string().trim().max(64).optional().or(z.literal('')),
  gotra: z.string().trim().max(64).optional().or(z.literal('')),
  lagna: z.string().trim().max(64).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export const emptyCustomerForm: CustomerFormValues = {
  name: '',
  email: '',
  phone: '',
  gender: '',
  date_of_birth: '',
  birth_time: '',
  birth_place: '',
  occupation: '',
  marital_status: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  rashi: '',
  nakshatra: '',
  gotra: '',
  lagna: '',
  notes: '',
};

/**
 * Convert the form values to the backend's `CustomerCreate`/`CustomerUpdate`
 * payload shape. Empty strings become null/undefined so unique-indexed
 * columns (email) don't collide on the second empty insert.
 */
export function toApiPayload(values: CustomerFormValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      out[key] = trimmed === '' ? null : trimmed;
    } else {
      out[key] = value;
    }
  }
  return out;
}
