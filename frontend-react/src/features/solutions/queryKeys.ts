export const solutionKeys = {
  all: ['solutions'] as const,
  lists: () => [...solutionKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...solutionKeys.lists(), params] as const,
  details: () => [...solutionKeys.all, 'detail'] as const,
  detail: (id: number) => [...solutionKeys.details(), id] as const,
};
