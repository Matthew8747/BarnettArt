import { describe, it, expect } from "vitest";
import {
  getFeaturedReviews,
  getReviewsForProduct,
  getAverageRating,
  reviewedSlugsExist,
} from "./reviews";

describe("reviews", () => {
  it("featured reviews are general (no productSlug) and capped", () => {
    const featured = getFeaturedReviews(2);
    expect(featured.length).toBe(2);
    expect(featured.every((r) => r.productSlug === null)).toBe(true);
  });

  it("ratings are integers within 1..5", () => {
    const all = [
      ...getFeaturedReviews(99),
      ...getReviewsForProduct("img-0364"),
      ...getReviewsForProduct("img-0519"),
      ...getReviewsForProduct("img-8590"),
    ];
    for (const r of all) {
      expect(Number.isInteger(r.rating)).toBe(true);
      expect(r.rating).toBeGreaterThanOrEqual(1);
      expect(r.rating).toBeLessThanOrEqual(5);
    }
  });

  it("getReviewsForProduct filters by slug, newest first", () => {
    const list = getReviewsForProduct("img-0364");
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((r) => r.productSlug === "img-0364")).toBe(true);
    const dates = list.map((r) => r.dateISO);
    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
  });

  it("getAverageRating computes mean + count, or null when none", () => {
    const stats = getAverageRating("img-0364");
    expect(stats).not.toBeNull();
    expect(stats!.count).toBeGreaterThan(0);
    expect(stats!.average).toBeGreaterThanOrEqual(1);
    expect(stats!.average).toBeLessThanOrEqual(5);
    expect(getAverageRating("no-such-slug")).toBeNull();
  });

  it("every product-tied review points at a real painting", () => {
    expect(reviewedSlugsExist()).toBe(true);
  });
});
