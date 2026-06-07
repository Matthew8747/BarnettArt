// One-time, re-runnable image pipeline for Anna's real paintings.
//
// Reads raw camera files from ./paintings (HEIC + JPEG), and for each:
//   • auto-rotates from EXIF orientation, THEN strips all metadata
//     (iPhone HEIC embeds GPS coordinates — we must not ship those),
//   • resizes to a web-optimal large image + a grid thumbnail,
//   • writes WebP (primary) + JPEG (fallback) to ./public/gallery,
//   • extracts a per-artwork accent colour with node-vibrant.
//
// Emits ./src/lib/gallery-manifest.json, consumed by the Gallery page, the
// shop placeholders, and the portfolio home. Safe to re-run: it overwrites.
//
//   node scripts/import-paintings.mjs
//
// Titles are placeholders (e.g. "Untitled — IMG_0364"); Anna renames them via
// the manifest or, later, the admin. See docs/HANDOVER.md.

import { readdir, mkdir, writeFile, readFile } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { Vibrant } from "node-vibrant/node";
import heicConvert from "heic-convert";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_DIR = join(ROOT, "paintings");
const OUT_DIR = join(ROOT, "public", "gallery");
const MANIFEST = join(ROOT, "src", "lib", "gallery-manifest.json");

const LARGE_EDGE = 2000; // longest edge of the full-view image
const THUMB_EDGE = 900; // longest edge of the grid thumbnail
const SUPPORTED = new Set([".heic", ".heif", ".jpg", ".jpeg", ".png"]);

/** "IMG_0364.JPG.jpeg" -> "img-0364". Stable, url-safe, de-duplicated. */
function slugify(file) {
  const stem = basename(file)
    .replace(/\.[^.]+$/, "")
    .replace(/\.(jpg|jpeg|png|heic|heif)$/i, "");
  return stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "img-0364" -> "Untitled — IMG 0364" (obvious placeholder for Anna). */
function placeholderTitle(slug) {
  return `Untitled — ${slug.replace(/-/g, " ").toUpperCase()}`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const entries = (await readdir(SRC_DIR))
    .filter((f) => SUPPORTED.has(extname(f).toLowerCase()))
    .sort();

  if (entries.length === 0) {
    console.error(`No supported images found in ${SRC_DIR}`);
    process.exit(1);
  }

  const manifest = [];
  const seen = new Set();

  for (const file of entries) {
    let slug = slugify(file);
    while (seen.has(slug)) slug += "-2";
    seen.add(slug);

    const inputPath = join(SRC_DIR, file);

    // sharp's bundled libheif lacks the HEVC decoder on Windows, so HEIC files
    // are first decoded to a JPEG buffer by the pure-JS heic-convert, then
    // handed to sharp like any other image. JPEG/PNG go straight to sharp.
    const ext = extname(file).toLowerCase();
    let inputForSharp = inputPath;
    if (ext === ".heic" || ext === ".heif") {
      try {
        const raw = await readFile(inputPath);
        inputForSharp = Buffer.from(
          await heicConvert({ buffer: raw, format: "JPEG", quality: 0.95 }),
        );
      } catch (err) {
        console.warn(`  skipping ${file}: HEIC decode failed (${err.message})`);
        continue;
      }
    }

    // Auto-rotate from EXIF, then everything downstream is metadata-free.
    const base = sharp(inputForSharp).rotate();

    const largeBuf = await base
      .clone()
      .resize(LARGE_EDGE, LARGE_EDGE, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();
    const { width, height } = await sharp(largeBuf).metadata();

    // Large: webp + jpeg
    await sharp(largeBuf)
      .webp({ quality: 82 })
      .toFile(join(OUT_DIR, `${slug}.webp`));
    await sharp(largeBuf)
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(join(OUT_DIR, `${slug}.jpg`));

    // Thumb: webp + jpeg
    const thumbBuf = await sharp(largeBuf)
      .resize(THUMB_EDGE, THUMB_EDGE, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();
    await sharp(thumbBuf)
      .webp({ quality: 80 })
      .toFile(join(OUT_DIR, `${slug}-thumb.webp`));
    await sharp(thumbBuf)
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(OUT_DIR, `${slug}-thumb.jpg`));

    // Accent from the optimised buffer (node-vibrant only ever sees Anna's art).
    let accentHex = "#9c4221"; // site default (sienna) if extraction degenerates
    try {
      const palette = await Vibrant.from(largeBuf).getPalette();
      const swatch =
        palette.Vibrant ??
        palette.LightVibrant ??
        palette.DarkVibrant ??
        palette.Muted ??
        palette.LightMuted ??
        palette.DarkMuted;
      if (swatch?.hex) accentHex = swatch.hex;
    } catch (err) {
      console.warn(`  accent extraction failed for ${file}: ${err.message}`);
    }

    manifest.push({
      slug,
      title: placeholderTitle(slug),
      source: file,
      large: `/gallery/${slug}.webp`,
      largeJpg: `/gallery/${slug}.jpg`,
      thumb: `/gallery/${slug}-thumb.webp`,
      thumbJpg: `/gallery/${slug}-thumb.jpg`,
      width: width ?? null,
      height: height ?? null,
      accentHex,
    });

    console.log(`✓ ${file} -> ${slug} (${width}×${height}, ${accentHex})`);
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`\nWrote ${manifest.length} entries to ${MANIFEST}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
