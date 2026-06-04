import type { Metadata } from "next";
import Link from "next/link";
import { readCart } from "@/lib/cart-cookie";
import { priceCartFromDb } from "@/db/orders";
import { isDemoMode } from "@/lib/env";
import { formatMoney } from "@/lib/money";
import { CheckoutButton } from "@/components/CheckoutButton";
import { updateQtyAction, removeFromCartAction } from "@/app/cart/actions";

export const metadata: Metadata = { title: "Cart" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cart = await readCart();
  const priced = await priceCartFromDb(cart.items);

  return (
    <div className="mx-auto max-w-[900px] px-6 py-16">
      <h1 className="display text-text text-4xl sm:text-5xl">Your cart</h1>

      {priced.lines.length === 0 ? (
        <div className="text-muted mt-8">
          <p>Your cart is empty.</p>
          <Link
            href="/shop"
            className="mt-4 inline-block text-[var(--accent-text)] hover:underline"
          >
            Browse the collection →
          </Link>
        </div>
      ) : (
        <>
          {priced.issues.length > 0 && (
            <p className="border-border bg-panel mt-6 rounded-lg border px-4 py-3 text-sm text-amber-300">
              Some items changed availability and were adjusted.
            </p>
          )}

          <ul className="divide-border border-border mt-8 flex flex-col divide-y border-y">
            {priced.lines.map((l) => (
              <li
                key={`${l.productId}:${l.variantId ?? ""}`}
                className="flex flex-wrap items-center justify-between gap-4 py-5"
              >
                <div className="min-w-[12rem] flex-1">
                  <p className="text-text">{l.titleSnapshot}</p>
                  <p className="text-muted text-sm">
                    {formatMoney(l.unitPriceCents, priced.currency)} each
                  </p>
                </div>

                <form
                  action={updateQtyAction}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="productId" value={l.productId} />
                  <input
                    type="hidden"
                    name="variantId"
                    value={l.variantId ?? ""}
                  />
                  <label className="sr-only" htmlFor={`qty-${l.productId}`}>
                    Quantity
                  </label>
                  <input
                    id={`qty-${l.productId}`}
                    name="quantity"
                    type="number"
                    min={1}
                    max={20}
                    defaultValue={l.quantity}
                    className="border-border bg-bg text-text w-16 rounded-md border px-2 py-1"
                  />
                  <button
                    type="submit"
                    className="border-border text-muted hover:text-text rounded-md border px-3 py-1 text-sm"
                  >
                    Update
                  </button>
                </form>

                <p className="w-24 text-right text-[var(--accent-text)]">
                  {formatMoney(l.lineTotalCents, priced.currency)}
                </p>

                <form action={removeFromCartAction}>
                  <input type="hidden" name="productId" value={l.productId} />
                  <input
                    type="hidden"
                    name="variantId"
                    value={l.variantId ?? ""}
                  />
                  <button
                    type="submit"
                    className="text-muted hover:text-text text-sm"
                    aria-label={`Remove ${l.titleSnapshot}`}
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-end gap-1 text-sm">
            <p className="text-muted">
              Subtotal:{" "}
              <span className="text-text">
                {formatMoney(priced.subtotalCents, priced.currency)}
              </span>
            </p>
            <p className="text-muted">
              Shipping:{" "}
              <span className="text-text">
                {priced.shippingCents === 0
                  ? "Free"
                  : formatMoney(priced.shippingCents, priced.currency)}
              </span>
            </p>
            <p className="text-text mt-1 text-lg">
              Total: {formatMoney(priced.totalCents, priced.currency)}
            </p>
          </div>

          <div className="mt-8 flex justify-end">
            <CheckoutButton demo={isDemoMode} />
          </div>
          <p className="text-muted mt-3 text-right text-xs">
            Secure payment by Stripe. Card details never touch our servers.
          </p>
        </>
      )}
    </div>
  );
}
