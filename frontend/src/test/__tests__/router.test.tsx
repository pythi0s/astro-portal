import { describe, expect, it } from 'vitest';
import { router } from '@/router';

function collectPaths(routes: typeof router.routes, prefix = ''): string[] {
  return routes.flatMap((r) => {
    const here = r.path ? (r.path.startsWith('/') ? r.path : `${prefix}/${r.path}`) : prefix;
    return [...(r.path ? [here] : []), ...(r.children ? collectPaths(r.children, here) : [])];
  });
}

describe('router', () => {
  const paths = collectPaths(router.routes);

  it('registers the customer portal as its own app', () => {
    expect(paths).toEqual(
      expect.arrayContaining(['/portal', '/portal/login', '/portal/register', '/portal/appointments', '/portal/book']),
    );
  });

  it('exposes the staff appointments page', () => {
    expect(paths).toContain('/appointments');
  });

  it('keeps every existing staff route', () => {
    for (const p of [
      '/login',
      '/dashboard',
      '/customers',
      '/customers/:id',
      '/visits',
      '/solutions',
      '/templates',
      '/messages/send',
      '/messages/log',
      '/admin/users',
      '/admin/automation',
      '/profile',
    ]) {
      expect(paths).toContain(p);
    }
  });
});
