import { z } from 'zod';

export const severityEnum = z.enum(['S0', 'S1', 'S2', 'S3']);
export const areaEnum = z.enum(['FRONTEND', 'BACKEND', 'INFRA', 'DATA']);
export const bugStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
export const messageRoleEnum = z.enum(['USER', 'ASSISTANT', 'SYSTEM']);

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  created_at: z.date(),
});

export const bugSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: severityEnum.nullable(),
  area: areaEnum.nullable(),
  suggested_severity: severityEnum.nullable(),
  suggested_area: areaEnum.nullable(),
  status: bugStatusEnum,
  created_by_id: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const commentSchema = z.object({
  id: z.string(),
  content: z.string(),
  bug_id: z.string(),
  user_id: z.string(),
  created_at: z.date(),
});

export const chatSessionSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const chatMessageSchema = z.object({
  id: z.string(),
  role: messageRoleEnum,
  content: z.string(),
  session_id: z.string(),
  created_by_id: z.string().nullable(),
  created_at: z.date(),
  is_complete: z.boolean(),
});

export const createBugInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  user_id: z.string(),
});

export const updateBugInputSchema = z.object({
  id: z.string(),
  severity: severityEnum.optional(),
  area: areaEnum.optional(),
  status: bugStatusEnum.optional(),
});

export const similarBugSchema = z.object({
  bug: bugSchema,
  similarity_score: z.number(),
});

export const createBugOutputSchema = z.object({
  bug: bugSchema,
  similar_bugs: z.array(similarBugSchema),
});

export const createCommentInputSchema = z.object({
  bug_id: z.string(),
  user_id: z.string(),
  content: z.string().min(1),
});

export const findSimilarBugsInputSchema = z.object({
  bug_id: z.string(),
});

export const listBugsInputSchema = z.object({
  severity: severityEnum.optional(),
  area: areaEnum.optional(),
  status: bugStatusEnum.optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export const chatStreamInputSchema = z.object({
  session_id: z.string(),
  message: z.string(),
  user_id: z.string(),
});

export type Severity = z.infer<typeof severityEnum>;
export type Area = z.infer<typeof areaEnum>;
export type BugStatus = z.infer<typeof bugStatusEnum>;
export type MessageRole = z.infer<typeof messageRoleEnum>;
export type User = z.infer<typeof userSchema>;
export type Bug = z.infer<typeof bugSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type ChatSession = z.infer<typeof chatSessionSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type CreateBugInput = z.infer<typeof createBugInputSchema>;
export type UpdateBugInput = z.infer<typeof updateBugInputSchema>;
export type SimilarBug = z.infer<typeof similarBugSchema>;
export type CreateBugOutput = z.infer<typeof createBugOutputSchema>;
export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;
export type FindSimilarBugsInput = z.infer<typeof findSimilarBugsInputSchema>;
export type ListBugsInput = z.infer<typeof listBugsInputSchema>;
export type ChatStreamInput = z.infer<typeof chatStreamInputSchema>;

