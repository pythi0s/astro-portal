import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Tabs } from '@/components/Tabs';
import { useToast } from '@/components/Toast';
import { errorMessage } from '@/lib/apiErrors';
import { useSendEmail, useSendWhatsApp } from '../hooks/useMessages';
import { SendMessageForm } from '../components/SendMessageForm';
import type { SendEmailValues, SendWhatsAppValues } from '../schema';

export function SendMessagePage() {
  const [params] = useSearchParams();
  const preCustomer = Number(params.get('customer_id')) || undefined;
  const { push } = useToast();
  const sendEmail = useSendEmail();
  const sendWhatsApp = useSendWhatsApp();

  return (
    <div>
      <PageHeader
        title="Send a message"
        description="Send an email or WhatsApp message to a customer, using a saved template or a custom body."
      />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Tabs
          ariaLabel="Message channels"
          paramKey="channel"
          tabs={[
            {
              id: 'email',
              label: 'Email',
              content: (
                <SendMessageForm
                  channel="email"
                  initialCustomerId={preCustomer}
                  onSend={async (v) => {
                    const vals = v as SendEmailValues;
                    try {
                      const log = await sendEmail.mutateAsync({
                        customer_id: vals.customer_id,
                        template_id: vals.template_id,
                        subject: vals.subject || undefined,
                        body: vals.body || undefined,
                      });
                      if (log.status === 'failed') {
                        push({
                          tone: 'error',
                          title: 'Send failed',
                          message: log.error_message ?? 'The message could not be sent.',
                        });
                      } else {
                        push({ tone: 'success', message: 'Email queued for delivery.' });
                      }
                    } catch (err) {
                      push({ tone: 'error', title: 'Send failed', message: errorMessage(err) });
                      throw err;
                    }
                  }}
                />
              ),
            },
            {
              id: 'whatsapp',
              label: 'WhatsApp',
              content: (
                <SendMessageForm
                  channel="whatsapp"
                  initialCustomerId={preCustomer}
                  onSend={async (v) => {
                    const vals = v as SendWhatsAppValues;
                    try {
                      const log = await sendWhatsApp.mutateAsync({
                        customer_id: vals.customer_id,
                        template_id: vals.template_id,
                      });
                      if (log.status === 'failed') {
                        push({
                          tone: 'error',
                          title: 'Send failed',
                          message: log.error_message ?? 'The message could not be sent.',
                        });
                      } else {
                        push({ tone: 'success', message: 'WhatsApp queued for delivery.' });
                      }
                    } catch (err) {
                      push({ tone: 'error', title: 'Send failed', message: errorMessage(err) });
                      throw err;
                    }
                  }}
                />
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
