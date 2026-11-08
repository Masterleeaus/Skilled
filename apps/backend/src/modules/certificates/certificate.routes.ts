import { param } from "../../utils/requestParams";
import { Router, Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/response";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/permission";
import * as certificateService from "./certificate.service";

const router = Router();

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

// Public — anyone with the certificate number can verify authenticity
router.get("/verify/:certificateNumber", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await certificateService.verifyCertificate(param(req, "certificateNumber"));
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
