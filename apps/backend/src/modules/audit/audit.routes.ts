import { Router, Request, Response, NextFunction } from "express";
import { sendPaginated } from "../../utils/response";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/permission";
import * as auditService from "./audit.service";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("audit:view"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const { entity, userId, action } = req.query as Record<string, string | undefined>;

      const { logs, pagination } = await auditService.listAuditLogs({
        page,
        limit,
        entity,
        userId,
        action,
      });
      return sendPaginated(res, logs, pagination);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
