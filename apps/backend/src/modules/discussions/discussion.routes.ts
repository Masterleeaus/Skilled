import { param, query } from "../../utils/requestParams";
import { Router, Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/response";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/permission";
import { createThreadSchema, createReplySchema } from "./discussion.validators";
import * as discussionService from "./discussion.service";

const router = Router();

router.post("/threads", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createThreadSchema.parse(req.body);
    const thread = await discussionService.createThread(input, req.user!.userId, req.user!.role);
    return sendSuccess(res, thread, "Thread created", 201);
  } catch (err) {
    next(err);
  }
});

router.get("/course/:courseId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lessonId = query(req, "lessonId");
    const threads = await discussionService.listThreadsForCourse(param(req, "courseId"), lessonId);
    return sendSuccess(res, threads);
  } catch (err) {
    next(err);
  }
});

router.get("/threads/:threadId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const thread = await discussionService.getThread(param(req, "threadId"));
    return sendSuccess(res, thread);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/threads/:threadId/replies",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { body } = createReplySchema.parse(req.body);
      const reply = await discussionService.addReply(
        param(req, "threadId"),
        body,
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, reply, "Reply added", 201);
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/replies/:replyId/pin",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reply = await discussionService.pinReply(
        param(req, "replyId"),
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, reply, "Reply pinned");
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/threads/:threadId/resolve",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const thread = await discussionService.resolveThread(
        param(req, "threadId"),
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, thread, "Thread marked resolved");
    } catch (err) {
      next(err);
    }
  },
);

// ---------------- Admin moderation ----------------

router.delete(
  "/threads/:threadId",
  authenticate,
  requirePermission("discussion:moderate"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await discussionService.moderateDeleteThread(param(req, "threadId"));
      return sendSuccess(res, null, "Thread removed");
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/replies/:replyId",
  authenticate,
  requirePermission("discussion:moderate"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await discussionService.moderateDeleteReply(param(req, "replyId"));
      return sendSuccess(res, null, "Reply removed");
    } catch (err) {
      next(err);
    }
  },
);

export default router;
