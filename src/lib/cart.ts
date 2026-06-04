import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Cart model + signed-cookie (de)serialisation.
 *
 * The cart lives in a single HMAC-signed cookie — no DB writes while browsing,
 * stateless, and free. Crucially it stores ONLY identifiers and quantities,
 * never prices: every price is recomputed server-side from the database at
 * checkout (see pricing.ts), so a tampered cookie can never change what a
 * customer is charged. The signature additionally rejects tampering outright.
 *
 * These functions are pure (the secret is passed in) so they unit-test without
 * Next's request context; the cookie read/write wrapper lives in cart-cookie.ts.
 */

export const COOKIE_NAME = "cart";
/** Per-line quantity cap — blunts abuse and absurd totals. */
export const MAX_QUANTITY = 20;
/** Max distinct lines in a cart. */
export const MAX_LINES = 50;

export type CartItem = {
  productId: string;
  variantId: string | null;
  quantity: number;
};

export type Cart = { items: CartItem[] };

export const EMPTY_CART: Cart = { items: [] };

/** Total number of units across all lines (for the header badge). */
export function cartCount(cart: Cart): number {
  return cart.items.reduce((n, i) => n + i.quantity, 0);
}

/** Same product+variant identifies the same line. */
function sameLine(a: CartItem, b: CartItem): boolean {
  return a.productId === b.productId && a.variantId === b.variantId;
}

/** Add (or increment) a line, clamped to MAX_QUANTITY / MAX_LINES. */
export function addItem(cart: Cart, item: CartItem): Cart {
  const qty = clampQty(item.quantity);
  if (qty <= 0) return cart;
  const existing = cart.items.find((i) => sameLine(i, item));
  if (existing) {
    return {
      items: cart.items.map((i) =>
        sameLine(i, item) ? { ...i, quantity: clampQty(i.quantity + qty) } : i,
      ),
    };
  }
  if (cart.items.length >= MAX_LINES) return cart;
  return {
    items: [
      ...cart.items,
      { productId: item.productId, variantId: item.variantId, quantity: qty },
    ],
  };
}

/** Set a line's quantity; 0 or less removes it. */
export function setQuantity(
  cart: Cart,
  key: { productId: string; variantId: string | null },
  quantity: number,
): Cart {
  const qty = clampQty(quantity);
  if (qty <= 0) return removeItem(cart, key);
  return {
    items: cart.items.map((i) =>
      sameLine(i, { ...key, quantity: qty }) ? { ...i, quantity: qty } : i,
    ),
  };
}

export function removeItem(
  cart: Cart,
  key: { productId: string; variantId: string | null },
): Cart {
  return {
    items: cart.items.filter((i) => !sameLine(i, { ...key, quantity: 0 })),
  };
}

function clampQty(q: number): number {
  if (!Number.isFinite(q)) return 0;
  return Math.max(0, Math.min(MAX_QUANTITY, Math.floor(q)));
}

// ── Signed-cookie (de)serialisation ─────────────────────────────────────────

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Encode a cart as `<base64url(json)>.<hmac>`. */
export function serializeCart(cart: Cart, secret: string): string {
  const json = JSON.stringify(cart);
  const payload = Buffer.from(json, "utf8").toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/**
 * Decode + verify a cart cookie. Any tampering, malformed structure, or bad
 * signature yields an empty cart rather than throwing — a corrupt cookie should
 * degrade gracefully, never 500 the storefront.
 */
export function parseCart(value: string | undefined, secret: string): Cart {
  if (!value) return EMPTY_CART;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return EMPTY_CART;
  const payload = value.slice(0, dot);
  const mac = value.slice(dot + 1);

  const expected = sign(payload, secret);
  const macBuf = Buffer.from(mac);
  const expBuf = Buffer.from(expected);
  if (macBuf.length !== expBuf.length || !timingSafeEqual(macBuf, expBuf)) {
    return EMPTY_CART;
  }

  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const parsed: unknown = JSON.parse(json);
    return normalizeCart(parsed);
  } catch {
    return EMPTY_CART;
  }
}

/** Coerce arbitrary parsed JSON into a valid Cart, dropping bad entries. */
function normalizeCart(value: unknown): Cart {
  if (!value || typeof value !== "object" || !("items" in value)) {
    return EMPTY_CART;
  }
  const items = (value as { items: unknown }).items;
  if (!Array.isArray(items)) return EMPTY_CART;
  const clean: CartItem[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.productId !== "string") continue;
    const variantId = typeof r.variantId === "string" ? r.variantId : null;
    const quantity = clampQty(Number(r.quantity));
    if (quantity <= 0) continue;
    if (clean.length >= MAX_LINES) break;
    clean.push({ productId: r.productId, variantId, quantity });
  }
  return { items: clean };
}
