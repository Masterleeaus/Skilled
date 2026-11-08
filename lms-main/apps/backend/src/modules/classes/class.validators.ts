import { z } from "zod";

export const createLiveClassSchema = z.object({
  courseId: z.string().cuid(),
  title: z.string().min(3).max(150),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(5),
  meetingLink: z.string().url().optional(),
});

export const updateLiveClassSchema = createLiveClassSchema.partial().omit({ courseId: true });

export const markAttendanceSchema = z.object({
  records: z
    .array(
      z.object({
        studentId: z.string().cuid(),
        status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
      }),
    )
    .min(1),
});

export type CreateLiveClassInput = z.infer<typeof createLiveClassSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
