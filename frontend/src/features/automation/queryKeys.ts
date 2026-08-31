export const automationKeys = {
  all: ['automation'] as const,
  rules: () => [...automationKeys.all, 'rules'] as const,
  rule: (id: number) => [...automationKeys.rules(), id] as const,
  runs: () => [...automationKeys.all, 'runs'] as const,
  runList: (ruleId?: number) => [...automationKeys.runs(), { ruleId }] as const,
};
