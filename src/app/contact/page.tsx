import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/Reveal";
import { isInquiryMode } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Anna Barnett directly — enquire about a painting, a commission, or a print.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-6 py-20">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-[0.85fr_1fr]">
        {/* Left: invitation + the human story of why you write directly. */}
        <Reveal>
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow">Contact</p>
            <h1 className="display text-text mt-4 text-5xl sm:text-6xl">
              Speak to Anna directly
            </h1>
            <p className="text-muted mt-6 max-w-md leading-relaxed">
              {isInquiryMode ? (
                <>
                  Every piece is sold by conversation, not by a checkout button.
                  Tell Anna what you&rsquo;re drawn to and she&rsquo;ll arrange
                  the rest personally — price, framing, delivery, or a
                  commission made for your space.
                </>
              ) : (
                <>
                  Whether it&rsquo;s a painting you keep returning to, a
                  commission for a particular wall, or a question about prints
                  and delivery — write to Anna directly. She reads and answers
                  every message herself.
                </>
              )}
            </p>

            <div className="border-border mt-10 border-t pt-8">
              <p className="eyebrow">What to expect</p>
              <ul className="text-muted mt-4 flex flex-col gap-3 text-sm leading-relaxed">
                <li>— A personal reply by email, usually within a few days.</li>
                <li>— No automated sales funnels, no mailing list sign-up.</li>
                <li>— Commissions and bespoke sizes are welcome to discuss.</li>
              </ul>
            </div>
          </div>
        </Reveal>

        {/* Right: the form. Suspense satisfies useSearchParams on the client. */}
        <Reveal delay={120}>
          <Suspense fallback={<div className="text-muted">Loading…</div>}>
            <ContactForm />
          </Suspense>
        </Reveal>
      </div>
    </div>
  );
}
