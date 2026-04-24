import { describe, expect, it } from 'vitest';
import { templateFormSchema, toCreatePayload } from '../schema';

describe('templateFormSchema', () => {
  it('accepts a valid email template', () => {
    const parsed = templateFormSchema.parse({
      name: 'Welcome',
      channel: 'email',
      trigger_type: 'first_visit',
      subject: 'Hi {{customer_name}}',
      body: 'Welcome {{customer_name}}!',
      is_active: true,
    });
    expect(parsed.channel).toBe('email');
    expect(parsed.trigger_type).toBe('first_visit');
  });

  it('requires subject when channel is email', () => {
    expect(() =>
      templateFormSchema.parse({
        name: 'Bad',
        channel: 'email',
        trigger_type: 'custom',
        subject: '',
        body: 'hello',
        is_active: true,
      }),
    ).toThrow();
  });

  it('accepts a whatsapp template without subject', () => {
    const parsed = templateFormSchema.parse({
      name: 'Reminder',
      channel: 'whatsapp',
      trigger_type: 'follow_up',
      subject: '',
      body: 'Reminder for {{customer_name}}',
      is_active: true,
    });
    expect(parsed.channel).toBe('whatsapp');
  });

  it('rejects empty body', () => {
    expect(() =>
      templateFormSchema.parse({
        name: 'Empty',
        channel: 'whatsapp',
        trigger_type: 'custom',
        subject: '',
        body: '   ',
        is_active: true,
      }),
    ).toThrow();
  });
});

describe('toCreatePayload', () => {
  it('strips subject for whatsapp', () => {
    const payload = toCreatePayload({
      name: 'R',
      channel: 'whatsapp',
      trigger_type: 'custom',
      subject: 'unused',
      body: 'hi',
      is_active: true,
    });
    expect(payload.subject).toBeNull();
  });

  it('keeps subject for email', () => {
    const payload = toCreatePayload({
      name: 'E',
      channel: 'email',
      trigger_type: 'custom',
      subject: 'Greetings',
      body: 'hi',
      is_active: true,
    });
    expect(payload.subject).toBe('Greetings');
  });
});
