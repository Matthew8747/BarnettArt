import "server-only";
import { Vibrant } from "node-vibrant/node";
import type { PaletteCandidate } from "@/db/schema";
import { normalizeHex } from "./color";

/**
 * Admin-time palette extraction (DESIGN.md §2 step 1).
 *
 * Given an uploaded image, return a default accent plus a small ordered set of
 * candidate swatches for Anna to choose from in the product editor. This runs
 * once on upload on the server — never live on the client — and the chosen value
 * (not this guess) is what ships. node-vibrant only ever sees Anna's own trusted
 * artwork.
 */
export type ExtractedPalette = {
  /** Suggested default accent (most prominent vibrant-ish swatch). */
  accentHex: string;
  /** Candidate swatches, ordered most-prominent first. */
  candidates: PaletteCandidate[];
};

// Prefer punchy swatches as the default accent; fall back through muted/dark.
const ACCENT_PREFERENCE = [
  "Vibrant",
  "LightVibrant",
  "DarkVibrant",
  "Muted",
  "LightMuted",
  "DarkMuted",
] as const;

export async function extractPalette(image: Buffer): Promise<ExtractedPalette> {
  const palette = await Vibrant.from(image).getPalette();

  const candidates: PaletteCandidate[] = [];
  for (const name of ACCENT_PREFERENCE) {
    const swatch = palette[name];
    if (swatch) {
      candidates.push({
        hex: normalizeHex(swatch.hex),
        name,
        population: swatch.population,
      });
    }
  }

  if (candidates.length === 0) {
    // Degenerate image (e.g. fully transparent). Fall back to the site default.
    return { accentHex: "#8a7bff", candidates: [] };
  }

  // Default accent: the highest-preference swatch that actually exists, which is
  // the first entry since ACCENT_PREFERENCE is already ordered by punchiness.
  const accentHex = candidates[0].hex;

  // Surface candidates ordered by population so the most-present colours lead.
  candidates.sort((a, b) => b.population - a.population);

  return { accentHex, candidates };
}
