import Stripe from "stripe";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import type {
  PaymentProvider,
  InitiatePaymentParams,
  InitiatePaymentResult,
  VerifyPaymentResult,
} from "./payment-provider.interface";

// API version this integration was written against. The SDK types accept only its own latest version,
// so the pinned string is cast here; the value sent to Stripe is unchanged.
const STRIPE_API_VERSION = "2024-06-20" as string;
// The client exists only when a secret key is configured. Production startup requires the key (config/env.ts), so
// without one every Stripe call fails closed with 503 and no request is ever made with a placeholder key.
const stripe: Stripe | null = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion })
  : null;

function stripeClient(): Stripe {
  if (!stripe) {
    throw new AppError("Stripe is not configured — set STRIPE_SECRET_KEY in .env", 503);
  }
  return stripe;
}

export class StripeProvider implements PaymentProvider {
  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const client = stripeClient();

    const body: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: params.currency,
            unit_amount: Math.round(params.amount * 100), // Stripe expects smallest unit (cents)
            product_data: { name: `Course enrollment: ${params.courseId}` },
          },
          quantity: 1,
        },
      ],
      customer_email: params.studentEmail,
      metadata: { courseId: params.courseId, studentId: params.studentId, licenceTrack: params.licenceTrack },
      // The track rides on the return URL so the success page can open the course on the same track.
      success_url: `${env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&track=${encodeURIComponent(params.licenceTrack)}`,
      cancel_url: `${env.CLIENT_URL}/payment/cancelled`,
    };
    // Stripe keeps an idempotency key's result for 24 hours and rejects a reused key with different parameters.
    const session = await client.checkout.sessions.create(body,params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined);

    return { checkoutUrl: session.url!, providerReference: session.id };
  }

  async verify(providerReference: string): Promise<VerifyPaymentResult> {
    const session = await stripeClient().checkout.sessions.retrieve(providerReference);

    const status =
      session.payment_status === "paid"
        ? "SUCCEEDED"
        : session.status === "expired"
          ? "FAILED"
          : "PENDING";

    return {
      status,
      providerReference,
      amount: (session.amount_total ?? 0) / 100,
      currency: session.currency ?? "",
      courseId: session.metadata?.courseId ?? null,
      studentId: session.metadata?.studentId ?? null,
      licenceTrack: session.metadata?.licenceTrack ?? null,
    };
  }

  async refund(providerReference: string): Promise<void> {
    const client = stripeClient();
    const session = await client.checkout.sessions.retrieve(providerReference);
    if (!session.payment_intent) throw new AppError("No payment intent found for refund", 400);

    await client.refunds.create({
      payment_intent: session.payment_intent as string,
    });
  }
}

export const paymentProvider: PaymentProvider = new StripeProvider();
