/**
 * Colour utilities for the per-artwork accent system (DESIGN.md §2).
 *
 * Single home for the accessibility guarantee: any accent used as *text* on the
 * page canvas is clamped to meet WCAG AA contrast (≥ 4.5:1). Large fills/glows
 * are exempt and may use the raw accent. Keep this logic here so the rule is
 * enforced in exactly one place.
 *
 * Pure functions, no I/O — safe to use on server or (where needed) client.
 */

/** The page canvas accents are read against (DESIGN.md §1 `--bg`, warm paper). */
export const PAGE_BG = "#f3efe6";

/**
 * The previous dark canvas, kept as a named constant so the contrast helpers can
 * still be exercised against a dark background in tests and so a future dark
 * theme has a reference. The live storefront reads against {@link PAGE_BG}.
 */
export const DARK_BG = "#15151d";

/** WCAG AA minimum contrast for normal-size text. */
export const MIN_TEXT_CONTRAST = 4.5;

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isHex(value: string): boolean {
  return HEX_RE.test(value);
}

/** Lowercase and expand `#abc` → `#aabbcc`. Throws on invalid input. */
export function normalizeHex(value: string): string {
  if (!isHex(value)) {
    throw new Error(`Not a valid hex colour: ${JSON.stringify(value)}`);
  }
  let hex = value.toLowerCase().slice(1);
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${hex}`;
}

type RGB = { r: number; g: number; b: number };

function toRgb(hex: string): RGB {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }: RGB): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** WCAG relative luminance of a colour (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = toRgb(hex);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colours (1:1 … 21:1), order-independent. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// --- HSL conversion (used to lighten while preserving hue) -------------------

type HSL = { h: number; s: number; l: number };

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

/**
 * Return an accent safe to use as text against `bg`, preserving hue and
 * saturation while moving lightness only as far as needed to clear `minRatio`.
 *
 * The direction is chosen from the background: on a light canvas (the live
 * paper-white storefront) a too-bright accent is *darkened*; on a dark canvas it
 * is *lightened*. If pure-lightness can't reach the target, returns the most
 * extreme in-hue colour we tried.
 */
export function clampAccentForText(
  accent: string,
  bg: string = PAGE_BG,
  minRatio: number = MIN_TEXT_CONTRAST,
): string {
  if (contrastRatio(accent, bg) >= minRatio) {
    return normalizeHex(accent);
  }
  const hsl = rgbToHsl(toRgb(accent));
  // Light background → walk lightness down (darken); dark background → up.
  const darken = relativeLuminance(bg) >= 0.5;
  const step = 0.02;
  let best = normalizeHex(accent);
  for (
    let l = hsl.l;
    darken ? l >= -0.0001 : l <= 1.0001;
    l += darken ? -step : step
  ) {
    const candidate = toHex(
      hslToRgb({ ...hsl, l: Math.min(Math.max(l, 0), 1) }),
    );
    best = candidate;
    if (contrastRatio(candidate, bg) >= minRatio) {
      return candidate;
    }
  }
  return best;
}
