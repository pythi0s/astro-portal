export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  userList: (params: Record<string, unknown>) => [...adminKeys.users(), 'list', params] as const,
  userDetail: (id: number) => [...adminKeys.users(), 'detail', id] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
};
