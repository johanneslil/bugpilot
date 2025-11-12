import { useState } from 'react';
import { trpc } from '@/lib/trpc';

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

type BugUpdate = {
  severity?: 'S0' | 'S1' | 'S2' | 'S3';
  area?: 'FRONTEND' | 'BACKEND' | 'INFRA' | 'DATA';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
};

/**
 * Manages bug detail data fetching, mutations, and similar bugs state.
 * Encapsulates all data layer concerns for the bug detail view.
 * 
 * @param bugId - ID of the bug to fetch and manage
 * @returns Bug data, similar bugs, loading states, errors, and mutation functions
 */
export function useBugDetail(bugId: string) {
  const utils = trpc.useUtils();
  const [manualSimilarBugs, setManualSimilarBugs] = useState<SimilarBug[] | null>(null);
  
  const bugQuery = trpc.bug.get.useQuery({ id: bugId });
  
  const updateBug = trpc.bug.update.useMutation({
    onSuccess: () => {
      utils.bug.get.invalidate({ id: bugId });
      utils.bug.list.invalidate();
    },
  });

  const findSimilarBugs = trpc.bug.findSimilar.useMutation({
    onSuccess: (similarBugs) => {
      setManualSimilarBugs(similarBugs as SimilarBug[]);
    },
  });

  const displaySimilarBugs = manualSimilarBugs ?? bugQuery.data?.similar_bugs;

  return {
    bug: bugQuery.data?.bug,
    similarBugs: displaySimilarBugs,
    isLoading: bugQuery.isLoading,
    error: bugQuery.error,
    updateBug: (updates: BugUpdate) => updateBug.mutate({ id: bugId, ...updates }),
    isUpdating: updateBug.isPending,
    findSimilarBugs: () => findSimilarBugs.mutate({ bug_id: bugId }),
    isFindingSimilar: findSimilarBugs.isPending,
    findSimilarError: findSimilarBugs.error,
  };
}

