import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import type { User } from '@/types/api';

// Shared fixture used across auth-centric interaction tests.
export const fakeAdminUser: User = {
  id: 1,
  email: 'admin@example.com',
  full_name: 'Admin User',
  phone: null,
  role: 'admin',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

// Default handlers cover the minimum surface required for auth flows and the
// one-or-two higher-level tests we ship. Tests that need to exercise other
// endpoints should install their own handlers via `server.use(...)`.
export const defaultHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (body.email === fakeAdminUser.email && body.password === 'correct-horse-battery-staple') {
      return HttpResponse.json({ access_token: 'fake.jwt.token', token_type: 'bearer' });
    }
    return HttpResponse.json(
      { detail: 'Invalid credentials' },
      { status: 401 },
    );
  }),

  http.get('/api/auth/me', () => HttpResponse.json(fakeAdminUser)),

  http.post('/api/auth/refresh', () =>
    HttpResponse.json({ access_token: 'fake.jwt.token', token_type: 'bearer' }),
  ),
];

export const server = setupServer(...defaultHandlers);
