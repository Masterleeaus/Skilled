import { prisma } from "../../config/prisma";
import { AppError, NotFoundError } from "../../utils/AppError";
import type { CreateCouponInput } from "./payment.validators";

export async function createCoupon(input: CreateCouponInput) {
  const existing = await prisma.coupon.findUnique({ where: { code: input.code } });
  if (existing) throw new AppError("Coupon code already exists", 409);

  return prisma.coupon.create({ data: input });
}

export async function listCoupons() {
  return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
}

export async function deleteCoupon(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new NotFoundError("Coupon");
  await prisma.coupon.delete({ where: { id } });
}

// Validates a coupon against a specific course and returns the discount percent.
// Does NOT track per-use consumption (usageLimit is enforced at a coarse level —
// see note in payment.service.ts) to keep the schema simple for the current scope.
export async function validateCoupon(code: string, courseId: string): Promise<number> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon) throw new AppError("Invalid coupon code", 400);

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new AppError("Coupon has expired", 400);
  }
  if (coupon.courseId && coupon.courseId !== courseId) {
    throw new AppError("Coupon is not valid for this course", 400);
  }
  if (coupon.usageLimit !== null) {
    const usedCount = await prisma.payment.count({
      where: { courseId, status: "SUCCEEDED" }, // coarse approximation — see note above
    });
    if (usedCount >= coupon.usageLimit) {
      throw new AppError("Coupon usage limit reached", 400);
    }
  }

  return coupon.discountPercent;
}
