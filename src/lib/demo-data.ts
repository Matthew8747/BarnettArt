import type { ProductWithMedia } from "@/db/products";
import type { PriceableProduct, PriceableVariant } from "@/lib/pricing";
import { getGalleryItems, type GalleryItem } from "@/lib/gallery";

/**
 * Demo/prototype catalog (DEMO_MODE, or any deploy without a DATABASE_URL).
 *
 * Built from Anna's real paintings (the manifest produced by
 * `scripts/import-paintings.mjs`) so the shop shows her own work with zero
 * external services. Titles and prices here are PLACEHOLDERS — Anna renames and
 * prices each piece later (via the manifest now, the admin in Phase 3). See
 * docs/HANDOVER.md. Once the database catalog is live this is replaced wholesale.
 *
 * The gallery shows every painting; the shop lists a curated front page of them.
 */

// How many paintings surface as shop listings (the rest live in the gallery).
const SHOP_COUNT = 9;

// Draft price applied to every placeholder original, in pence. Deliberately
// uniform and obvious so nothing reads as a real, confirmed price. Anna sets the
// true value per piece. In COMMERCE_MODE=inquiry these are not charged at all.
const DRAFT_PRICE_CENTS = 45000;

const NOW = new Date("2026-06-01T00:00:00Z");

function toProductWithMedia(item: GalleryItem, i: number): ProductWithMedia {
  const id = `demo-${item.slug}`;
  const number = String(i + 1).padStart(2, "0");
  return {
    id,
    slug: item.slug,
    title: `Untitled No. ${number}`,
    description:
      "Original painting — mixed media on canvas. Provisional listing: title, " +
      "dimensions and price to be confirmed by the artist.",
    type: "original",
    basePriceCents: DRAFT_PRICE_CENTS,
    currency: "GBP",
    status: "available",
    accentHex: item.accentHex,
    paletteJson: null,
    createdAt: new Date(NOW.getTime() - i * 1000),
    updatedAt: NOW,
    images: [
      {
        id: `${id}-img`,
        productId: id,
        s3Key: item.large,
        altText: `Untitled painting No. ${number} by Anna Barnett`,
        width: item.width ?? 1126,
        height: item.height ?? 2000,
        position: 0,
      },
    ],
    variants: [],
  };
}

let cache: ProductWithMedia[] | null = null;
function all(): ProductWithMedia[] {
  if (!cache) {
    cache = getGalleryItems().slice(0, SHOP_COUNT).map(toProductWithMedia);
  }
  return cache;
}

export function getDemoProducts(): ProductWithMedia[] {
  return all();
}

export function getDemoProductBySlug(slug: string): ProductWithMedia | null {
  return all().find((p) => p.slug === slug) ?? null;
}

/** Pricing maps for the demo catalog (mirrors priceCartFromDb's DB lookups). */
export function demoPricingMaps(): {
  products: Map<string, PriceableProduct>;
  variants: Map<string, PriceableVariant>;
} {
  const products = new Map<string, PriceableProduct>();
  const variants = new Map<string, PriceableVariant>();
  for (const p of all()) {
    products.set(p.id, {
      id: p.id,
      title: p.title,
      type: p.type,
      basePriceCents: p.basePriceCents,
      currency: p.currency,
      status: p.status,
    });
    for (const v of p.variants) {
      variants.set(v.id, {
        id: v.id,
        productId: v.productId,
        name: v.name,
        priceCents: v.priceCents,
        stockQty: v.stockQty,
      });
    }
  }
  return { products, variants };
}
