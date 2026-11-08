import { param } from "../../utils/requestParams";
import { Router, Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/response";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission, requireRole } from "../../middleware/permission";
import { createCouponSchema, initiatePaymentSchema } from "./payment.validators";
import * as couponService from "./coupon.service";
import * as paymentService from "./payment.service";

const router = Router();

// ---------------- Coupons (Admin) ----------------

router.post(
  "/coupons",
  authenticate,
  requirePermission("user:manage"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createCouponSchema.parse(req.body);
      const coupon = await couponService.createCoupon(input);
      return sendSuccess(res, coupon, "Coupon created", 201);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/coupons",
  authenticate,
  requirePermission("user:manage"),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const coupons = await couponService.listCoupons();
      return sendSuccess(res, coupons);
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/coupons/:id",
  authenticate,
  requirePermission("user:manage"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await couponService.deleteCoupon(param(req, "id"));
      return sendSuccess(res, null, "Coupon deleted");
    } catch (err) {
      next(err);
    }
  },
);

// ---------------- Checkout (Student) ----------------

router.post(
  "/checkout",
  authenticate,
  requireRole("STUDENT"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, couponCode, licenceTrack } = initiatePaymentSchema.parse(req.body);
      const result = await paymentService.initiateCheckout(courseId, req.user!.userId, couponCode, licenceTrack);
      return sendSuccess(res, result, "Checkout initiated");
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/verify/:providerReference",
  authenticate,
  async (req: Request<{ providerReference: string }>, res: Response, next: NextFunction) => {
    try {
      const payment = await paymentService.verifyAndCompletePayment(req.params.providerReference, req.user!.userId);
      return sendSuccess(res, payment, "Payment status checked");
    } catch (err) {
      next(err);
    }
  },
);

router.get("/my-payments", authenticate, requireRole("STUDENT"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payments = await paymentService.listMyPayments(req.user!.userId);
    return sendSuccess(res, payments);
  } catch (err) {
    next(err);
  }
});

export default router;
