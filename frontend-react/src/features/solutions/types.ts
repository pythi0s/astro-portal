export type SolutionCategory =
  | 'gemstone'
  | 'mantra'
  | 'puja'
  | 'remedy'
  | 'yantra'
  | 'charity'
  | 'lifestyle'
  | 'other';

export const SOLUTION_CATEGORIES: readonly SolutionCategory[] = [
  'gemstone',
  'mantra',
  'puja',
  'remedy',
  'yantra',
  'charity',
  'lifestyle',
  'other',
] as const;

export interface Solution {
  id: number;
  name: string;
  category: SolutionCategory;
  description: string | null;
  instructions: string | null;
  typical_duration: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
