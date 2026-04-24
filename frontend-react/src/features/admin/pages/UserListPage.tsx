import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import { LinkButton } from '@/components/Button';
import { PageHeader } from '@/components/PageHeader';
import { SelectField } from '@/components/FormField';
import { formatDate, humanizeEnum } from '@/lib/format';
import { useUrlState } from '@/lib/urlState';
import { ALL_ROLES, type Role, type User } from '@/types/api';
import { useUserList } from '../hooks/useAdmin';
import { AdminStatsCard } from '../components/AdminStatsCard';

interface ListState extends Record<string, string | number | boolean> {
  role: string;
  status: 'active' | 'inactive' | 'all';
}

const DEFAULTS: ListState = {
  role: '',
  status: 'all',
};

export function UserListPage() {
  const [state, setState] = useUrlState<ListState>(DEFAULTS);

  const params = useMemo(() => {
    const out: { role?: Role; is_active?: boolean } = {};
    if (state.role) out.role = state.role as Role;
    if (state.status === 'active') out.is_active = true;
    else if (state.status === 'inactive') out.is_active = false;
    return out;
  }, [state]);

  const { data, isLoading, isError } = useUserList(params);

  const columns = useMemo<ColumnDef<User, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link to={`/admin/users/${row.original.id}`} className="font-medium text-midnight-900 hover:underline">
            {row.original.full_name || row.original.email}
          </Link>
        ),
      },
      {
        id: 'email',
        header: 'Email',
        cell: ({ row }) => row.original.email,
      },
      {
        id: 'role',
        header: 'Role',
        cell: ({ row }) => humanizeEnum(row.original.role),
      },
      {
        id: 'phone',
        header: 'Phone',
        cell: ({ row }) => row.original.phone ?? '—',
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (row.original.is_active ? 'Active' : 'Inactive'),
      },
      {
        id: 'created',
        header: 'Created',
        cell: ({ row }) => formatDate(row.original.created_at),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage the admins, astrologers, and receptionists that can access the portal."
        actions={
          <LinkButton href="/admin/users/new" variant="primary">
            New user
          </LinkButton>
        }
      />
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <AdminStatsCard />

        <div className="flex flex-col gap-3 rounded-md border border-midnight-200 bg-white px-3 py-3 sm:flex-row sm:items-end">
          <SelectField
            label="Role"
            value={state.role}
            onChange={(e) => setState({ role: e.target.value })}
          >
            <option value="">All</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {humanizeEnum(r)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Status"
            value={state.status}
            onChange={(e) => setState({ status: e.target.value as ListState['status'] })}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </SelectField>
        </div>

        <DataTable
          caption="Users"
          columns={columns}
          data={data}
          isLoading={isLoading}
          error={isError ? true : undefined}
          emptyTitle="No users match"
          emptyDescription="Try clearing the filters or add a new user."
          getRowId={(u) => String(u.id)}
        />
      </div>
    </div>
  );
}
