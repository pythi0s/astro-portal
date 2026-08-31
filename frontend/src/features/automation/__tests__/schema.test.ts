import { describe, expect, it } from 'vitest';
import { automationRuleSchema, emptyAutomationRule, toAutomationRulePayload } from '../schema';

describe('automationRuleSchema', () => {
  it('accepts a valid due follow-up rule', () => {
    const values = { ...emptyAutomationRule, name: 'Tomorrow reminder', template_id: 5 };

    expect(automationRuleSchema.parse(values)).toEqual(values);
    expect(toAutomationRulePayload({ ...values, filter_city: 'Pune' })).toMatchObject({
      offset_days: -1,
      filter: { city: 'Pune' },
    });
  });

  it('requires a template', () => {
    const result = automationRuleSchema.safeParse({
      ...emptyAutomationRule,
      name: 'Reminder',
    });

    expect(result.success).toBe(false);
  });

  it('requires the end of the send window to be after the start', () => {
    const result = automationRuleSchema.safeParse({
      ...emptyAutomationRule,
      name: 'Reminder',
      template_id: 1,
      send_window_start_hour: 18,
      send_window_end_hour: 9,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.send_window_end_hour).toContain(
        'End hour must be after start hour',
      );
    }
  });
});
