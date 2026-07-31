export type MessageStatus = 'pending' | 'sent' | 'failed';

export interface MessageLog {
  id: number;
  customer_id: number;
  template_id: number | null;
  visit_id: number | null;
  channel: string;
  recipient: string;
  subject: string | null;
  body_snapshot: string | null;
  status: MessageStatus;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export const MESSAGE_STATUSES: readonly MessageStatus[] = ['pending', 'sent', 'failed'] as const;
