import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '../../../db/prisma.js';

export const getBugDetailsTool = tool({
  description: 'Get detailed information about specific bugs including comments and similar bugs',
  inputSchema: z.object({
    bugIds: z.array(z.string()).min(1).max(10).describe('Array of bug IDs to fetch details for'),
    includeComments: z.boolean().default(true).describe('Include comment thread'),
    includeSimilar: z.boolean().default(true).describe('Include similar bugs'),
  }),
  execute: async ({ bugIds, includeComments, includeSimilar }) => {
    const bugsWithDetails = await Promise.all(
      bugIds.map(async (bugId) => {
        const bug = await prisma.bug.findUnique({
          where: { id: bugId },
          include: {
            created_by: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            comments: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
              orderBy: { created_at: 'asc' as const },
            },
          },
        });

        if (!bug) {
          return { error: `Bug ${bugId} not found` };
        }

        let similarBugs: Array<{
          id: string;
          title: string;
          severity: string | null;
          area: string | null;
          status: string;
          similarity_score: string;
        }> = [];
        
        if (includeSimilar) {
          try {
            const embeddingResult = await prisma.$queryRaw<Array<{ embedding: string | null }>>`
              SELECT embedding::text as embedding FROM "Bug" WHERE id = ${bugId}
            `;
            
            if (embeddingResult.length > 0 && embeddingResult[0].embedding) {
              const embeddingArray = JSON.parse(embeddingResult[0].embedding);
              const embeddingString = `[${embeddingArray.join(',')}]`;

            const similar = await prisma.$queryRaw<Array<{
              id: string;
              title: string;
              severity: string | null;
              area: string | null;
              status: string;
              distance: number;
            }>>`
              SELECT 
                id, title, severity, area, status,
                (embedding <=> ${embeddingString}::vector) AS distance
              FROM "Bug"
              WHERE id != ${bugId}
              ORDER BY distance
              LIMIT 3
            `;

              similarBugs = similar.map(s => ({
                id: s.id,
                title: s.title,
                severity: s.severity,
                area: s.area,
                status: s.status,
                similarity_score: (1 - s.distance).toFixed(3),
              }));
            }
          } catch (error) {
            console.error('Failed to find similar bugs:', error);
          }
        }

        return {
          id: bug.id,
          title: bug.title,
          description: bug.description,
          severity: bug.severity,
          area: bug.area,
          suggested_severity: bug.suggested_severity,
          suggested_area: bug.suggested_area,
          status: bug.status,
          created_by: bug.created_by.name,
          created_at: bug.created_at.toISOString(),
          ...(includeComments && {
            comments: bug.comments.map(c => ({
              content: c.content,
              user: c.user.name,
              created_at: c.created_at.toISOString(),
            })),
          }),
          ...(includeSimilar && { similar_bugs: similarBugs }),
        };
      })
    );

    return {
      bugs: bugsWithDetails,
      requested_count: bugIds.length,
    };
  },
});

