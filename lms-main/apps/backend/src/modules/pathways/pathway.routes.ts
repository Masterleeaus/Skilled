import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/authenticate";
import { sendSuccess } from "../../utils/response";
import { ForbiddenError, NotFoundError } from "../../utils/AppError";
import { enrolBodySchema } from "./pathway.validators";
import * as pathwayService from "./pathway.service";

const router = Router();

function actorOf(req: Request) {
  if (!req.user) throw new ForbiddenError("Authentication required");
  return { userId: req.user.userId, role: req.user.role };
}

function param(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string") throw new NotFoundError("Pathway");
  return value;
}

router.get("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pathways = await pathwayService.listPathways(actorOf(req).userId);
    return sendSuccess(res, pathways);
  } catch (err) {
    next(err);
  }
});

router.get("/:code", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pathway = await pathwayService.getPathway(actorOf(req).userId, param(req, "code"));
    return sendSuccess(res, pathway);
  } catch (err) {
    next(err);
  }
});

router.post("/:code/enrolments", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = enrolBodySchema.parse(req.body ?? {});
    const result = await pathwayService.enrolInPathway(actorOf(req), param(req, "code"), input);
    return sendSuccess(res, result, "Enrolled in pathway", 201);
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:code/learners/:learnerId/progress",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const progress = await pathwayService.getLearnerProgress(
        actorOf(req).userId,
        param(req, "code"),
        param(req, "learnerId"),
      );
      return sendSuccess(res, progress);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
