/**
 * Dashboard domain types. These mirror the Pydantic response models exposed
 * by backend/app/schemas/dashboard.py; keep them in sync.
 */

export type Preset = '7D' | '30D' | '90D' | '365D' | 'custom';

export interface DateRange {
  from: string; // YYYY-MM-DD (date-only, user's local time zone)
  to: string;   // YYYY-MM-DD (inclusive)
  preset?: Preset;
}

export type Granularity = 'day' | 'week' | 'month';

/** GET /dashboard/revenue */
export interface RevenueSummary {
  from_date: string;
  to_date: string;
  collected: string | number;     // backend returns Decimal → string
  outstanding: string | number;
  waived: string | number;
  gross: string | number;
  visit_count: number;
  avg_fee: string | number;
  collection_rate: number; // already a percentage (0..100)
}

/** GET /dashboard/earnings */
export interface PeriodBreakdown {
  label: string;
  total_fees: string | number;
  visit_count: number;
  paid_count: number;
  pending_amount: string | number;
}

export interface EarningsSummary {
  period: Granularity;
  start_date: string;
  end_date: string;
  breakdown: PeriodBreakdown[];
  grand_total: string | number;
}

/** GET /dashboard/revenue-by-category */
export interface CategoryRevenueRow {
  category: string;
  total_fees: string | number;
  visit_count: number;
}

export interface RevenueByCategory {
  from_date: string;
  to_date: string;
  rows: CategoryRevenueRow[];
  grand_total: string | number;
  unassigned_bucket_label?: string | null;
}

/** GET /visits/ — slim shape used by the dashboard's Recent Visits panel.
 *  The backend VisitRead schema has more fields; we only type what we use. */
export interface VisitSummary {
  id: number;
  customer_id: number;
  visit_date: string;
  consultation_type: string;
  fees: string | number;
  payment_status: 'paid' | 'pending' | 'partial' | 'waived';
  payment_method: string | null;
  created_at: string;
}

/** Computed client-side KPI tuple passed to <KpiCard>. */
export interface Kpi {
  label: string;
  value: string;            // pre-formatted (money / integer / percent)
  rawValue: number;          // for delta math
  previousValue?: number;    // for delta display; undefined → "—"
  tooltip?: string;
  tone?: 'neutral' | 'revenue' | 'warning';
}
