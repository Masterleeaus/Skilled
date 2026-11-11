import { z } from "zod";
import { LICENCE_TRACKS } from "../curriculum/licence-track";

export const createCouponSchema = z.object({
  code: z.string().min(3).max(30).toUpperCase(),
  discountPercent: z.coerce.number().int().min(1).max(100),
  expiresAt: z.coerce.date().optional(),
  usageLimit: z.coerce.number().int().min(1).optional(),
  courseId: z.string().cuid().optional(), // omit for platform-wide coupon
});

export const initiatePaymentSchema = z.object({
  courseId: z.string().cuid(),
  couponCode: z.string().optional(),
  // Carried through checkout onto the payment and the enrolment. Omitted means the default (non-licensed).
  licenceTrack: z.enum(LICENCE_TRACKS).optional(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
