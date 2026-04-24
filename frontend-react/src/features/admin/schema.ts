import { z } from 'zod';
import { ALL_ROLES } from '@/types/api';

const roleEnum = z.enum(ALL_ROLES as readonly [string, ...string[]]);

export const userCreateSchema = z.object({
  email: z.string().trim().email('Invalid email').max(200),
  password: z.string().min(8, 'At least 8 characters').max(120),
  full_name: z.string().trim().max(200).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  role: roleEnum,
});

export type UserCreateValues = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  email: z.string().trim().email('Invalid email').max(200),
  full_name: z.string().trim().max(200).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  role: roleEnum,
  is_active: z.boolean(),
  new_password: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || v.length >= 8, { message: 'At least 8 characters' }),
});

export type UserUpdateValues = z.infer<typeof userUpdateSchema>;

export function toCreatePayload(values: UserCreateValues): Record<string, unknown> {
  return {
    email: values.email.trim(),
    password: values.password,
    full_name: values.full_name?.trim() || '',
    phone: values.phone?.trim() || null,
    role: values.role,
  };
}

export function toUpdatePayload(values: UserUpdateValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    email: values.email.trim(),
    full_name: values.full_name?.trim() || '',
    phone: values.phone?.trim() || null,
    role: values.role,
    is_active: values.is_active,
  };
  if (values.new_password && values.new_password.length > 0) {
    payload.password = values.new_password;
  }
  return payload;
}

export const emptyCreateUser: UserCreateValues = {
  email: '',
  password: '',
  full_name: '',
  phone: '',
  role: 'astrologer',
};
