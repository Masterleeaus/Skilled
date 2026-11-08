import { param } from "../../utils/requestParams";
import { Router, Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/response";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/permission";
import * as moduleService from "./module.service";
import * as lessonService from "./lesson.service";
import {
  uploadVideo,
  uploadLessonVideo,
  reserveVideoUploadSlot,
  verifyUploadedVideo,
} from "./video-upload.service";
import {
  createModuleSchema,
  updateModuleSchema,
  reorderModulesSchema,
  createLessonSchema,
  updateLessonSchema,
  reorderLessonsSchema,
} from "./module.validators";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../config/prisma";
import { assertCourseOwnership } from "./course.service";
import { createPlaybackGrant, verifyPlaybackGrant, PLAYBACK_COOKIE, playbackCookiePath, streamPrivateVideo } from "./video-playback.service";

// mergeParams lets us read :courseId from the parent router mount
const router = Router({ mergeParams: true });

// ---------------- Modules ----------------

router.get("/:courseId/modules", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modules = await moduleService.listModules(param(req, "courseId"));
    return sendSuccess(res, modules);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:courseId/modules",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createModuleSchema.parse(req.body);
      const module = await moduleService.createModule(
        param(req, "courseId"),
        input,
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, module, "Module created", 201);
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/modules/:moduleId",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateModuleSchema.parse(req.body);
      const module = await moduleService.updateModule(
        param(req, "moduleId"),
        input,
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, module, "Module updated");
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/:courseId/modules/reorder",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderedIds: order } = reorderModulesSchema.parse(req.body);
      await moduleService.reorderModules(param(req, "courseId"), order, req.user!.userId, req.user!.role);
      return sendSuccess(res, null, "Modules reordered");
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/modules/:moduleId",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await moduleService.deleteModule(param(req, "moduleId"), req.user!.userId, req.user!.role);
      return sendSuccess(res, null, "Module deleted");
    } catch (err) {
      next(err);
    }
  },
);

// ---------------- Lessons ----------------

router.post(
  "/modules/:moduleId/lessons",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createLessonSchema.parse(req.body);
      const lesson = await lessonService.createLesson(
        param(req, "moduleId"),
        input,
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, lesson, "Lesson created", 201);
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/lessons/:lessonId",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateLessonSchema.parse(req.body);
      const lesson = await lessonService.updateLesson(
        param(req, "lessonId"),
        input,
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, lesson, "Lesson updated");
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/modules/:moduleId/lessons/reorder",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderedIds: order } = reorderLessonsSchema.parse(req.body);
      await lessonService.reorderLessons(param(req, "moduleId"), order, req.user!.userId, req.user!.role);
      return sendSuccess(res, null, "Lessons reordered");
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/lessons/:lessonId",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await lessonService.deleteLesson(param(req, "lessonId"), req.user!.userId, req.user!.role);
      return sendSuccess(res, null, "Lesson deleted");
    } catch (err) {
      next(err);
    }
  },
);

// ---------------- Video upload ----------------

// Reject non-owners BEFORE multipart data is accepted or written to disk/MinIO.
async function authorizeVideoUpload(req: Request, _res: Response, next: NextFunction) {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: param(req, "lessonId") },
      select: { module: { select: { courseId: true } } },
    });
    if (!lesson) throw new AppError("Lesson not found", 404);
    await assertCourseOwnership(lesson.module.courseId, req.user!.userId, req.user!.role);
    next();
  } catch (err) {
    next(err);
  }
}

router.post(
  "/lessons/:lessonId/video",
  authenticate,
  requirePermission("course:update:own"),
  authorizeVideoUpload,
  reserveVideoUploadSlot,
  uploadVideo.single("video"),
  verifyUploadedVideo,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError("No video file provided", 400);

      const objectKey = await uploadLessonVideo(req.file);
      // Ownership is checked again inside the update. The previous object is removed only after the commit.
      const lesson = await lessonService.attachUploadedLessonVideo(
        param(req, "lessonId"),
        objectKey,
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, lesson, "Video uploaded");
    } catch (err) {
      next(err);
    }
  },
);

// Both grant issuance and media delivery recheck the CURRENT user's access.
async function authorizedVideoForUser(lessonId: string, userId: string) {
  const { isEnrolled } = await import("../enrollment/enrollment.service");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true, isEmailVerified: true, deletedAt: true },
  });
  if (!user || !user.isActive || !user.isEmailVerified || user.deletedAt) {
    throw new AppError("Account unavailable", 401);
  }
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { select: { courseId: true } } },
  });
  if (!lesson?.videoUrl) throw new AppError("Video not found", 404);

  if (user.role === "STUDENT") {
    const course = await prisma.course.findUnique({
      where: { id: lesson.module.courseId },
      select: { isPublished: true, deletedAt: true },
    });
    if (!course?.isPublished || course.deletedAt) throw new AppError("Course unavailable", 404);
    if (!lesson.isFreePreview && !(await isEnrolled(userId, lesson.module.courseId))) {
      throw new AppError("Enroll in this course to watch this lesson", 403);
    }
  } else {
    await assertCourseOwnership(lesson.module.courseId, userId, user.role);
  }
  return lesson.videoUrl;
}

router.get(
  "/lessons/:lessonId/video-url",
  authenticate,
  async (req: Request<{ lessonId: string }>, res: Response, next: NextFunction) => {
    try {
      await authorizedVideoForUser(req.params.lessonId, req.user!.userId);
      res.cookie(PLAYBACK_COOKIE, createPlaybackGrant(req.params.lessonId, req.user!.userId), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: playbackCookiePath(req.params.lessonId),
        maxAge: 60 * 60 * 1000,
      });
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("Referrer-Policy", "no-referrer");
      return sendSuccess(res, { url: `/api/courses/lessons/${encodeURIComponent(req.params.lessonId)}/video/stream` });
    } catch (err) {
      next(err);
    }
  },
);

// HTML5 <video> cannot attach bearer headers. Authenticate this media GET
// with a short-lived HttpOnly scoped cookie and revalidate DB access on EVERY
// range request, so removal from a course takes effect immediately.
router.get(
  "/lessons/:lessonId/video/stream",
  async (req: Request<{ lessonId: string }>, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.[PLAYBACK_COOKIE];
      if (typeof token !== "string") throw new AppError("Video grant required", 401);
      const userId = verifyPlaybackGrant(token, req.params.lessonId);
      const objectKey = await authorizedVideoForUser(req.params.lessonId, userId);
      await streamPrivateVideo(req, res, objectKey);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
