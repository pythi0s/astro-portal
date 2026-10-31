import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { errorMessage } from '@/lib/apiErrors';
import { createTemplate } from '@/features/templates/api';
import type { MessageChannel } from '@/features/templates/types';
import { createAutomationRule } from '../api';
import type { AutomationRule } from '../types';

interface Preset {
  name: string;
  trigger: 'appointment_booked' | 'appointment_reminder';
  offsetHours: number;
  subject: string;
  body: Record<MessageChannel, string>;
}

const PRESETS: Preset[] = [
  {
    name: 'Booking confirmation',
    trigger: 'appointment_booked',
    offsetHours: 0,
    subject: 'Your appointment with Guruji is confirmed — {{appointment_date}}',
    body: {
      whatsapp:
        'Namaste {{customer_name}} 🙏 Your appointment with Guruji is confirmed for {{appointment_date}} at {{appointment_time}} ({{appointment_duration}}). Please arrive 10 minutes early. — व्यंकटेश प्रतिष्ठाण',
      email:
        '<p>Namaste {{customer_name}},</p><p>Your in-person appointment with Guruji is confirmed for <strong>{{appointment_date}} at {{appointment_time}}</strong> ({{appointment_duration}}).</p><p>Please arrive 10 minutes early.</p><p>— व्यंकटेश प्रतिष्ठाण</p>',
    },
  },
  {
    name: 'Reminder — 1 day before',
    trigger: 'appointment_reminder',
    offsetHours: 24,
    subject: 'Reminder: appointment with Guruji tomorrow at {{appointment_time}}',
    body: {
      whatsapp:
        'Namaste {{customer_name}} 🙏 Reminder: your appointment with Guruji is on {{appointment_date}} at {{appointment_time}}. If you cannot come, please cancel from the customer portal. — व्यंकटेश प्रतिष्ठाण',
      email:
        '<p>Namaste {{customer_name}},</p><p>This is a reminder of your appointment with Guruji on <strong>{{appointment_date}} at {{appointment_time}}</strong>.</p><p>If you cannot come, please cancel from the customer portal so someone else can take the slot.</p><p>— व्यंकटेश प्रतिष्ठाण</p>',
    },
  },
  {
    name: 'Reminder — 2 hours before',
    trigger: 'appointment_reminder',
    offsetHours: 2,
    subject: 'See you at {{appointment_time}} today',
    body: {
      whatsapp:
        'Namaste {{customer_name}}, see you today at {{appointment_time}} for your appointment with Guruji. 🙏',
      email: '<p>Namaste {{customer_name}},</p><p>See you today at <strong>{{appointment_time}}</strong> for your appointment with Guruji.</p>',
    },
  },
];

const CHANNEL_LABEL: Record<MessageChannel, string> = { whatsapp: 'WhatsApp', email: 'Email' };

export function ReminderQuickSetup({ existing }: { existing: AutomationRule[] | undefined }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState<MessageChannel | null>(null);

  const hasChannel = (channel: MessageChannel) =>
    (existing ?? []).some(
      (r) => r.is_active && r.channel === channel && (r.trigger === 'appointment_booked' || r.trigger === 'appointment_reminder'),
    );

  async function setUp(channel: MessageChannel) {
    setBusy(channel);
    try {
      for (const preset of PRESETS) {
        const template = await createTemplate({
          name: `${preset.name} (${CHANNEL_LABEL[channel]})`,
          channel,
          trigger_type: 'custom',
          subject: channel === 'email' ? preset.subject : null,
          body: preset.body[channel],
        });
        await createAutomationRule({
          name: `${preset.name} · ${CHANNEL_LABEL[channel]}`,
          trigger: preset.trigger,
          template_id: template.id,
          channel,
          offset_days: 0,
          offset_hours: preset.offsetHours,
          timezone: 'Asia/Kolkata',
          send_window_start_hour: 0,
          send_window_end_hour: 23,
          filter: {},
          is_active: true,
        });
      }
      toast.push({
        tone: 'success',
        title: `${CHANNEL_LABEL[channel]} reminders are on`,
        message: 'Confirmation, 1-day and 2-hour reminders were created. Edit them any time.',
      });
      void qc.invalidateQueries();
    } catch (err) {
      toast.push({ tone: 'error', message: errorMessage(err, 'Could not set up reminders.') });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      aria-labelledby="quick-setup-heading"
      className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-saffron-50 via-white to-amber-50 p-5 shadow-sm"
    >
      <h2 id="quick-setup-heading" className="text-base font-bold text-midnight-900">
        Appointment reminders
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-midnight-700">
        One click creates ready-to-use messages: a booking confirmation, a reminder the day before and a nudge 2
        hours before the visit. Customers who switched reminders off in their portal profile are skipped.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(['whatsapp', 'email'] as const).map((channel) =>
          hasChannel(channel) ? (
            <span
              key={channel}
              className="inline-flex items-center rounded-full bg-jade-100 px-3 py-1.5 text-sm font-semibold text-jade-800"
            >
              ✓ {CHANNEL_LABEL[channel]} reminders active
            </span>
          ) : (
            <Button
              key={channel}
              variant={channel === 'whatsapp' ? 'primary' : 'secondary'}
              disabled={busy !== null}
              onClick={() => void setUp(channel)}
            >
              {busy === channel ? 'Setting up…' : `Set up ${CHANNEL_LABEL[channel]} reminders`}
            </Button>
          ),
        )}
      </div>
    </section>
  );
}
