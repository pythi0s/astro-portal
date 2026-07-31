import { describe, expect, it } from 'vitest';
import { sendEmailSchema, sendWhatsAppSchema } from '../schema';

describe('sendEmailSchema', () => {
  it('accepts a template-based send', () => {
    const parsed = sendEmailSchema.parse({
      customer_id: 3,
      template_id: 1,
    });
    expect(parsed.customer_id).toBe(3);
    expect(parsed.template_id).toBe(1);
  });

  it('requires subject and body without a template', () => {
    expect(() => sendEmailSchema.parse({ customer_id: 1 })).toThrow();
  });

  it('accepts custom subject and body without a template', () => {
    const parsed = sendEmailSchema.parse({
      customer_id: 1,
      subject: 'Hi',
      body: 'Hello',
    });
    expect(parsed.subject).toBe('Hi');
    expect(parsed.body).toBe('Hello');
  });
});

describe('sendWhatsAppSchema', () => {
  it('requires template_id', () => {
    expect(() =>
      sendWhatsAppSchema.parse({
        customer_id: 1,
      } as unknown),
    ).toThrow();
  });

  it('accepts valid payload', () => {
    const parsed = sendWhatsAppSchema.parse({
      customer_id: 1,
      template_id: 5,
    });
    expect(parsed.template_id).toBe(5);
  });
});
