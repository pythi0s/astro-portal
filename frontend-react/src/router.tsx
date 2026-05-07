import { Suspense, lazy, type ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/AppShell';
import { RequireAuth } from '@/auth/RequireAuth';
import { RequireRole } from '@/auth/RequireRole';
import { Login } from '@/pages/Login';
import { Home } from '@/pages/Home';
import { Forbidden } from '@/pages/Forbidden';
import { NotFound } from '@/pages/NotFound';
import { Dashboard } from '@/pages/Dashboard';
import { Skeleton } from '@/components/Skeleton';

type LazyModule = {
  default?: ComponentType;
  [key: string]: ComponentType | undefined;
};

/**
 * Lazy route wrapper. Every feature page is code-split with React.lazy so the
 * initial bundle stays small and each domain loads on demand. The fallback is
 * a simple skeleton so hard navigations don't flash the empty shell.
 */
function lazyRoute(factory: () => Promise<LazyModule>, exportName: string) {
  const Loaded = lazy(async () => {
    const mod = await factory();
    const resolved = mod[exportName] ?? mod.default;

    if (!resolved) {
      throw new Error(`Lazy route module is missing both named export "${exportName}" and a default export.`);
    }

    return { default: resolved };
  });
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-6" aria-live="polite" aria-busy="true">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      }
    >
      <Loaded />
    </Suspense>
  );
}

const CustomerListPage = lazyRoute(
  () => import('@/features/customers/pages/CustomerListPage'),
  'CustomerListPage',
);
const CustomerNewPage = lazyRoute(
  () => import('@/features/customers/pages/CustomerNewPage'),
  'CustomerNewPage',
);
const CustomerDetailPage = lazyRoute(
  () => import('@/features/customers/pages/CustomerDetailPage'),
  'CustomerDetailPage',
);
const CustomerEditPage = lazyRoute(
  () => import('@/features/customers/pages/CustomerEditPage'),
  'CustomerEditPage',
);

const VisitListPage = lazyRoute(
  () => import('@/features/visits/pages/VisitListPage'),
  'VisitListPage',
);
const VisitNewPage = lazyRoute(() => import('@/features/visits/pages/VisitNewPage'), 'VisitNewPage');
const VisitDetailPage = lazyRoute(
  () => import('@/features/visits/pages/VisitDetailPage'),
  'VisitDetailPage',
);
const VisitEditPage = lazyRoute(
  () => import('@/features/visits/pages/VisitEditPage'),
  'VisitEditPage',
);

const SolutionListPage = lazyRoute(
  () => import('@/features/solutions/pages/SolutionListPage'),
  'SolutionListPage',
);
const SolutionNewPage = lazyRoute(
  () => import('@/features/solutions/pages/SolutionNewPage'),
  'SolutionNewPage',
);
const SolutionEditPage = lazyRoute(
  () => import('@/features/solutions/pages/SolutionEditPage'),
  'SolutionEditPage',
);

const TemplateListPage = lazyRoute(
  () => import('@/features/templates/pages/TemplateListPage'),
  'TemplateListPage',
);
const TemplateNewPage = lazyRoute(
  () => import('@/features/templates/pages/TemplateNewPage'),
  'TemplateNewPage',
);
const TemplateEditPage = lazyRoute(
  () => import('@/features/templates/pages/TemplateEditPage'),
  'TemplateEditPage',
);

const SendMessagePage = lazyRoute(
  () => import('@/features/messages/pages/SendMessagePage'),
  'SendMessagePage',
);
const MessageLogPage = lazyRoute(
  () => import('@/features/messages/pages/MessageLogPage'),
  'MessageLogPage',
);

const UserListPage = lazyRoute(
  () => import('@/features/admin/pages/UserListPage'),
  'UserListPage',
);
const UserNewPage = lazyRoute(() => import('@/features/admin/pages/UserNewPage'), 'UserNewPage');
const UserDetailPage = lazyRoute(
  () => import('@/features/admin/pages/UserDetailPage'),
  'UserDetailPage',
);

const ProfilePage = lazyRoute(
  () => import('@/features/profile/pages/ProfilePage'),
  'ProfilePage',
);

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/403', element: <Forbidden /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/home', element: <Home /> },
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/profile', element: ProfilePage },

          { path: '/customers', element: CustomerListPage },
          { path: '/customers/new', element: CustomerNewPage },
          { path: '/customers/:id', element: CustomerDetailPage },
          { path: '/customers/:id/edit', element: CustomerEditPage },

          { path: '/visits', element: VisitListPage },
          { path: '/visits/new', element: VisitNewPage },
          { path: '/visits/:id', element: VisitDetailPage },
          { path: '/visits/:id/edit', element: VisitEditPage },

          { path: '/solutions', element: SolutionListPage },
          { path: '/solutions/new', element: SolutionNewPage },
          { path: '/solutions/:id/edit', element: SolutionEditPage },

          { path: '/templates', element: TemplateListPage },
          { path: '/templates/new', element: TemplateNewPage },
          { path: '/templates/:id/edit', element: TemplateEditPage },

          { path: '/messages/send', element: SendMessagePage },
          { path: '/messages/log', element: MessageLogPage },

          {
            element: <RequireRole allow={['admin']} />,
            children: [
              { path: '/admin/users', element: UserListPage },
              { path: '/admin/users/new', element: UserNewPage },
              { path: '/admin/users/:id', element: UserDetailPage },
            ],
          },
        ],
      },
      { path: '/404', element: <NotFound /> },
      { path: '*', element: <Navigate to="/404" replace /> },
    ],
  },
]);
