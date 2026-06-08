import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for buying from Anna Barnett.",
};

// UK-consumer-law-aligned draft. Bracketed items are Anna's real details to fill
// in before launch — see docs/LEGAL-CHECKLIST.md. Covers the 14-day right to
// cancel (Consumer Contracts Regulations 2013) with the commissioned-work
// exemption, and the Consumer Rights Act 2015 for faulty goods.
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <Link href="/" className="eyebrow link-accent inline-block">
        ← Back home
      </Link>
      <h1 className="display text-text mt-6 text-5xl">Terms of Service</h1>
      <p className="text-muted mt-3 text-sm">Last updated: 7 June 2026</p>

      <div className="text-text/80 mt-10 space-y-8 leading-relaxed">
        <section>
          <h2 className="display text-text text-2xl">Overview</h2>
          <p>
            These terms govern your purchase of artwork and prints from this
            site, operated by Anna Barnett
            {" ("}trading as <span className="text-muted">[trading name]</span>
            {"), "}
            United Kingdom. By placing an order you agree to them. They are
            governed by the law of England and Wales.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">Products</h2>
          <p>
            Original works are one-of-a-kind; once sold they are no longer
            available. Prints are produced to the sizes and finishes described
            on each listing. Because every piece is handmade or hand-finished,
            colours and texture may vary slightly between screens and the
            physical work — this is part of the character of original art, not a
            fault.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">Orders & payment</h2>
          <p>
            Prices are shown in GBP and are{" "}
            <span className="text-muted">
              [VAT status — e.g. &ldquo;not subject to VAT as we are not
              VAT-registered&rdquo;]
            </span>
            . Payment is processed securely by Stripe; we never see or store
            your card details. A contract is formed only once payment succeeds
            and you receive a confirmation email. We may decline or cancel an
            order (with a full refund) if an item is unavailable or a pricing
            error is obvious.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">Delivery</h2>
          <p>
            We ship to{" "}
            <span className="text-muted">
              [delivery regions — e.g. mainland UK]
            </span>
            . Standard UK delivery is a flat <strong>£6.95</strong> per order,
            and is <strong>free</strong> on orders of{" "}
            <strong>£150 or more</strong>. Estimated dispatch and delivery times
            are shown at checkout. Risk in the goods passes to you on delivery.
            Original works are packed and sent by an insured, tracked service.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">
            Cancellations & returns
          </h2>
          <p>
            Under the Consumer Contracts Regulations 2013 you may cancel a
            standard (non-personalised) order for any reason within{" "}
            <strong>14 days</strong> of receiving it. Tell us by email at{" "}
            <a className="link-accent" href="mailto:[contact email]">
              [contact email]
            </a>
            , then return the item unused and in its original condition within
            14 days. We&rsquo;ll refund the price (and standard outbound
            delivery) within 14 days of getting the item back. You cover the
            cost of return postage, and we recommend an insured, tracked service
            for artwork.
          </p>
          <p className="mt-4">
            <strong>Commissions and made-to-order work are exempt:</strong>{" "}
            works created or personalised to your specification cannot be
            cancelled or returned under these regulations once started, unless
            faulty.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">
            Faulty or damaged items
          </h2>
          <p>
            Your statutory rights under the Consumer Rights Act 2015 are
            unaffected. If an item arrives faulty, damaged or not as described,
            contact us within a reasonable time and we will arrange a repair,
            replacement or refund. Please keep the packaging and send us photos
            so we can help quickly.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">Intellectual property</h2>
          <p>
            All artwork, images, and content remain the intellectual property of
            Anna Barnett. Buying a physical work does not transfer copyright or
            any reproduction rights; you may not reproduce, resell as prints, or
            commercially exploit the image without written permission.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">Contact</h2>
          <p>
            Questions about an order, a return, or a commission? Email{" "}
            <a className="link-accent" href="mailto:[contact email]">
              [contact email]
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
