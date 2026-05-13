export type ConsultationType = 'first_visit' | 'follow_up' | 'special' | 'emergency';
export type PaymentStatus = 'paid' | 'pending' | 'partial' | 'waived';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer';

export const CONSULTATION_TYPES: readonly ConsultationType[] = [
  'first_visit',
  'follow_up',
  'special',
  'emergency',
] as const;

export const PAYMENT_STATUSES: readonly PaymentStatus[] = ['paid', 'pending', 'partial', 'waived'] as const;

export const PAYMENT_METHODS: readonly PaymentMethod[] = ['cash', 'upi', 'card', 'bank_transfer'] as const;

export interface VisitRow {
  id: number;
  customer_id: number;
  visited_by: number | null;
  visit_date: string;
  consultation_type: ConsultationType;
  problems_discussed: string | null;
  analysis: string | null;
  recommendations: string | null;
  fees: number | string;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitSolutionBrief {
  id: number;
  name: string;
  category: string;
}

export interface VisitWithSolutions extends VisitRow {
  solutions: VisitSolutionBrief[];
}
