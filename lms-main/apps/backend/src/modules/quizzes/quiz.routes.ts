import { param } from "../../utils/requestParams";
import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { sendSuccess } from "../../utils/response";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission, requireRole } from "../../middleware/permission";
import {
  createQuizSchema,
  updateQuizSchema,
  questionSchema,
  submitAttemptSchema,
} from "./quiz.validators";
import * as quizService from "./quiz.service";

const router = Router();

// Section 11: rate limit quiz-submit routes to prevent brute-force/spam attempts
const quizAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please slow down", errors: [] },
});

router.get("/course/:courseId", authenticate, async (req: Request<{ courseId: string }>, res, next) => {
  try {
    const quizzes = await quizService.listQuizzesForCourse(req.params.courseId, req.user!.userId, req.user!.role);
    return sendSuccess(res, quizzes);
  } catch (err) {
    next(err);
  }
});

// ---------------- Builder ----------------

router.post(
  "/",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createQuizSchema.parse(req.body);
      const quiz = await quizService.createQuiz(input, req.user!.userId, req.user!.role);
      return sendSuccess(res, quiz, "Quiz created", 201);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/:quizId/questions",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = questionSchema.parse(req.body);
      const question = await quizService.addQuestion(
        param(req, "quizId"),
        input,
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, question, "Question added", 201);
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/:quizId/publish",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quiz = await quizService.publishQuiz(param(req, "quizId"), req.user!.userId, req.user!.role);
      return sendSuccess(res, quiz, "Quiz published");
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:quizId/manage",
  authenticate,
  requirePermission("course:update:own"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quiz = await quizService.getQuizForTeacher(param(req, "quizId"), req.user!.userId, req.user!.role);
      return sendSuccess(res, quiz);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:quizId/submissions",
  authenticate,
  requirePermission("assignment:grade"),
  async (req: Request<{ quizId: string }>, res: Response, next: NextFunction) => {
    try {
      const submissions = await quizService.listQuizSubmissionsForTeacher(
        req.params.quizId, req.user!.userId, req.user!.role,
      );
      return sendSuccess(res, submissions);
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/answers/:answerId/grade",
  authenticate,
  requirePermission("assignment:grade"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { marksObtained } = z
        .object({ marksObtained: z.coerce.number().int().min(0) })
        .parse(req.body ?? {});
      await quizService.gradeAnswer(
        param(req, "answerId"),
        marksObtained,
        req.user!.userId,
        req.user!.role,
      );
      return sendSuccess(res, null, "Answer graded");
    } catch (err) {
      next(err);
    }
  },
);

// ---------------- Student attempt flow ----------------

router.get("/:quizId/take", authenticate, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const quiz = await quizService.getQuizForStudent(param(req, "quizId"), req.user!.userId);
    return sendSuccess(res, quiz);
  } catch (err) {
    next(err);
  }
});

router.post("/:quizId/attempts", authenticate, requireRole("STUDENT"), quizAttemptLimiter, async (req, res, next) => {
  try {
    const attempt = await quizService.startAttempt(param(req, "quizId"), req.user!.userId);
    return sendSuccess(res, attempt, "Attempt started", 201);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/attempts/:attemptId/submit",
  authenticate,
  requireRole("STUDENT"),
  quizAttemptLimiter,
  async (req, res, next) => {
    try {
      const input = submitAttemptSchema.parse(req.body);
      const result = await quizService.submitAttempt(param(req, "attemptId"), req.user!.userId, input);
      return sendSuccess(res, result, "Attempt submitted");
    } catch (err) {
      next(err);
    }
  },
);

router.get("/:quizId/attempts", authenticate, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const attempts = await quizService.listMyAttempts(param(req, "quizId"), req.user!.userId);
    return sendSuccess(res, attempts);
  } catch (err) {
    next(err);
  }
});

export default router;
