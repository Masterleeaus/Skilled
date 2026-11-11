import { param } from "../../utils/requestParams";
import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { sendSuccess } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/permission";
import * as certificateService from "./certificate.service";

const router = Router();

const verificationVisibilitySchema = z.object({ showNameOnVerify: z.boolean() });

router.get("/my-certificates", authenticate, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const certs = await certificateService.listMyCertificates(req.user!.userId);
    return sendSuccess(res, certs);
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:certificateId/download",
  authenticate,
  requireRole("STUDENT"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const url = await certificateService.getCertificateDownloadUrl(
        param(req, "certificateId"),
        req.user!.userId,
      );
      return sendSuccess(res, { url });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/:certificateId/verification-visibility",
  authenticate,
  requireRole("STUDENT"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = verificationVisibilitySchema.safeParse(req.body);
      if (!body.success) throw new AppError("showNameOnVerify must be a boolean", 400);
      const result = await certificateService.setShowNameOnVerify(
        param(req, "certificateId"),
        req.user!.userId,
        body.data.showNameOnVerify,
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
);

// Public verification. Rate limited per client IP because the code space for legacy certificate numbers is small.
// The limit covers the whole route, including 404s, so guessing is throttled as well as successful lookups.
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many verification requests, please try again later", errors: [] },
});

// Public — anyone holding a certificate's verification token (or a legacy certificate number) can confirm authenticity.
// The response is minimised by verifyCertificate; it is never cached.
router.get("/verify/:code", verifyLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await certificateService.verifyCertificate(param(req, "code"));
    res.set("Cache-Control", "no-store");
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
