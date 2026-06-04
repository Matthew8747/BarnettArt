import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { env, isDemoMode } from "@/lib/env";
import { limiters, clientIp } from "@/lib/rate-limit";
import { readCart } from "@/lib/cart-cookie";
import {
  priceCartFromDb,
  createPendingOrder,
  attachSession,
} from "@/db/orders";

/**
 * Create a Stripe Checkout Session for the current cart.
 *
 * Security invariants:
 *  - Prices are computed server-side from the DB (priceCartFromDb); the cart
 *    cookie only supplies product/variant ids + quantities.
 *  - Same-origin check (no cross-site POST can start a checkout for a victim).
 *  - Rate limited per IP. Card data goes straight to Stripe's hosted page.
 */
export async function POST(req: Request) {
  // Demo/prototype previews have no payment provider — checkout is disabled.
  if (isDemoMode) {
    return NextResponse.json(
      { error: "demo_checkout_disabled" },
      { status: 503 },
    );
  }

  const { success } = await limiters.checkout.limit(clientIp(req));
  if (!success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // Same-origin guard for this state-changing endpoint.
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) {
    return NextResponse.json({ error: "bad_origin" }, { status: 403 });
  }

  const cart = await readCart();
  if (cart.items.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  const priced = await priceCartFromDb(cart.items);
  if (priced.lines.length === 0) {
    return NextResponse.json(
      { error: "nothing_purchasable", issues: priced.issues },
      { status: 400 },
    );
  }

  // Order is created pending first so its id rides along as Stripe metadata —
  // the webhook uses it to fulfil exactly the right order.
  const order = await createPendingOrder(priced, "");

  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: priced.lines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: priced.currency.toLowerCase(),
        unit_amount: l.unitPriceCents,
        product_data: { name: l.titleSnapshot },
      },
    })),
    shipping_address_collection: { allowed_countries: ["GB"] },
    success_url: `${siteUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/cart`,
    metadata: { orderId: order.id },
    payment_intent_data: { metadata: { orderId: order.id } },
  });

  await attachSession(order.id, session.id);

  if (!session.url) {
    return NextResponse.json({ error: "session_failed" }, { status: 502 });
  }
  return NextResponse.json({ url: session.url });
}
