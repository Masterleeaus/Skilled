import { param } from "../../utils/requestParams";
import { Router, Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/response";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission, requireRole } from "../../middleware/permission";
import {
  createAssignmentSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
  gradePassingMarksSchema,
} from "./assignment.validators";
import {
  reserveAssignmentUploadSlot,
  receiveAssignmentAttachments,
  verifyAssignmentAttachments,
  beginAssignmentUpload,
  finishAssignmentUpload,
  uploadAssignmentAttachments,
  removeAssignmentAttachments,
} from "./assignment-upload.service";
import * as assignmentService from "./assignment.service";

const router = Router();

router.post(
  "/",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createAssignmentSchema.parse(req.body);
      const assignment = await assignmentService.createAssignment(
        input,
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, assignment, "Assignment created", 201);
    } catch (err) {
      next(err);
    }
  },
);

router.get("/course/:courseId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignments = await assignmentService.listAssignmentsForCourse(
      param(req, "courseId"),
      req.user!.userId,
      req.user!.role,
    );
    return sendSuccess(res, assignments);
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/:assignmentId/passing-marks",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { passingMarks } = gradePassingMarksSchema.parse(req.body);
      const assignment = await assignmentService.configureAssignmentPassingMarks(
        param(req, "assignmentId"), passingMarks, req.user!.userId, req.user!.role,
      );
      return sendSuccess(res, assignment, "Passing threshold updated");
    } catch (err) { next(err); }
  },
);

router.post(
  "/:assignmentId/submit",
  authenticate,
  requireRole("STUDENT"),
  async (req: Request<{ assignmentId: string }>, _res: Response, next: NextFunction) => {
    try {
      // Check authorisation before reading potentially large multipart bodies or writing objects.
      await assignmentService.assertCanSubmitAssignment(req.params.assignmentId, req.user!.userId);
      next();
    } catch (err) { next(err); }
  },
  // Admission control (per-user and global limits) runs before any body byte is written to disk.
  reserveAssignmentUploadSlot,
  receiveAssignmentAttachments,
  verifyAssignmentAttachments,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      beginAssignmentUpload(req);
      const { text } = submitAssignmentSchema.parse(req.body);
      const files = (req.files as Express.Multer.File[]) ?? [];
      const attachments = files.length ? await uploadAssignmentAttachments(files) : [];

      try {
        const submission = await assignmentService.submitAssignment(
          param(req, "assignmentId"),
          req.user!.userId,
          text,
          attachments,
        );
        return sendSuccess(res, submission, "Assignment submitted");
      } catch (error) {
        await removeAssignmentAttachments(attachments);
        throw error;
      }
    } catch (err) {
      next(err);
    } finally {
      // Releases the quota and removes any temporary files, on success, failure or disconnect.
      await finishAssignmentUpload(req);
    }
  },
);

router.get(
  "/:assignmentId/my-submission",
  authenticate,
  requireRole("STUDENT"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const submission = await assignmentService.getMySubmission(
        param(req, "assignmentId"),
        req.user!.userId,
      );
      return sendSuccess(res, submission);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:assignmentId/submissions",
  authenticate,
  requirePermission("assignment:grade"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const submissions = await assignmentService.listSubmissions(
        param(req, "assignmentId"),
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, submissions);
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/submissions/:submissionId/grade",
  authenticate,
  requirePermission("assignment:grade"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { marksObtained, feedback } = gradeSubmissionSchema.parse(req.body);
      const submission = await assignmentService.gradeSubmission(
        param(req, "submissionId"),
        marksObtained,
        feedback,
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, submission, "Submission graded");
    } catch (err) {
      next(err);
    }
  },
);

export default router;
