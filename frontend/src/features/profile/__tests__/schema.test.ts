import { describe, expect, it } from 'vitest';
import { changePasswordSchema, profileSchema, toProfilePayload } from '../schema';

describe('profileSchema', () => {
  it('accepts a valid profile', () => {
    const parsed = profileSchema.parse({ full_name: 'Asha', phone: '' });
    expect(parsed.full_name).toBe('Asha');
  });
});

describe('toProfilePayload', () => {
  it('converts empty phone to null', () => {
    const payload = toProfilePayload({ full_name: 'Asha', phone: '' });
    expect(payload.phone).toBeNull();
  });

  it('trims whitespace', () => {
    const payload = toProfilePayload({ full_name: '  Asha  ', phone: ' +91 123 ' });
    expect(payload.full_name).toBe('Asha');
    expect(payload.phone).toBe('+91 123');
  });
});

describe('changePasswordSchema', () => {
  it('rejects mismatched confirm', () => {
    expect(() =>
      changePasswordSchema.parse({
        current_password: 'abc',
        new_password: 'newpassword1',
        confirm_password: 'different',
      }),
    ).toThrow();
  });

  it('rejects short new password', () => {
    expect(() =>
      changePasswordSchema.parse({
        current_password: 'abc',
        new_password: 'short',
        confirm_password: 'short',
      }),
    ).toThrow();
  });

  it('rejects reusing the current password', () => {
    expect(() =>
      changePasswordSchema.parse({
        current_password: 'samepass1',
        new_password: 'samepass1',
        confirm_password: 'samepass1',
      }),
    ).toThrow();
  });

  it('accepts a valid change', () => {
    const parsed = changePasswordSchema.parse({
      current_password: 'oldpass123',
      new_password: 'newpass456',
      confirm_password: 'newpass456',
    });
    expect(parsed.new_password).toBe('newpass456');
  });
});
