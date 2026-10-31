import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { Button, LinkButton } from '@/components/Button';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { PaymentStatusBadge } from '@/features/visits/components/PaymentStatusBadge';

describe('<Button />', () => {
  it('defaults to type="button" and fires onClick', async () => {
    const onClick = vi.fn();
    renderWithProviders(<Button onClick={onClick}>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toHaveAttribute('type', 'button');
    await userEvent.setup().click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('explains why it is disabled', () => {
    renderWithProviders(
      <Button disabled disabledReason="Admins only">
        Delete
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Delete' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('title', 'Admins only');
  });

  it('applies variant styles', () => {
    renderWithProviders(<Button variant="danger">Remove</Button>);
    expect(screen.getByRole('button', { name: 'Remove' }).className).toMatch(/bg-rose-600/);
  });
});

describe('<LinkButton />', () => {
  it('navigates client-side without a full page reload', async () => {
    renderWithProviders(<LinkButton href="/visits/new">New visit</LinkButton>, {
      route: '/visits',
      extraRoutes: [{ path: '/visits/new', element: <p>new visit form</p> }],
    });
    const link = screen.getByRole('link', { name: 'New visit' });
    expect(link).toHaveAttribute('href', '/visits/new');
    await userEvent.setup().click(link);
    expect(await screen.findByText('new visit form')).toBeInTheDocument();
  });
});

describe('<PageHeader />', () => {
  it('renders title, description and actions', () => {
    renderWithProviders(
      <PageHeader title="Customers" description="All clients" actions={<button>Add</button>} />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Customers' })).toBeInTheDocument();
    expect(screen.getByText('All clients')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });
});

describe('<EmptyState />', () => {
  it('announces itself as a status with optional action', () => {
    renderWithProviders(<EmptyState title="Nothing here" description="Add one" action={<a href="#x">Go</a>} />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Nothing here');
    expect(status).toHaveTextContent('Add one');
    expect(screen.getByRole('link', { name: 'Go' })).toBeInTheDocument();
  });
});

describe('<PaymentStatusBadge />', () => {
  it.each([
    ['paid', 'Paid'],
    ['pending', 'Pending'],
    ['partial', 'Partial'],
    ['waived', 'Waived'],
  ] as const)('labels %s', (status, label) => {
    renderWithProviders(<PaymentStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
