import { router } from '../trpc.js';
import { bugRouter } from './bug.js';
import { commentRouter } from './comment.js';
import { chatRouter } from './chat.js';
import { userRouter } from './user.js';

export const appRouter = router({
  bug: bugRouter,
  comment: commentRouter,
  chat: chatRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

