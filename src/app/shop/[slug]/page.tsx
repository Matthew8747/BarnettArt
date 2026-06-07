import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/db/products";
import { getSiteSettings } from "@/db/settings";
import { isInquiryMode } from "@/lib/env";
import { resolveAccent } from "@/lib/accent";
import { getStorage } from "@/lib/storage";
import { formatMoney } from "@/lib/money";
import { AccentScope } from "@/components/AccentScope";
import { Reveal } from "@/components/Reveal";
import { addToCartAction } from "@/app/cart/actions";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.title,
    description: product.description || `${product.title} by Anna Barnett.`,
  };
}

// Per-request render so availability is always current (see /shop/page.tsx).
export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getSiteSettings(),
  ]);
  if (!product) notFound();

  const storage = getStorage();
  const accent = resolveAccent(product.accentHex, settings);
  const hero = product.images[0];
  const rest = product.images.slice(1);
  const isSold = product.status === "sold";

  return (
    <AccentScope accentHex={accent} as="section">
      <div className="mx-auto max-w-[1180px] px-6 py-14">
        <Link href="/shop" className="eyebrow link-accent inline-block">
          ← Back to the collection
        </Link>

        <div className="mt-10 grid grid-cols-1 gap-14 lg:grid-cols-2">
          {/* Hero artwork — settles up into its paper mount on open */}
          <div className="hero-rise">
            <div className="border-border bg-panel relative border p-3 shadow-[0_40px_90px_-50px_rgba(28,26,22,0.55)]">
              <div className="border-border/60 relative aspect-[3/4] overflow-hidden border bg-[var(--accent-soft)]">
                {hero ? (
                  <Image
                    src={storage.publicUrl(hero.s3Key)}
                    alt={hero.altText || product.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,var(--accent-soft),transparent_70%)]" />
                )}
              </div>
            </div>
            {rest.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {rest.map((img) => (
                  <div
                    key={img.id}
                    className="border-border bg-panel relative aspect-square overflow-hidden border p-1"
                  >
                    <Image
                      src={storage.publicUrl(img.s3Key)}
                      alt={img.altText || product.title}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details — slide up, staggered */}
          <div className="flex flex-col justify-center">
            <Reveal delay={80}>
              <p className="eyebrow">
                {product.type === "print" ? "Fine-art print" : "Original work"}
              </p>
              <h1 className="display text-text mt-3 text-5xl sm:text-6xl">
                {product.title}
              </h1>
            </Reveal>

            <Reveal delay={180}>
              <p className="mt-5 text-2xl text-[var(--accent-text)]">
                {product.type === "print" ? "From " : ""}
                {formatMoney(product.basePriceCents, product.currency)}
              </p>
            </Reveal>

            {product.description && (
              <Reveal delay={260}>
                <p className="text-muted mt-6 max-w-prose leading-relaxed">
                  {product.description}
                </p>
              </Reveal>
            )}

            {product.variants.length > 0 && (
              <Reveal delay={320}>
                <div className="mt-8">
                  <p className="eyebrow mb-3">Sizes &amp; framing</p>
                  <ul className="flex flex-col gap-2">
                    {product.variants.map((v) => (
                      <li
                        key={v.id}
                        className="border-border bg-panel flex items-center justify-between rounded-[2px] border px-4 py-3 text-sm"
                      >
                        <span className="text-text">{v.name}</span>
                        <span className="text-[var(--accent-text)]">
                          {formatMoney(v.priceCents, product.currency)}
                          {v.stockQty === 0 && (
                            <span className="text-muted ml-2">· sold out</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )}

            <Reveal delay={400}>
              <div className="mt-9">
                {isSold ? (
                  <button type="button" disabled className="btn btn-ghost">
                    Sold
                  </button>
                ) : isInquiryMode ? (
                  /* Enquiry model: direct payment is off — buying happens by
                     conversation with Anna (see COMMERCE_MODE). */
                  <div className="flex flex-col gap-4">
                    <Link
                      href={`/contact?artwork=${encodeURIComponent(product.title)}`}
                      className="btn btn-primary self-start"
                    >
                      Enquire to buy
                    </Link>
                    <p className="text-muted max-w-sm text-sm leading-relaxed">
                      Each piece is sold personally. Send Anna a note and
                      she&rsquo;ll arrange price, framing and delivery with you
                      directly.
                    </p>
                  </div>
                ) : (
                  <form
                    action={addToCartAction}
                    className="flex flex-col gap-4"
                  >
                    <input type="hidden" name="productId" value={product.id} />
                    {product.type === "print" &&
                      product.variants.length > 0 && (
                        <label className="flex flex-col gap-1 text-sm">
                          <span className="text-muted">Choose an option</span>
                          <select
                            name="variantId"
                            className="border-border bg-panel text-text rounded-[2px] border px-3 py-2"
                            defaultValue={
                              product.variants.find((v) => v.stockQty > 0)
                                ?.id ?? product.variants[0].id
                            }
                          >
                            {product.variants.map((v) => (
                              <option
                                key={v.id}
                                value={v.id}
                                disabled={v.stockQty === 0}
                              >
                                {v.name} —{" "}
                                {formatMoney(v.priceCents, product.currency)}
                                {v.stockQty === 0 ? " (sold out)" : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    <input type="hidden" name="quantity" value={1} />
                    <button
                      type="submit"
                      className="btn btn-primary self-start"
                    >
                      Add to cart
                    </button>
                    <Link
                      href={`/contact?artwork=${encodeURIComponent(product.title)}`}
                      className="link-accent self-start text-[0.72rem] tracking-[0.16em] uppercase"
                    >
                      Or enquire about this piece →
                    </Link>
                  </form>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </AccentScope>
  );
}
