import { z } from 'zod';

export const profileSchema = z.object({
  full_name: z.string().trim().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
});

export type ProfileValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'At least 8 characters'),
    confirm_password: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.new_password !== values.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirm_password'],
        message: 'Passwords do not match',
      });
    }
    if (values.new_password === values.current_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['new_password'],
        message: 'New password must differ from the current one',
      });
    }
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function toProfilePayload(values: ProfileValues): Record<string, unknown> {
  return {
    full_name: values.full_name.trim(),
    phone: values.phone?.trim() || null,
  };
}
