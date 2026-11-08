import { param } from "../../utils/requestParams";
import { Router, Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/response";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/permission";
import { createReviewSchema, updateReviewSchema } from "./review.validators";
import * as reviewService from "./review.service";

const router = Router();

router.post("/", authenticate, requireRole("STUDENT"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createReviewSchema.parse(req.body);
    const review = await reviewService.createReview(input, req.user!.userId);
    return sendSuccess(res, review, "Review submitted", 201);
  } catch (err) {
    next(err);
  }
});

router.get("/course/:courseId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = await reviewService.listReviewsForCourse(param(req, "courseId"), page, limit);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", authenticate, requireRole("STUDENT"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateReviewSchema.parse(req.body);
    const review = await reviewService.updateReview(param(req, "id"), req.user!.userId, input);
    return sendSuccess(res, review, "Review updated");
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reviewService.deleteReview(param(req, "id"), req.user!.userId, req.user!.role === "ADMIN");
    return sendSuccess(res, null, "Review deleted");
  } catch (err) {
    next(err);
  }
});

export default router;
