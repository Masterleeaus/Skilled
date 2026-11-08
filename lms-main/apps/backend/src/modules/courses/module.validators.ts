import { z } from "zod";

export const createModuleSchema = z.object({
  title: z.string().min(2).max(150),
  orderIndex: z.coerce.number().int().min(0).optional(),
});

export const updateModuleSchema = createModuleSchema.partial();

export const reorderModulesSchema = z.object({
  orderedIds: z.array(z.string().cuid()).min(1),
});

export const createLessonSchema = z.object({
  title: z.string().min(2).max(150),
  videoUrl: z.string().url().optional(),
  duration: z.coerce.number().int().min(0).optional(),
  isFreePreview: z.coerce.boolean().default(false),
  orderIndex: z.coerce.number().int().min(0).optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

export const reorderLessonsSchema = z.object({
  orderedIds: z.array(z.string().cuid()).min(1),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
