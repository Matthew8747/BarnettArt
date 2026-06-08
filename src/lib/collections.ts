import { getGalleryItems, type GalleryItem } from "@/lib/gallery";

/**
 * Collections — curated groupings of Anna's paintings.
 *
 * PLACEHOLDER CONTENT: the collection titles and stories below are drafts so the
 * site reads as a finished gallery. Anna replaces them with real names and
 * narratives (see docs/ADDING-PAINTINGS.md). The grouping lives here — NOT in
 * `gallery-manifest.json` — so re-running `scripts/import-paintings.mjs` never
 * wipes it.
 *
 * Migration note: this mirrors a future `collections` table (+ a `collection_id`
 * on products). UI reads only the helpers below, so swapping the source to the
 * database later is a one-file change with no component edits.
 */
export type Collection = {
  /** URL segment, e.g. "tidal". */
  slug: string;
  /** PLACEHOLDER display name. */
  title: string;
  /** PLACEHOLDER narrative shown on the collection page (clearly draft). */
  story: string;
  /** Painting slug used as the collection cover image. */
  coverSlug: string;
  /** Ordered member painting slugs (each a slug from the gallery manifest). */
  paintingSlugs: string[];
};

const PLACEHOLDER = "Placeholder text — Anna to replace.";

/**
 * Collections are OPTIONAL groupings. A painting may belong to at most one
 * collection; paintings left out of every collection are simply "one-off" works
 * that still appear in the gallery (under "All") and have their own detail view —
 * they just aren't part of a series. The test only enforces that no painting is
 * in two collections and that every referenced slug exists in the manifest.
 */
const COLLECTIONS: Collection[] = [
  {
    slug: "verdant",
    title: "Coll 1",
    story:
      `${PLACEHOLDER} A working note for this collection: the greens and golds ` +
      "here were painted across one long stretch of summer, colour worked over " +
      "colour until the surface settled. Swap this for the real story of how the " +
      "series began and what holds it together.",
    coverSlug: "img-8587",
    paintingSlugs: [
      "img-0367",
      "img-8587",
      "img-8588",
      "img-8589",
      "img-8590",
      "img-8591",
    ],
  },
  {
    slug: "ochre-earth",
    title: "Coll 2",
    story:
      `${PLACEHOLDER} These earth-toned works lean into ochre, clay and warm ` +
      "neutrals — quieter pieces built in patient layers. Replace this with the " +
      "real intention behind the collection and any materials or places that " +
      "shaped it.",
    coverSlug: "img-8593",
    paintingSlugs: ["img-8593", "img-8595", "img-8597", "img-8602"],
  },
  {
    slug: "tidal",
    title: "Coll 3",
    story:
      `${PLACEHOLDER} Blues and teals run through this group — water, depth and ` +
      "the cold light off it. Replace with the true narrative: where these were " +
      "made, what they are reaching for, and how they relate to one another.",
    coverSlug: "img-0264",
    paintingSlugs: [
      "img-0233",
      "img-0263",
      "img-0264",
      "img-0353",
      "img-0518",
      "img-0519",
      "img-0523",
      "img-0526",
      "img-0534",
      "img-0648",
      "img-0649",
      "img-8600",
      "img-8612",
    ],
  },
];

/** All collections, in display order. */
export function getCollections(): Collection[] {
  return COLLECTIONS;
}

/** A single collection by slug, or null. */
export function getCollection(slug: string): Collection | null {
  return COLLECTIONS.find((c) => c.slug === slug) ?? null;
}

/** The collection a painting belongs to, or null if unassigned. */
export function getCollectionForPainting(
  paintingSlug: string,
): Collection | null {
  return (
    COLLECTIONS.find((c) => c.paintingSlugs.includes(paintingSlug)) ?? null
  );
}

/**
 * The gallery items in a collection, in the collection's order. Skips any slug
 * that isn't in the manifest (defensive — the test asserts there are none).
 */
export function getCollectionPaintings(slug: string): GalleryItem[] {
  const collection = getCollection(slug);
  if (!collection) return [];
  const bySlug = new Map(getGalleryItems().map((i) => [i.slug, i]));
  return collection.paintingSlugs
    .map((s) => bySlug.get(s))
    .filter((i): i is GalleryItem => i !== undefined);
}

/** Map of painting slug → its collection (for gallery filter chips, etc.). */
export function paintingCollectionMap(): Map<string, Collection> {
  const map = new Map<string, Collection>();
  for (const c of COLLECTIONS) {
    for (const s of c.paintingSlugs) map.set(s, c);
  }
  return map;
}
