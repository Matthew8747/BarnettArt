import type { Metadata } from "next";
import Link from "next/link";
import { ClearCartOnMount } from "@/components/ClearCartOnMount";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * Post-checkout landing. Stripe redirects here on success; the order is already
 * being fulfilled by the webhook (the source of truth), so this page is purely
 * confirmation. The cart is cleared client-side on mount.
 */
export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-[640px] px-6 py-24 text-center">
      <ClearCartOnMount />
      <p className="eyebrow">Thank you</p>
      <h1 className="display text-text mt-3 text-4xl sm:text-5xl">
        Your order is confirmed
      </h1>
      <p className="text-muted mt-5">
        A confirmation email is on its way. We&apos;ll be in touch when your
        piece is ready to ship.
      </p>
      <Link
        href="/shop"
        className="mt-10 inline-block rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-medium text-[#15151d] transition-transform hover:scale-[1.02]"
      >
        Continue browsing
      </Link>
    </div>
  );
}
