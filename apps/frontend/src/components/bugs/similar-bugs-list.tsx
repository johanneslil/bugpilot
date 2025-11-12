import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { getSimilarityBadge, getSeverityColor } from '@/lib/utils';

type SimilarBug = {
  bug: {
    id: string;
    title: string;
    description: string;
    severity: string | null;
    area: string | null;
  };
  similarity_score: number;
};

type SimilarBugsListProps = {
  similarBugs: SimilarBug[];
};

export function SimilarBugsList({ similarBugs }: SimilarBugsListProps) {
  const navigate = useNavigate();

  if (similarBugs.length === 0) {
    return (
      <div className="text-sm text-slate-600">
        No similar bugs found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {similarBugs.map(({ bug, similarity_score }) => {
        const { label, color } = getSimilarityBadge(similarity_score);
        const scorePercent = Math.round(similarity_score * 100);

        return (
          <div
            key={bug.id}
            className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={() => navigate(`/bugs/${bug.id}`)}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={color}>{label}</Badge>
                  <span className="text-xs text-slate-500">{scorePercent}% similar</span>
                  {bug.severity && (
                    <Badge className={getSeverityColor(bug.severity)}>
                      {bug.severity}
                    </Badge>
                  )}
                </div>
                <h4 className="font-medium text-sm hover:text-blue-600">
                  {bug.title}
                </h4>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 line-clamp-2">
              {bug.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

