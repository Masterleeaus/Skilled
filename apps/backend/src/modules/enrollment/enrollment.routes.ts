import { param } from "../../utils/requestParams";
import { Router, Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/response";
import { authenticate } from "../../middleware/authenticate";
import { requireRole, requirePermission } from "../../middleware/permission";
import { enrollSchema, licenceTrackSchema, updateProgressSchema } from "./enrollment.validators";
import * as enrollmentService from "./enrollment.service";

const router = Router();

router.post(
  "/",
  authenticate,
  requireRole("STUDENT"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, licenceTrack } = enrollSchema.parse(req.body);
      const enrollment = await enrollmentService.enrollInCourse(req.user!.userId, courseId, licenceTrack);
      return sendSuccess(res, enrollment, "Enrolled successfully", 201);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/course/:courseId/students",
  authenticate,
  requirePermission("attendance:mark"),
  async (req: Request<{ courseId: string }>, res: Response, next: NextFunction) => {
    try {
      const { assertCourseOwnership } = await import("../courses/course.service");
      await assertCourseOwnership(req.params.courseId, req.user!.userId, req.user!.role);
      const students = await enrollmentService.listEnrolledStudents(req.params.courseId);
      return sendSuccess(res, students.map((e) => e.student));
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/course/:courseId/roster",
  authenticate,
  requirePermission("attendance:mark"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assertCourseOwnership } = await import("../courses/course.service");
      await assertCourseOwnership(param(req, "courseId"), req.user!.userId, req.user!.role);

      const roster = await enrollmentService.getCourseRoster(param(req, "courseId"));
      return sendSuccess(res, roster);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/course/:courseId/students/:studentId",
  authenticate,
  requirePermission("attendance:mark"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assertCourseOwnership } = await import("../courses/course.service");
      await assertCourseOwnership(param(req, "courseId"), req.user!.userId, req.user!.role);

      const detail = await enrollmentService.getStudentDetailForCourse(
        param(req, "courseId"),
        param(req, "studentId"),
      );
      return sendSuccess(res, detail);
    } catch (err) {
      next(err);
    }
  },
);

router.get("/my-courses", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enrollments = await enrollmentService.listMyEnrollments(req.user!.userId);
    return sendSuccess(res, enrollments);
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:courseId/progress",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const progress = await enrollmentService.getCourseProgress(req.user!.userId, param(req, "courseId"));
      return sendSuccess(res, progress);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/enrollments/:courseId/licence-track  body: { "licenceTrack": "non-licensed" | "licensed" }
// Changes the learner's own saved track. Progress and completions are kept.
router.patch(
  "/:courseId/licence-track",
  authenticate,
  requireRole("STUDENT"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { licenceTrack } = licenceTrackSchema.parse(req.body);
      const enrollment = await enrollmentService.setEnrolmentLicenceTrack(req.user!.userId, param(req, "courseId"), licenceTrack);
      return sendSuccess(res, enrollment, "Licence track updated");
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/lessons/:lessonId/progress",
  authenticate,
  requireRole("STUDENT"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { watchedSeconds, completed } = updateProgressSchema.parse(req.body);
      const progress = await enrollmentService.updateLessonProgress(
        req.user!.userId,
        param(req, "lessonId"),
        watchedSeconds,
        completed,
      );
      return sendSuccess(res, progress, "Progress updated");
    } catch (err) {
      next(err);
    }
  },
);

export default router;
