import { prisma } from "../../config/prisma";
import { AppError, NotFoundError } from "../../utils/AppError";
import type { CreateCouponInput } from "./payment.validators";

/** The client handed to an interactive $transaction callback (the extended client, not Prisma.TransactionClient). */
export type CouponTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

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
  // Payments that redeemed the coupon keep their record; their couponId is set to NULL by the foreign key.
  await prisma.coupon.delete({ where: { id } });
}

/**
 * Validates a coupon's code, expiry and course, and returns the coupon record. It does not reserve a redemption, and
 * it does not check usageLimit. The limit is checked only by reserveCouponRedemption(), inside the checkout
 * transaction, so a learner whose own open checkout already holds the last slot can still reuse that checkout.
 */
export async function validateCoupon(code: string, courseId: string) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon) throw new AppError("Invalid coupon code", 400);

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new AppError("Coupon has expired", 400);
  }
  if (coupon.courseId && coupon.courseId !== courseId) {
    throw new AppError("Coupon is not valid for this course", 400);
  }

  return coupon;
}

/**
 * Reserves one redemption of this coupon. Call it inside the transaction that creates the checkout's payment row,
 * so a failed insert (for example a second open checkout) also releases the reservation.
 *
 * The update is a single conditional statement: PostgreSQL re-checks `redeemedCount < usageLimit` after it takes the
 * row lock, so concurrent checkouts cannot push a coupon past its limit. Only this coupon's counter changes; payments
 * for other courses or other coupons never touch it.
 *
 * Reservation lifecycle (the counter is the number of reservations held plus redemptions made):
 *  - Created: a checkout reserves a redemption when it is created (PENDING).
 *  - Kept: the reservation stays counted when the payment SUCCEEDS, and when it is REFUNDED (a refund does not
 *    restore the coupon).
 *  - Released: a PENDING payment that becomes FAILED gives its reservation back, exactly once (see
 *    releasePendingCheckout in payment.service.ts). A checkout becomes FAILED when Stripe refuses to create its session,
 *    when Stripe reports its session expired (checkout.session.expired webhook, or the expiry sweep), or when an
 *    abandoned claim is replaced by a checkout with different options.
 */
export async function reserveCouponRedemption(tx: CouponTx, coupon: { id: string; usageLimit: number | null }): Promise<void> {
  const reserved = await tx.coupon.updateMany({
    where: { id: coupon.id, ...(coupon.usageLimit === null ? {} : { redeemedCount: { lt: coupon.usageLimit } }) },
    data: { redeemedCount: { increment: 1 } },
  });
  if (reserved.count === 0) {
    throw new AppError("Coupon usage limit reached", 400);
  }
}

/** Gives back one reservation of a coupon. Call it only for a payment that has just moved from PENDING to FAILED. */
export async function releaseCouponRedemption(tx: CouponTx, couponId: string): Promise<void> {
  // Never goes below zero. Negative increment is used so the same statement form works in tests and in PostgreSQL.
  await tx.coupon.updateMany({
    where: { id: couponId, redeemedCount: { gt: 0 } },
    data: { redeemedCount: { increment: -1 } },
  });
}
