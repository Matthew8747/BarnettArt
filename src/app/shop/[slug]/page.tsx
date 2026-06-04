import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/db/products";
import { getSiteSettings } from "@/db/settings";
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
      <div className="mx-auto max-w-[1180px] px-6 py-12">
        <Link
          href="/shop"
          className="eyebrow hover:text-text inline-block transition-colors"
        >
          ← Back to the collection
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Hero artwork — scales up with its glow on open */}
          <div className="hero-rise">
            <div className="border-border relative aspect-[3/4] overflow-hidden rounded-2xl border bg-[var(--accent-soft)] shadow-[0_30px_80px_-20px_var(--accent-soft)]">
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
            {rest.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {rest.map((img) => (
                  <div
                    key={img.id}
                    className="border-border relative aspect-square overflow-hidden rounded-lg border"
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
              <h1 className="display text-text mt-3 text-4xl sm:text-5xl">
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
                        className="border-border bg-panel flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
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
                  <button
                    type="button"
                    disabled
                    className="border-border text-text cursor-not-allowed rounded-full border bg-[var(--accent-soft)] px-7 py-3 text-sm font-medium opacity-80"
                  >
                    Sold
                  </button>
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
                            className="border-border bg-bg text-text rounded-md border px-3 py-2"
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
                      className="self-start rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-medium text-[#15151d] transition-transform hover:scale-[1.02]"
                    >
                      Add to cart
                    </button>
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
