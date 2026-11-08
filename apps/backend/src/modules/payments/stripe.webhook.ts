import type { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { verifyAndCompletePayment } from "./payment.service";

/** Only Stripe-signed checkout sessions are eligible for webhook fulfillment. */
const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

export async function handleStripeWebhook(req: Request, res: Response) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ success: false, message: "Payment webhooks not configured" });
  }
  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string" || !Buffer.isBuffer(req.body)) {
    return res.status(400).json({ success: false, message: "Invalid webhook request" });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).json({ success: false, message: "Invalid webhook signature" });
  }

  if (event.type !== "checkout.session.completed" &&
      event.type !== "checkout.session.async_payment_succeeded") {
    return res.status(200).json({ received: true });
  }
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return res.status(200).json({ received: true });
  }
  try {
    // Fetches current session state from Stripe; validates amount, currency,
    // learner and course against the persisted Academy payment before enrolling.
    await verifyAndCompletePayment(session.id);
    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Stripe webhook fulfillment failed for ${session.id}: ${String(error)}`);
    // Non-2xx lets Stripe retry transient failures; mismatches remain blocked.
    return res.status(503).json({ success: false, message: "Fulfillment pending" });
  }
}
