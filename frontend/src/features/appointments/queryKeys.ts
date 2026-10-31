export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...appointmentKeys.lists(), params] as const,
};
