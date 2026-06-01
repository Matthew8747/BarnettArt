/**
 * Local dev seed (Phase 1).
 *
 * Generates a handful of abstract artworks (no binary assets committed),
 * extracts each palette with node-vibrant, stores the image through the storage
 * adapter, and inserts products + images + a few print variants. Also pins the
 * site-settings singleton. Idempotent: clears the sample rows first.
 *
 * Run: `npm run db:seed` (needs a running Postgres in DATABASE_URL).
 */
import "dotenv/config";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { products, productVariants, images, siteSettings } from "./schema";
import { extractPalette } from "@/lib/palette";
import { getStorage, productImageKey } from "@/lib/storage";

type Sample = {
  slug: string;
  title: string;
  type: "original" | "print";
  description: string;
  basePriceCents: number;
  hues: [number, number]; // gradient hue endpoints (degrees)
  variants?: { name: string; priceCents: number; stockQty: number }[];
};

const SAMPLES: Sample[] = [
  {
    slug: "tidal-bloom",
    title: "Tidal Bloom",
    type: "original",
    description:
      "Acrylic on canvas, 80×60cm. A surge of teal and coral caught mid-break.",
    basePriceCents: 145000,
    hues: [175, 330],
  },
  {
    slug: "amber-quiet",
    title: "Amber Quiet",
    type: "original",
    description: "Oil on board, 50×50cm. Low light pooling in warm ochre.",
    basePriceCents: 98000,
    hues: [35, 18],
  },
  {
    slug: "violet-field",
    title: "Violet Field",
    type: "print",
    description: "Giclée print on archival cotton rag. Open edition, signed.",
    basePriceCents: 6500,
    hues: [265, 210],
    variants: [
      { name: "A3 / Unframed", priceCents: 6500, stockQty: 25 },
      { name: "A2 / Unframed", priceCents: 9500, stockQty: 15 },
      { name: "A2 / Oak frame", priceCents: 16500, stockQty: 6 },
    ],
  },
  {
    slug: "emerald-drift",
    title: "Emerald Drift",
    type: "print",
    description: "Giclée print on archival cotton rag. Open edition, signed.",
    basePriceCents: 6500,
    hues: [150, 95],
    variants: [
      { name: "A3 / Unframed", priceCents: 6500, stockQty: 25 },
      { name: "A2 / Oak frame", priceCents: 16500, stockQty: 0 },
    ],
  },
  {
    slug: "cobalt-hour",
    title: "Cobalt Hour",
    type: "original",
    description: "Mixed media on panel, 70×90cm. Dusk folding into deep blue.",
    basePriceCents: 168000,
    hues: [220, 280],
  },
  {
    slug: "rose-static",
    title: "Rose Static",
    type: "original",
    description: "Acrylic and ink, 60×60cm. Soft pinks fractured by graphite.",
    basePriceCents: 112000,
    hues: [340, 20],
  },
];

/** Build a colourful abstract SVG from two hues, rendered to JPEG. */
async function makeArtwork(hues: [number, number]): Promise<Buffer> {
  const [h1, h2] = hues;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600">
      <defs>
        <radialGradient id="g1" cx="30%" cy="25%" r="80%">
          <stop offset="0%" stop-color="hsl(${h1} 80% 60%)"/>
          <stop offset="100%" stop-color="hsl(${h2} 55% 22%)"/>
        </radialGradient>
        <linearGradient id="g2" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stop-color="hsl(${h2} 70% 45%)" stop-opacity="0.0"/>
          <stop offset="100%" stop-color="hsl(${h1} 85% 55%)" stop-opacity="0.7"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="1600" fill="url(#g1)"/>
      <circle cx="820" cy="520" r="360" fill="hsl(${h1} 90% 65%)" opacity="0.55"/>
      <circle cx="360" cy="1150" r="300" fill="hsl(${h2} 75% 40%)" opacity="0.6"/>
      <rect width="1200" height="1600" fill="url(#g2)"/>
    </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toBuffer();
}

async function main() {
  const storage = getStorage();

  console.log("Clearing existing sample products…");
  // For a fresh local seed we only remove the sample products (cascades to
  // variants + images). Don't run this against production data.
  for (const s of SAMPLES) {
    await db.delete(products).where(eq(products.slug, s.slug));
  }

  for (const sample of SAMPLES) {
    const img = await makeArtwork(sample.hues);
    const { accentHex, candidates } = await extractPalette(img);
    const meta = await sharp(img).metadata();

    const [product] = await db
      .insert(products)
      .values({
        slug: sample.slug,
        title: sample.title,
        description: sample.description,
        type: sample.type,
        basePriceCents: sample.basePriceCents,
        accentHex,
        paletteJson: candidates,
      })
      .returning();

    const key = productImageKey(product.id, `${sample.slug}.jpg`);
    await storage.put(key, img, "image/jpeg");

    await db.insert(images).values({
      productId: product.id,
      s3Key: key,
      altText: `${sample.title} by Anna Barnett`,
      width: meta.width ?? null,
      height: meta.height ?? null,
      position: 0,
    });

    if (sample.variants) {
      await db.insert(productVariants).values(
        sample.variants.map((v, i) => ({
          productId: product.id,
          name: v.name,
          priceCents: v.priceCents,
          sku: `${sample.slug}-${i + 1}`,
          stockQty: v.stockQty,
        })),
      );
    }

    console.log(`  ✓ ${sample.title} — accent ${accentHex}`);
  }

  await db
    .insert(siteSettings)
    .values({ id: "singleton" })
    .onConflictDoNothing();

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
