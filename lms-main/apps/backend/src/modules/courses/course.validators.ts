import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  parentId: z.string().cuid().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createCourseSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(10),
  categoryId: z.string().cuid(),
  thumbnailUrl: z.string().url().optional(),
  price: z.coerce.number().min(0).default(0),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
});

export const updateCourseSchema = createCourseSchema.partial();

export const listCourseQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  teacherId: z.string().cuid().optional(),
  published: z.coerce.boolean().optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type ListCourseQuery = z.infer<typeof listCourseQuerySchema>;
