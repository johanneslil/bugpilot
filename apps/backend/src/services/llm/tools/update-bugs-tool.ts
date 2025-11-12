import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '../../../db/prisma.js';

export const updateBugsTool = tool({
  description: 'Update severity, area, or status for one or more bugs. Useful for batch updates or fixing incorrect classifications. This action requires user approval.',
  inputSchema: z.object({
    bugIds: z.array(z.string()).min(1).max(20).describe('Array of bug IDs to update'),
    updates: z.object({
      severity: z.enum(['S0', 'S1', 'S2', 'S3']).nullish().describe('New severity level'),
      area: z.enum(['FRONTEND', 'BACKEND', 'INFRA', 'DATA']).nullish().describe('New area/category'),
      status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).nullish().describe('New status'),
    }).refine(
      data => data.severity || data.area || data.status,
      { message: 'At least one update field (severity, area, or status) must be provided' }
    ),
  }),
  needsApproval: true,
  execute: async ({ bugIds, updates }) => {
    // Fetch bugs to validate
    const bugs = await prisma.bug.findMany({
      where: { id: { in: bugIds } },
      select: {
        id: true,
        title: true,
        severity: true,
        area: true,
        status: true,
      },
    });

    if (bugs.length === 0) {
      throw new Error('No bugs found with the provided IDs');
    }

    if (bugs.length !== bugIds.length) {
      const foundIds = bugs.map(b => b.id);
      const missingIds = bugIds.filter(id => !foundIds.includes(id));
      throw new Error(`Some bugs not found: ${missingIds.join(', ')}`);
    }

    // Execute the update (this only runs after user approval)
    const updateData: any = {};
    if (updates.severity) updateData.severity = updates.severity;
    if (updates.area) updateData.area = updates.area;
    if (updates.status) updateData.status = updates.status;

    const updatedBugs = await Promise.all( // TODO add transaction for atomic update
      bugIds.map(id =>
        prisma.bug.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            title: true,
            severity: true,
            area: true,
            status: true,
          },
        })
      )
    );

    return {
      success: true,
      updated_count: updatedBugs.length,
      updates_applied: updates,
      bugs: updatedBugs.map((bug, index) => {
        const oldBug = bugs[index];
        return {
          id: bug.id,
          title: bug.title,
          changes: {
            ...(updates.severity && {
              severity: { from: oldBug.severity, to: bug.severity },
            }),
            ...(updates.area && {
              area: { from: oldBug.area, to: bug.area },
            }),
            ...(updates.status && {
              status: { from: oldBug.status, to: bug.status },
            }),
          },
        };
      }),
      message: `Successfully updated ${updatedBugs.length} bug(s)`,
    };
  },
});

