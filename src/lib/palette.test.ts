import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { extractPalette } from "./palette";
import { isHex } from "./color";

/** Build a small image with several strong colour blocks for the extractor. */
async function swatchImage(): Promise<Buffer> {
  const blue = { r: 30, g: 60, b: 210 };
  const base = sharp({
    create: { width: 90, height: 60, channels: 3, background: blue },
  });
  const red = await sharp({
    create: {
      width: 30,
      height: 60,
      channels: 3,
      background: { r: 220, g: 40, b: 50 },
    },
  })
    .png()
    .toBuffer();
  const yellow = await sharp({
    create: {
      width: 30,
      height: 60,
      channels: 3,
      background: { r: 230, g: 210, b: 40 },
    },
  })
    .png()
    .toBuffer();
  return base
    .composite([
      { input: red, left: 0, top: 0 },
      { input: yellow, left: 60, top: 0 },
    ])
    .png()
    .toBuffer();
}

describe("extractPalette", () => {
  it("returns a valid accent and ordered candidates from an image", async () => {
    const img = await swatchImage();
    const { accentHex, candidates } = await extractPalette(img);

    expect(isHex(accentHex)).toBe(true);
    expect(candidates.length).toBeGreaterThanOrEqual(2);
    for (const c of candidates) {
      expect(isHex(c.hex)).toBe(true);
      expect(typeof c.name).toBe("string");
      expect(c.population).toBeGreaterThanOrEqual(0);
    }
  });

  it("orders candidates most-present first", async () => {
    const img = await swatchImage();
    const { candidates } = await extractPalette(img);
    const pops = candidates.map((c) => c.population);
    const sorted = [...pops].sort((a, b) => b - a);
    expect(pops).toEqual(sorted);
  });
});
