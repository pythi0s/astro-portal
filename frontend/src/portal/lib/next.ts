export function safePortalNext(next: string | null): string {
  if (!next || !next.startsWith('/portal') || next.startsWith('//')) return '/portal/appointments';
  return next;
}
