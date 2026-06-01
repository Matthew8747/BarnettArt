import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

/**
 * Server-side Stripe client. Card data never touches our servers — we only
 * create PaymentIntents server-side (with server-computed prices) and verify
 * webhook signatures here. The publishable key is the only Stripe value the
 * browser ever sees.
 *
 * Lazily constructed: `next build` evaluates this module to collect page data,
 * but secrets aren't present then. Deferring construction until first runtime
 * use avoids instantiating Stripe with an empty key at build time.
 */
let client: Stripe | null = null;

function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(env.STRIPE_SECRET_KEY, {
      // Pin the API version so Stripe-side upgrades never silently change
      // behaviour. Matches the version bundled with the installed Stripe SDK.
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
      appInfo: { name: "Barnett Art Platform" },
    });
  }
  return client;
}

/** Proxy that constructs the real client on first property access (runtime). */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});
