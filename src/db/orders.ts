import "server-only";
import { and, eq, inArray, gte, sql } from "drizzle-orm";
import { db } from "./index";
import {
  products,
  productVariants,
  orders,
  orderItems,
  processedEvents,
  type Order,
} from "./schema";
import {
  priceCart,
  type PricedCart,
  type PriceableProduct,
  type PriceableVariant,
} from "@/lib/pricing";
import type { CartItem } from "@/lib/cart";
import { isDemoMode } from "@/lib/env";
import { demoPricingMaps } from "@/lib/demo-data";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Load current product/variant data for a cart and compute authoritative
 * prices. IDs are filtered to valid UUIDs first so a tampered cookie can't push
 * malformed input into a `uuid` column (it simply resolves to a "not found"
 * issue instead).
 */
export async function priceCartFromDb(items: CartItem[]): Promise<PricedCart> {
  if (isDemoMode) return priceCart(items, demoPricingMaps());
  const productIds = unique(
    items.map((i) => i.productId).filter((id) => UUID_RE.test(id)),
  );
  const variantIds = unique(
    items
      .map((i) => i.variantId)
      .filter((id): id is string => !!id && UUID_RE.test(id)),
  );

  const [prods, vars] = await Promise.all([
    productIds.length
      ? db.select().from(products).where(inArray(products.id, productIds))
      : Promise.resolve([]),
    variantIds.length
      ? db
          .select()
          .from(productVariants)
          .where(inArray(productVariants.id, variantIds))
      : Promise.resolve([]),
  ]);

  const productMap = new Map<string, PriceableProduct>(
    prods.map((p) => [
      p.id,
      {
        id: p.id,
        title: p.title,
        type: p.type,
        basePriceCents: p.basePriceCents,
        currency: p.currency,
        status: p.status,
      },
    ]),
  );
  const variantMap = new Map<string, PriceableVariant>(
    vars.map((v) => [
      v.id,
      {
        id: v.id,
        productId: v.productId,
        name: v.name,
        priceCents: v.priceCents,
        stockQty: v.stockQty,
      },
    ]),
  );

  return priceCart(items, { products: productMap, variants: variantMap });
}

/**
 * Create a pending order with snapshotted line items. Called *before* the Stripe
 * Checkout Session; the session id is patched on afterwards via `attachSession`.
 */
export async function createPendingOrder(
  priced: PricedCart,
  customerEmail: string,
): Promise<Order> {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        status: "pending",
        customerEmail,
        subtotalCents: priced.subtotalCents,
        shippingCents: priced.shippingCents,
        totalCents: priced.totalCents,
        currency: priced.currency,
      })
      .returning();

    if (priced.lines.length > 0) {
      await tx.insert(orderItems).values(
        priced.lines.map((l) => ({
          orderId: order.id,
          productId: l.productId,
          variantId: l.variantId,
          titleSnapshot: l.titleSnapshot,
          unitPriceCents: l.unitPriceCents,
          quantity: l.quantity,
        })),
      );
    }
    return order;
  });
}

export async function attachSession(
  orderId: string,
  checkoutSessionId: string,
): Promise<void> {
  await db
    .update(orders)
    .set({ stripeCheckoutSessionId: checkoutSessionId, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

export type FulfilledEmail = {
  to: string;
  orderId: string;
  lines: { titleSnapshot: string; unitPriceCents: number; quantity: number }[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
};

export type FulfilResult =
  | { status: "duplicate" }
  | { status: "not_found" }
  | { status: "already_paid" }
  | { status: "fulfilled"; oversold: string[]; email: FulfilledEmail };

/**
 * Fulfil a paid order — the correctness-critical path. All of it runs in ONE
 * transaction:
 *  1. Record the event id (PK conflict ⇒ duplicate delivery ⇒ no-op).
 *  2. Mark the order paid (skip if already paid).
 *  3. Atomically consume inventory: an original flips available→sold; a print
 *     variant's stock decrements only if enough remains (conditional UPDATE +
 *     DB CHECK guarantee stock never goes negative / nothing double-sells).
 *
 * Any line that couldn't be consumed (already sold elsewhere) is returned in
 * `oversold` so the caller can alert for a manual Stripe refund — the payment is
 * real, so we never silently drop it.
 */
export async function fulfilOrder(params: {
  eventId: string;
  eventType: string;
  orderId: string;
  paymentIntentId: string | null;
  customerEmail: string | null;
}): Promise<FulfilResult> {
  return db.transaction(async (tx) => {
    // 1. Idempotency gate.
    const recorded = await tx
      .insert(processedEvents)
      .values({ eventId: params.eventId, type: params.eventType })
      .onConflictDoNothing()
      .returning();
    if (recorded.length === 0) return { status: "duplicate" };

    // 2. Load + mark paid.
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, params.orderId))
      .limit(1);
    if (!order) return { status: "not_found" };
    if (order.status === "paid" || order.status === "fulfilled") {
      return { status: "already_paid" };
    }

    await tx
      .update(orders)
      .set({
        status: "paid",
        stripePaymentIntentId: params.paymentIntentId,
        // Fill the real customer email captured by Stripe Checkout (the order
        // was created before we knew it).
        ...(params.customerEmail
          ? { customerEmail: params.customerEmail }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, params.orderId));

    // 3. Atomic inventory consumption.
    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, params.orderId));

    const oversold: string[] = [];
    for (const item of items) {
      if (item.variantId) {
        const updated = await tx
          .update(productVariants)
          .set({
            stockQty: sql`${productVariants.stockQty} - ${item.quantity}`,
          })
          .where(
            and(
              eq(productVariants.id, item.variantId),
              gte(productVariants.stockQty, item.quantity),
            ),
          )
          .returning({ id: productVariants.id });
        if (updated.length === 0) oversold.push(item.titleSnapshot);
      } else if (item.productId) {
        const updated = await tx
          .update(products)
          .set({ status: "sold", updatedAt: new Date() })
          .where(
            and(
              eq(products.id, item.productId),
              eq(products.status, "available"),
            ),
          )
          .returning({ id: products.id });
        if (updated.length === 0) oversold.push(item.titleSnapshot);
      }
    }

    return {
      status: "fulfilled",
      oversold,
      email: {
        to: params.customerEmail || order.customerEmail,
        orderId: order.id,
        lines: items.map((i) => ({
          titleSnapshot: i.titleSnapshot,
          unitPriceCents: i.unitPriceCents,
          quantity: i.quantity,
        })),
        subtotalCents: order.subtotalCents,
        shippingCents: order.shippingCents,
        totalCents: order.totalCents,
        currency: order.currency,
      },
    };
  });
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
