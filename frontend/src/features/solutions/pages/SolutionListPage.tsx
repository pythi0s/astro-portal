import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { Button, LinkButton } from '@/components/Button';
import { PageHeader } from '@/components/PageHeader';
import { SearchInput } from '@/components/SearchInput';
import { SelectField } from '@/components/FormField';
import { Pagination } from '@/components/DataTable';
import { useUrlState } from '@/lib/urlState';
import { humanizeCategory } from '@/lib/format';
import { SolutionGrid } from '../components/SolutionGrid';
import { SolutionKpiStrip } from '../components/SolutionKpiStrip';
import { useSolutionList } from '../hooks/useSolutions';
import { SOLUTION_CATEGORIES } from '../types';

interface ListState extends Record<string, string | number | boolean> {
  q: string;
  page: number;
  pageSize: number;
  category: string;
  status: 'active' | 'inactive' | 'all';
}

const DEFAULTS: ListState = {
  q: '',
  page: 1,
  pageSize: 24,
  category: '',
  status: 'active',
};

export function SolutionListPage() {
  const [state, setState] = useUrlState<ListState>(DEFAULTS);

  const apiParams = useMemo(() => {
    const params: Record<string, string | number | boolean> = {
      skip: (state.page - 1) * state.pageSize,
      limit: state.pageSize,
    };
    if (state.q) params.search = state.q;
    if (state.category) params.category = state.category;
    if (state.status === 'active') params.is_active = true;
    else if (state.status === 'inactive') params.is_active = false;
    return params;
  }, [state]);

  const { data, isLoading, isError, isFetching } = useSolutionList(apiParams);
  const hasMore = (data?.length ?? 0) >= state.pageSize;

  return (
    <div>
      <PageHeader
        title="Solutions"
        description="Manage the catalogue of remedies and services assignable to visits."
        actions={
          <LinkButton href="/solutions/new" variant="primary">
            New solution
          </LinkButton>
        }
      />
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <SolutionKpiStrip rows={data} isLoading={isLoading} />

        <div className="flex flex-col gap-3 rounded-md border border-midnight-200 bg-white px-3 py-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <SearchInput
              value={state.q}
              onChange={(v) => setState({ q: v, page: 1 })}
              label="Search solutions"
              placeholder="Search by name or description"
            />
            <SelectField
              label="Category"
              value={state.category}
              onChange={(e) => setState({ category: e.target.value, page: 1 })}
            >
              <option value="">All</option>
              {SOLUTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {humanizeCategory(c)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Status"
              value={state.status}
              onChange={(e) =>
                setState({ status: e.target.value as ListState['status'], page: 1 })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </SelectField>
          </div>
          <div className="flex items-center gap-2">
            {isFetching && !isLoading ? (
              <span className="text-xs text-midnight-600" aria-live="polite">
                Refreshing…
              </span>
            ) : null}
          </div>
        </div>

        <SolutionGrid
          solutions={data}
          isLoading={isLoading}
          isError={isError}
          emptyAction={
            <Button variant="primary" onClick={() => setState({ q: '', category: '', status: 'active' })}>
              Reset filters
            </Button>
          }
        />

        <Pagination
          page={state.page}
          pageSize={state.pageSize}
          hasMore={hasMore}
          onChange={(patch) => setState(patch)}
        />

        <p className="text-xs text-midnight-600">
          Tip: click a card to edit. <Link className="underline" to="/solutions/new">Create a new solution</Link>.
        </p>
      </div>
    </div>
  );
}
