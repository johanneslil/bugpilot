import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { useUser } from '@/lib/user-context';

type CreatedBug = {
  bug: {
    id: string;
    title: string;
    description: string;
    suggested_severity: string | null;
    suggested_area: string | null;
  };
  similar_bugs: Array<{
    bug: {
      id: string;
      title: string;
      description: string;
    };
    similarity_score: number;
  }>;
};

/**
 * Manages bug creation form state and submission logic.
 * Handles form fields, validation, mutation, and success flow.
 * 
 * @param onSuccess - Optional callback when bug is successfully created
 * @returns Form state, handlers, submission status, and created bug data
 */
export function useBugForm(onSuccess?: () => void) {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [createdBug, setCreatedBug] = useState<CreatedBug | null>(null);

  const utils = trpc.useUtils();
  const createBug = trpc.bug.create.useMutation({
    onSuccess: (data) => {
      utils.bug.list.invalidate();
      setCreatedBug(data as CreatedBug);
      setShowResults(true);
    },
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title.trim() || !description.trim()) return;

    createBug.mutate({
      title: title.trim(),
      description: description.trim(),
      user_id: userId,
    });
  }, [userId, title, description, createBug]);

  const handleFinish = useCallback(() => {
    if (createdBug?.bug?.id) {
      navigate(`/bugs/${createdBug.bug.id}`);
    }
    onSuccess?.();
  }, [createdBug, navigate, onSuccess]);

  const reset = useCallback(() => {
    setTitle('');
    setDescription('');
    setShowResults(false);
    setCreatedBug(null);
    onSuccess?.();
  }, [onSuccess]);

  return {
    title,
    description,
    showResults,
    createdBug,
    setTitle,
    setDescription,
    handleSubmit,
    handleFinish,
    reset,
    isSubmitting: createBug.isPending,
    error: createBug.error,
  };
}

