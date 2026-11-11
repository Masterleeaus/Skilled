import { z } from "zod";

export const enrolBodySchema = z.object({
  learnerId: z.string().min(1).max(64).optional(),
  companyId: z.string().min(1).max(64).optional(),
});

export type EnrolBody = z.infer<typeof enrolBodySchema>;
