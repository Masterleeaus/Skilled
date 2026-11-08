import crypto from "crypto";
import { prisma } from "../../config/prisma";
import { AppError, NotFoundError } from "../../utils/AppError";
import { paymentProvider } from "./stripe.provider";
import { releaseCouponRedemption, reserveCouponRedemption, validateCoupon } from "./coupon.service";
import { DEFAULT_LICENCE_TRACK, type LicenceTrack } from "../curriculum/licence-track";
import { logger } from "../../config/logger";

/**
 * Checkout claims. A paid checkout is claimed by inserting a PENDING payment before Stripe is called. The partial
 * unique index payments_one_pending_per_student_course_key allows one PENDING payment per learner and course, so a
 * concurrent second request fails with P2002 and gets a conflict instead of a second Stripe session.
 *
 * The claim's transactionId is a placeholder with this prefix until Stripe returns a session id. A placeholder never
 * matches a real Stripe session, so the webhook cannot fulfil it.
 */
const CLAIM_PREFIX = "checkout-claim:";

/** A placeholder claim older than this, with no Stripe session, is treated as abandoned (the request died mid-way). */
const STALE_CLAIM_MS = 2 * 60 * 1000;

/**
 * Stripe checkout sessions expire 24 hours after creation by default, and this code does not set expires_at. An open
 * PENDING checkout older than this is settled by the expiry sweep.
 */
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;
const SWEEP_BATCH_SIZE = 500;

/**
 * The Stripe idempotency key for a checkout's session create. It is the claimed payment row id, so every attempt to
 * create the session for that claim, including a resumed one after a crash, reuses the same Stripe result.
 */
export function claimIdempotencyKey(claimId: string): string {
  return `academy-checkout-${claimId}`;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002";
}

function errorStatusCode(error: unknown): number | null {
  const status = typeof error === "object" && error !== null ? (error as { statusCode?: unknown }).statusCode : undefined;
  return typeof status === "number" ? status : null;
}

/**
 * True when the provider is known not to have created a session. The Stripe SDK tags its own errors with a type that
 * starts with "Stripe". A transport failure, a 5xx, or a 409 (an identical create still in flight) may have created
 * the session, so those are unknown. Any other Stripe error is an answer that the session was not created. An error
 * that is not from the SDK (an AppError such as "Stripe is not configured", thrown before the call) is also known.
 */
function providerRefusedBeforeSession(error: unknown): boolean {
  if (error instanceof AppError) return true;
  const type = typeof error === "object" && error !== null ? (error as { type?: unknown }).type : undefined;
  if (typeof type !== "string" || !type.startsWith("Stripe")) return true;
  if (type === "StripeConnectionError" || type === "StripeAPIError") return false;
  const status = errorStatusCode(error);
  return status === null || (status < 500 && status !== 409);
}

/**
 * Gives a PENDING payment back: it becomes FAILED and its coupon reservation is released. The status check makes it
 * run once. A concurrent caller that finds the row already moved on changes nothing.
 */
async function releasePendingCheckout(paymentId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const released = await tx.payment.updateMany({ where: { id: paymentId, status: "PENDING" }, data: { status: "FAILED" } });
    if (released.count === 0) return;
    const row = await tx.payment.findUnique({ where: { id: paymentId }, select: { couponId: true } });
    if (row?.couponId) await releaseCouponRedemption(tx, row.couponId);
  });
}

interface WantedCheckout {
  couponId: string | null;
  licenceTrack: LicenceTrack;
  amount: number;
}

interface OpenCheckout {
  id: string;
  transactionId: string;
  couponId: string | null;
  licenceTrack: string;
  amount: unknown;
  checkoutUrl: string | null;
  createdAt: Date;
}

/**
 * What an existing PENDING payment means for a new request:
 *  - reuse: an open Stripe session with the same options; return its URL.
 *  - resume: an abandoned claim with the same options; create its session again with the claim's idempotency key.
 *  - null: the old row was released (FAILED) and a new checkout may start.
 */
type OpenCheckoutDecision = { kind: "reuse"; checkoutUrl: string } | { kind: "resume"; claimId: string } | null;

function matchesWanted(open: OpenCheckout, wanted: WantedCheckout): boolean {
  return open.couponId === wanted.couponId &&
    open.licenceTrack === wanted.licenceTrack &&
    Math.round(Number(open.amount) * 100) === Math.round(wanted.amount * 100);
}

/**
 * Throws a 409 when a checkout is still being created, or is open with different options.
 */
async function resolveOpenCheckout(open: OpenCheckout, wanted: WantedCheckout | null): Promise<OpenCheckoutDecision> {
  if (open.transactionId.startsWith(CLAIM_PREFIX)) {
    if (Date.now() - open.createdAt.getTime() < STALE_CLAIM_MS) {
      throw new AppError("A checkout for this course is already being created. Try again in a moment.", 409);
    }
    // The request that made this claim died, and its Stripe create may or may not have completed. For the same
    // checkout, resume the claim: the same idempotency key returns any session that was created, or creates the one
    // that was not. For different options the claim is released. A session the dead request created is then not
    // linked to any row, and neither the expiry webhook nor the sweep can match it (a known residual).
    if (wanted !== null && matchesWanted(open, wanted)) return { kind: "resume", claimId: open.id };
    await releasePendingCheckout(open.id);
    return null;
  }

  const remote = await paymentProvider.verify(open.transactionId);
  if (remote.status === "SUCCEEDED") {
    // The learner has paid. Fulfil it now rather than offer another checkout.
    await verifyAndCompletePayment(open.transactionId);
    throw new AppError("This course has already been paid for.", 409);
  }
  if (remote.status === "FAILED") {
    // The Stripe session expired or failed unpaid: release the reservation and let a new checkout start.
    await releasePendingCheckout(open.id);
    return null;
  }

  // Still open at Stripe. Return the same session only for the same coupon, track and amount.
  if (wanted !== null && matchesWanted(open, wanted) && open.checkoutUrl) return { kind: "reuse", checkoutUrl: open.checkoutUrl };
  throw new AppError("A checkout for this course is already open with different options. Complete it or wait for it to expire before starting another.", 409);
}

export async function initiateCheckout(courseId: string, studentId: string, couponCode?: string, licenceTrack: LicenceTrack = DEFAULT_LICENCE_TRACK) {
  const [course, student] = await Promise.all([
    prisma.course.findUnique({ where: { id: courseId } }),
    prisma.user.findUnique({ where: { id: studentId } }),
  ]);
  if (!course) throw new NotFoundError("Course");
  if (!student) throw new NotFoundError("Student");
  if (!course.isPublished) throw new AppError("Course is not published", 400);

  const alreadyEnrolled = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (alreadyEnrolled) throw new AppError("Already enrolled in this course", 409);

  const coupon = couponCode ? await validateCoupon(couponCode, courseId) : null;
  let amount = Number(course.price);
  if (coupon) {
    amount = Math.round(amount * (1 - coupon.discountPercent / 100) * 100) / 100;
  }

  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError("Invalid checkout amount", 400);
  }

  const wanted: WantedCheckout | null = amount === 0 ? null : { couponId: coupon?.id ?? null, licenceTrack, amount };
  let resumeClaimId: string | null = null;
  const open = await prisma.payment.findFirst({ where: { studentId, courseId, status: "PENDING" } });
  if (open) {
    const decision = await resolveOpenCheckout(open, wanted);
    if (decision?.kind === "reuse") return { free: false as const, checkoutUrl: decision.checkoutUrl };
    if (decision?.kind === "resume") resumeClaimId = decision.claimId;
  }

  if (amount === 0) {
    // Keep the zero-cost payment receipt, the coupon redemption and the enrollment atomic. If any insert fails
    // (including a concurrent enrollment), all of them roll back.
    try {
      await prisma.$transaction(async (tx) => {
        if (coupon) await reserveCouponRedemption(tx, coupon);
        await tx.enrollment.create({ data: { studentId, courseId, licenceTrack } });
        await tx.payment.create({
          data: {
            studentId,
            courseId,
            amount: 0,
            provider: "coupon-full-discount",
            transactionId: crypto.randomUUID(),
            status: "SUCCEEDED",
            paidAt: new Date(),
            licenceTrack,
            couponId: coupon?.id ?? null,
          },
        });
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new AppError("Already enrolled in this course", 409);
      throw error;
    }
    return { free: true as const };
  }

  // Claim the single open checkout for this learner and course, and reserve the coupon, in one transaction.
  // Either both happen or neither does. A second concurrent request fails on the partial unique index.
  // A resumed claim already holds its row and its reservation, so nothing is written for it here.
  let claimId: string;
  if (resumeClaimId) {
    claimId = resumeClaimId;
  } else {
    try {
      const claimed = await prisma.$transaction(async (tx) => {
        if (coupon) await reserveCouponRedemption(tx, coupon);
        return tx.payment.create({
          data: {
            studentId,
            courseId,
            amount,
            provider: "stripe",
            transactionId: `${CLAIM_PREFIX}${crypto.randomUUID()}`,
            status: "PENDING",
            licenceTrack,
            couponId: coupon?.id ?? null,
          },
          select: { id: true },
        });
      });
      claimId = claimed.id;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError("A checkout for this course is already being created. Try again in a moment.", 409);
      }
      throw error;
    }
  }

  let result: Awaited<ReturnType<typeof paymentProvider.initiate>>;
  try {
    result = await paymentProvider.initiate({
      amount,
      currency: "usd",
      courseId,
      studentId,
      studentEmail: student.email,
      licenceTrack,
      idempotencyKey: claimIdempotencyKey(claimId),
    });
  } catch (error) {
    if (errorStatusCode(error) === 409) {
      // Stripe is still processing an identical create for this claim. The other request will link the session.
      throw new AppError("A checkout for this course is already being created. Try again in a moment.", 409);
    }
    if (providerRefusedBeforeSession(error)) {
      // No session exists, so the reservation is released and the learner can try again.
      await releasePendingCheckout(claimId);
    }
    // Otherwise the outcome is unknown. The claim stays PENDING with its placeholder, and the next attempt after
    // STALE_CLAIM_MS resumes it with the same idempotency key, so Stripe cannot leave a second session behind.
    throw error;
  }

  // Attach the Stripe session to the claim. If this write fails after Stripe has created the session, the claim keeps
  // its placeholder, and the resume path above links the same session later.
  await prisma.payment.update({
    where: { id: claimId },
    data: { transactionId: result.providerReference, checkoutUrl: result.checkoutUrl },
  });

  return { free: false as const, checkoutUrl: result.checkoutUrl };
}

export async function verifyAndCompletePayment(providerReference: string, requestingStudentId?: string) {
  const payment = await prisma.payment.findUnique({ where: { transactionId: providerReference } });
  if (!payment) throw new NotFoundError("Payment");
  // A signed-in learner can only inspect/complete their own payment.
  // Webhooks omit requestingStudentId but require a verified Stripe signature.
  if (requestingStudentId && payment.studentId !== requestingStudentId) {
    throw new AppError("Payment does not belong to this account", 403);
  }
  if (payment.provider !== "stripe") throw new AppError("Unsupported payment provider", 400);
  if (payment.status === "SUCCEEDED") return payment;
  // Already refunded: return the record, so a repeated webhook delivery is acknowledged rather than retried forever.
  if (payment.status === "REFUNDED") return payment;

  const result = await paymentProvider.verify(providerReference);
  // Do not trust a paid session unless it matches the immutable checkout record.
  // An unrelated session, wrong currency, or altered amount must never enroll a learner.
  if (result.providerReference !== payment.transactionId ||
      result.studentId !== payment.studentId ||
      (result.licenceTrack ?? DEFAULT_LICENCE_TRACK) !== payment.licenceTrack ||
      result.courseId !== payment.courseId ||
      result.currency.toLowerCase() !== "usd" ||
      !Number.isFinite(result.amount) ||
      Math.round(result.amount * 100) !== Math.round(Number(payment.amount) * 100)) {
    throw new AppError("Payment session does not match Academy checkout", 409);
  }

  if (result.status === "SUCCEEDED") {
    // An enrolment that already exists keeps its track (the upsert below never rewrites it). Paying for a different track
    // must not succeed silently, so the payment stays PENDING and no enrolment is changed.
    const existing = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: payment.studentId, courseId: payment.courseId } },
      select: { licenceTrack: true },
    });
    if (existing && existing.licenceTrack !== payment.licenceTrack) {
      throw new AppError("This course is already enrolled on a different licence track. The payment was not applied; contact support.", 409);
    }
    if (existing) {
      // The learner is already enrolled on this track, for example through a free coupon or an admin enrolment after
      // this checkout was opened. A second enrolment is not created, and the charge is not kept silently: refund it.
      await paymentProvider.refund(providerReference);
      await prisma.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "REFUNDED" } });
      return prisma.payment.findUnique({ where: { id: payment.id } });
    }
    await prisma.$transaction(async (tx) => {
      // Only the caller that moves the payment from PENDING to SUCCEEDED creates the enrolment. A concurrent webhook or
      // verify call that gets count 0 has nothing left to do.
      const claim = await tx.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: { status: "SUCCEEDED", paidAt: new Date() },
      });
      if (claim.count === 0) return;
      await tx.enrollment.upsert({
        where: { studentId_courseId: { studentId: payment.studentId, courseId: payment.courseId } },
        create: { studentId: payment.studentId, courseId: payment.courseId, licenceTrack: payment.licenceTrack },
        update: {},
      });
    });
  } else if (result.status === "FAILED") {
    await releasePendingCheckout(payment.id);
  }

  return prisma.payment.findUnique({ where: { id: payment.id } });
}

/**
 * Backstop for the checkout.session.expired webhook, for expiries whose webhook was never delivered. Settles PENDING
 * Stripe checkouts older than the session expiry. verifyAndCompletePayment releases an expired one, fulfils one that was
 * paid, and does nothing for an open one, so a repeated sweep is safe. Placeholder claims are skipped: they belong to
 * the resume path. An error on one row is logged and does not stop the sweep. Returns the number of rows checked.
 */
export async function sweepAbandonedCheckouts(now: Date = new Date()): Promise<number> {
  const rows = await prisma.payment.findMany({
    where: { status: "PENDING", provider: "stripe", createdAt: { lt: new Date(now.getTime() - SESSION_EXPIRY_MS) } },
    orderBy: { createdAt: "asc" },
    take: SWEEP_BATCH_SIZE,
    select: { transactionId: true },
  });
  let checked = 0;
  for (const row of rows) {
    if (row.transactionId.startsWith(CLAIM_PREFIX)) continue;
    checked += 1;
    try {
      await verifyAndCompletePayment(row.transactionId);
    } catch (error) {
      logger.error(`Checkout sweep failed for ${row.transactionId}: ${String(error)}`);
    }
  }
  return checked;
}

export async function listMyPayments(studentId: string) {
  return prisma.payment.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: { course: { select: { title: true, slug: true } } },
  });
}
