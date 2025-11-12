import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { formatDate } from '@/lib/utils';
import { useCommentThread } from '@/hooks/use-comment-thread';

type CommentThreadProps = {
  bugId: string;
};

export function CommentThread({ bugId }: CommentThreadProps) {
  const {
    comments,
    isLoading,
    comment,
    setComment,
    handleSubmit,
    isSubmitting,
  } = useCommentThread(bugId);

  if (isLoading) {
    return <div className="text-sm text-slate-600">Loading comments...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Comments</h2>
      
      {comments && comments.length > 0 ? (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-slate-100 pb-4 last:border-b-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">{comment.user.name}</span>
                <span className="text-xs text-slate-500">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-600 mb-6">No comments yet</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={!comment.trim() || isSubmitting}
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </Button>
      </form>
    </div>
  );
}

