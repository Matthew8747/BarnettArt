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
    <div className="mx-auto max-w-[640px] px-6 py-28 text-center">
      <ClearCartOnMount />
      <p className="eyebrow">Thank you</p>
      <h1 className="display text-text mt-4 text-5xl sm:text-6xl">
        Your order is confirmed
      </h1>
      <p className="text-muted mt-6 leading-relaxed">
        A confirmation email is on its way. We&apos;ll be in touch when your
        piece is ready to ship.
      </p>
      <Link href="/shop" className="btn btn-primary mt-10">
        Continue browsing
      </Link>
    </div>
  );
}
