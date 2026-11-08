/**
 * Issue #47 follow-up: the Stripe SDK call behind StripeProvider.initiate receives the idempotency key as request
 * options, separate from the session parameters. The SDK is replaced by a stub that records its arguments.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const stripeSessionCreate = vi.hoisted(() => vi.fn());

vi.mock("stripe", () => {
  class StripeStub {
    checkout = { sessions: { create: stripeSessionCreate, retrieve: vi.fn() } };
    refunds = { create: vi.fn() };
    webhooks = { constructEvent: vi.fn() };
  }
  return { default: StripeStub };
});
vi.mock("../config/env", () => ({
  env: { STRIPE_SECRET_KEY: "sk_test_placeholder_value", STRIPE_WEBHOOK_SECRET: "", CLIENT_URL: "http://localhost:3000" },
}));

import { StripeProvider } from "../modules/payments/stripe.provider";

const params = {
  amount: 90,
  currency: "usd",
  courseId: "course-1",
  studentId: "learner-1",
  studentEmail: "learner-1@example.test",
  licenceTrack: "non-licensed",
};

beforeEach(() => {
  stripeSessionCreate.mockReset();
  stripeSessionCreate.mockResolvedValue({ id: "cs_test_1", url: "https://checkout.stripe.test/cs_test_1" });
});

describe("StripeProvider.initiate idempotency key", () => {
  it("sends the key as request options, not inside the session parameters", async () => {
    const result = await new StripeProvider().initiate({ ...params, idempotencyKey: "academy-checkout-abc123" });

    expect(result).toEqual({ checkoutUrl: "https://checkout.stripe.test/cs_test_1", providerReference: "cs_test_1" });
    expect(stripeSessionCreate).toHaveBeenCalledTimes(1);
    const [body, options] = stripeSessionCreate.mock.calls[0];
    expect(options).toEqual({ idempotencyKey: "academy-checkout-abc123" });
    expect(body).toMatchObject({ mode: "payment", customer_email: "learner-1@example.test", metadata: { courseId: "course-1", studentId: "learner-1", licenceTrack: "non-licensed" } });
    expect(body).not.toHaveProperty("idempotencyKey");
  });

  it("sends no request options when no key is given", async () => {
    await new StripeProvider().initiate(params);

    expect(stripeSessionCreate.mock.calls[0][1]).toBeUndefined();
  });
});
