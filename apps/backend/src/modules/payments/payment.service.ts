import crypto from "crypto";
import { prisma } from "../../config/prisma";
import { AppError, NotFoundError } from "../../utils/AppError";
import { paymentProvider } from "./stripe.provider";
import { validateCoupon } from "./coupon.service";
import { DEFAULT_LICENCE_TRACK, type LicenceTrack } from "../curriculum/licence-track";

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

  let amount = Number(course.price);
  if (couponCode) {
    const discountPercent = await validateCoupon(couponCode, courseId);
    amount = Math.round(amount * (1 - discountPercent / 100) * 100) / 100;
  }

  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError("Invalid checkout amount", 400);
  }
  if (amount === 0) {
    // Keep the zero-cost payment receipt and enrollment atomic. If either
    // insert fails (including concurrent enrollment), the other rolls back.
    await prisma.$transaction([
      prisma.enrollment.create({ data: { studentId, courseId, licenceTrack } }),
      prisma.payment.create({
        data: {
          studentId,
          courseId,
          amount: 0,
          provider: "coupon-full-discount",
          transactionId: crypto.randomUUID(),
          status: "SUCCEEDED",
          paidAt: new Date(),
          licenceTrack,
        },
      }),
    ]);
    return { free: true as const };
  }

  const result = await paymentProvider.initiate({
    amount,
    currency: "usd",
    courseId,
    studentId,
    studentEmail: student.email,
    licenceTrack,
  });

  await prisma.payment.create({
    data: {
      studentId,
      courseId,
      amount,
      provider: "stripe",
      transactionId: result.providerReference,
      status: "PENDING",
      licenceTrack,
    },
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
  if (payment.status === "REFUNDED") throw new AppError("Payment has been refunded", 409);

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
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCEEDED", paidAt: new Date() },
      }),
      prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId: payment.studentId, courseId: payment.courseId } },
        create: { studentId: payment.studentId, courseId: payment.courseId, licenceTrack: payment.licenceTrack },
        update: {},
      }),
    ]);
  } else if (result.status === "FAILED") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  }

  return prisma.payment.findUnique({ where: { id: payment.id } });
}

export async function listMyPayments(studentId: string) {
  return prisma.payment.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: { course: { select: { title: true, slug: true } } },
  });
}
