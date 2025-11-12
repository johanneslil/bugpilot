import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '../../../db/prisma.js';
import { openaiClient } from '../openai-client.js';

export const generateMergePreviewTool = tool({
  description: 'Generate a preview of what a merged bug would look like by combining multiple bug reports. Call this before mergeBugs to show the user what the result will be. Returns merged title, description, and total comment count. Can merge 1-10 duplicate bugs into the primary bug. The duplicates will be DELETED after merging.',
  inputSchema: z.object({
    primaryBugId: z.string().describe('The ID of the bug to keep (primary bug)'),
    duplicateBugIds: z.array(z.string()).min(1).max(10).describe('Array of bug IDs to mark as duplicates (1-10 bugs)'),
  }),
  execute: async ({ primaryBugId, duplicateBugIds }) => {
    // Validate no duplicates in the array and primary not in duplicates
    if (duplicateBugIds.includes(primaryBugId)) {
      throw new Error('Primary bug cannot be in the list of duplicates');
    }

    const uniqueDuplicateIds = [...new Set(duplicateBugIds)];
    if (uniqueDuplicateIds.length !== duplicateBugIds.length) {
      throw new Error('Duplicate bug IDs must be unique');
    }

    // Fetch primary bug
    const primaryBug = await prisma.bug.findUnique({
      where: { id: primaryBugId },
      select: {
        id: true,
        title: true,
        description: true,
        severity: true,
        area: true,
        status: true,
      },
    });

    if (!primaryBug) {
      throw new Error(`Primary bug ${primaryBugId} not found`);
    }

    // Fetch all duplicate bugs
    const duplicateBugs = await prisma.bug.findMany({
      where: { id: { in: duplicateBugIds } },
      select: {
        id: true,
        title: true,
        description: true,
        severity: true,
        area: true,
        status: true,
      },
    });

    if (duplicateBugs.length !== duplicateBugIds.length) {
      const foundIds = duplicateBugs.map(b => b.id);
      const missingIds = duplicateBugIds.filter(id => !foundIds.includes(id));
      throw new Error(`Bugs not found: ${missingIds.join(', ')}`);
    }

    // Count total comments across all duplicate bugs
    const commentCounts = await prisma.comment.groupBy({
      by: ['bug_id'],
      where: { bug_id: { in: duplicateBugIds } },
      _count: { id: true },
    });
    
    const totalCommentCount = commentCounts.reduce((sum, item) => sum + item._count.id, 0);

    // Build prompt with all bugs
    const duplicateBugsText = duplicateBugs
      .map((bug, idx) => `Duplicate Bug ${idx + 1}:
Title: ${bug.title}
Description: ${bug.description.substring(0, 1000)}${bug.description.length > 1000 ? '...' : ''}
Severity: ${bug.severity || 'not set'}
Area: ${bug.area || 'not set'}`)
      .join('\n\n');

    // Use OpenAI to generate merged title and description
    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are merging multiple duplicate bug reports into one comprehensive report.

Your task:
1. Create a merged title that captures the core issue from ALL bugs
2. Create a merged description that combines all relevant information from ALL bugs

Guidelines:
- Preserve ALL technical details, error messages, and reproduction steps from all bugs
- If information conflicts, include all perspectives
- Keep the merged content clear and well-organized
- Use markdown formatting for readability
- Start the description with a brief summary, then include detailed information from all reports
- If merging many bugs, organize by theme or commonality

Output format (JSON):
{
  "mergedTitle": "Clear, concise title",
  "mergedDescription": "Comprehensive markdown description"
}`,
        },
        {
          role: 'user',
          content: `Primary Bug:
Title: ${primaryBug.title}
Description: ${primaryBug.description.substring(0, 1000)}${primaryBug.description.length > 1000 ? '...' : ''}
Severity: ${primaryBug.severity || 'not set'}
Area: ${primaryBug.area || 'not set'}

${duplicateBugsText}

Generate the merged bug report combining ALL ${duplicateBugs.length + 1} bugs above.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const mergedContent = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      success: true,
      primaryBug: {
        id: primaryBug.id,
        title: primaryBug.title,
        description: primaryBug.description,
        severity: primaryBug.severity,
        area: primaryBug.area,
      },
      duplicateBugs: duplicateBugs.map(bug => ({
        id: bug.id,
        title: bug.title,
        description: bug.description,
        severity: bug.severity,
        area: bug.area,
      })),
      mergedTitle: mergedContent.mergedTitle,
      mergedDescription: mergedContent.mergedDescription,
      commentCount: totalCommentCount,
      message: `Generated merge preview for ${duplicateBugs.length} duplicate bug(s). ${totalCommentCount} comment(s) will be transferred.`,
    };
  },
});

