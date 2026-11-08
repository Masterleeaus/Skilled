import { param } from "../../utils/requestParams";
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { sendSuccess } from "../../utils/response";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission, requireRole } from "../../middleware/permission";
import { createLiveClassSchema, markAttendanceSchema } from "./class.validators";
import * as classService from "./class.service";

const router = Router();

router.post(
  "/",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createLiveClassSchema.parse(req.body);
      const liveClass = await classService.createLiveClass(input, req.user!.userId, req.user!.role);
      return sendSuccess(res, liveClass, "Live class scheduled", 201);
    } catch (err) {
      next(err);
    }
  },
);

router.get("/course/:courseId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classes = await classService.listLiveClassesForCourse(param(req, "courseId"));
    return sendSuccess(res, classes);
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/:id/status",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = z
        .object({ status: z.enum(["SCHEDULED", "LIVE", "ENDED", "CANCELLED"]) })
        .parse(req.body ?? {});
      const liveClass = await classService.updateLiveClassStatus(
        param(req, "id"),
        status,
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, liveClass, "Status updated");
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/:id/recording",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { recordingUrl } = z.object({ recordingUrl: z.string().url() }).parse(req.body ?? {});
      const liveClass = await classService.setRecordingUrl(
        param(req, "id"),
        recordingUrl,
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, liveClass, "Recording attached");
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/:id/attendance",
  authenticate,
  requirePermission("attendance:mark"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = markAttendanceSchema.parse(req.body);
      const records = await classService.markAttendance(
        param(req, "id"),
        input,
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, records, "Attendance marked");
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:id/attendance",
  authenticate,
  requirePermission("attendance:mark"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const records = await classService.getAttendanceForClass(
        param(req, "id"),
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, records);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/course/:courseId/my-attendance",
  authenticate,
  requireRole("STUDENT"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const records = await classService.getMyAttendance(param(req, "courseId"), req.user!.userId);
      return sendSuccess(res, records);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
