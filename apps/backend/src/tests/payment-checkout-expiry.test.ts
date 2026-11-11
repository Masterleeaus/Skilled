/**
 * Issue #47 follow-up: an abandoned checkout is released exactly once, from the checkout.session.expired webhook and
 * from the expiry sweep.
 *
 * The webhook is driven through handleStripeWebhook with a real signature from the Stripe SDK, so the signature check
 * is the production one. Stripe itself is replaced by a fake provider, and the database is the in-memory double.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const provider = vi.hoisted(() => ({
  initiate: vi.fn(),
  verify: vi.fn(),
  refund: vi.fn(),
}));
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }));

vi.mock("../modules/payments/stripe.provider", () => ({ paymentProvider: provider }));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));
vi.mock("../config/logger", () => ({ logger }));
vi.mock("../config/env", () => ({
  env: {
    STRIPE_SECRET_KEY: "sk_test_webhook_fixture",
    STRIPE_WEBHOOK_SECRET: "whsec_webhook_fixture",
    CLIENT_URL: "http://localhost:3000",
    NODE_ENV: "test",
  },
}));

import Stripe from "stripe";
import { fakePrisma as prisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { handleStripeWebhook } from "../modules/payments/stripe.webhook";
import { initiateCheckout, sweepAbandonedCheckouts } from "../modules/payments/payment.service";

const COURSE = "course-paid";
const LEARNERS = ["learner-1", "learner-2"];
const WEBHOOK_SECRET = "whsec_webhook_fixture";
const signer = new Stripe("sk_test_webhook_fixture");

let sessionCounter = 0;

async function seedWorld() {
  await seed("user", LEARNERS.map((id) => ({ id, email: `${id}@example.test`, fullName: id, role: "STUDENT" })));
  await seed("course", [{ id: COURSE, title: "Paid", slug: "paid", isPublished: true, price: 100 }]);
  await seed("coupon", [{ id: "coupon-a", code: "SAVE10", discountPercent: 10, usageLimit: 2, courseId: null, redeemedCount: 0 }]);
}

function couponCount(): number {
  return Number(rows("coupon").find((c) => c.id === "coupon-a")?.redeemedCount);
}

function remoteSession(providerReference: string, status: "PENDING" | "FAILED" | "SUCCEEDED", studentId = "learner-1") {
  return {
    status, providerReference, amount: 90, currency: "usd", courseId: COURSE, studentId, licenceTrack: "non-licensed",
  };
}

/** A signed event delivery, shaped as Stripe sends it. */
function signedRequest(event: { id: string; type: string; sessionId: string }, secret = WEBHOOK_SECRET) {
  const payload = JSON.stringify({
    id: event.id,
    object: "event",
    type: event.type,
    data: { object: { id: event.sessionId, object: "checkout.session", payment_status: "unpaid" } },
  });
  const header = signer.webhooks.generateTestHeaderString({ payload, secret });
  return { headers: { "stripe-signature": header }, body: Buffer.from(payload) };
}

function fakeResponse() {
  const res = { statusCode: 200, body: undefined as unknown };
  return {
    res: {
      status(code: number) { res.statusCode = code; return this; },
      json(body: unknown) { res.body = body; return this; },
    } as unknown as Parameters<typeof handleStripeWebhook>[1],
    result: res,
  };
}

async function deliver(event: { id: string; type: string; sessionId: string }, secret?: string) {
  const { res, result } = fakeResponse();
  await handleStripeWebhook(signedRequest(event, secret) as unknown as Parameters<typeof handleStripeWebhook>[0], res);
  return result;
}

beforeEach(() => {
  resetFakeDb();
  sessionCounter = 0;
  provider.initiate.mockReset();
  provider.verify.mockReset();
  provider.refund.mockReset();
  logger.error.mockReset();
  provider.initiate.mockImplementation(async () => {
    sessionCounter += 1;
    const id = `cs_test_${sessionCounter}`;
    return { checkoutUrl: `https://checkout.example.test/${id}`, providerReference: id };
  });
  provider.verify.mockImplementation(async (providerReference: string) => remoteSession(providerReference, "PENDING"));
});

describe("checkout.session.expired webhook", () => {
  it("releases the reservation of an expired, unpaid checkout exactly once", async () => {
    await seedWorld();
    await initiateCheckout(COURSE, "learner-1", "SAVE10");
    await initiateCheckout(COURSE, "learner-2", "SAVE10");
    expect(couponCount()).toBe(2);
    provider.verify.mockImplementation(async (ref: string) => remoteSession(ref, "FAILED"));

    const first = await deliver({ id: "evt_1", type: "checkout.session.expired", sessionId: "cs_test_1" });
    const second = await deliver({ id: "evt_1_retry", type: "checkout.session.expired", sessionId: "cs_test_1" });

    expect(first).toMatchObject({ statusCode: 200, body: { received: true } });
    expect(second).toMatchObject({ statusCode: 200 });
    expect(couponCount()).toBe(1);
    expect(rows("payment").find((p) => p.transactionId === "cs_test_1")?.status).toBe("FAILED");
    expect(rows("payment").find((p) => p.transactionId === "cs_test_2")?.status).toBe("PENDING");
  });

  it("leaves a checkout alone when Stripe still reports it open", async () => {
    await seedWorld();
    await initiateCheckout(COURSE, "learner-1", "SAVE10");

    const result = await deliver({ id: "evt_2", type: "checkout.session.expired", sessionId: "cs_test_1" });

    expect(result.statusCode).toBe(200);
    expect(couponCount()).toBe(1);
    expect(rows("payment")[0].status).toBe("PENDING");
  });

  it("acknowledges an expiry for a session that has no payment row, so Stripe does not retry it", async () => {
    await seedWorld();

    const result = await deliver({ id: "evt_3", type: "checkout.session.expired", sessionId: "cs_unknown" });

    expect(result.statusCode).toBe(200);
    expect(provider.verify).not.toHaveBeenCalled();
  });

  it("refuses an unsigned or wrongly signed expiry, and changes nothing", async () => {
    await seedWorld();
    await initiateCheckout(COURSE, "learner-1", "SAVE10");

    const result = await deliver({ id: "evt_4", type: "checkout.session.expired", sessionId: "cs_test_1" }, "whsec_wrong");

    expect(result.statusCode).toBe(400);
    expect(provider.verify).not.toHaveBeenCalledWith("cs_test_1");
    expect(couponCount()).toBe(1);
  });

  it("asks Stripe to retry when settling the expiry fails", async () => {
    await seedWorld();
    await initiateCheckout(COURSE, "learner-1", "SAVE10");
    provider.verify.mockRejectedValueOnce(new Error("stripe timeout"));

    const result = await deliver({ id: "evt_5", type: "checkout.session.expired", sessionId: "cs_test_1" });

    expect(result.statusCode).toBe(503);
    expect(couponCount()).toBe(1);
  });
});

describe("expiry sweep", () => {
  const DAY = 24 * 60 * 60 * 1000;

  it("settles only old, non-placeholder PENDING Stripe checkouts, releasing the expired ones", async () => {
    await seedWorld();
    await seed("coupon", [{ id: "coupon-b", code: "SAVE20", discountPercent: 20, usageLimit: null, courseId: null, redeemedCount: 1 }]);
    const old = new Date(Date.now() - DAY - 60 * 60 * 1000);
    await seed("payment", [
      { id: "old-expired", studentId: "learner-1", courseId: COURSE, amount: 90, provider: "stripe", transactionId: "cs_old_expired", status: "PENDING", licenceTrack: "non-licensed", couponId: "coupon-b", createdAt: old },
      { id: "old-open", studentId: "learner-2", courseId: COURSE, amount: 90, provider: "stripe", transactionId: "cs_old_open", status: "PENDING", licenceTrack: "non-licensed", couponId: null, createdAt: old },
      { id: "old-claim", studentId: "learner-2", courseId: COURSE, amount: 90, provider: "stripe", transactionId: "checkout-claim:stuck", status: "PENDING", licenceTrack: "non-licensed", couponId: null, createdAt: old },
      { id: "fresh", studentId: "learner-1", courseId: COURSE, amount: 90, provider: "stripe", transactionId: "cs_fresh", status: "PENDING", licenceTrack: "non-licensed", couponId: null, createdAt: new Date() },
    ]);
    provider.verify.mockImplementation(async (ref: string) => remoteSession(ref, ref === "cs_old_expired" ? "FAILED" : "PENDING", ref === "cs_old_open" ? "learner-2" : "learner-1"));

    const checked = await sweepAbandonedCheckouts();

    expect(checked).toBe(2);
    expect(provider.verify).not.toHaveBeenCalledWith("cs_fresh");
    expect(provider.verify).not.toHaveBeenCalledWith("checkout-claim:stuck");
    expect((await prisma.payment.findUnique({ where: { id: "old-expired" } })).status).toBe("FAILED");
    expect((await prisma.payment.findUnique({ where: { id: "old-open" } })).status).toBe("PENDING");
    expect((await prisma.payment.findUnique({ where: { id: "old-claim" } })).status).toBe("PENDING");
    expect(rows("coupon").find((c) => c.id === "coupon-b")?.redeemedCount).toBe(0);
  });

  it("a second sweep releases nothing more", async () => {
    await seedWorld();
    await seed("coupon", [{ id: "coupon-b", code: "SAVE20", discountPercent: 20, usageLimit: null, courseId: null, redeemedCount: 1 }]);
    await seed("payment", [
      { id: "old-expired", studentId: "learner-1", courseId: COURSE, amount: 90, provider: "stripe", transactionId: "cs_old_expired", status: "PENDING", licenceTrack: "non-licensed", couponId: "coupon-b", createdAt: new Date(Date.now() - 2 * DAY) },
    ]);
    provider.verify.mockImplementation(async (ref: string) => remoteSession(ref, "FAILED"));

    await sweepAbandonedCheckouts();
    await sweepAbandonedCheckouts();

    expect(rows("coupon").find((c) => c.id === "coupon-b")?.redeemedCount).toBe(0);
  });

  it("logs a failing row and still settles the rest", async () => {
    await seedWorld();
    await seed("coupon", [{ id: "coupon-b", code: "SAVE20", discountPercent: 20, usageLimit: null, courseId: null, redeemedCount: 1 }]);
    const old = new Date(Date.now() - 2 * DAY);
    await seed("payment", [
      { id: "broken", studentId: "learner-2", courseId: COURSE, amount: 90, provider: "stripe", transactionId: "cs_broken", status: "PENDING", licenceTrack: "non-licensed", couponId: null, createdAt: old },
      { id: "expired", studentId: "learner-1", courseId: COURSE, amount: 90, provider: "stripe", transactionId: "cs_expired", status: "PENDING", licenceTrack: "non-licensed", couponId: "coupon-b", createdAt: old },
    ]);
    provider.verify.mockImplementation(async (ref: string) => {
      if (ref === "cs_broken") throw new Error("stripe unavailable");
      return remoteSession(ref, "FAILED");
    });

    const checked = await sweepAbandonedCheckouts();

    expect(checked).toBe(2);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("cs_broken"));
    expect((await prisma.payment.findUnique({ where: { id: "expired" } })).status).toBe("FAILED");
    expect(rows("coupon").find((c) => c.id === "coupon-b")?.redeemedCount).toBe(0);
  });
});
