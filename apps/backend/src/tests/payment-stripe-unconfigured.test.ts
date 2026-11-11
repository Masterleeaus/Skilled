/**
 * Without STRIPE_SECRET_KEY the provider must never construct a Stripe client with a placeholder key and every call must
 * fail closed with 503. A configured key is the positive control that proves the client is built from the real value.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const testEnv = vi.hoisted(() => ({
  STRIPE_SECRET_KEY: "",
  STRIPE_WEBHOOK_SECRET: "",
  CLIENT_URL: "http://localhost:3000",
}));
const stripeConstructor = vi.hoisted(() => vi.fn());
const sessionCreate = vi.hoisted(() => vi.fn());
const sessionRetrieve = vi.hoisted(() => vi.fn());
const refundCreate = vi.hoisted(() => vi.fn());

vi.mock("stripe", () => {
  class StripeStub {
    constructor(key: string, options: unknown) {
      stripeConstructor(key, options);
    }
    checkout = { sessions: { create: sessionCreate, retrieve: sessionRetrieve } };
    refunds = { create: refundCreate };
  }
  return { default: StripeStub };
});
vi.mock("../config/env", () => ({ env: testEnv }));

const params = {
  amount: 90,
  currency: "usd",
  courseId: "course-1",
  studentId: "learner-1",
  studentEmail: "learner-1@example.test",
  licenceTrack: "non-licensed",
};

async function loadProvider() {
  vi.resetModules();
  return (await import("../modules/payments/stripe.provider")).StripeProvider;
}

beforeEach(() => {
  testEnv.STRIPE_SECRET_KEY = "";
  stripeConstructor.mockReset();
  sessionCreate.mockReset();
  sessionRetrieve.mockReset();
  refundCreate.mockReset();
});

describe("StripeProvider without a configured secret key", () => {
  it("never constructs a Stripe client, so no placeholder key exists", async () => {
    await loadProvider();

    expect(stripeConstructor).not.toHaveBeenCalled();
  });

  it("initiate, verify and refund all reject with 503 and make no Stripe call", async () => {
    const StripeProvider = await loadProvider();
    const provider = new StripeProvider();

    await expect(provider.initiate(params)).rejects.toMatchObject({ statusCode: 503 });
    await expect(provider.verify("cs_test_1")).rejects.toMatchObject({ statusCode: 503 });
    await expect(provider.refund("cs_test_1")).rejects.toMatchObject({ statusCode: 503 });

    expect(sessionCreate).not.toHaveBeenCalled();
    expect(sessionRetrieve).not.toHaveBeenCalled();
    expect(refundCreate).not.toHaveBeenCalled();
  });

  it("builds the client from the configured key (positive control)", async () => {
    testEnv.STRIPE_SECRET_KEY = "sk_test_fixture_configured";
    const StripeProvider = await loadProvider();
    sessionCreate.mockResolvedValue({ id: "cs_test_1", url: "https://checkout.stripe.test/cs_test_1" });

    await new StripeProvider().initiate(params);

    expect(stripeConstructor).toHaveBeenCalledTimes(1);
    expect(stripeConstructor.mock.calls[0][0]).toBe("sk_test_fixture_configured");
    expect(sessionCreate).toHaveBeenCalledTimes(1);
  });
});
