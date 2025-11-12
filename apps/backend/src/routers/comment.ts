import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { createCommentInputSchema } from 'shared';

export const commentRouter = router({
  list: publicProcedure
    .input(z.object({ bug_id: z.string() }))
    .query(async ({ input, ctx }) => {
      const comments = await ctx.prisma.comment.findMany({
        where: { bug_id: input.bug_id },
        orderBy: { created_at: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return comments;
    }),

  create: publicProcedure
    .input(createCommentInputSchema)
    .mutation(async ({ input, ctx }) => {
      const comment = await ctx.prisma.comment.create({
        data: {
          content: input.content,
          bug_id: input.bug_id,
          user_id: input.user_id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return comment;
    }),
});

