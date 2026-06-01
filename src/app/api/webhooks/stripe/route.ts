import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { limiters, clientIp } from "@/lib/rate-limit";
import { fulfilOrder } from "@/db/orders";
import { sendOrderConfirmation } from "@/lib/email";

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

  // `checkout.session.completed` is our source of truth that payment succeeded.
  // Fulfilment is transactional + idempotent (keyed on event.id) in fulfilOrder.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      // Not one of ours / missing metadata — acknowledge so Stripe stops retrying.
      console.error(`[webhook] ${event.id}: session without orderId metadata`);
      return NextResponse.json({ received: true });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);

    try {
      const result = await fulfilOrder({
        eventId: event.id,
        eventType: event.type,
        orderId,
        paymentIntentId,
        customerEmail: session.customer_details?.email ?? null,
      });

      if (result.status === "fulfilled") {
        if (result.oversold.length > 0) {
          // Payment is real but stock was already gone — needs a manual refund.
          console.error(
            `[webhook] order ${orderId} OVERSOLD (refund needed): ${result.oversold.join(", ")}`,
          );
        }
        // Best-effort email; never blocks acknowledging the webhook.
        await sendOrderConfirmation(result.email);
      }
    } catch (err) {
      // A real failure (e.g. DB down): return 500 so Stripe retries later.
      console.error(`[webhook] fulfilment failed for ${event.id}:`, err);
      return NextResponse.json({ error: "fulfilment_failed" }, { status: 500 });
    }
  }

  // Acknowledge receipt. Returning 2xx tells Stripe the event was handled.
  return NextResponse.json({ received: true });
}
