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
const stripe = new Stripe(env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
});

export class StripeProvider implements PaymentProvider {
  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    if (!env.STRIPE_SECRET_KEY) {
      throw new AppError("Stripe is not configured — set STRIPE_SECRET_KEY in .env", 503);
    }

    const session = await stripe.checkout.sessions.create({
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
    });

    return { checkoutUrl: session.url!, providerReference: session.id };
  }

  async verify(providerReference: string): Promise<VerifyPaymentResult> {
    if (!env.STRIPE_SECRET_KEY) throw new AppError("Stripe is not configured", 503);
    const session = await stripe.checkout.sessions.retrieve(providerReference);

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
    const session = await stripe.checkout.sessions.retrieve(providerReference);
    if (!session.payment_intent) throw new AppError("No payment intent found for refund", 400);

    await stripe.refunds.create({
      payment_intent: session.payment_intent as string,
    });
  }
}

export const paymentProvider: PaymentProvider = new StripeProvider();
