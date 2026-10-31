import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { server, fakeAdminUser } from '@/test/msw';
import { fakeBackendHandler, unknownRequests } from '@/test/fakeBackend';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useAuthStore } from '@/stores/auth';

import { Dashboard } from '@/pages/Dashboard';
import { Home } from '@/pages/Home';
import { Forbidden } from '@/pages/Forbidden';
import { NotFound } from '@/pages/NotFound';
import CustomerListPage from '@/features/customers/pages/CustomerListPage';
import CustomerNewPage from '@/features/customers/pages/CustomerNewPage';
import CustomerDetailPage from '@/features/customers/pages/CustomerDetailPage';
import CustomerEditPage from '@/features/customers/pages/CustomerEditPage';
import VisitListPage from '@/features/visits/pages/VisitListPage';
import VisitNewPage from '@/features/visits/pages/VisitNewPage';
import VisitDetailPage from '@/features/visits/pages/VisitDetailPage';
import VisitEditPage from '@/features/visits/pages/VisitEditPage';
import { SolutionListPage } from '@/features/solutions/pages/SolutionListPage';
import { SolutionNewPage } from '@/features/solutions/pages/SolutionNewPage';
import { SolutionEditPage } from '@/features/solutions/pages/SolutionEditPage';
import { TemplateListPage } from '@/features/templates/pages/TemplateListPage';
import { TemplateNewPage } from '@/features/templates/pages/TemplateNewPage';
import { TemplateEditPage } from '@/features/templates/pages/TemplateEditPage';
import { SendMessagePage } from '@/features/messages/pages/SendMessagePage';
import { MessageLogPage } from '@/features/messages/pages/MessageLogPage';
import { UserListPage } from '@/features/admin/pages/UserListPage';
import { UserNewPage } from '@/features/admin/pages/UserNewPage';
import { UserDetailPage } from '@/features/admin/pages/UserDetailPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { AutomationListPage } from '@/features/automation/pages/AutomationListPage';
import { AutomationNewPage } from '@/features/automation/pages/AutomationNewPage';
import { AutomationEditPage } from '@/features/automation/pages/AutomationEditPage';
import { AppointmentListPage } from '@/features/appointments/pages/AppointmentListPage';

interface PageCase {
  name: string;
  Page: ComponentType;
  path: string;
  url: string;
  heading: RegExp;
}

const pages: PageCase[] = [
  { name: 'Dashboard', Page: Dashboard, path: '/dashboard', url: '/dashboard', heading: /good (morning|afternoon|evening)/i },
  { name: 'Home', Page: Home, path: '/home', url: '/home', heading: /welcome/i },
  { name: 'Forbidden', Page: Forbidden, path: '/403', url: '/403', heading: /./ },
  { name: 'NotFound', Page: NotFound, path: '/404', url: '/404', heading: /./ },
  { name: 'CustomerList', Page: CustomerListPage, path: '/customers', url: '/customers', heading: /customers/i },
  { name: 'CustomerNew', Page: CustomerNewPage, path: '/customers/new', url: '/customers/new', heading: /customer/i },
  { name: 'CustomerDetail', Page: CustomerDetailPage, path: '/customers/:id', url: '/customers/1', heading: /aarav sharma/i },
  { name: 'CustomerEdit', Page: CustomerEditPage, path: '/customers/:id/edit', url: '/customers/1/edit', heading: /edit|aarav/i },
  { name: 'VisitList', Page: VisitListPage, path: '/visits', url: '/visits', heading: /visits/i },
  { name: 'VisitNew', Page: VisitNewPage, path: '/visits/new', url: '/visits/new', heading: /visit/i },
  { name: 'VisitDetail', Page: VisitDetailPage, path: '/visits/:id', url: '/visits/1', heading: /visit/i },
  { name: 'VisitEdit', Page: VisitEditPage, path: '/visits/:id/edit', url: '/visits/1/edit', heading: /visit/i },
  { name: 'SolutionList', Page: SolutionListPage, path: '/solutions', url: '/solutions', heading: /solutions/i },
  { name: 'SolutionNew', Page: SolutionNewPage, path: '/solutions/new', url: '/solutions/new', heading: /solution/i },
  { name: 'SolutionEdit', Page: SolutionEditPage, path: '/solutions/:id/edit', url: '/solutions/1/edit', heading: /solution|ruby/i },
  { name: 'TemplateList', Page: TemplateListPage, path: '/templates', url: '/templates', heading: /templates/i },
  { name: 'TemplateNew', Page: TemplateNewPage, path: '/templates/new', url: '/templates/new', heading: /template/i },
  { name: 'TemplateEdit', Page: TemplateEditPage, path: '/templates/:id/edit', url: '/templates/1/edit', heading: /template|welcome/i },
  { name: 'SendMessage', Page: SendMessagePage, path: '/messages/send', url: '/messages/send', heading: /message/i },
  { name: 'MessageLog', Page: MessageLogPage, path: '/messages/log', url: '/messages/log', heading: /message/i },
  { name: 'UserList', Page: UserListPage, path: '/admin/users', url: '/admin/users', heading: /users/i },
  { name: 'UserNew', Page: UserNewPage, path: '/admin/users/new', url: '/admin/users/new', heading: /user/i },
  { name: 'UserDetail', Page: UserDetailPage, path: '/admin/users/:id', url: '/admin/users/1', heading: /admin user|user/i },
  { name: 'Profile', Page: ProfilePage, path: '/profile', url: '/profile', heading: /profile/i },
  { name: 'AutomationList', Page: AutomationListPage, path: '/admin/automation', url: '/admin/automation', heading: /automated reminders/i },
  { name: 'AutomationNew', Page: AutomationNewPage, path: '/admin/automation/new', url: '/admin/automation/new', heading: /automation|rule/i },
  { name: 'AutomationEdit', Page: AutomationEditPage, path: '/admin/automation/:id/edit', url: '/admin/automation/1/edit', heading: /automation|rule|follow-up/i },
  { name: 'Appointments', Page: AppointmentListPage, path: '/appointments', url: '/appointments', heading: /appointments/i },
];

describe('every staff page renders against the API contract', () => {
  beforeEach(() => {
    unknownRequests.length = 0;
    useAuthStore.setState({ token: 'fake.jwt.token', user: fakeAdminUser, isBooting: false });
    server.use(fakeBackendHandler);
  });

  it.each(pages)('$name', async ({ Page, path, url, heading }) => {
    renderWithProviders(<div>fallback</div>, {
      route: url,
      extraRoutes: [{ path, element: <Page /> }],
    });

    const h1 = await screen.findByRole('heading', { level: 1, name: heading });
    expect(h1).toBeVisible();
    await waitFor(() => expect(screen.queryByText(/something went wrong/i)).toBeNull());
    expect(screen.queryByText('fallback')).toBeNull();
    expect(unknownRequests).toEqual([]);
  });
});
