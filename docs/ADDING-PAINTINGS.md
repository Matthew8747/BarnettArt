# Adding & editing paintings

How to add new artwork, replace photos, and set real titles, prices, stories,
collections and reviews. Everything here is editing small data files and
re-running one script — no database needed (the live demo reads these files).

> Later, a Phase 1b admin UI will do all of this in the browser. Until then, it's
> these files. They're all keyed by a painting's **slug**, and live *outside* the
> generated manifest, so re-importing never wipes your edits.

---

## 1. Add or replace a painting photo

1. Drop the photo into the **`paintings/`** folder (HEIC or JPEG — straight from
   the camera is fine).
2. From the project root, run:
   ```powershell
   node scripts/import-paintings.mjs
   ```
   This auto-rotates, **strips all metadata** (including the GPS location iPhones
   embed — a privacy must), makes web-optimised WebP + JPEG, extracts an accent
   colour, and writes everything to `public/gallery/` + `src/lib/gallery-manifest.json`.
   It's safe to re-run; it overwrites cleanly.
3. The painting's **slug** comes from its filename, e.g. `IMG_0364.JPG` →
   `img-0364`. You'll use that slug in the files below.

> **Crop first.** If a photo shows the painting on a desk/wall, crop to just the
> artwork before importing — a clean edge makes the gallery look professional.

> **⚠️ If you REMOVE or REPLACE a painting, update `src/lib/collections.ts`.**
> A painting does **not** have to be in a collection — leaving it out just makes
> it a "one-off" that still shows in the gallery with its own detail view. But a
> collection must not reference a slug that no longer exists. After importing, run
> `npm test`: if `collections.test.ts` fails, remove any deleted slug(s) from
> `collections.ts` (and fix any `coverSlug` / review `productSlug` that pointed at
> a removed painting). Adding a new painting is free — assign it to a collection
> if it belongs to a series, or leave it as a one-off. Also delete the leftover
> `public/gallery/<old-slug>*` files for paintings you removed (the importer
> overwrites but doesn't delete).
>
> *HEIC note:* the importer auto-detects HEIC files even when an iPhone has saved
> them with a `.jpg`/`.jpeg` name, so mislabeled photos import fine.

---

## 2. Set the title, story & details — `src/lib/artwork-meta.ts`

By default each piece shows an obvious placeholder ("Untitled No. 01", a
placeholder story, dimensions guessed from the photo's shape). To set **real**
values, add an entry to the `OVERRIDES` map keyed by slug:

```ts
const OVERRIDES: Record<string, Partial<ArtworkMeta>> = {
  "img-0364": {
    title: "Low Tide, Morning",
    story: "Painted over three weeks on the north coast…",
    medium: "Oil and cold wax on linen",
    dimensions: "70 × 100 cm",
    year: "2025",
    status: "available", // or "sold"
  },
};
```

Only include the fields you want to override; the rest keep their placeholder.
This title + story shows on the gallery detail view and the product page.

---

## 3. Choose which paintings are in the shop & set prices — `src/lib/demo-data.ts`

The **gallery** shows every painting; the **shop** lists a curated front set.

- `SHOP_COUNT` — how many paintings become shop listings (the first N in the
  manifest).
- `DRAFT_PRICE_CENTS` — the placeholder price applied to every listing, in pence
  (e.g. `45000` = £450). Deliberately uniform so nothing reads as a final price.

To price pieces **individually**, give each its own value here (this is the file
the future admin replaces). Prices are in **integer pence** — never decimals.

> In `COMMERCE_MODE=inquiry`, prices aren't charged at all — buying happens by
> conversation, so the price is just indicative.
>
> **With a database (Path B / card checkout):** the shop reads products from the
> DB, not this file. Load/refresh them with `npm run db:seed:paintings` and set
> real per-piece prices in `src/db/seed-paintings.ts`. See `docs/GO-LIVE.md`.

---

## 4. Put paintings into collections — `src/lib/collections.ts`

Collections group paintings into series, each with its own page and story.
Edit the `COLLECTIONS` array:

- `title` / `story` — the collection's name and narrative (currently
  placeholders).
- `coverSlug` — which painting is the cover.
- `paintingSlugs` — the ordered list of slugs in the collection.

**Rule:** every painting should appear in exactly one collection. There's a unit
test (`collections.test.ts`) that fails if a slug is missing or double-assigned —
run `npm test` after editing and it'll tell you.

---

## 5. Add reviews — `src/lib/reviews.ts`

Reviews show on the home page (general ones) and on a painting's detail view /
product page (ones tied to it). Add entries to the `REVIEWS` array:

- `productSlug: null` → a general testimonial (home page).
- `productSlug: "img-0364"` → tied to that painting.
- `rating` is 1–5; `verified` stays `false` for hand-written ones.

All current reviews are clearly-labelled **placeholders** — replace them with
real customer words before launch. (Once the shop is selling and the database is
live, real purchase-verified reviews replace these automatically.)

---

## 6. After editing — check it

```powershell
npm test          # data-integrity tests (collections, reviews, pricing)
npm run build     # confirms everything compiles
```

Then commit and push — Vercel redeploys automatically. To preview locally,
`npm run dev` and open <http://localhost:3000>.

---

## Quick reference — what lives where

| To change… | Edit | Keyed by |
|---|---|---|
| The photo / accent colour | `paintings/` + re-run the import script | filename |
| Title, story, medium, size, year, sold/available | `src/lib/artwork-meta.ts` | slug |
| Which paintings are in the shop + price | `src/lib/demo-data.ts` | order / slug |
| Collection name, story, members, cover | `src/lib/collections.ts` | slug |
| Reviews (home + per-painting) | `src/lib/reviews.ts` | slug / null |
