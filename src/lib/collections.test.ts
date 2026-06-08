import { describe, it, expect } from "vitest";
import {
  getCollections,
  getCollection,
  getCollectionForPainting,
  getCollectionPaintings,
  paintingCollectionMap,
} from "./collections";
import { getGalleryItems } from "./gallery";

describe("collections", () => {
  const collections = getCollections();
  const allSlugs = getGalleryItems().map((i) => i.slug);

  it("partitions every painting into exactly one collection", () => {
    const assigned = collections.flatMap((c) => c.paintingSlugs);
    // Every manifest painting is assigned…
    for (const slug of allSlugs) {
      expect(assigned).toContain(slug);
    }
    // …and none more than once.
    expect(assigned.length).toBe(allSlugs.length);
    expect(new Set(assigned).size).toBe(assigned.length);
  });

  it("has unique collection slugs", () => {
    const slugs = collections.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("references only real painting slugs (members + covers)", () => {
    const known = new Set(allSlugs);
    for (const c of collections) {
      expect(known.has(c.coverSlug)).toBe(true);
      for (const s of c.paintingSlugs) expect(known.has(s)).toBe(true);
    }
  });

  it("getCollection returns by slug or null", () => {
    expect(getCollection(collections[0].slug)?.slug).toBe(collections[0].slug);
    expect(getCollection("does-not-exist")).toBeNull();
  });

  it("getCollectionForPainting finds the owning collection", () => {
    const first = collections[0];
    expect(getCollectionForPainting(first.paintingSlugs[0])?.slug).toBe(
      first.slug,
    );
    expect(getCollectionForPainting("nope")).toBeNull();
  });

  it("getCollectionPaintings returns items in collection order", () => {
    const c = collections[0];
    const items = getCollectionPaintings(c.slug);
    expect(items.map((i) => i.slug)).toEqual(c.paintingSlugs);
  });

  it("paintingCollectionMap covers all paintings", () => {
    const map = paintingCollectionMap();
    expect(map.size).toBe(allSlugs.length);
  });
});
