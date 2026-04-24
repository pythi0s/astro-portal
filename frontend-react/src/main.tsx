import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { router } from '@/router';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/ConfirmProvider';

import '@/api/auth';
import '@/index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found in index.html');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <QueryProvider>
          <RouterProvider router={router} />
        </QueryProvider>
      </ConfirmProvider>
    </ToastProvider>
  </React.StrictMode>,
);
