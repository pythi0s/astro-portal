import { z } from 'zod';
import { SOLUTION_CATEGORIES } from './types';

export const solutionFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(160, 'Too long'),
  category: z.enum(SOLUTION_CATEGORIES as readonly [string, ...string[]]),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  instructions: z.string().trim().max(2000).optional().or(z.literal('')),
  typical_duration: z.string().trim().max(64).optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

export type SolutionFormValues = z.infer<typeof solutionFormSchema>;

export const emptySolutionForm: SolutionFormValues = {
  name: '',
  category: 'other',
  description: '',
  instructions: '',
  typical_duration: '',
  is_active: true,
};

export function toApiPayload(values: SolutionFormValues): Record<string, unknown> {
  return {
    name: values.name.trim(),
    category: values.category,
    description: values.description?.trim() || null,
    instructions: values.instructions?.trim() || null,
    typical_duration: values.typical_duration?.trim() || null,
    is_active: values.is_active,
  };
}
