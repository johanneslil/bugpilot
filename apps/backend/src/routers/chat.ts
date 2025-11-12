import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';

export const chatRouter = router({
  getOrCreateSession: publicProcedure
    .input(z.object({ session_id: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      if (input.session_id) {
        const session = await ctx.prisma.chatSession.findUnique({
          where: { id: input.session_id },
        });
        if (session) return session;
      }

      const session = await ctx.prisma.chatSession.create({
        data: {},
      });

      return session;
    }),

  getHistory: publicProcedure
    .input(z.object({
      session_id: z.string(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      const messages = await ctx.prisma.chatMessage.findMany({
        where: { session_id: input.session_id },
        orderBy: { created_at: 'asc' },
        take: input.limit,
      });

      return messages;
    }),
});

