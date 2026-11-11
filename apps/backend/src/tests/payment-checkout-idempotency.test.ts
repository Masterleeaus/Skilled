/**
 * Issue #47 follow-up: the Stripe idempotency key for checkout sessions, and resuming an abandoned claim.
 *
 * The fake provider records every idempotency key and behaves as Stripe does for a key: a repeated create with the same
 * key returns the session the first create made. Runs the real payment service against the in-memory Prisma double.
 *
 * What these tests prove: the claim row id is the key; a crash after Stripe created the session (the link write failed)
 * is recovered by resuming the claim with the same key, so exactly one session exists; an unknown create outcome keeps
 * the claim; a definite refusal releases it.
 *
 * What they do NOT prove: PostgreSQL behaviour under real concurrency (see payment-checkout-concurrency.test.ts), or
 * Stripe's own key handling (see payment-stripe-idempotency-key.test.ts for the request the SDK receives).
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
import { claimIdempotencyKey, initiateCheckout } from "../modules/payments/payment.service";
import { AppError } from "../utils/AppError";

const COURSE = "course-paid";
const LEARNERS = ["learner-1", "learner-2", "learner-3"];

/** Simulated Stripe: sessions keyed by idempotency key, the way Stripe returns a stored result for a repeated key. */
let stripeSessionsByKey = new Map<string, string>();
let stripeSessionCount = 0;
let sessionDetails = new Map<string, { studentId: string; amount: number }>();

// The double does not enforce the PENDING partial unique index, so this wrapper fails the link write on demand. That
// models a crash between Stripe's create and the claim update.
type UpdateFn = (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
const paymentApi = prisma.payment as unknown as { update: UpdateFn };
const originalPaymentUpdate = paymentApi.update;
let failNextSessionLink = false;
paymentApi.update = (args) => {
  if (failNextSessionLink && typeof args.data.transactionId === "string" && args.data.transactionId.startsWith("cs_")) {
    failNextSessionLink = false;
    return Promise.reject(new Error("connection lost after Stripe answered"));
  }
  return originalPaymentUpdate(args);
};

function stripeError(type: string, statusCode: number, message: string): Error {
  return Object.assign(new Error(message), { type, statusCode });
}

async function seedWorld() {
  await seed("user", LEARNERS.map((id) => ({ id, email: `${id}@example.test`, fullName: id, role: "STUDENT" })));
  await seed("course", [{ id: COURSE, title: "Paid", slug: "paid", isPublished: true, price: 100 }]);
  await seed("coupon", [{ id: "coupon-a", code: "SAVE10", discountPercent: 10, usageLimit: null, courseId: null, redeemedCount: 0 }]);
}

async function paymentsFor(studentId: string) {
  return (await prisma.payment.findMany({ where: { studentId, courseId: COURSE } })) as unknown as Array<{ id: string; status: string; transactionId: string; createdAt: Date }>;
}

/** Moves a row's creation time back, as if the request that made it died long enough ago to be stale. */
async function ageRow(id: string, ms: number) {
  await prisma.payment.update({ where: { id }, data: { createdAt: new Date(Date.now() - ms) } });
}

beforeEach(() => {
  resetFakeDb();
  failNextSessionLink = false;
  stripeSessionsByKey = new Map();
  stripeSessionCount = 0;
  sessionDetails = new Map();
  provider.initiate.mockReset();
  provider.verify.mockReset();
  provider.refund.mockReset();
  provider.initiate.mockImplementation(async (params: { idempotencyKey?: string; studentId: string; amount: number }) => {
    if (params.idempotencyKey && stripeSessionsByKey.has(params.idempotencyKey)) {
      const id = stripeSessionsByKey.get(params.idempotencyKey)!;
      return { checkoutUrl: `https://checkout.example.test/${id}`, providerReference: id };
    }
    stripeSessionCount += 1;
    const id = `cs_test_${stripeSessionCount}`;
    if (params.idempotencyKey) stripeSessionsByKey.set(params.idempotencyKey, id);
    sessionDetails.set(id, { studentId: params.studentId, amount: params.amount });
    return { checkoutUrl: `https://checkout.example.test/${id}`, providerReference: id };
  });
  provider.verify.mockImplementation(async (providerReference: string) => {
    const details = sessionDetails.get(providerReference);
    return {
      status: "PENDING",
      providerReference,
      amount: details?.amount ?? 90,
      currency: "usd",
      courseId: COURSE,
      studentId: details?.studentId ?? null,
      licenceTrack: "non-licensed",
    };
  });
});

describe("the Stripe idempotency key is the claimed payment row", () => {
  it("passes the claim row id to the provider as the key", async () => {
    await seedWorld();

    await initiateCheckout(COURSE, "learner-1", "SAVE10");

    const [payment] = await paymentsFor("learner-1");
    expect(provider.initiate).toHaveBeenCalledTimes(1);
    expect(provider.initiate).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: claimIdempotencyKey(payment.id) }));
    expect(claimIdempotencyKey(payment.id)).toBe(`academy-checkout-${payment.id}`);
  });

  it("gives each new claim its own key", async () => {
    await seedWorld();

    await initiateCheckout(COURSE, "learner-1");
    await initiateCheckout(COURSE, "learner-2");

    const keys = provider.initiate.mock.calls.map((call) => call[0].idempotencyKey);
    expect(new Set(keys).size).toBe(2);
  });
});

describe("a create whose outcome is unknown does not release the claim", () => {
  it("keeps the claim PENDING after a transport failure, and a retry inside the stale window is refused", async () => {
    await seedWorld();
    provider.initiate.mockRejectedValueOnce(stripeError("StripeConnectionError", 0, "socket hang up"));

    await expect(initiateCheckout(COURSE, "learner-1", "SAVE10")).rejects.toThrow("socket hang up");

    const [claim] = await paymentsFor("learner-1");
    expect(claim.status).toBe("PENDING");
    expect(claim.transactionId.startsWith("checkout-claim:")).toBe(true);
    expect(rows("coupon").find((c) => c.id === "coupon-a")?.redeemedCount).toBe(1);
    // The double does not stamp createdAt on create (the column defaults to now() in PostgreSQL), so stamp it here.
    await prisma.payment.update({ where: { id: claim.id }, data: { createdAt: new Date() } });

    await expect(initiateCheckout(COURSE, "learner-1", "SAVE10")).rejects.toMatchObject({ statusCode: 409 });
    expect(provider.initiate).toHaveBeenCalledTimes(1);
  });

  it("treats Stripe's own in-flight 409 as a conflict and keeps the claim", async () => {
    await seedWorld();
    provider.initiate.mockRejectedValueOnce(stripeError("StripeIdempotencyError", 409, "Keys for idempotent requests are being processed"));

    await expect(initiateCheckout(COURSE, "learner-1")).rejects.toMatchObject({ statusCode: 409 });

    const [claim] = await paymentsFor("learner-1");
    expect(claim.status).toBe("PENDING");
  });

  it("a Stripe 5xx keeps the claim", async () => {
    await seedWorld();
    provider.initiate.mockRejectedValueOnce(stripeError("StripeAPIError", 500, "internal error"));

    await expect(initiateCheckout(COURSE, "learner-1")).rejects.toThrow("internal error");

    expect((await paymentsFor("learner-1"))[0].status).toBe("PENDING");
  });

  it("a Stripe 4xx refusal releases the claim, so the learner can retry at once", async () => {
    await seedWorld();
    provider.initiate.mockRejectedValueOnce(stripeError("StripeInvalidRequestError", 400, "Invalid currency"));

    await expect(initiateCheckout(COURSE, "learner-1")).rejects.toThrow("Invalid currency");

    expect((await paymentsFor("learner-1"))[0].status).toBe("FAILED");
    await expect(initiateCheckout(COURSE, "learner-1")).resolves.toMatchObject({ free: false });
  });

  it("an error from before the Stripe call (not configured) releases the claim", async () => {
    await seedWorld();
    provider.initiate.mockRejectedValueOnce(new AppError("Stripe is not configured", 503));

    await expect(initiateCheckout(COURSE, "learner-1")).rejects.toMatchObject({ statusCode: 503 });

    expect((await paymentsFor("learner-1"))[0].status).toBe("FAILED");
  });
});

describe("a crash after Stripe created the session is recovered by resuming the claim", () => {
  it("the link write fails, the stale claim is resumed with the same key, and exactly one session exists", async () => {
    await seedWorld();
    // Stripe creates the session, then the process loses the connection before the claim is linked to it.
    failNextSessionLink = true;
    await expect(initiateCheckout(COURSE, "learner-1", "SAVE10")).rejects.toThrow("connection lost");

    const [claim] = await paymentsFor("learner-1");
    expect(claim.status).toBe("PENDING");
    expect(claim.transactionId.startsWith("checkout-claim:")).toBe(true);
    expect(stripeSessionCount).toBe(1);

    // The request is retried after the stale window. The claim is resumed, not replaced.
    await ageRow(claim.id, 10 * 60 * 1000);
    const retried = await initiateCheckout(COURSE, "learner-1", "SAVE10");

    expect(retried).toEqual({ free: false, checkoutUrl: "https://checkout.example.test/cs_test_1" });
    expect(provider.initiate).toHaveBeenLastCalledWith(expect.objectContaining({ idempotencyKey: claimIdempotencyKey(claim.id) }));
    // Stripe returned the session the first attempt created: no second session, no second claim, no second reservation.
    expect(stripeSessionCount).toBe(1);
    const payments = await paymentsFor("learner-1");
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({ id: claim.id, status: "PENDING", transactionId: "cs_test_1" });
    expect(rows("coupon").find((c) => c.id === "coupon-a")?.redeemedCount).toBe(1);
  });

  it("a stale claim for the same options is resumed, not released", async () => {
    await seedWorld();
    await seed("coupon", [{ id: "coupon-stale", code: "STALE", discountPercent: 10, usageLimit: 1, courseId: null, redeemedCount: 1 }]);
    await seed("payment", [
      { id: "claim-old", studentId: "learner-1", courseId: COURSE, amount: 90, provider: "stripe", transactionId: "checkout-claim:old", status: "PENDING", licenceTrack: "non-licensed", couponId: "coupon-stale", createdAt: new Date(Date.now() - 10 * 60 * 1000) },
    ]);

    const result = await initiateCheckout(COURSE, "learner-1", "STALE");

    expect(result).toMatchObject({ free: false, checkoutUrl: "https://checkout.example.test/cs_test_1" });
    expect(provider.initiate).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: "academy-checkout-claim-old" }));
    expect((await prisma.payment.findUnique({ where: { id: "claim-old" } })).status).toBe("PENDING");
    expect(await paymentsFor("learner-1")).toHaveLength(1);
    expect(rows("coupon").find((c) => c.id === "coupon-stale")?.redeemedCount).toBe(1);
  });

  it("a stale claim for different options is released and a new claim gets a new key", async () => {
    await seedWorld();
    await seed("payment", [
      { id: "claim-old", studentId: "learner-1", courseId: COURSE, amount: 100, provider: "stripe", transactionId: "checkout-claim:old", status: "PENDING", licenceTrack: "non-licensed", couponId: null, createdAt: new Date(Date.now() - 10 * 60 * 1000) },
    ]);

    await initiateCheckout(COURSE, "learner-1", "SAVE10");

    expect((await prisma.payment.findUnique({ where: { id: "claim-old" } })).status).toBe("FAILED");
    const fresh = (await paymentsFor("learner-1")).find((p) => p.id !== "claim-old");
    expect(provider.initiate).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: claimIdempotencyKey(fresh!.id) }));
  });
});
