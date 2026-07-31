import { describe, expect, it } from 'vitest';
import { emptyVisitForm, toCreatePayload, visitFormSchema } from '../schema';

describe('visitFormSchema', () => {
  it('accepts a minimal valid form', () => {
    const parsed = visitFormSchema.safeParse({
      ...emptyVisitForm,
      customer_id: 7,
      fees: '500',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a missing customer', () => {
    const parsed = visitFormSchema.safeParse(emptyVisitForm);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.path.join('.') === 'customer_id')).toBe(true);
    }
  });

  it('rejects a non-numeric fee', () => {
    const parsed = visitFormSchema.safeParse({
      ...emptyVisitForm,
      customer_id: 1,
      fees: 'free',
    });
    expect(parsed.success).toBe(false);
  });
});

describe('toCreatePayload', () => {
  it('omits empty optionals', () => {
    const payload = toCreatePayload({
      ...emptyVisitForm,
      customer_id: 3,
      fees: 250,
      problems_discussed: '',
    });
    expect(payload.problems_discussed).toBeUndefined();
    expect(payload.fees).toBe(250);
  });
});
