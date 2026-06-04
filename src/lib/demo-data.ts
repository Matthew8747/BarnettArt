import type { ProductWithMedia } from "@/db/products";
import type { PriceableProduct, PriceableVariant } from "@/lib/pricing";

/**
 * Demo/prototype catalog (DEMO_MODE=true). A curated, in-repo set of products so
 * a Vercel preview runs with no database — enough for Anna to click through the
 * look, feel and motion. Images are committed public-domain paintings under
 * `public/sample-art/` (placeholders until Anna's high-res photos arrive); the
 * accent for each was extracted from its image with the same node-vibrant
 * pipeline the real admin uses.
 *
 * Replaced wholesale by the database catalog once DEMO_MODE is off.
 */

type DemoSpec = {
  slug: string;
  title: string;
  type: "original" | "print";
  description: string;
  basePriceCents: number;
  accentHex: string;
  image: string; // file under /public/sample-art
  variants?: { name: string; priceCents: number; stockQty: number }[];
};

// Accents were extracted from each image with node-vibrant; a couple are nudged
// toward the painting's secondary colour for variety — exactly the "artist
// adjusts the accent" step in DESIGN.md §2. Images are public-domain paintings
// (placeholders until Anna's own photos arrive).
const SPECS: DemoSpec[] = [
  {
    slug: "lily-pond",
    title: "Lily Pond, Morning",
    type: "original",
    description:
      "Oil on canvas, 90×70cm. Still water and floating colour at first light.",
    basePriceCents: 145000,
    accentHex: "#5f9e76",
    image: "lily-pond.jpg",
  },
  {
    slug: "wheat-and-cypress",
    title: "Wheat & Cypress",
    type: "original",
    description: "Oil on canvas, 73×93cm. Wind moving through a summer field.",
    basePriceCents: 168000,
    accentHex: "#c79a2e",
    image: "falling-light.jpg",
  },
  {
    slug: "boulevard-winter",
    title: "Boulevard, Winter",
    type: "print",
    description: "Giclée print on archival cotton rag. Open edition, signed.",
    basePriceCents: 6500,
    accentHex: "#9a7b52",
    image: "window-woods.jpg",
    variants: [
      { name: "A3 / Unframed", priceCents: 6500, stockQty: 25 },
      { name: "A2 / Unframed", priceCents: 9500, stockQty: 12 },
      { name: "A2 / Oak frame", priceCents: 16500, stockQty: 5 },
    ],
  },
  {
    slug: "tideline",
    title: "Tideline",
    type: "print",
    description: "Giclée print on archival cotton rag. Open edition, signed.",
    basePriceCents: 6500,
    accentHex: "#4e9fb0",
    image: "tideline.jpg",
    variants: [
      { name: "A3 / Unframed", priceCents: 6500, stockQty: 25 },
      { name: "A2 / Oak frame", priceCents: 16500, stockQty: 0 },
    ],
  },
  {
    slug: "garden-chrysanthemums",
    title: "Garden Chrysanthemums",
    type: "original",
    description:
      "Oil on canvas, 60×73cm. A bank of late blooms in full colour.",
    basePriceCents: 98000,
    accentHex: "#c2557a",
    image: "magnolia-velvet.jpg",
  },
  {
    slug: "southern-light",
    title: "Southern Light",
    type: "original",
    description:
      "Oil on canvas, 80×100cm. A sun-warmed coast in shimmering colour.",
    basePriceCents: 132000,
    accentHex: "#6f9b54",
    image: "distant-peak.jpg",
  },
];

const NOW = new Date("2026-06-01T00:00:00Z");

function toProductWithMedia(spec: DemoSpec, i: number): ProductWithMedia {
  const id = `demo-${spec.slug}`;
  return {
    id,
    slug: spec.slug,
    title: spec.title,
    description: spec.description,
    type: spec.type,
    basePriceCents: spec.basePriceCents,
    currency: "GBP",
    status: "available",
    accentHex: spec.accentHex,
    paletteJson: null,
    createdAt: new Date(NOW.getTime() - i * 1000),
    updatedAt: NOW,
    images: [
      {
        id: `${id}-img`,
        productId: id,
        s3Key: `/sample-art/${spec.image}`,
        altText: `${spec.title} by Anna Barnett`,
        width: 843,
        height: 1052,
        position: 0,
      },
    ],
    variants: (spec.variants ?? []).map((v, vi) => ({
      id: `${id}-v${vi}`,
      productId: id,
      name: v.name,
      priceCents: v.priceCents,
      sku: `${spec.slug}-${vi + 1}`,
      stockQty: v.stockQty,
      createdAt: NOW,
    })),
  };
}

let cache: ProductWithMedia[] | null = null;
function all(): ProductWithMedia[] {
  if (!cache) cache = SPECS.map(toProductWithMedia);
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
