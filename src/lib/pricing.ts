import type { CartItem } from "./cart";

/**
 * Server-side price computation (HANDOVER invariant #2: never trust a price from
 * the browser). Given the cart's identifiers and the *current* product/variant
 * data loaded from the database, this derives the authoritative line items and
 * totals. The cart cookie's contents never influence price — only quantity and
 * which product/variant.
 *
 * Pure: callers pass already-loaded data, so this unit-tests without a DB.
 */

/** Minimal product shape pricing needs (subset of the DB row). */
export type PriceableProduct = {
  id: string;
  title: string;
  type: "original" | "print";
  basePriceCents: number;
  currency: string;
  status: "available" | "sold" | "archived";
};

/** Minimal variant shape pricing needs. */
export type PriceableVariant = {
  id: string;
  productId: string;
  name: string;
  priceCents: number;
  stockQty: number;
};

export type PricedLine = {
  productId: string;
  variantId: string | null;
  titleSnapshot: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type CartIssue = {
  productId: string;
  variantId: string | null;
  reason: "not_found" | "unavailable" | "insufficient_stock";
};

export type PricedCart = {
  lines: PricedLine[];
  issues: CartIssue[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
};

/**
 * Shipping policy (PLACEHOLDER rates — Anna confirms before launch).
 *
 * Flat fee per order, with free shipping once the order subtotal reaches a
 * threshold. UK norm for premium/handmade work. Both numbers are named
 * constants so changing them is a one-line edit + redeploy.
 *
 * For dashboard-level control without a redeploy, this can later be replaced by
 * a Stripe shipping rate (`shipping_options` on the Checkout Session) — see
 * docs/EXTERNAL-SETUP.md §"Shipping". Kept as a single function so any future
 * rule (weight, prints vs originals, per-region) slots in here without touching
 * call sites.
 */
export const FLAT_SHIPPING_CENTS = 695; // £6.95 per order
export const FREE_SHIPPING_THRESHOLD_CENTS = 15000; // free at/over £150

export function computeShippingCents(lines: PricedLine[]): number {
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  if (subtotal <= 0) return 0; // empty cart — nothing to ship
  return subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
}

export function priceCart(
  items: CartItem[],
  data: {
    products: Map<string, PriceableProduct>;
    variants: Map<string, PriceableVariant>;
  },
): PricedCart {
  const lines: PricedLine[] = [];
  const issues: CartIssue[] = [];
  let currency = "GBP";

  for (const item of items) {
    const product = data.products.get(item.productId);
    if (!product || product.status === "archived") {
      issues.push({ ...keyOf(item), reason: "not_found" });
      continue;
    }
    currency = product.currency;

    if (item.variantId) {
      // Print variant: price + stock come from the variant.
      const variant = data.variants.get(item.variantId);
      if (!variant || variant.productId !== product.id) {
        issues.push({ ...keyOf(item), reason: "not_found" });
        continue;
      }
      if (variant.stockQty <= 0) {
        issues.push({ ...keyOf(item), reason: "unavailable" });
        continue;
      }
      const quantity = Math.min(item.quantity, variant.stockQty);
      if (quantity < item.quantity) {
        issues.push({ ...keyOf(item), reason: "insufficient_stock" });
      }
      lines.push(
        makeLine(
          item,
          `${product.title} — ${variant.name}`,
          variant.priceCents,
          quantity,
        ),
      );
    } else {
      // Original: one-of-one, priced from the product, must be available.
      if (product.status !== "available") {
        issues.push({ ...keyOf(item), reason: "unavailable" });
        continue;
      }
      // Originals are unique — quantity is always 1 regardless of the cookie.
      lines.push(makeLine(item, product.title, product.basePriceCents, 1));
    }
  }

  const subtotalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const shippingCents = computeShippingCents(lines);
  return {
    lines,
    issues,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    currency,
  };
}

function keyOf(item: CartItem) {
  return { productId: item.productId, variantId: item.variantId };
}

function makeLine(
  item: CartItem,
  titleSnapshot: string,
  unitPriceCents: number,
  quantity: number,
): PricedLine {
  return {
    productId: item.productId,
    variantId: item.variantId,
    titleSnapshot,
    unitPriceCents,
    quantity,
    lineTotalCents: unitPriceCents * quantity,
  };
}
