import "server-only";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import {
  COOKIE_NAME,
  EMPTY_CART,
  parseCart,
  serializeCart,
  type Cart,
} from "./cart";

/**
 * Request-scoped cart cookie access. Thin wrapper over the pure cart helpers so
 * route handlers / server actions read and persist the signed cookie without
 * re-deriving the secret or cookie options each time.
 *
 * Cookie is HttpOnly (no client JS can read/forge it) and signed; the UI gets
 * the cart via server components, not by reading the cookie in the browser.
 */

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export async function readCart(): Promise<Cart> {
  const store = await cookies();
  return parseCart(store.get(COOKIE_NAME)?.value, env.CART_SECRET);
}

export async function writeCart(cart: Cart): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, serializeCart(cart, env.CART_SECRET), COOKIE_OPTS);
}

export async function clearCart(): Promise<void> {
  const store = await cookies();
  store.set(
    COOKIE_NAME,
    serializeCart(EMPTY_CART, env.CART_SECRET),
    COOKIE_OPTS,
  );
}
