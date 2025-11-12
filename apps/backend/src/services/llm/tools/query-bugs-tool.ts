import { tool } from 'ai';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../db/prisma.js';
import { embeddingService } from '../embedding-service.js';

export const queryBugsTool = tool({
  description: 'Search and filter bugs by natural language query (semantic search) or by severity, area, or status. Can combine semantic search with filters.',
  inputSchema: z.object({
    query: z.string().nullish().describe('Natural language search query for semantic search'),
    severity: z.enum(['S0', 'S1', 'S2', 'S3']).nullish().describe('Filter by severity level'),
    area: z.enum(['FRONTEND', 'BACKEND', 'INFRA', 'DATA']).nullish().describe('Filter by area/category'),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).nullish().describe('Filter by status'),
    limit: z.number().min(1).max(50).default(20).describe('Maximum number of bugs to return'),
  }),
  execute: async ({ query, severity, area, status, limit }) => {
    if (query) {
      console.log('[Semantic Search] Query:', query, '| Filters:', { severity, area, status, limit });
      
      const queryEmbedding = await embeddingService.generate(query);
      const embeddingString = `[${queryEmbedding.join(',')}]`;

      const whereClauses: Prisma.Sql[] = [Prisma.sql`b.embedding IS NOT NULL`];
      if (severity) whereClauses.push(Prisma.sql`b.severity = ${severity}`);
      if (area) whereClauses.push(Prisma.sql`b.area = ${area}`);
      if (status) whereClauses.push(Prisma.sql`b.status = ${status}`);
      const whereClause = Prisma.join(whereClauses, ' AND ');

      const bugs = await prisma.$queryRaw<Array<{
        id: string;
        title: string;
        description: string;
        severity: string | null;
        area: string | null;
        status: string;
        created_by_id: string;
        created_at: Date;
        distance: number;
      }>>`
        SELECT 
          b.id, b.title, b.description, b.severity, b.area, b.status, b.created_by_id, b.created_at,
          (b.embedding <=> ${embeddingString}::vector) AS distance
        FROM "Bug" b
        WHERE ${whereClause}
        ORDER BY distance
        LIMIT ${limit}
      `; // cosine distance is used to sort the bugs by similarity to the query

      const userIds = [...new Set(bugs.map(bug => bug.created_by_id))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      });
      const userMap = new Map(users.map(u => [u.id, u.name]));

      return {
        bugs: bugs.map(bug => ({
          id: bug.id,
          title: bug.title,
          description: bug.description,
          severity: bug.severity,
          area: bug.area,
          status: bug.status,
          created_by: userMap.get(bug.created_by_id) || 'Unknown',
          created_at: bug.created_at.toISOString(),
          similarity_score: (1 - bug.distance).toFixed(3),
        })),
        count: bugs.length,
        search_query: query,
        filters: { severity, area, status },
      };
    }

    const bugs = await prisma.bug.findMany({
      where: {
        ...(severity && { severity }),
        ...(area && { area }),
        ...(status && { status }),
      },
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        created_by: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      bugs: bugs.map(bug => ({
        id: bug.id,
        title: bug.title,
        description: bug.description,
        severity: bug.severity,
        area: bug.area,
        status: bug.status,
        created_by: bug.created_by.name,
        created_at: bug.created_at.toISOString(),
      })),
      count: bugs.length,
      filters: { severity, area, status },
    };
  },
});

