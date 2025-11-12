import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '../../../db/prisma.js';

export const mergeBugsTool = tool({
  description: 'Merge multiple duplicate bugs into a primary bug. The primary bug will be updated with merged title and description, all comments will be transferred, and all duplicates will be DELETED. IMPORTANT: Call generateMergePreview first to get the merged content, then pass that data to this tool. This action requires user approval.',
  inputSchema: z.object({ // NOTE: should be moved to shared. Also all types not needed for this tool, some only for preview tool. 
    primaryBugId: z.string().describe('The ID of the bug to keep (primary bug)'),
    duplicateBugIds: z.array(z.string()).describe('Array of bug IDs to mark as duplicates'),
    reason: z.string().nullish().describe('Brief explanation of why these bugs are duplicates'),
    mergedTitle: z.string().describe('The merged title from generateMergePreview'),
    mergedDescription: z.string().describe('The merged description from generateMergePreview'),
    primaryBugTitle: z.string().describe('Original title of the primary bug'),
    primaryBugDescription: z.string().describe('Original description of the primary bug'),
    duplicateBugTitles: z.array(z.string()).describe('Array of original titles of duplicate bugs'),
    duplicateBugDescriptions: z.array(z.string()).describe('Array of original descriptions of duplicate bugs'),
    commentCount: z.number().describe('Total number of comments that will be transferred from all duplicates to primary'),
  }),
  needsApproval: true,
  execute: async ({ 
    primaryBugId, 
    duplicateBugIds, 
    reason,
    mergedTitle,
    mergedDescription,
    commentCount,
  }) => {
    // Validate primary bug exists
    const primaryBug = await prisma.bug.findUnique({
      where: { id: primaryBugId },
      select: { id: true, title: true, status: true },
    });

    if (!primaryBug) {
      throw new Error(`Primary bug ${primaryBugId} not found`);
    }

    // Validate all duplicate bugs exist
    const duplicateBugs = await prisma.bug.findMany({
      where: { id: { in: duplicateBugIds } },
      select: { id: true, title: true, status: true },
    });

    if (duplicateBugs.length !== duplicateBugIds.length) {
      const foundIds = duplicateBugs.map(b => b.id);
      const missingIds = duplicateBugIds.filter(id => !foundIds.includes(id));
      throw new Error(`Bugs not found: ${missingIds.join(', ')}`);
    }

    if (duplicateBugIds.includes(primaryBugId)) {
      throw new Error('Primary bug cannot be in the list of duplicates');
    }

    // Execute the merge in a transaction (this only runs after user approval)
    await prisma.$transaction(async (tx) => {
      // 1. Update primary bug with merged content
      await tx.bug.update({
        where: { id: primaryBugId },
        data: {
          title: mergedTitle,
          description: mergedDescription,
        },
      });

      // 2. Transfer all comments from all duplicates to primary
      await tx.comment.updateMany({
        where: { bug_id: { in: duplicateBugIds } },
        data: { bug_id: primaryBugId },
      });

      // 3. Delete all duplicate bugs
      await tx.bug.deleteMany({
        where: { id: { in: duplicateBugIds } },
      });
    });

    return {
      success: true,
      merged_bug: {
        id: primaryBugId,
        title: mergedTitle,
        description: mergedDescription.substring(0, 200) + (mergedDescription.length > 200 ? '...' : ''),
      },
      duplicate_bugs_count: duplicateBugIds.length,
      duplicate_bug_ids: duplicateBugIds,
      comments_transferred: commentCount,
      reason: reason || 'No reason provided',
      message: `Successfully merged ${duplicateBugIds.length} bug(s) into "${mergedTitle}". ${commentCount} comment(s) transferred and ${duplicateBugIds.length} duplicate bug(s) deleted.`,
    };
  },
});

