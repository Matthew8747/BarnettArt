import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Anna Barnett collects and uses your personal data.",
};

// DRAFT — review with Anna and a solicitor before launch. Replace bracketed
// placeholders with real business details. See docs/IMPLEMENTATION.md.
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: [DATE]</p>

      <div className="prose mt-8 space-y-6 text-neutral-700 dark:text-neutral-300">
        <section>
          <h2 className="text-xl font-medium">Who we are</h2>
          <p>
            This site is operated by Anna Barnett (&ldquo;we&rdquo;,
            &ldquo;us&rdquo;). For any privacy questions, contact{" "}
            <a className="underline" href="mailto:[CONTACT EMAIL]">
              [CONTACT EMAIL]
            </a>
            . We are the data controller for the personal data described here.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">What we collect</h2>
          <p>
            We collect only what we need to fulfil your order: your name, email,
            delivery address, and order details. Payment card details are
            handled entirely by our payment processor (Stripe) and are never
            stored on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">How we use it</h2>
          <p>
            To process and deliver your order, send order confirmations, handle
            returns or queries, and meet our legal and tax obligations. The
            lawful bases are performance of a contract and our legitimate
            interests in running the shop.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Who we share it with</h2>
          <p>
            Only the service providers needed to run the shop: our payment
            processor (Stripe), email provider (Resend), hosting/infrastructure
            providers, and delivery carriers. We do not sell your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">How long we keep it</h2>
          <p>
            We keep order records for as long as required for accounting and
            legal purposes (typically [X] years), then delete or anonymise them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Your rights</h2>
          <p>
            Under UK GDPR you have the right to access, correct, delete, or
            restrict use of your personal data, and to object to processing. To
            exercise these, email{" "}
            <a className="underline" href="mailto:[CONTACT EMAIL]">
              [CONTACT EMAIL]
            </a>
            . You may also complain to the UK Information Commissioner&rsquo;s
            Office (ICO).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Cookies</h2>
          <p>
            We use only essential cookies needed for the site and checkout to
            function. If we add analytics or marketing cookies, we will ask for
            your consent first.
          </p>
        </section>
      </div>
    </main>
  );
}
