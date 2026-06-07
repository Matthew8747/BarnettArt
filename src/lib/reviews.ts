import { getGalleryItems } from "@/lib/gallery";

/**
 * Reviews / testimonials.
 *
 * PLACEHOLDER CONTENT: every review below is a clearly-labelled sample so the
 * home and product pages have something to show. They all carry
 * `verified: false`. Once the shop is selling and the database/admin is live,
 * real purchase-verified reviews replace these (see migration note below) —
 * the display components read ONLY the helpers here, so that swap touches no UI.
 *
 * `productSlug` ties a review to a painting (matching a gallery manifest slug);
 * `null` means a general testimonial, surfaced on the home page.
 */
export type Review = {
  id: string;
  /** PLACEHOLDER author name. */
  author: string;
  /** Integer 1..5. */
  rating: number;
  /** PLACEHOLDER review text (clearly a sample). */
  body: string;
  /** Painting/product slug this review is for, or null for a general one. */
  productSlug: string | null;
  /** ISO date (YYYY-MM-DD). */
  dateISO: string;
  /** false for all placeholders; true later = linked to a real paid order. */
  verified: boolean;
};

const REVIEWS: Review[] = [
  {
    id: "rev-001",
    author: "Sample Collector",
    rating: 5,
    body: "(Placeholder review.) The piece is even better in person — the layers catch the light through the day. Replace this with a real customer testimonial.",
    productSlug: null,
    dateISO: "2026-05-02",
    verified: false,
  },
  {
    id: "rev-002",
    author: "Sample Buyer",
    rating: 5,
    body: "(Placeholder review.) Beautifully packed and arrived quickly. Anna was lovely to deal with from enquiry to delivery. Swap for a genuine review later.",
    productSlug: null,
    dateISO: "2026-04-18",
    verified: false,
  },
  {
    id: "rev-003",
    author: "Sample Patron",
    rating: 4,
    body: "(Placeholder review.) A real focal point in our hallway. The colours are richer than the screen suggests. Placeholder text — replace before launch.",
    productSlug: null,
    dateISO: "2026-03-29",
    verified: false,
  },
  {
    id: "rev-004",
    author: "Sample Collector",
    rating: 5,
    body: "(Placeholder review.) Commissioned a companion piece after this one — couldn't be happier. Replace with a real testimonial for this painting.",
    productSlug: "img-0281",
    dateISO: "2026-05-10",
    verified: false,
  },
  {
    id: "rev-005",
    author: "Sample Buyer",
    rating: 5,
    body: "(Placeholder review.) Exactly the calm, watery feel I was after. Placeholder text — Anna to replace with a genuine review.",
    productSlug: "img-0519",
    dateISO: "2026-04-22",
    verified: false,
  },
  {
    id: "rev-006",
    author: "Sample Patron",
    rating: 4,
    body: "(Placeholder review.) Warm and bold — it changed the whole room. Sample text only; replace before going live.",
    productSlug: "img-8590",
    dateISO: "2026-03-11",
    verified: false,
  },
];

/** Featured general testimonials for the home page (productSlug === null). */
export function getFeaturedReviews(n: number): Review[] {
  return REVIEWS.filter((r) => r.productSlug === null).slice(0, n);
}

/** Reviews tied to a specific painting/product slug, newest first. */
export function getReviewsForProduct(slug: string): Review[] {
  return REVIEWS.filter((r) => r.productSlug === slug).sort((a, b) =>
    b.dateISO.localeCompare(a.dateISO),
  );
}

/** Average rating + count for a product, or null if it has no reviews. */
export function getAverageRating(
  slug: string,
): { average: number; count: number } | null {
  const list = getReviewsForProduct(slug);
  if (list.length === 0) return null;
  const sum = list.reduce((acc, r) => acc + r.rating, 0);
  return { average: sum / list.length, count: list.length };
}

/** Defensive helper used by tests: are all product-tied slugs real paintings? */
export function reviewedSlugsExist(): boolean {
  const known = new Set(getGalleryItems().map((i) => i.slug));
  return REVIEWS.every(
    (r) => r.productSlug === null || known.has(r.productSlug),
  );
}
