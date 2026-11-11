/**
 * Issues #47 and #48: checkout claims and per-coupon redemption limits.
 *
 * Runs the real payment and coupon services against the in-memory Prisma double. Stripe is replaced by a stub.
 *
 * What these tests prove: the service-level rules (who is counted, when a reservation is kept or released, that a
 * repeated checkout reuses the open session, that sequential checkouts never exceed a limit, and that duplicate
 * fulfilment does not enrol twice or keep a duplicate charge).
 *
 * What they do NOT prove: real concurrency. The double has no row locks and no isolation levels. The partial unique
 * index and the conditional UPDATE are PostgreSQL behaviour. Here the index is simulated by a wrapper on payment.create
 * (the double cannot express partial indexes, see fake-prisma.ts PARTIAL_UNIQUES), and the "concurrent" tests only check
 * that the code takes the right branch when a clash happens. The race itself needs a PostgreSQL integration test.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const provider = vi.hoisted(() => ({
  initiate: vi.fn(),
  verify: vi.fn(),
  refund: vi.fn(),
}));

vi.mock("../modules/payments/stripe.provider", () => ({ paymentProvider: provider }));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { fakePrisma as prisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { initiateCheckout, verifyAndCompletePayment } from "../modules/payments/payment.service";
import { validateCoupon } from "../modules/payments/coupon.service";

const COURSE = "course-paid";
const OTHER_COURSE = "course-other";
const LEARNERS = ["learner-1", "learner-2", "learner-3", "learner-4"];

// The double does not enforce the partial unique index on PENDING payments (it cannot express one). This wrapper
// reproduces that one constraint so the claim's P2002 path can be exercised. Migration
// 20261108130000_payment_coupon_redemptions creates the real index. The wrapper checks only when a test is sequential;
// it does not model a race (see the header).
type CreateFn = (args: { data: Record<string, unknown> }) => Promise<unknown>;
const paymentApi = prisma.payment as unknown as { create: CreateFn };
const originalPaymentCreate = paymentApi.create;
/** When set, the next PENDING insert fails as if another request had committed its claim first. */
let forceClashOnNextClaim = false;
paymentApi.create = (args) => {
  const data = args.data;
  if (data.status === "PENDING") {
    const clash = rows("payment").some((row) => row.studentId === data.studentId && row.courseId === data.courseId && row.status === "PENDING");
    if (clash || forceClashOnNextClaim) {
      forceClashOnNextClaim = false;
      return Promise.reject(Object.assign(new Error("Unique constraint failed (payments_one_pending_per_student_course_key)"), { code: "P2002" }));
    }
  }
  return originalPaymentCreate(args);
};

async function seedWorld(couponLimit: number | null = 1) {
  await seed("user", LEARNERS.map((id) => ({ id, email: `${id}@example.test`, fullName: id, role: "STUDENT" })));
  await seed("course", [
    { id: COURSE, title: "Paid", slug: "paid", isPublished: true, price: 100 },
    { id: OTHER_COURSE, title: "Other", slug: "other", isPublished: true, price: 50 },
  ]);
  await seed("coupon", [{ id: "coupon-a", code: "SAVE10", discountPercent: 10, usageLimit: couponLimit, courseId: null, redeemedCount: 0 }]);
}

async function seedSecondCoupon(couponLimit: number | null = 1) {
  await seed("coupon", [{ id: "coupon-b", code: "SAVE20", discountPercent: 20, usageLimit: couponLimit, courseId: null, redeemedCount: 0 }]);
}

async function couponCount(id: string): Promise<number> {
  const coupon = (await prisma.coupon.findUnique({ where: { id } })) as unknown as { redeemedCount: number };
  return Number(coupon.redeemedCount);
}

type PaymentRow = { id: string; couponId: string | null; amount: unknown; status: string };

async function paymentsFor(studentId: string, courseId = COURSE): Promise<PaymentRow[]> {
  return (await prisma.payment.findMany({ where: { studentId, courseId } })) as unknown as PaymentRow[];
}

let sessionCounter = 0;

beforeEach(() => {
  resetFakeDb();
  sessionCounter = 0;
  forceClashOnNextClaim = false;
  provider.initiate.mockReset();
  provider.verify.mockReset();
  provider.refund.mockReset();
  provider.initiate.mockImplementation(async () => {
    sessionCounter += 1;
    const id = `cs_test_${sessionCounter}`;
    return { checkoutUrl: `https://checkout.example.test/${id}`, providerReference: id };
  });
  provider.verify.mockImplementation(async (providerReference: string) => ({
    status: "PENDING",
    providerReference,
    amount: 90,
    currency: "usd",
    courseId: COURSE,
    studentId: null,
    licenceTrack: null,
  }));
});

describe("#48 coupon limits count only their own redemptions", () => {
  it("unrelated course payments do not consume a coupon limit", async () => {
    await seedWorld(1);
    // Two successful purchases of another course, with no coupon. The old coarse count saw these and refused the coupon.
    await seed("payment", [
      { id: "old-1", studentId: "learner-2", courseId: OTHER_COURSE, amount: 50, provider: "stripe", transactionId: "cs_old_1", status: "SUCCEEDED" },
      { id: "old-2", studentId: "learner-3", courseId: OTHER_COURSE, amount: 50, provider: "stripe", transactionId: "cs_old_2", status: "SUCCEEDED" },
    ]);

    const result = await initiateCheckout(COURSE, "learner-1", "SAVE10");

    expect(result.free).toBe(false);
    expect(await couponCount("coupon-a")).toBe(1);
    const [payment] = await paymentsFor("learner-1");
    expect(payment.couponId).toBe("coupon-a");
    expect(Number(payment.amount)).toBe(90);
  });

  it("counts two coupons independently", async () => {
    await seedWorld(1);
    await seedSecondCoupon(1);

    await initiateCheckout(COURSE, "learner-1", "SAVE10");
    await initiateCheckout(COURSE, "learner-2", "SAVE20");

    expect(await couponCount("coupon-a")).toBe(1);
    expect(await couponCount("coupon-b")).toBe(1);
    // Both coupons are now at their limit, so a third learner is refused on each of them.
    await expect(initiateCheckout(COURSE, "learner-3", "SAVE10")).rejects.toMatchObject({ statusCode: 400, message: "Coupon usage limit reached" });
    await expect(initiateCheckout(COURSE, "learner-3", "SAVE20")).rejects.toMatchObject({ statusCode: 400, message: "Coupon usage limit reached" });
    // The refusal does not change either counter or create a payment.
    expect(await couponCount("coupon-a")).toBe(1);
    expect(await couponCount("coupon-b")).toBe(1);
    expect(await paymentsFor("learner-3")).toHaveLength(0);
  });

  it("does not exceed the limit across sequential checkouts", async () => {
    await seedWorld(2);

    await initiateCheckout(COURSE, "learner-1", "SAVE10");
    await initiateCheckout(COURSE, "learner-2", "SAVE10");
    await expect(initiateCheckout(COURSE, "learner-3", "SAVE10")).rejects.toMatchObject({ statusCode: 400 });
    await expect(initiateCheckout(COURSE, "learner-4", "SAVE10")).rejects.toMatchObject({ statusCode: 400 });

    expect(await couponCount("coupon-a")).toBe(2);
    expect(provider.initiate).toHaveBeenCalledTimes(2);
  });

  it("a coupon with no limit still records each redemption", async () => {
    await seedWorld(null);
    await initiateCheckout(COURSE, "learner-1", "SAVE10");
    await initiateCheckout(COURSE, "learner-2", "SAVE10");
    expect(await couponCount("coupon-a")).toBe(2);
  });

  it("a free (fully discounted) redemption is recorded against its coupon in the same transaction", async () => {
    await seedWorld(1);
    await seed("coupon", [{ id: "coupon-free", code: "FREE", discountPercent: 100, usageLimit: 1, courseId: null, redeemedCount: 0 }]);

    const result = await initiateCheckout(COURSE, "learner-1", "FREE");

    expect(result).toEqual({ free: true });
    expect(await couponCount("coupon-free")).toBe(1);
    expect(await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: "learner-1", courseId: COURSE } } })).not.toBeNull();
    await expect(initiateCheckout(COURSE, "learner-2", "FREE")).rejects.toMatchObject({ statusCode: 400, message: "Coupon usage limit reached" });
  });
});

describe("#48 releasing a reservation", () => {
  it("gives the reservation back when Stripe fails to create the session", async () => {
    await seedWorld(1);
    provider.initiate.mockRejectedValueOnce(new Error("stripe unavailable"));

    await expect(initiateCheckout(COURSE, "learner-1", "SAVE10")).rejects.toThrow("stripe unavailable");

    expect(await couponCount("coupon-a")).toBe(0);
    const [failed] = await paymentsFor("learner-1");
    expect(failed.status).toBe("FAILED");
    // The coupon is free again for the next learner.
    await expect(initiateCheckout(COURSE, "learner-2", "SAVE10")).resolves.toMatchObject({ free: false });
  });

  it("gives the reservation back when a checkout expires unpaid, and a new checkout can start", async () => {
    await seedWorld(1);
    await initiateCheckout(COURSE, "learner-1", "SAVE10");
    provider.verify.mockResolvedValueOnce({
      status: "FAILED", providerReference: "cs_test_1", amount: 90, currency: "usd", courseId: COURSE, studentId: null, licenceTrack: null,
    });

    const second = await initiateCheckout(COURSE, "learner-1", "SAVE10");

    expect(second).toEqual({ free: false, checkoutUrl: "https://checkout.example.test/cs_test_2" });
    const statuses = (await paymentsFor("learner-1")).map((p) => p.status).sort();
    expect(statuses).toEqual(["FAILED", "PENDING"]);
    expect(await couponCount("coupon-a")).toBe(1);
  });

  it("a verify that sees the session expired releases the reservation exactly once", async () => {
    await seedWorld(1);
    await initiateCheckout(COURSE, "learner-1", "SAVE10");
    const expired = { status: "FAILED", providerReference: "cs_test_1", amount: 90, currency: "usd", courseId: COURSE, studentId: "learner-1", licenceTrack: "non-licensed" };
    provider.verify.mockResolvedValue(expired);

    await verifyAndCompletePayment("cs_test_1", "learner-1");
    await verifyAndCompletePayment("cs_test_1", "learner-1");

    expect(await couponCount("coupon-a")).toBe(0);
  });
});

describe("#47 one open checkout per learner and course", () => {
  it("a repeated checkout for the same learner and course returns the existing pending session", async () => {
    await seedWorld(1);

    const first = await initiateCheckout(COURSE, "learner-1", "SAVE10");
    const second = await initiateCheckout(COURSE, "learner-1", "SAVE10");

    expect(second).toEqual(first);
    expect(provider.initiate).toHaveBeenCalledTimes(1);
    expect(provider.verify).toHaveBeenCalledWith("cs_test_1");
    expect(await paymentsFor("learner-1")).toHaveLength(1);
    // The repeat did not reserve a second redemption.
    expect(await couponCount("coupon-a")).toBe(1);
  });

  it("a repeated checkout with different options is refused with a conflict, and no second session is created", async () => {
    await seedWorld(null);

    await initiateCheckout(COURSE, "learner-1");
    await expect(initiateCheckout(COURSE, "learner-1", "SAVE10")).rejects.toMatchObject({ statusCode: 409 });
    await expect(initiateCheckout(COURSE, "learner-1", undefined, "licensed")).rejects.toMatchObject({ statusCode: 409 });

    expect(provider.initiate).toHaveBeenCalledTimes(1);
  });

  it("a checkout whose claim is still being created is refused with a conflict", async () => {
    await seedWorld(null);
    // A claim with a placeholder id and no Stripe session, created just now: another request is in flight.
    await seed("payment", [
      { id: "claim-1", studentId: "learner-1", courseId: COURSE, amount: 100, provider: "stripe", transactionId: "checkout-claim:in-flight", status: "PENDING", licenceTrack: "non-licensed", createdAt: new Date() },
    ]);

    await expect(initiateCheckout(COURSE, "learner-1")).rejects.toMatchObject({ statusCode: 409 });
    expect(provider.initiate).not.toHaveBeenCalled();
  });

  it("an abandoned claim for different options is cleared, and its reservation released, before a new checkout starts", async () => {
    // Same-options abandoned claims are resumed instead (see payment-checkout-idempotency.test.ts).
    await seedWorld(1);
    await seed("coupon", [{ id: "coupon-stale", code: "STALE", discountPercent: 10, usageLimit: 1, courseId: null, redeemedCount: 1 }]);
    await seed("payment", [
      { id: "claim-old", studentId: "learner-1", courseId: COURSE, amount: 90, provider: "stripe", transactionId: "checkout-claim:old", status: "PENDING", licenceTrack: "licensed", couponId: "coupon-stale", createdAt: new Date(Date.now() - 10 * 60 * 1000) },
    ]);

    const result = await initiateCheckout(COURSE, "learner-1", "STALE");

    expect(result).toMatchObject({ free: false });
    expect((await prisma.payment.findUnique({ where: { id: "claim-old" } })).status).toBe("FAILED");
    expect(await couponCount("coupon-stale")).toBe(1);
  });

  it("when another request wins the claim index, the loser gets a 409 and creates no Stripe session", async () => {
    await seedWorld(null);
    forceClashOnNextClaim = true;

    await expect(initiateCheckout(COURSE, "learner-1", "SAVE10")).rejects.toMatchObject({ statusCode: 409 });

    expect(provider.initiate).not.toHaveBeenCalled();
    // The failed claim transaction left no payment row and no coupon reservation behind.
    expect(await paymentsFor("learner-1")).toHaveLength(0);
    expect(await couponCount("coupon-a")).toBe(0);
  });
});

describe("#47 fulfilment stays idempotent", () => {
  const paidSession = (id: string, overrides: Record<string, unknown> = {}) => ({
    status: "SUCCEEDED", providerReference: id, amount: 90, currency: "usd", courseId: COURSE, studentId: "learner-1", licenceTrack: "non-licensed", ...overrides,
  });

  it("a second successful delivery for a paid checkout does not create a second enrolment", async () => {
    await seedWorld(null);
    await initiateCheckout(COURSE, "learner-1", "SAVE10");
    provider.verify.mockResolvedValue(paidSession("cs_test_1"));

    await verifyAndCompletePayment("cs_test_1");
    const again = await verifyAndCompletePayment("cs_test_1");

    expect(again).toMatchObject({ status: "SUCCEEDED" });
    expect(rows("enrollment").filter((e) => e.studentId === "learner-1" && e.courseId === COURSE)).toHaveLength(1);
    expect(provider.refund).not.toHaveBeenCalled();
  });

  it("a paid checkout for a learner who is already enrolled is refunded, not kept, and creates no enrolment", async () => {
    await seedWorld(null);
    await initiateCheckout(COURSE, "learner-1", "SAVE10");
    // Enrolled after the checkout opened (for example by an admin or a free coupon).
    await seed("enrollment", [{ studentId: "learner-1", courseId: COURSE, status: "ACTIVE", licenceTrack: "non-licensed" }]);
    provider.verify.mockResolvedValue(paidSession("cs_test_1"));

    const payment = await verifyAndCompletePayment("cs_test_1");

    expect(provider.refund).toHaveBeenCalledWith("cs_test_1");
    expect(payment).toMatchObject({ status: "REFUNDED" });
    expect(rows("enrollment").filter((e) => e.studentId === "learner-1")).toHaveLength(1);
    // A repeated webhook for the refunded payment is acknowledged, not retried as an error.
    await expect(verifyAndCompletePayment("cs_test_1")).resolves.toMatchObject({ status: "REFUNDED" });
    expect(provider.refund).toHaveBeenCalledTimes(1);
  });

  it("a payment that fails at Stripe keeps the coupon reservation released exactly once", async () => {
    await seedWorld(1);
    await initiateCheckout(COURSE, "learner-1", "SAVE10");
    provider.verify.mockResolvedValue({ ...paidSession("cs_test_1"), status: "FAILED" });

    await verifyAndCompletePayment("cs_test_1");
    await verifyAndCompletePayment("cs_test_1");

    expect(await couponCount("coupon-a")).toBe(0);
    expect(rows("enrollment")).toHaveLength(0);
  });
});

describe("validateCoupon", () => {
  it("validates without reserving: the counter is unchanged and the limit is left to the checkout transaction", async () => {
    await seedWorld(1);
    const coupon = await validateCoupon("save10", COURSE);
    expect(coupon).toMatchObject({ id: "coupon-a", discountPercent: 10 });
    expect(await couponCount("coupon-a")).toBe(0);
  });
});
