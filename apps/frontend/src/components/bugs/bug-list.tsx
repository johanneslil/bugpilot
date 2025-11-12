import { BugCard } from './bug-card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useBugFilterStore } from '@/lib/store';
import { useBugList } from '@/hooks/use-bug-list';

export function BugList() {
  const { filters, setFilters, clearFilters } = useBugFilterStore();
  const { bugs, isLoading, error } = useBugList();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading bugs: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-3">
        <Select
          value={filters.severity || 'all'}
          onValueChange={(value) => setFilters({ ...filters, severity: value === 'all' ? undefined : value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="S0">S0 - Critical</SelectItem>
            <SelectItem value="S1">S1 - High</SelectItem>
            <SelectItem value="S2">S2 - Medium</SelectItem>
            <SelectItem value="S3">S3 - Low</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.area || 'all'}
          onValueChange={(value) => setFilters({ ...filters, area: value === 'all' ? undefined : value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            <SelectItem value="FRONTEND">Frontend</SelectItem>
            <SelectItem value="BACKEND">Backend</SelectItem>
            <SelectItem value="INFRA">Infrastructure</SelectItem>
            <SelectItem value="DATA">Data</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>

        {(filters.severity || filters.area || filters.status) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {!bugs || bugs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600">No bugs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bugs.map((bug) => (
            <BugCard key={bug.id} bug={bug} />
          ))}
        </div>
      )}
    </div>
  );
}

