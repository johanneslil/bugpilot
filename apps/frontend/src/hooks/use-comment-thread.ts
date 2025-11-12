import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useUser } from '@/lib/user-context';

/**
 * Manages comment thread data fetching and comment creation.
 * Encapsulates comment form state and submission logic.
 * 
 * @param bugId - ID of the bug for the comment thread
 * @returns Comments data, form state, handlers, and submission status
 */
export function useCommentThread(bugId: string) {
  const { userId } = useUser();
  const [comment, setComment] = useState('');
  
  const commentsQuery = trpc.comment.list.useQuery({ bug_id: bugId });
  
  const utils = trpc.useUtils();
  const createComment = trpc.comment.create.useMutation({
    onSuccess: () => {
      utils.comment.list.invalidate({ bug_id: bugId });
      setComment('');
    },
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !comment.trim()) return;
    
    createComment.mutate({
      bug_id: bugId,
      user_id: userId,
      content: comment.trim(),
    });
  }, [bugId, userId, comment, createComment]);

  return {
    comments: commentsQuery.data,
    isLoading: commentsQuery.isLoading,
    comment,
    setComment,
    handleSubmit,
    isSubmitting: createComment.isPending,
  };
}

