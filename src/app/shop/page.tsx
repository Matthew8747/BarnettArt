import type { Metadata } from "next";
import { listAvailableProducts } from "@/db/products";
import { getSiteSettings } from "@/db/settings";
import { resolveAccent } from "@/lib/accent";
import { getStorage } from "@/lib/storage";
import { ArtworkCard } from "@/components/ArtworkCard";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse available original artwork and fine-art prints.",
};

// Rendered per request: inventory changes (an original selling out) must show
// immediately, and it keeps the build free of a live-DB dependency. Revisit
// data-cache tuning for Core Web Vitals in Phase 3.
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [items, settings] = await Promise.all([
    listAvailableProducts(),
    getSiteSettings(),
  ]);
  const storage = getStorage();

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-16">
      <Reveal>
        <p className="eyebrow">The Collection</p>
        <h1 className="display text-text mt-3 text-4xl sm:text-6xl">
          Original art &amp; prints
        </h1>
        <p className="text-muted mt-4 max-w-xl text-lg">
          Each piece sets the mood — the colour you see follows the work in
          focus.
        </p>
      </Reveal>

      {items.length === 0 ? (
        <p className="text-muted mt-16">
          The collection is being hung. Please check back soon.
        </p>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => {
            const primary = p.images[0];
            return (
              <ArtworkCard
                key={p.id}
                index={i}
                slug={p.slug}
                title={p.title}
                type={p.type}
                priceCents={p.basePriceCents}
                currency={p.currency}
                accentHex={resolveAccent(p.accentHex, settings)}
                imageUrl={primary ? storage.publicUrl(primary.s3Key) : null}
                alt={primary?.altText || p.title}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
