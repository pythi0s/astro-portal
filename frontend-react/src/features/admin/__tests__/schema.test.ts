import { describe, expect, it } from 'vitest';
import { toCreatePayload, toUpdatePayload, userCreateSchema, userUpdateSchema } from '../schema';

describe('userCreateSchema', () => {
  it('accepts a valid payload', () => {
    const parsed = userCreateSchema.parse({
      email: 'new@example.com',
      password: 'password123',
      full_name: 'New Person',
      phone: '',
      role: 'astrologer',
    });
    expect(parsed.email).toBe('new@example.com');
    expect(parsed.role).toBe('astrologer');
  });

  it('rejects short passwords', () => {
    expect(() =>
      userCreateSchema.parse({
        email: 'a@b.com',
        password: 'short',
        full_name: '',
        phone: '',
        role: 'astrologer',
      }),
    ).toThrow();
  });

  it('rejects invalid emails', () => {
    expect(() =>
      userCreateSchema.parse({
        email: 'nope',
        password: 'password123',
        full_name: '',
        phone: '',
        role: 'admin',
      }),
    ).toThrow();
  });
});

describe('userUpdateSchema', () => {
  it('accepts empty new_password (means unchanged)', () => {
    const parsed = userUpdateSchema.parse({
      email: 'a@b.com',
      full_name: 'X',
      phone: '',
      role: 'admin',
      is_active: true,
      new_password: '',
    });
    expect(parsed.new_password).toBe('');
  });

  it('rejects short new_password', () => {
    expect(() =>
      userUpdateSchema.parse({
        email: 'a@b.com',
        full_name: 'X',
        phone: '',
        role: 'admin',
        is_active: true,
        new_password: 'short',
      }),
    ).toThrow();
  });
});

describe('toUpdatePayload', () => {
  it('omits password when new_password is empty', () => {
    const payload = toUpdatePayload({
      email: 'a@b.com',
      full_name: '',
      phone: '',
      role: 'admin',
      is_active: true,
      new_password: '',
    });
    expect(payload.password).toBeUndefined();
  });

  it('includes password when new_password is set', () => {
    const payload = toUpdatePayload({
      email: 'a@b.com',
      full_name: '',
      phone: '',
      role: 'admin',
      is_active: true,
      new_password: 'newpassword!',
    });
    expect(payload.password).toBe('newpassword!');
  });
});

describe('toCreatePayload', () => {
  it('converts empty phone to null', () => {
    const payload = toCreatePayload({
      email: 'a@b.com',
      password: 'password123',
      full_name: '',
      phone: '',
      role: 'astrologer',
    });
    expect(payload.phone).toBeNull();
  });
});
