import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/authenticate";
import { param } from "../../utils/requestParams";
import { sendSuccess } from "../../utils/response";
import { getCoursePool, getCourseSelection, namedCompany, saveCourseSelection } from "./course-selection.service";

// Mounted at /api/academy/course-selection (see PASS42/CUSTOMISE-courses.md for the mount line).
// Every route is authenticated and checked by resolveManageScope. Learners and other roles get 403.
// Reads take ?companyId=<id>. An organisation owner must name their organisation; a course teacher or admin
// omits it to manage the course-wide default. The save takes the same companyId in the body.
const router = Router();
const run = (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response, next: NextFunction) => {
  try { await fn(req, res); } catch (e) { next(e); }
};
const actor = (req: Request) => ({ userId: req.user!.userId, role: req.user!.role });

router.get("/courses/:courseId/lesson-pool", authenticate, run(async (req, res) => {
  sendSuccess(res, await getCoursePool(actor(req), param(req, "courseId"), namedCompany(req.query.companyId)));
}));

router.get("/courses/:courseId/lesson-selection", authenticate, run(async (req, res) => {
  sendSuccess(res, await getCourseSelection(actor(req), param(req, "courseId"), namedCompany(req.query.companyId)));
}));

router.put("/courses/:courseId/lesson-selection", authenticate, run(async (req, res) => {
  sendSuccess(res, await saveCourseSelection(actor(req), param(req, "courseId"), req.body), "Lesson selection saved");
}));

export default router;
