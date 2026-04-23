import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/AppShell';
import { RequireAuth } from '@/auth/RequireAuth';
import { RequireRole } from '@/auth/RequireRole';
import { Login } from '@/pages/Login';
import { Home } from '@/pages/Home';
import { AdminDemo } from '@/pages/AdminDemo';
import { Forbidden } from '@/pages/Forbidden';
import { NotFound } from '@/pages/NotFound';
import { Dashboard } from '@/pages/Dashboard';
import { CustomerDetailStub } from '@/pages/CustomerDetailStub';

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
          { path: '/customers/:id', element: <CustomerDetailStub /> },
          {
            element: <RequireRole allow={['admin']} />,
            children: [{ path: '/admin-demo', element: <AdminDemo /> }],
          },
        ],
      },
      { path: '/404', element: <NotFound /> },
      { path: '*', element: <Navigate to="/404" replace /> },
    ],
  },
]);
