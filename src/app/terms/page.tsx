import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for buying from Anna Barnett.",
};

// DRAFT — review with Anna and a solicitor before launch. Replace bracketed
// placeholders with real business details. See docs/IMPLEMENTATION.md.
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <Link href="/" className="eyebrow link-accent inline-block">
        ← Back home
      </Link>
      <h1 className="display text-text mt-6 text-5xl">Terms of Service</h1>
      <p className="text-muted mt-3 text-sm">Last updated: [DATE]</p>

      <div className="text-text/80 mt-10 space-y-8 leading-relaxed">
        <section>
          <h2 className="display text-text text-2xl">Overview</h2>
          <p>
            These terms govern your purchase of artwork and prints from this
            site, operated by Anna Barnett. By placing an order you agree to
            them.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">Products</h2>
          <p>
            Original works are one-of-a-kind; once sold they are no longer
            available. Prints are produced to the sizes and finishes described
            on each listing. Colours may vary slightly between screens and the
            physical piece.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">Orders & payment</h2>
          <p>
            Prices are shown in GBP and include [VAT status]. Payment is
            processed securely by Stripe; we never see or store your card
            details. An order is confirmed only once payment succeeds and you
            receive a confirmation email.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">Delivery</h2>
          <p>
            We ship to [DELIVERY REGIONS]. Estimated dispatch and delivery
            times, and shipping costs, are shown at checkout. Risk passes to you
            on delivery.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">
            Returns & cancellations
          </h2>
          <p>
            Under UK consumer law you may have the right to cancel within 14
            days of receipt for certain items. [State your returns policy,
            including any exclusions for commissioned or personalised work.]
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">Intellectual property</h2>
          <p>
            All artwork, images, and content remain the intellectual property of
            Anna Barnett. Purchase of a physical work does not transfer
            copyright or reproduction rights.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">Contact</h2>
          <p>
            Questions about an order? Email{" "}
            <a className="link-accent" href="mailto:[CONTACT EMAIL]">
              [CONTACT EMAIL]
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
