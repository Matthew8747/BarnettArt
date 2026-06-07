import Link from "next/link";
import Image from "next/image";
import { StoreShell } from "@/components/StoreShell";
import { Reveal } from "@/components/Reveal";
import { AccentScope } from "@/components/AccentScope";
import { readCart } from "@/lib/cart-cookie";
import { cartCount } from "@/lib/cart";
import { getFeatured } from "@/lib/gallery";
import { getFeaturedReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

/**
 * Portfolio home — the brand surface (DESIGN.md aesthetic). An editorial "gallery
 * wall": oversized serif, a featured painting that rises in on load, a selected-
 * work strip pulled from the manifest, a short essay on the painter/engineer
 * practice, and a quiet route into a personal enquiry. All motion is reduced-
 * motion aware via the shared utilities.
 */
export default async function Home() {
  const cart = await readCart();
  const featured = getFeatured(4);
  const hero = featured[0];
  const strip = featured.slice(1, 4);
  const reviews = getFeaturedReviews(3);

  return (
    <StoreShell cartCount={cartCount(cart)}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pt-20 pb-24 sm:pt-28">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p
              className="eyebrow hero-rise text-[var(--accent-text)]"
              style={{ animationDelay: "0ms" }}
            >
              Painter &amp; Engineer
            </p>
            <h1
              className="display text-text hero-rise mt-6 text-[3.5rem] leading-[0.9] sm:text-[6.5rem]"
              style={{ animationDelay: "90ms" }}
            >
              Anna
              <br />
              Barnett
            </h1>
            <span
              className="hero-rise mt-8 block h-px w-16 bg-[var(--text)] opacity-30"
              style={{ animationDelay: "170ms" }}
              aria-hidden
            />
            <p
              className="text-muted hero-rise mt-8 max-w-md text-lg leading-relaxed text-balance"
              style={{ animationDelay: "240ms" }}
            >
              Original paintings built in layers — colour worked over colour
              with the same care for structure that I bring to engineering. Two
              disciplines, one way of seeing.
            </p>
            <div
              className="hero-rise mt-10 flex flex-wrap gap-4"
              style={{ animationDelay: "330ms" }}
            >
              <Link href="/gallery" className="btn btn-primary">
                View the gallery
              </Link>
              <Link href="/contact" className="btn btn-ghost">
                Get in touch
              </Link>
            </div>
          </div>

          {hero && (
            <AccentScope
              accentHex={hero.accentHex}
              className="hero-rise"
              style={{ animationDelay: "200ms" }}
            >
              <Link
                href="/gallery"
                className="group bg-panel block overflow-hidden p-2 shadow-[0_40px_90px_-50px_rgba(28,26,22,0.55)] ring-1 ring-[color-mix(in_srgb,var(--text)_12%,transparent)]"
              >
                <span className="block overflow-hidden">
                  <Image
                    src={hero.large}
                    alt={hero.title}
                    width={hero.width ?? 1126}
                    height={hero.height ?? 2000}
                    priority
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="h-auto w-full transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                  />
                </span>
              </Link>
            </AccentScope>
          )}
        </div>
      </section>

      {/* ── Selected work ────────────────────────────────────────────────── */}
      {strip.length > 0 && (
        <section className="mx-auto max-w-[1180px] px-6 py-16">
          <Reveal>
            <div className="border-border flex items-baseline justify-between border-b pb-5">
              <h2 className="display text-text text-3xl sm:text-4xl">
                Selected work
              </h2>
              <Link
                href="/gallery"
                className="link-accent text-[0.72rem] tracking-[0.18em] uppercase"
              >
                See all →
              </Link>
            </div>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {strip.map((item, i) => (
              <Reveal key={item.slug} delay={i * 90}>
                <AccentScope accentHex={item.accentHex}>
                  <Link href="/gallery" className="group block">
                    <div className="hover-lift bg-panel overflow-hidden p-1.5 shadow-[0_2px_10px_-6px_rgba(28,26,22,0.3)] ring-1 ring-[color-mix(in_srgb,var(--text)_12%,transparent)]">
                      <span className="block overflow-hidden">
                        <Image
                          src={item.thumb}
                          alt={item.title}
                          width={item.width ?? 900}
                          height={item.height ?? 1125}
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="h-auto w-full transition-transform duration-[1100ms] ease-out group-hover:scale-[1.04]"
                        />
                      </span>
                    </div>
                    <p className="eyebrow mt-4 text-[var(--accent-text)]">
                      Original painting
                    </p>
                  </Link>
                </AccentScope>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── The practice (painter / engineer essay) ──────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.4fr_0.6fr]">
          <Reveal>
            <h2 className="display text-text text-4xl sm:text-5xl">
              Two disciplines,
              <br />
              one way of seeing
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="text-muted max-w-prose space-y-5 leading-relaxed">
              <p>
                I move between the studio and the screen. Painting is where I
                work intuitively — building a surface in layers, letting colour
                argue with colour until it settles. Engineering is where I work
                in structure — systems that have to hold, be understood, and be
                handed on.
              </p>
              <p>
                They are closer than they look. Both reward patience and
                revision. Both are about composition: deciding what to keep,
                what to take away, and where the eye should rest. The paintings
                here are the intuitive half of that practice — physical,
                worked-over, one of a kind.
              </p>
              <p className="text-text">
                Every piece is sold the way it&rsquo;s made: personally. If
                something speaks to you,{" "}
                <Link href="/contact" className="link-accent">
                  write to me directly
                </Link>
                .
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── What collectors say ──────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-[1180px] px-6 py-16">
          <Reveal>
            <div className="border-border flex items-baseline justify-between border-b pb-5">
              <h2 className="display text-text text-3xl sm:text-4xl">
                What collectors say
              </h2>
            </div>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {reviews.map((r, i) => (
              <Reveal key={r.id} delay={i * 90}>
                <figure className="border-border bg-panel flex h-full flex-col gap-4 border p-7">
                  <span
                    aria-label={`${r.rating} out of 5`}
                    className="text-[var(--accent-text)]"
                  >
                    {"★★★★★".slice(0, r.rating)}
                    <span className="opacity-30">
                      {"★★★★★".slice(r.rating)}
                    </span>
                  </span>
                  <blockquote className="text-text/80 leading-relaxed">
                    {r.body}
                  </blockquote>
                  <figcaption className="text-muted mt-auto text-sm">
                    — {r.author}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── Enquire CTA ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-24">
        <Reveal>
          <div className="border-border bg-panel flex flex-col items-start gap-6 rounded-[3px] border px-8 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-12">
            <div>
              <p className="eyebrow">Enquiries &amp; commissions</p>
              <p className="display text-text mt-3 text-3xl sm:text-4xl">
                Start a conversation
              </p>
            </div>
            <Link href="/contact" className="btn btn-primary shrink-0">
              Contact Anna
            </Link>
          </div>
        </Reveal>
      </section>
    </StoreShell>
  );
}
