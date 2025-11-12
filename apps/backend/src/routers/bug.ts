import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { 
  listBugsInputSchema, 
  createBugInputSchema, 
  updateBugInputSchema,
  findSimilarBugsInputSchema,
  type SimilarBug,
} from 'shared';
import { embeddingService } from '../services/llm/embedding-service.js';
import { classificationService } from '../services/llm/classification-service.js';
import { LLMError } from '../middleware/error-handler.js';
import { Prisma } from '@prisma/client';

export const bugRouter = router({
  list: publicProcedure
    .input(listBugsInputSchema)
    .query(async ({ input, ctx }) => {
      const where: Prisma.BugWhereInput = {};
      
      if (input.severity) where.severity = input.severity;
      if (input.area) where.area = input.area;
      if (input.status) where.status = input.status;

      const bugs = await ctx.prisma.bug.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: input.limit,
        skip: input.offset,
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

      return bugs;
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const bug = await ctx.prisma.bug.findUnique({
        where: { id: input.id },
        include: { // Runs an extra query, fetching the user who created the bug. Relations are not fetched by default.
          created_by: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!bug) {
        throw new Error('Bug not found');
      }

      let similarBugs: SimilarBug[] = [];

      // Query embedding separately using $queryRaw to handle Unsupported type
      const embeddingResult = await ctx.prisma.$queryRaw<Array<{ embedding: string | null }>>`
        SELECT embedding::text as embedding FROM "Bug" WHERE id = ${input.id}
      `;

      if (embeddingResult.length > 0 && embeddingResult[0].embedding) {
        try {
          const embeddingArray = JSON.parse(embeddingResult[0].embedding);
          const embeddingString = `[${embeddingArray.join(',')}]`;
          
          const similar = await ctx.prisma.$queryRaw<Array<{
            id: string;
            title: string;
            description: string;
            severity: string | null;
            area: string | null;
            suggested_severity: string | null;
            suggested_area: string | null;
            status: string;
            created_by_id: string;
            created_at: Date;
            updated_at: Date;
            distance: number;
          }>>`
            SELECT 
              id, title, description, severity, area, 
              suggested_severity, suggested_area, status,
              created_by_id, created_at, updated_at,
              (embedding <=> ${embeddingString}::vector) AS distance
            FROM "Bug"
            WHERE id != ${input.id}
            ORDER BY distance
            LIMIT 5
          `;

          similarBugs = similar.map(s => ({
            bug: {
              id: s.id,
              title: s.title,
              description: s.description,
              severity: s.severity as any,
              area: s.area as any,
              suggested_severity: s.suggested_severity as any,
              suggested_area: s.suggested_area as any,
              status: s.status as any,
              created_by_id: s.created_by_id,
              created_at: s.created_at,
              updated_at: s.updated_at,
            },
            similarity_score: 1 - s.distance,
          }));
        } catch (error) {
          console.error('Failed to find similar bugs:', error);
        }
      }

      return {
        bug,
        similar_bugs: similarBugs,
      };
    }),

  create: publicProcedure
    .input(createBugInputSchema)
    .mutation(async ({ input, ctx }) => {
      let embedding: number[] | null = null;
      let suggestedSeverity = null;
      let suggestedArea = null;

      try {
        const bugText = embeddingService.formatBugText(input.title, input.description);
        [embedding] = await Promise.all([
          embeddingService.generate(bugText),
        ]);

        const classification = await classificationService.classify({
          title: input.title,
          description: input.description,
        });
        suggestedSeverity = classification.severity;
        suggestedArea = classification.area;
      } catch (error) {
        console.error('LLM services failed during bug creation:', error);
      }

      const embeddingString = embedding ? `[${embedding.join(',')}]` : null;

      await ctx.prisma.$executeRaw`
        INSERT INTO "Bug" (id, title, description, suggested_severity, suggested_area, status, embedding, created_by_id, created_at, updated_at)
        VALUES (
          gen_random_uuid()::text,
          ${input.title},
          ${input.description},
          ${suggestedSeverity}::"Severity",
          ${suggestedArea}::"Area",
          'OPEN'::"BugStatus",
          ${embeddingString}::vector(1536),
          ${input.user_id},
          NOW(),
          NOW()
        )
      `;

      const createdBug = await ctx.prisma.bug.findFirst({
        where: { 
          title: input.title,
          created_by_id: input.user_id,
        },
        orderBy: { created_at: 'desc' },
      });

      if (!createdBug) {
        throw new Error('Failed to create bug');
      }

      let similarBugs: SimilarBug[] = [];

      if (embedding) {
        try {
          const embeddingStr = `[${embedding.join(',')}]`;
          const similar = await ctx.prisma.$queryRaw<Array<{
            id: string;
            title: string;
            description: string;
            severity: string | null;
            area: string | null;
            suggested_severity: string | null;
            suggested_area: string | null;
            status: string;
            created_by_id: string;
            created_at: Date;
            updated_at: Date;
            distance: number;
          }>>`
            SELECT 
              id, title, description, severity, area,
              suggested_severity, suggested_area, status,
              created_by_id, created_at, updated_at,
              (embedding <=> ${embeddingStr}::vector) AS distance
            FROM "Bug"
            WHERE id != ${createdBug.id}
            ORDER BY distance
            LIMIT 5
          `;

          similarBugs = similar.map(s => ({
            bug: {
              id: s.id,
              title: s.title,
              description: s.description,
              severity: s.severity as any,
              area: s.area as any,
              suggested_severity: s.suggested_severity as any,
              suggested_area: s.suggested_area as any,
              status: s.status as any,
              created_by_id: s.created_by_id,
              created_at: s.created_at,
              updated_at: s.updated_at,
            },
            similarity_score: 1 - s.distance,
          }));
        } catch (error) {
          console.error('Failed to find similar bugs:', error);
        }
      }

      return {
        bug: createdBug,
        similar_bugs: similarBugs,
      };
    }),

  update: publicProcedure
    .input(updateBugInputSchema)
    .mutation(async ({ input, ctx }) => {
      const data: Prisma.BugUpdateInput = {};
      
      if (input.severity !== undefined) data.severity = input.severity;
      if (input.area !== undefined) data.area = input.area;
      if (input.status !== undefined) data.status = input.status;

      const bug = await ctx.prisma.bug.update({
        where: { id: input.id },
        data,
      });

      return bug;
    }),

  findSimilar: publicProcedure
    .input(findSimilarBugsInputSchema)
    .mutation(async ({ input, ctx }) => {
      const bugResult = await ctx.prisma.$queryRaw<Array<{
        id: string;
        title: string;
        description: string;
        embedding: string | null;
      }>>`
        SELECT id, title, description, embedding::text as embedding
        FROM "Bug"
        WHERE id = ${input.bug_id}
        LIMIT 1
      `;

      if (bugResult.length === 0) {
        throw new Error('Bug not found');
      }

      const bug = bugResult[0];
      let embedding: number[] | null = bug.embedding ? JSON.parse(bug.embedding) : null;
      
      if (!embedding) {
        try {
          const bugText = embeddingService.formatBugText(bug.title, bug.description);
          embedding = await embeddingService.generate(bugText);
          
          const embeddingString = `[${embedding.join(',')}]`;
          await ctx.prisma.$executeRaw`
            UPDATE "Bug"
            SET embedding = ${embeddingString}::vector(1536), updated_at = NOW()
            WHERE id = ${input.bug_id}
          `;
        } catch (error) {
          console.error('Failed to generate embedding:', error);
          throw new LLMError('Failed to generate bug embedding');
        }
      }

      if (!embedding) {
        throw new Error('No embedding available for this bug');
      }

      const embeddingString = `[${embedding.join(',')}]`;
      const similar = await ctx.prisma.$queryRaw<Array<{
        id: string;
        title: string;
        description: string;
        severity: string | null;
        area: string | null;
        suggested_severity: string | null;
        suggested_area: string | null;
        status: string;
        created_by_id: string;
        created_at: Date;
        updated_at: Date;
        distance: number;
      }>>`
        SELECT 
          id, title, description, severity, area,
          suggested_severity, suggested_area, status,
          created_by_id, created_at, updated_at,
          (embedding <=> ${embeddingString}::vector) AS distance
        FROM "Bug"
        WHERE id != ${input.bug_id}
        ORDER BY distance
        LIMIT 5
      `;

      const similarBugs: SimilarBug[] = similar.map(s => ({
        bug: {
          id: s.id,
          title: s.title,
          description: s.description,
          severity: s.severity as any,
          area: s.area as any,
          suggested_severity: s.suggested_severity as any,
          suggested_area: s.suggested_area as any,
          status: s.status as any,
          created_by_id: s.created_by_id,
          created_at: s.created_at,
          updated_at: s.updated_at,
        },
        similarity_score: 1 - s.distance,
      }));

      return similarBugs;
    }),
});

