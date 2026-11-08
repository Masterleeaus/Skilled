import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/permission";
import { ForbiddenError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import { param } from "../../utils/requestParams";
import { LESSON_STATUSES, listCourseLessonSources, readLessonSource, updateLessonSource } from "./superadmin-lesson.service";

// Superadmin = the ADMIN role. Teachers and learners cannot read or change lesson source through these routes.
const superadmin = [authenticate, requireRole("ADMIN")] as const;
const run = (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response, next: NextFunction) => { try { await fn(req, res); } catch (e) { next(e); } };

const patchSchema = z.object({
  expectedHash: z.string().regex(/^[a-f0-9]{64}$/, "expectedHash must be the SHA-256 of the lesson file as it was loaded"),
  changes: z.record(z.string(), z.union([z.string(), z.array(z.unknown()), z.record(z.string(), z.unknown()), z.null()])).optional(),
  status: z.enum(LESSON_STATUSES).optional(),
}).refine(value => Object.keys(value.changes ?? {}).length > 0 || value.status !== undefined, { message: "Nothing to save" });

const router = Router();

router.get("/superadmin/courses/:courseSlug/lessons", ...superadmin, run(async (req, res) => {
  sendSuccess(res, await listCourseLessonSources(param(req, "courseSlug")));
}));

router.get("/superadmin/lessons/:lessonId", ...superadmin, run(async (req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  sendSuccess(res, await readLessonSource(param(req, "lessonId")));
}));

router.patch("/superadmin/lessons/:lessonId", ...superadmin, run(async (req, res) => {
  const actorId = req.user?.userId;
  if (!actorId) throw new ForbiddenError("Authentication required");
  const input = patchSchema.parse(req.body);
  const result = await updateLessonSource({
    lessonId: param(req, "lessonId"),
    actorId,
    expectedHash: input.expectedHash,
    changes: input.changes,
    status: input.status,
  });
  sendSuccess(res, result, "Lesson saved");
}));

export default router;
