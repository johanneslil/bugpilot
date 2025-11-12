import { prisma } from './db/prisma.js';

export const createContext = async () => {
  return { prisma };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

