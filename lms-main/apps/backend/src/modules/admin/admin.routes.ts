import { param } from "../../utils/requestParams";
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/permission";
import { updateUserRoleSchema, listUsersQuerySchema } from "./admin.validators";
import * as adminService from "./admin.service";
import * as analyticsService from "./analytics.service";

const router = Router();

router.use(authenticate, requirePermission("user:manage"));

router.get("/users", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listUsersQuerySchema.parse(req.query);
    const { users, pagination } = await adminService.listUsers(query);
    return sendPaginated(res, users, pagination);
  } catch (err) {
    next(err);
  }
});

router.get("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const detail = await adminService.getUserDetail(param(req, "id"));
    return sendSuccess(res, detail);
  } catch (err) {
    next(err);
  }
});

router.patch("/users/:id/role", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = updateUserRoleSchema.parse(req.body);
    const user = await adminService.updateUserRole(param(req, "id"), role, req.user!.userId);
    return sendSuccess(res, user, "Role updated");
  } catch (err) {
    next(err);
  }
});

router.patch("/users/:id/active", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body ?? {});
    const user = await adminService.toggleUserActive(param(req, "id"), isActive, req.user!.userId);
    return sendSuccess(res, user, isActive ? "User activated" : "User deactivated");
  } catch (err) {
    next(err);
  }
});

router.delete("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminService.deleteUser(param(req, "id"), req.user!.userId);
    return sendSuccess(res, null, "User deleted");
  } catch (err) {
    next(err);
  }
});

router.get("/dashboard", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await analyticsService.getDashboardMetrics();
    return sendSuccess(res, metrics);
  } catch (err) {
    next(err);
  }
});

export default router;
