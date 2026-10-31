export interface OverviewAppointment {
  id: number;
  customer_id: number;
  customer_name: string;
  start_at: string;
  end_at: string;
  duration_minutes: number;
}

export interface OverviewCustomer {
  id: number;
  name: string;
  phone: string | null;
  created_at: string;
  self_registered: boolean;
}

export interface OverviewFollowUp {
  visit_id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string | null;
  follow_up_date: string;
}

export interface DashboardOverview {
  today: string;
  appointments_today: number;
  remaining_today: number;
  next_appointment: OverviewAppointment | null;
  upcoming_7_days: number;
  appointments_this_month: number;
  appointments_total: number;
  collected_this_month: string | number;
  collected_last_month: string | number;
  collected_change_pct: number | null;
  collected_daily: { day: string; amount: string | number }[];
  outstanding_total: string | number;
  new_customers_this_month: number;
  recent_customers: OverviewCustomer[];
  follow_ups_due: OverviewFollowUp[];
}
