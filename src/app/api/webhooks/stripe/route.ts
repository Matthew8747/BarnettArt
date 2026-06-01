import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { limiters, clientIp } from "@/lib/rate-limit";

/**
 * Stripe webhook handler — the source of truth that a payment succeeded.
 *
 * This is the single most correctness-critical endpoint in the app. The rules
 * below are non-negotiable; the fulfilment logic is stubbed until the commerce
 * phase (see docs/IMPLEMENTATION.md):
 *
 *  1. VERIFY the Stripe signature against the raw body before doing anything.
 *     An unverified body is untrusted input and must never drive state changes.
 *  2. Read the RAW request body — Stripe signs the exact bytes, so we must not
 *     let a framework parse/re-serialise it first.
 *  3. Be IDEMPOTENT — Stripe retries deliveries. Key off event.id (and the
 *     PaymentIntent id) so processing the same event twice is a no-op.
 *  4. Do fulfilment (mark order paid + decrement stock + queue email) inside a
 *     SINGLE database transaction so inventory can never desync from payment.
 */
export async function POST(req: Request) {
  // Defensive rate limit — generous, since Stripe legitimately retries.
  const { success } = await limiters.webhook.limit(clientIp(req));
  if (!success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  // Raw bytes — required for signature verification.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: `signature_verification_failed: ${message}` },
      { status: 400 },
    );
  }

  // TODO(commerce phase): wrap in a DB transaction, key idempotency off
  // event.id, mark the order paid, atomically decrement/lock stock, and queue
  // the confirmation email. See docs/IMPLEMENTATION.md → "Checkout flow".
  switch (event.type) {
    case "payment_intent.succeeded":
      // const intent = event.data.object as Stripe.PaymentIntent;
      break;
    case "payment_intent.payment_failed":
      break;
    default:
      // Unhandled event types are acknowledged so Stripe stops retrying.
      break;
  }

  // Acknowledge receipt. Returning 2xx tells Stripe the event was handled.
  return NextResponse.json({ received: true });
}
