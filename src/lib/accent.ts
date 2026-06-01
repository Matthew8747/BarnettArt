import { clampAccentForText, DARK_BG, normalizeHex } from "./color";

/**
 * Accent resolution + theming (DESIGN.md §2, §5).
 *
 * Pure functions that turn "this product + the site settings" into the concrete
 * CSS custom properties the theme provider writes. Keeping the rules here (not
 * scattered in components) means colour behaviour is owned in one place and is
 * unit-testable without a browser or DB.
 */

/** The documented uniform/site default accent (DESIGN.md §2). */
export const DEFAULT_ACCENT = "#8a7bff";

export type AccentSettings = {
  matchArtworkColours: boolean;
  uniformAccentHex: string;
};

/**
 * The effective accent for a product:
 *  - uniform mode off → always the site uniform accent;
 *  - uniform mode on  → the product's own accent, or the uniform accent if unset.
 */
export function resolveAccent(
  productAccentHex: string | null | undefined,
  settings: AccentSettings,
): string {
  if (!settings.matchArtworkColours) {
    return normalizeHex(settings.uniformAccentHex);
  }
  return normalizeHex(productAccentHex || settings.uniformAccentHex);
}

export type AccentTheme = {
  /** Raw accent — used for large fills, borders and glows. */
  "--accent": string;
  /** Contrast-clamped accent — safe for text/price on the dark canvas. */
  "--accent-text": string;
  /** Translucent accent for soft glows/shadows. */
  "--accent-soft": string;
};

/** Build the CSS variables for an accent, enforcing the text-contrast guard. */
export function accentTheme(
  accentHex: string,
  bg: string = DARK_BG,
): AccentTheme {
  const accent = normalizeHex(accentHex);
  const r = parseInt(accent.slice(1, 3), 16);
  const g = parseInt(accent.slice(3, 5), 16);
  const b = parseInt(accent.slice(5, 7), 16);
  return {
    "--accent": accent,
    "--accent-text": clampAccentForText(accent, bg),
    "--accent-soft": `rgba(${r}, ${g}, ${b}, 0.22)`,
  };
}
