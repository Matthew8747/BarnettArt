import "server-only";
import { eq, asc, desc, inArray } from "drizzle-orm";
import { db } from "./index";
import {
  products,
  productVariants,
  images,
  type Product,
  type ProductVariant,
  type Image,
} from "./schema";

/**
 * Typed product read layer (Phase 1).
 *
 * All access goes through Drizzle, which parameterises every query — there is no
 * string-concatenated SQL here, so this layer is SQL-injection safe by
 * construction. Storefront pages call the `*ForStore` reads (available items
 * only); admin uses the unfiltered reads.
 */

export type ProductWithMedia = Product & {
  images: Image[];
  variants: ProductVariant[];
};

/** Products to show in the public gallery: available, newest first. */
export async function listAvailableProducts(): Promise<ProductWithMedia[]> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.status, "available"))
    .orderBy(desc(products.createdAt));
  return attachMedia(rows);
}

/** A single product for its public detail page, or null if not available. */
export async function getProductBySlug(
  slug: string,
): Promise<ProductWithMedia | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  if (!product || product.status === "archived") return null;
  const [withMedia] = await attachMedia([product]);
  return withMedia ?? null;
}

/** Every product (incl. sold/archived) for the admin list, newest first. */
export async function listAllProducts(): Promise<Product[]> {
  return db.select().from(products).orderBy(desc(products.createdAt));
}

/** Attach images and variants to a set of products in two batched queries. */
async function attachMedia(rows: Product[]): Promise<ProductWithMedia[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [imgs, variants] = await Promise.all([
    db
      .select()
      .from(images)
      .where(inArray(images.productId, ids))
      .orderBy(asc(images.position)),
    db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.productId, ids))
      .orderBy(asc(productVariants.priceCents)),
  ]);

  const imgsByProduct = groupBy(imgs, (i) => i.productId);
  const variantsByProduct = groupBy(variants, (v) => v.productId);

  return rows.map((p) => ({
    ...p,
    images: imgsByProduct.get(p.id) ?? [],
    variants: variantsByProduct.get(p.id) ?? [],
  }));
}

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = map.get(k);
    if (bucket) bucket.push(item);
    else map.set(k, [item]);
  }
  return map;
}
