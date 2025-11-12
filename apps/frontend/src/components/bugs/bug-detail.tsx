import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatDate, getSeverityColor, getAreaColor } from '@/lib/utils';
import { SimilarBugsList } from './similar-bugs-list';
import { useBugDetail } from '@/hooks/use-bug-detail';
import ReactMarkdown from 'react-markdown';

type BugDetailProps = {
  bugId: string;
};

export function BugDetail({ bugId }: BugDetailProps) {
  const {
    bug,
    similarBugs,
    isLoading,
    error,
    updateBug,
    isUpdating,
    findSimilarBugs,
    isFindingSimilar,
    findSimilarError,
  } = useBugDetail(bugId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-100 rounded w-3/4 animate-pulse" />
        <div className="h-32 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !bug) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading bug: {error?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold">{bug.title}</h1>
          <div className="flex gap-2">
            {bug.severity && (
              <Badge className={getSeverityColor(bug.severity)}>
                {bug.severity}
              </Badge>
            )}
            {bug.area && (
              <Badge className={getAreaColor(bug.area)}>
                {bug.area}
              </Badge>
            )}
          </div>
        </div>

        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 prose prose-slate max-w-none">
          <ReactMarkdown>{bug.description}</ReactMarkdown>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
          <span>Status: <span className="font-medium">{bug.status}</span></span>
          <span>•</span>
          <span>Created: {formatDate(new Date(bug.created_at))}</span>
        </div>

        {(bug.suggested_severity || bug.suggested_area) && (
          <div className="border-t border-slate-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span>💡</span>
              AI Suggestions
            </h3>
            <div className="space-y-2 text-sm">
              {bug.suggested_severity && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Suggested Severity:</span>
                  <Badge className={getSeverityColor(bug.suggested_severity)}>
                    {bug.suggested_severity}
                  </Badge>
                  {!bug.severity && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        updateBug({
                          severity: bug.suggested_severity as any,
                        });
                      }}
                      disabled={isUpdating}
                    >
                      Apply
                    </Button>
                  )}
                </div>
              )}
              {bug.suggested_area && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Suggested Area:</span>
                  <Badge className={getAreaColor(bug.suggested_area)}>
                    {bug.suggested_area}
                  </Badge>
                  {!bug.area && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        updateBug({
                          area: bug.suggested_area as any,
                        });
                      }}
                      disabled={isUpdating}
                    >
                      Apply
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Similar Bugs</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={findSimilarBugs}
            disabled={isFindingSimilar}
          >
            {isFindingSimilar ? 'Finding...' : similarBugs && similarBugs.length > 0 ? 'Refresh' : 'Find Similar'}
          </Button>
        </div>

        {findSimilarError && (
          <div className="text-sm text-red-600 mb-3">
            Error finding similar bugs: {findSimilarError?.message}
          </div>
        )}

        {similarBugs && similarBugs.length > 0 ? (
          <SimilarBugsList similarBugs={similarBugs} />
        ) : (
          <p className="text-sm text-slate-600">
            Click "Find Similar" to search for related bugs.
          </p>
        )}
      </div>
    </div>
  );
}

