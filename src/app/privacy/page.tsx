import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Anna Barnett collects and uses your personal data.",
};

// UK-GDPR-aligned draft. Bracketed items are Anna's real details to fill in
// before launch — see docs/LEGAL-CHECKLIST.md. A privacy policy is legally
// required under UK GDPR. Only essential cookies are used, so no consent banner
// is required (see "Cookies").
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <Link href="/" className="eyebrow link-accent inline-block">
        ← Back home
      </Link>
      <h1 className="display text-text mt-6 text-5xl">Privacy Policy</h1>
      <p className="text-muted mt-3 text-sm">Last updated: 7 June 2026</p>

      <div className="text-text/80 mt-10 space-y-8 leading-relaxed">
        <section>
          <h2 className="display text-text text-2xl">Who we are</h2>
          <p>
            This site is operated by Anna Barnett
            {" ("}trading as <span className="text-muted">[trading name]</span>
            {") "}
            (&ldquo;we&rdquo;, &ldquo;us&rdquo;), based in the United Kingdom.
            We are the data controller for the personal data described here. For
            any privacy question, contact us at{" "}
            <a className="link-accent" href="mailto:[contact email]">
              [contact email]
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">What we collect</h2>
          <p>
            We collect only what we need to deal with you: your name, email
            address, delivery address and order details when you buy, and the
            contents of any message you send us through the contact form.
            Payment card details are handled entirely by our payment processor
            (Stripe) and are never seen or stored by us.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">How we use it & why</h2>
          <p>
            To take and deliver your order, send order confirmations, answer
            enquiries, handle returns, and meet our legal and tax obligations.
            Our lawful bases under UK GDPR are{" "}
            <em>performance of a contract</em> (to fulfil your order),{" "}
            <em>legitimate interests</em> (to run and secure the shop and
            respond to enquiries), and <em>legal obligation</em> (to keep tax
            and accounting records).
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">Who we share it with</h2>
          <p>
            Only the service providers needed to run the shop: our payment
            processor (Stripe), email provider (Resend), hosting and
            infrastructure provider (Vercel), and the delivery carrier for your
            order. Each acts under its own data-protection terms. We never sell
            your data.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">
            International transfers
          </h2>
          <p>
            Some of these providers may process data outside the UK. Where they
            do, the transfer is covered by appropriate safeguards (a UK adequacy
            decision or the International Data Transfer Agreement / Addendum),
            keeping your data protected to UK standards.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">How long we keep it</h2>
          <p>
            We keep order and transaction records for <strong>6 years</strong>{" "}
            to meet UK accounting and tax requirements, then delete or anonymise
            them. Contact-form enquiries that don&rsquo;t lead to an order are
            kept only as long as needed to deal with them.
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">Your rights</h2>
          <p>
            Under UK GDPR you have the right to access, correct, delete, or
            restrict use of your personal data, to object to processing, and to
            data portability. To exercise any of these, email{" "}
            <a className="link-accent" href="mailto:[contact email]">
              [contact email]
            </a>
            . You can also complain to the UK Information Commissioner&rsquo;s
            Office (ICO) at{" "}
            <a className="link-accent" href="https://ico.org.uk">
              ico.org.uk
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="display text-text text-2xl">Cookies</h2>
          <p>
            We use only the essential cookies needed for the site and checkout
            to work (for example, to keep your basket and to secure forms).
            These don&rsquo;t require consent, so we don&rsquo;t show a cookie
            banner. If we ever add analytics or marketing cookies, we will ask
            for your consent first and update this policy.
          </p>
        </section>
      </div>
    </main>
  );
}
