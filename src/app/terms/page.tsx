import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for buying from Anna Barnett.",
};

// DRAFT — review with Anna and a solicitor before launch. Replace bracketed
// placeholders with real business details. See docs/IMPLEMENTATION.md.
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: [DATE]</p>

      <div className="prose mt-8 space-y-6 text-neutral-700 dark:text-neutral-300">
        <section>
          <h2 className="text-xl font-medium">Overview</h2>
          <p>
            These terms govern your purchase of artwork and prints from this
            site, operated by Anna Barnett. By placing an order you agree to
            them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Products</h2>
          <p>
            Original works are one-of-a-kind; once sold they are no longer
            available. Prints are produced to the sizes and finishes described
            on each listing. Colours may vary slightly between screens and the
            physical piece.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Orders & payment</h2>
          <p>
            Prices are shown in GBP and include [VAT status]. Payment is
            processed securely by Stripe; we never see or store your card
            details. An order is confirmed only once payment succeeds and you
            receive a confirmation email.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Delivery</h2>
          <p>
            We ship to [DELIVERY REGIONS]. Estimated dispatch and delivery
            times, and shipping costs, are shown at checkout. Risk passes to you
            on delivery.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Returns & cancellations</h2>
          <p>
            Under UK consumer law you may have the right to cancel within 14
            days of receipt for certain items. [State your returns policy,
            including any exclusions for commissioned or personalised work.]
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Intellectual property</h2>
          <p>
            All artwork, images, and content remain the intellectual property of
            Anna Barnett. Purchase of a physical work does not transfer
            copyright or reproduction rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Contact</h2>
          <p>
            Questions about an order? Email{" "}
            <a className="underline" href="mailto:[CONTACT EMAIL]">
              [CONTACT EMAIL]
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
