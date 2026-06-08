/**
 * Seed the database with Anna's real paintings as purchasable products.
 *
 * This is the bridge that makes **Path B (online card checkout)** work without a
 * full admin UI: it turns the gallery manifest (+ per-painting metadata) into
 * `products` + `images` rows so the shop has real, buyable originals. The image
 * rows point straight at the already-committed `/gallery/*.webp` files (the
 * storage adapter passes absolute keys through unchanged), so nothing is copied
 * or re-processed.
 *
 * Idempotent: deletes any product with the same slug first (cascades to its
 * images/variants), then re-inserts. Only touches these paintings — safe to
 * re-run. Prices are the same obvious PLACEHOLDER draft used everywhere else.
 *
 * Run (needs DATABASE_URL pointing at a migrated Postgres):
 *   npm run db:seed:paintings
 *
 * See docs/GO-LIVE.md Path B.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { products, images, siteSettings } from "./schema";
import { getGalleryItems } from "@/lib/gallery";
import { getArtworkMeta } from "@/lib/artwork-meta";

// Uniform draft price (pence), matching src/lib/demo-data.ts. Deliberately
// obvious so nothing reads as a final, confirmed price — set real per-piece
// prices here (or via the admin, once built) before taking real money.
const DRAFT_PRICE_CENTS = 45000;

async function main() {
  const items = getGalleryItems();
  console.log(`Seeding ${items.length} paintings as products…`);

  for (const item of items) {
    const meta = getArtworkMeta(item.slug);

    // Idempotency: remove any existing row for this slug (cascades to images).
    await db.delete(products).where(eq(products.slug, item.slug));

    const [product] = await db
      .insert(products)
      .values({
        slug: item.slug,
        title: meta.title,
        description: `Original ${meta.medium.toLowerCase()}, ${meta.dimensions}.`,
        type: "original",
        basePriceCents: DRAFT_PRICE_CENTS,
        currency: "GBP",
        status: meta.status === "sold" ? "sold" : "available",
        accentHex: item.accentHex,
      })
      .returning();

    await db.insert(images).values({
      productId: product.id,
      // Absolute key → the storage adapter's publicUrl returns it unchanged, so
      // the product page serves the committed /gallery image directly.
      s3Key: item.large,
      altText: `${meta.title} by Anna Barnett`,
      width: item.width ?? null,
      height: item.height ?? null,
      position: 0,
    });

    console.log(`  ✓ ${meta.title} (${item.slug}) — ${product.status}`);
  }

  // Ensure the site-settings singleton exists.
  await db
    .insert(siteSettings)
    .values({ id: "singleton" })
    .onConflictDoNothing();

  console.log(
    `Seed complete: ${items.length} originals at the draft price (£${(
      DRAFT_PRICE_CENTS / 100
    ).toFixed(2)}). Set real titles/prices before taking real payments.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
