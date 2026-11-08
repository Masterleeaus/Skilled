import { param } from "../../utils/requestParams";
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/permission";
import {
  createCourseSchema,
  updateCourseSchema,
  listCourseQuerySchema,
} from "./course.validators";
import * as courseService from "./course.service";
import { filterModulesForTrack, getLicenceIndex, resolveLicenceTrack } from "../curriculum/licence-track";
import { isLevelGateExempt } from "../levels/level.service";
import { prisma } from "../../config/prisma";

const router = Router();

/**
 * Identifies a signed-in caller when a valid token is sent, and carries on anonymously otherwise. The public course page
 * must keep working with an expired or missing token, so a failed check here is ignored.
 */
const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) return next();
  authenticate(req, res, () => next());
};

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listCourseQuerySchema.parse(req.query);
    const { courses, pagination } = await courseService.listCourses(query);
    return sendPaginated(res, courses, pagination);
  } catch (err) {
    next(err);
  }
});

router.get("/:slug/manage", authenticate, requirePermission("course:update:own"), async (req: Request<{ slug: string }>, res: Response, next: NextFunction) => {
  try {
    const course = await courseService.getCourseBySlugForManager(req.params.slug, req.user!.userId, req.user!.role);
    return sendSuccess(res, course);
  } catch (err) {
    next(err);
  }
});

router.get("/:slug", optionalAuthenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Licence track filters the legacy modules list, the same rules as the curriculum outline. An enrolled learner always gets
    // the saved track and ?track= is ignored. A visitor with no enrolment uses the ?track= preview, else non-licensed.
    // Staff keep the ?track= preview. The index is read without refusing: a missing licence file must not take the course
    // page down. The filter fails closed for any lesson that has a sourceId.
    const course = await courseService.getCourseBySlug(param(req, "slug"));
    const learnerId = req.user?.userId;
    const enrolment = learnerId
      ? await prisma.enrollment.findFirst({ where: { studentId: learnerId, courseId: course.id, status: { in: ["ACTIVE", "COMPLETED"] } }, select: { licenceTrack: true } })
      : null;
    const staffPreview = enrolment && learnerId ? await isLevelGateExempt({ userId: learnerId, role: req.user?.role ?? "" }) : false;
    const track = resolveLicenceTrack({ queryTrack: req.query.track, enrolment, staffPreview });
    const index = await getLicenceIndex();
    return sendSuccess(res, { ...course, modules: filterModulesForTrack(course.modules, track, index), licenceTrack: track });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  authenticate,
  requirePermission("course:create"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createCourseSchema.parse(req.body);
      const course = await courseService.createCourse(input, req.user!.userId);
      return sendSuccess(res, course, "Course created", 201);
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/:id",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateCourseSchema.parse(req.body);
      const course = await courseService.updateCourse(
        param(req, "id"),
        input,
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, course, "Course updated");
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/:id/publish",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { isPublished } = z.object({ isPublished: z.boolean() }).parse(req.body ?? {});
      const course = await courseService.setPublishStatus(
        param(req, "id"),
        isPublished,
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, course, isPublished ? "Course published" : "Course unpublished");
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("course:update:own"), // ownership check happens in service; ADMIN via course:delete separately if needed
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await courseService.deleteCourse(param(req, "id"), req.user!.userId, req.user!.role);
      return sendSuccess(res, null, "Course deleted");
    } catch (err) {
      next(err);
    }
  },
);

export default router;
