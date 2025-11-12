import { router, publicProcedure } from '../trpc.js';

export const userRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return users;
  }),
});

