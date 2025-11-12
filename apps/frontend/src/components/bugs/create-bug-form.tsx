import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { getSeverityColor, getAreaColor, getSimilarityBadge } from '@/lib/utils';
import { useBugForm } from '@/hooks/use-bug-form';

type CreateBugFormProps = {
  onSuccess?: () => void;
};

export function CreateBugForm({ onSuccess }: CreateBugFormProps) {
  const {
    title,
    description,
    showResults,
    createdBug,
    setTitle,
    setDescription,
    handleSubmit,
    handleFinish,
    reset,
    isSubmitting,
    error,
  } = useBugForm(onSuccess);

  if (showResults && createdBug) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3">Bug Created Successfully!</h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">AI Suggestions:</span>
              {createdBug.bug.suggested_severity && (
                <Badge className={getSeverityColor(createdBug.bug.suggested_severity)}>
                  {createdBug.bug.suggested_severity}
                </Badge>
              )}
              {createdBug.bug.suggested_area && (
                <Badge className={getAreaColor(createdBug.bug.suggested_area)}>
                  {createdBug.bug.suggested_area}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {createdBug.similar_bugs && createdBug.similar_bugs.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Possible Duplicates</h3>
            <div className="space-y-2">
              {createdBug.similar_bugs.map((similar: any) => {
                const { label, color } = getSimilarityBadge(similar.similarity_score);
                const scorePercent = Math.round(similar.similarity_score * 100);
                
                return (
                  <div
                    key={similar.bug.id}
                    className="border border-slate-200 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={color}>{label}</Badge>
                      <span className="text-xs text-slate-500">{scorePercent}%</span>
                    </div>
                    <p className="text-sm font-medium">{similar.bug.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleFinish}>View Bug</Button>
          <Button
            variant="outline"
            onClick={reset}
          >
            Create Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief description of the bug"
          maxLength={200}
          required
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed description of the bug, steps to reproduce, expected vs actual behavior..."
          rows={6}
          required
          autoComplete="off"
        />
      </div>

      <Button
        type="submit"
        disabled={!title.trim() || !description.trim() || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Analyzing bug...' : 'Create Bug'}
      </Button>

      {error && (
        <p className="text-sm text-red-600">
          Error: {error?.message}
        </p>
      )}
    </form>
  );
}

