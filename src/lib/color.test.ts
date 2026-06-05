import { describe, it, expect } from "vitest";
import {
  isHex,
  normalizeHex,
  relativeLuminance,
  contrastRatio,
  clampAccentForText,
  DARK_BG,
  PAGE_BG,
} from "./color";

describe("isHex", () => {
  it("accepts 6-digit hex with hash", () => {
    expect(isHex("#8a7bff")).toBe(true);
    expect(isHex("#FFFFFF")).toBe(true);
  });
  it("accepts 3-digit shorthand", () => {
    expect(isHex("#abc")).toBe(true);
  });
  it("rejects malformed values", () => {
    expect(isHex("8a7bff")).toBe(false); // no hash
    expect(isHex("#12345")).toBe(false); // wrong length
    expect(isHex("#gggggg")).toBe(false); // non-hex chars
    expect(isHex("")).toBe(false);
  });
});

describe("normalizeHex", () => {
  it("lowercases and keeps 6-digit form", () => {
    expect(normalizeHex("#8A7BFF")).toBe("#8a7bff");
  });
  it("expands 3-digit shorthand to 6 digits", () => {
    expect(normalizeHex("#abc")).toBe("#aabbcc");
  });
  it("throws on invalid input rather than guessing", () => {
    expect(() => normalizeHex("nope")).toThrow();
  });
});

describe("contrastRatio", () => {
  it("is 21:1 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
  it("is 1:1 for a colour against itself", () => {
    expect(contrastRatio("#15151d", "#15151d")).toBeCloseTo(1, 5);
  });
  it("is symmetric (order does not matter)", () => {
    const a = contrastRatio("#8a7bff", DARK_BG);
    const b = contrastRatio(DARK_BG, "#8a7bff");
    expect(a).toBeCloseTo(b, 10);
  });
});

describe("relativeLuminance", () => {
  it("ranks lighter colours higher", () => {
    expect(relativeLuminance("#ffffff")).toBeGreaterThan(
      relativeLuminance("#808080"),
    );
    expect(relativeLuminance("#808080")).toBeGreaterThan(
      relativeLuminance("#000000"),
    );
  });
});

describe("clampAccentForText", () => {
  it("leaves an already-readable accent essentially unchanged", () => {
    // A pale lilac already clears 4.5:1 on the dark canvas.
    const accent = "#cfc7ff";
    expect(contrastRatio(accent, DARK_BG)).toBeGreaterThanOrEqual(4.5);
    const clamped = clampAccentForText(accent, DARK_BG);
    expect(contrastRatio(clamped, DARK_BG)).toBeGreaterThanOrEqual(4.5);
  });

  it("lightens a too-dark accent until it meets 4.5:1 on the dark canvas", () => {
    const accent = "#3a2f7a"; // dark indigo, unreadable as text on #15151d
    expect(contrastRatio(accent, DARK_BG)).toBeLessThan(4.5);
    const clamped = clampAccentForText(accent, DARK_BG);
    expect(isHex(clamped)).toBe(true);
    expect(contrastRatio(clamped, DARK_BG)).toBeGreaterThanOrEqual(4.5);
  });

  it("preserves the hue family while lightening", () => {
    // Clamping a blue should still read as blue-ish, not wander to grey/white.
    const clamped = clampAccentForText("#1e2a8a", DARK_BG);
    const r = parseInt(clamped.slice(1, 3), 16);
    const b = parseInt(clamped.slice(5, 7), 16);
    expect(b).toBeGreaterThan(r); // blue channel still dominant
  });

  it("darkens a too-bright accent until it meets 4.5:1 on the paper canvas", () => {
    const accent = "#f2c14e"; // bright yellow, unreadable as text on paper
    expect(contrastRatio(accent, PAGE_BG)).toBeLessThan(4.5);
    const clamped = clampAccentForText(accent, PAGE_BG);
    expect(isHex(clamped)).toBe(true);
    expect(contrastRatio(clamped, PAGE_BG)).toBeGreaterThanOrEqual(4.5);
  });

  it("preserves the hue family while darkening on paper", () => {
    // A clamped green should still read green, not drift to grey/black.
    const clamped = clampAccentForText("#5fe08a", PAGE_BG);
    const r = parseInt(clamped.slice(1, 3), 16);
    const g = parseInt(clamped.slice(3, 5), 16);
    const b = parseInt(clamped.slice(5, 7), 16);
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
  });
});
