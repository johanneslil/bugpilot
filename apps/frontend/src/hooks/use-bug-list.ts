import { trpc } from '@/lib/trpc';
import { useBugFilterStore } from '@/lib/store';

/**
 * Manages bug list data fetching with filters.
 * Integrates with Zustand bug filter store for filter state management.
 * 
 * @returns Bug list data, loading state, error, and filter management
 */
export function useBugList() {
  const { filters } = useBugFilterStore();

  const bugListQuery = trpc.bug.list.useQuery({
    severity: filters.severity as any,
    area: filters.area as any,
    status: filters.status as any,
    limit: 50,
    offset: 0,
  });

  return {
    bugs: bugListQuery.data,
    isLoading: bugListQuery.isLoading,
    error: bugListQuery.error,
  };
}

