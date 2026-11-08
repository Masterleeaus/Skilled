import { z } from "zod";
import { LICENCE_TRACKS } from "../curriculum/licence-track";

export const enrollSchema = z.object({
  courseId: z.string().cuid(),
  // Saved on the enrolment. Omitted means the default (non-licensed).
  licenceTrack: z.enum(LICENCE_TRACKS).optional(),
});

// Switching the saved track. The track is required here: an empty or unknown value is refused before anything is written.
export const licenceTrackSchema = z.object({
  licenceTrack: z.enum(LICENCE_TRACKS),
});

export const updateProgressSchema = z.object({
  watchedSeconds: z.coerce.number().int().min(0).max(24 * 60 * 60),
  completed: z.coerce.boolean().optional(),
});

export type EnrollInput = z.infer<typeof enrollSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
