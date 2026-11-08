import { z } from "zod";

export const createThreadSchema = z.object({
  courseId: z.string().cuid(),
  lessonId: z.string().cuid().optional(),
  title: z.string().min(3).max(150),
  body: z.string().min(5),
});

export const createReplySchema = z.object({
  body: z.string().min(1),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type CreateReplyInput = z.infer<typeof createReplySchema>;
