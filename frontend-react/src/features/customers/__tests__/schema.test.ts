import { describe, expect, it } from 'vitest';
import { customerFormSchema, emptyCustomerForm, toApiPayload } from '../schema';

describe('customerFormSchema', () => {
  it('accepts a minimal valid form', () => {
    const parsed = customerFormSchema.safeParse({ ...emptyCustomerForm, name: 'Ada Lovelace' });
    expect(parsed.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const parsed = customerFormSchema.safeParse(emptyCustomerForm);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.path.join('.') === 'name')).toBe(true);
    }
  });

  it('rejects an invalid email', () => {
    const parsed = customerFormSchema.safeParse({
      ...emptyCustomerForm,
      name: 'A',
      email: 'not-an-email',
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.path.join('.') === 'email')).toBe(true);
    }
  });

  it('accepts an empty email (optional)', () => {
    const parsed = customerFormSchema.safeParse({
      ...emptyCustomerForm,
      name: 'A',
      email: '',
    });
    expect(parsed.success).toBe(true);
  });
});

describe('toApiPayload', () => {
  it('strips empty strings to null', () => {
    const payload = toApiPayload({ ...emptyCustomerForm, name: 'Ada', email: '' });
    expect(payload.name).toBe('Ada');
    expect(payload.email).toBeNull();
  });

  it('trims whitespace around string values', () => {
    const payload = toApiPayload({ ...emptyCustomerForm, name: '  Ada  ' });
    expect(payload.name).toBe('Ada');
  });
});
