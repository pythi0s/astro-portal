import { describe, expect, it } from 'vitest';
import { solutionFormSchema, toApiPayload } from '../schema';

describe('solutionFormSchema', () => {
  it('accepts a valid form value', () => {
    const parsed = solutionFormSchema.parse({
      name: 'Ruby gemstone',
      category: 'gemstone',
      description: 'Worn on the ring finger.',
      instructions: 'Wear on Sunday morning.',
      typical_duration: '40 days',
      is_active: true,
    });
    expect(parsed.name).toBe('Ruby gemstone');
    expect(parsed.category).toBe('gemstone');
  });

  it('rejects empty name', () => {
    expect(() =>
      solutionFormSchema.parse({
        name: '   ',
        category: 'gemstone',
        is_active: true,
      }),
    ).toThrow();
  });

  it('rejects invalid category', () => {
    expect(() =>
      solutionFormSchema.parse({
        name: 'Something',
        category: 'nonsense',
        is_active: true,
      }),
    ).toThrow();
  });
});

describe('toApiPayload', () => {
  it('converts empty strings to null', () => {
    const payload = toApiPayload({
      name: 'Yantra A',
      category: 'yantra',
      description: '',
      instructions: '',
      typical_duration: '',
      is_active: false,
    });
    expect(payload).toEqual({
      name: 'Yantra A',
      category: 'yantra',
      description: null,
      instructions: null,
      typical_duration: null,
      is_active: false,
    });
  });

  it('trims whitespace', () => {
    const payload = toApiPayload({
      name: '  Puja  ',
      category: 'puja',
      description: '  small text  ',
      instructions: '',
      typical_duration: ' 3 days ',
      is_active: true,
    });
    expect(payload.name).toBe('Puja');
    expect(payload.description).toBe('small text');
    expect(payload.typical_duration).toBe('3 days');
  });
});
