import type { MessageChannel } from '@/features/templates/types';

export type AutomationTrigger = 'follow_up_due' | 'appointment_booked' | 'appointment_reminder';

export const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  follow_up_due: 'Visit follow-up due',
  appointment_booked: 'Appointment booked (confirmation)',
  appointment_reminder: 'Before an appointment (reminder)',
};

export const isAppointmentTrigger = (t: AutomationTrigger) =>
  t === 'appointment_booked' || t === 'appointment_reminder';
export type AutomationRunStatus =
  | 'pending'
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface AutomationRule {
  id: number;
  name: string;
  trigger: AutomationTrigger;
  template_id: number;
  channel: MessageChannel;
  offset_days: number;
  offset_hours: number;
  is_active: boolean;
  filter: Record<string, unknown> | null;
  timezone: string;
  send_window_start_hour: number;
  send_window_end_hour: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationRun {
  id: number;
  automation_rule_id: number;
  event_key: string;
  channel: MessageChannel;
  scheduled_for: string;
  timezone: string;
  status: AutomationRunStatus;
  sent_count: number;
  failed_count: number;
  total_count: number;
}
