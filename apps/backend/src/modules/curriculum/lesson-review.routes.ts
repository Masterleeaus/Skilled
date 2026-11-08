import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/permission";
import { ForbiddenError } from "../../utils/AppError";
import { sendPaginated, sendSuccess } from "../../utils/response";
import { REVIEW_DECISIONS, getRevisionForReview, listReviewQueue, publishRevision, recordReview } from "./lesson-review.service";

// Owner decision: ADMIN and TEACHER may review and publish. The author of a revision
// can never approve it; that is enforced in lesson-review.service.ts, not here.
const reviewer = [authenticate, requireRole("ADMIN", "TEACHER")] as const;
const run = (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response, next: NextFunction) => { try { await fn(req, res); } catch (e) { next(e); } };

const reviewSchema = z.object({
  decision: z.enum(REVIEW_DECISIONS),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/, "contentHash must be the SHA-256 hex of the revision being reviewed"),
  notes: z.string().trim().max(4000).nullish(),
}).superRefine((value, ctx) => {
  if (value.decision !== "APPROVED" && !value.notes) ctx.addIssue({ code: "custom", path: ["notes"], message: "Notes are required when rejecting or requesting changes" });
});

const router = Router();

const queuePageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

router.get("/reviews/queue", ...reviewer, run(async (req, res) => {
  const query = queuePageQuery.parse(req.query);
  const { items, pagination } = await listReviewQueue(query);
  sendPaginated(res, items, pagination);
}));

router.get("/revisions/:id/review", ...reviewer, run(async (req, res) => {
  sendSuccess(res, await getRevisionForReview(req.params.id as string));
}));

router.post("/revisions/:id/reviews", ...reviewer, run(async (req, res) => {
  const input = reviewSchema.parse(req.body);
  const review = await recordReview({ revisionId: req.params.id as string, reviewerId: req.user!.userId, decision: input.decision, contentHash: input.contentHash, notes: input.notes ?? null });
  sendSuccess(res, review, "Review recorded", 201);
}));

// The only publish path. The gate in lesson-review.service.ts decides, not the caller.
router.post("/revisions/:id/publish", ...reviewer, run(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw new ForbiddenError("Authentication required");
  sendSuccess(res, await publishRevision(req.params.id as string, userId));
}));

export default router;
