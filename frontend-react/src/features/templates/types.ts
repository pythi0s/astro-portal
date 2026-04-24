export type MessageChannel = 'email' | 'whatsapp';
export type TriggerType = 'first_visit' | 'follow_up' | 'solution_given' | 'custom';

export const MESSAGE_CHANNELS: readonly MessageChannel[] = ['email', 'whatsapp'] as const;
export const TRIGGER_TYPES: readonly TriggerType[] = [
  'first_visit',
  'follow_up',
  'solution_given',
  'custom',
] as const;

export interface MessageTemplate {
  id: number;
  name: string;
  channel: MessageChannel;
  trigger_type: TriggerType;
  subject: string | null;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Placeholders recognised by the backend `_render_placeholders` helper. */
export const TEMPLATE_PLACEHOLDERS: readonly string[] = [
  '{{customer_name}}',
  '{{customer_email}}',
  '{{customer_phone}}',
] as const;
