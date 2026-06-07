import { getGalleryItems } from "@/lib/gallery";

/**
 * Per-painting metadata (title, story, medium, dimensions, year, availability).
 *
 * PLACEHOLDER CONTENT. By default every painting gets an obviously-draft title
 * ("Untitled No. 01"), a placeholder story, a default medium, placeholder
 * dimensions derived from the image's aspect ratio, and "available" status.
 *
 * To set REAL values for a piece, add an entry to `OVERRIDES` keyed by its
 * gallery slug — see docs/ADDING-PAINTINGS.md. Kept here (not in the generated
 * `gallery-manifest.json`) so re-importing never wipes it.
 *
 * Migration note: mirrors future columns on the products table. UI reads only
 * `getArtworkMeta()`, so moving the source to the database later touches no
 * components.
 */
export type ArtworkMeta = {
  /** Display title (PLACEHOLDER unless overridden). */
  title: string;
  /** Background / story shown on the detail view (PLACEHOLDER). */
  story: string;
  /** e.g. "Mixed media on canvas" (PLACEHOLDER). */
  medium: string;
  /** e.g. "60 × 90 cm" (PLACEHOLDER, derived from aspect ratio). */
  dimensions: string;
  /** e.g. "2025" (PLACEHOLDER). */
  year: string;
  /** Availability signal (PLACEHOLDER — defaults to available). */
  status: "available" | "sold";
};

/** Real, per-piece values. Add entries here as Anna supplies them. */
const OVERRIDES: Record<string, Partial<ArtworkMeta>> = {
  // Example (delete the leading "//" and edit once you have the real details):
  // "img-0281": {
  //   title: "Low Tide, Morning",
  //   story: "Painted over three weeks on the north coast…",
  //   medium: "Oil and cold wax on linen",
  //   dimensions: "70 × 100 cm",
  //   year: "2025",
  //   status: "available",
  // },
};

const PLACEHOLDER_STORY =
  "(Placeholder story.) A few lines about how this piece was made, what it's " +
  "reaching for, and the materials behind it will go here. Anna replaces this " +
  "with the real background to the painting before launch.";

/** Stable 1-based number for a slug, from manifest order (for "Untitled No. NN"). */
function paintingNumber(slug: string): number {
  const idx = getGalleryItems().findIndex((i) => i.slug === slug);
  return idx === -1 ? 0 : idx + 1;
}

/** Placeholder dimensions bucketed by aspect ratio. */
function placeholderDimensions(slug: string): string {
  const item = getGalleryItems().find((i) => i.slug === slug);
  const ratio = item?.width && item?.height ? item.width / item.height : 0.75;
  if (ratio < 0.9) return "60 × 90 cm"; // portrait
  if (ratio > 1.1) return "90 × 60 cm"; // landscape
  return "70 × 70 cm"; // ~square
}

/** Metadata for a painting slug — overrides merged over generated placeholders. */
export function getArtworkMeta(slug: string): ArtworkMeta {
  const number = String(paintingNumber(slug)).padStart(2, "0");
  const base: ArtworkMeta = {
    title: `Untitled No. ${number}`,
    story: PLACEHOLDER_STORY,
    medium: "Mixed media on canvas",
    dimensions: placeholderDimensions(slug),
    year: "2025",
    status: "available",
  };
  return { ...base, ...OVERRIDES[slug] };
}
