import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatDate, getSeverityColor, getAreaColor } from '@/lib/utils';

type Bug = {
  id: string;
  title: string;
  description: string;
  severity: string | null;
  area: string | null;
  status: string;
  created_at: string;
};

type BugCardProps = {
  bug: Bug;
};

export function BugCard({ bug }: BugCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/bugs/${bug.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2">{bug.title}</h3>
          {bug.severity && (
            <Badge className={getSeverityColor(bug.severity)}>
              {bug.severity}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 line-clamp-2 mb-3">
          {bug.description}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {bug.area && (
            <Badge className={getAreaColor(bug.area)}>
              {bug.area}
            </Badge>
          )}
          <span>•</span>
          <span>{formatDate(new Date(bug.created_at))}</span>
        </div>
      </CardContent>
    </Card>
  );
}

