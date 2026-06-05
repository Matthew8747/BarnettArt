import { describe, it, expect } from "vitest";
import { resolveAccent, accentTheme, DEFAULT_ACCENT } from "./accent";
import { contrastRatio, PAGE_BG, isHex } from "./color";

const uniform = { matchArtworkColours: true, uniformAccentHex: "#8a7bff" };

describe("resolveAccent", () => {
  it("uses the product accent when match-artwork is on", () => {
    expect(resolveAccent("#ff3366", uniform)).toBe("#ff3366");
  });

  it("falls back to the uniform accent when the product has none", () => {
    expect(resolveAccent(null, uniform)).toBe("#8a7bff");
  });

  it("ignores the product accent when uniform mode is off", () => {
    const off = { matchArtworkColours: false, uniformAccentHex: "#22ddaa" };
    expect(resolveAccent("#ff3366", off)).toBe("#22ddaa");
  });

  it("normalises the resolved value to #rrggbb", () => {
    expect(resolveAccent("#ABC", uniform)).toBe("#aabbcc");
  });
});

describe("accentTheme", () => {
  it("exposes accent, a contrast-safe text accent, and a soft glow", () => {
    const theme = accentTheme("#3a2f7a"); // dark indigo
    expect(isHex(theme["--accent"])).toBe(true);
    expect(theme["--accent-text"]).toBeDefined();
    expect(theme["--accent-soft"]).toContain("rgba(");
  });

  it("guarantees the text accent clears 4.5:1 on the paper canvas", () => {
    // A bright yellow is unreadable as text on paper and must be darkened.
    const theme = accentTheme("#f2c14e");
    expect(
      contrastRatio(theme["--accent-text"], PAGE_BG),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the raw accent for fills even when it is too bright for text", () => {
    const theme = accentTheme("#f2c14e");
    expect(theme["--accent"]).toBe("#f2c14e");
  });
});

describe("DEFAULT_ACCENT", () => {
  it("is the documented site default", () => {
    expect(DEFAULT_ACCENT).toBe("#9c4221");
  });
});
