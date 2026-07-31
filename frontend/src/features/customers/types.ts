export type Gender = 'male' | 'female' | 'other';

export const GENDERS: readonly Gender[] = ['male', 'female', 'other'] as const;

export interface CustomerListRow {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  gender: Gender | null;
  city: string | null;
  rashi: string | null;
  photo_path: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VisitBrief {
  id: number;
  visit_date: string;
  consultation_type: string;
  fees: number | string;
  payment_status: string;
  payment_method: string | null;
  problems_discussed: string | null;
  analysis: string | null;
  recommendations: string | null;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface CustomerSolutionBrief {
  id: number;
  solution_id: number;
  visit_id: number | null;
  given_date: string;
  status: 'active' | 'completed' | 'discontinued';
  notes: string | null;
  created_at: string;
  solution: { id: number; name: string; category: string } | null;
}

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  birth_time: string | null;
  birth_place: string | null;
  occupation: string | null;
  marital_status: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  rashi: string | null;
  nakshatra: string | null;
  gotra: string | null;
  lagna: string | null;
  photo_path: string | null;
  kundali_file_path: string | null;
  kundali_original_name: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  visits?: VisitBrief[];
  customer_solutions?: CustomerSolutionBrief[];
}

/** Slim version of `Customer` suitable for pickers. */
export interface CustomerOption {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface CustomerSolutionHistory {
  id: number;
  customer_id: number;
  solution_id: number;
  visit_id: number | null;
  given_date: string;
  status: 'active' | 'completed' | 'discontinued';
  notes: string | null;
  created_at: string;
  solution_name: string;
  solution_category: string;
}

/** Visit list shape as returned by GET /customers/{id}/visits. */
export interface VisitFull extends VisitBrief {
  customer_id: number;
  visited_by: number | null;
  updated_at: string;
}
