export const messageKeys = {
  all: ['messages'] as const,
  logs: () => [...messageKeys.all, 'log'] as const,
  log: (params: Record<string, unknown>) => [...messageKeys.logs(), params] as const,
};
