import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { humanizeCategory } from '@/lib/format';
import { Skeleton } from '@/components/Skeleton';

interface SolutionOption {
  id: number;
  name: string;
  category: string;
}

interface Props {
  value: number[];
  onChange: (ids: number[]) => void;
}

async function fetchActiveSolutions(): Promise<SolutionOption[]> {
  const { data } = await apiClient.get<SolutionOption[]>('/solutions/', {
    params: { is_active: true, limit: 200 },
  });
  return data;
}

export function SolutionPicker({ value, onChange }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['solutions', 'picker'],
    queryFn: fetchActiveSolutions,
    staleTime: 60_000,
  });

  if (isLoading) return <Skeleton className="h-16 w-full" />;

  const options = data ?? [];
  const byCategory = new Map<string, SolutionOption[]>();
  for (const s of options) {
    const list = byCategory.get(s.category) ?? [];
    list.push(s);
    byCategory.set(s.category, list);
  }

  function toggle(id: number) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  if (options.length === 0) {
    return (
      <p className="text-sm text-midnight-600">
        No active solutions yet. Create a solution from the Solutions page to link it to this visit.
      </p>
    );
  }

  return (
    <fieldset>
      <legend className="sr-only">Select solutions to give at this visit</legend>
      <div className="flex flex-col gap-3">
        {[...byCategory.entries()].map(([cat, list]) => (
          <div key={cat} className="rounded-md border border-midnight-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-midnight-600">
              {humanizeCategory(cat)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {list.map((s) => {
                const checked = value.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={
                      checked
                        ? 'inline-flex cursor-pointer items-center gap-1 rounded-full border border-primary-600 bg-primary-50 px-2.5 py-1 text-sm text-primary-900'
                        : 'inline-flex cursor-pointer items-center gap-1 rounded-full border border-midnight-200 bg-white px-2.5 py-1 text-sm text-midnight-800 hover:bg-midnight-700/5'
                    }
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(s.id)}
                      className="sr-only"
                    />
                    <span aria-hidden="true" className="text-xs">
                      {checked ? '✓' : '+'}
                    </span>
                    {s.name}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
