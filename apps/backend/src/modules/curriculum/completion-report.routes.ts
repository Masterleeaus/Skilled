/**
 * ACA-025 HTTP surface for evidence-backed completion reports.
 *
 * Access: a learner may read their own report. OWNER, MANAGER and ASSESSOR members may read a
 * learner's report in the same organisation. Organisation roll-ups are for OWNER and MANAGER only.
 */
import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/authenticate";
import { prisma } from "../../config/prisma";
import { sendSuccess } from "../../utils/response";
import { ForbiddenError, NotFoundError } from "../../utils/AppError";
import { buildLearnerCompletionReport, buildCompanyCompletionReport } from "./completion-report.service";

const router = Router();
const run = (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await fn(req, res);
  } catch (error) {
    next(error);
  }
};
const LEARNER_REPORT_VIEWERS = ["OWNER", "MANAGER", "ASSESSOR"];
const COMPANY_REPORT_VIEWERS = ["OWNER", "MANAGER"];

router.get("/companies/:companyId/completion-reports/learners/:learnerId", authenticate, run(async (req, res) => {
  const viewerId = req.user?.userId;
  if (!viewerId) throw new ForbiddenError("Authentication required");
  const companyId = String(req.params.companyId);
  const learnerId = String(req.params.learnerId);
  const viewer = await prisma.companyMember.findUnique({ where: { companyId_userId: { companyId, userId: viewerId } } });
  if (!viewer) throw new ForbiddenError("Organisation membership required");
  if (viewerId !== learnerId && !LEARNER_REPORT_VIEWERS.includes(viewer.role)) throw new ForbiddenError("Completion report access denied");
  const learner = await prisma.companyMember.findUnique({ where: { companyId_userId: { companyId, userId: learnerId } } });
  if (!learner) throw new NotFoundError("Learner in organisation");
  sendSuccess(res, await buildLearnerCompletionReport(companyId, learnerId));
}));

router.get("/companies/:companyId/completion-reports", authenticate, run(async (req, res) => {
  const viewerId = req.user?.userId;
  if (!viewerId) throw new ForbiddenError("Authentication required");
  const companyId = String(req.params.companyId);
  const viewer = await prisma.companyMember.findUnique({ where: { companyId_userId: { companyId, userId: viewerId } } });
  if (!viewer || !COMPANY_REPORT_VIEWERS.includes(viewer.role)) throw new ForbiddenError("Organisation manager membership required");
  sendSuccess(res, await buildCompanyCompletionReport(companyId));
}));

export default router;
