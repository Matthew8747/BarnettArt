# Design Spec — Collections, Reviews, Painting Detail, Shipping, Legal & Docs

**Date:** 2026-06-07
**Branch:** `phase-2-commerce`
**Status:** Approved design → implementation plan next.

> Single source of truth for this batch of work. Architecture context:
> [`anna-art-platform-plan.md`](../../anna-art-platform-plan.md);
> build status: [`IMPLEMENTATION.md`](../../IMPLEMENTATION.md).

---

## 1. Context & constraints

The live site runs in **demo mode** (no `DATABASE_URL`): the catalog and gallery
are built from `src/lib/gallery-manifest.json` (26 paintings in `public/gallery/`)
via `src/lib/demo-data.ts`. The admin UI and DB writes are a later phase and are
**not built yet**. Therefore:

- **Everything in this batch is built into the manifest/data-file layer** so it
  appears on the live Vercel demo immediately.
- Data **types are shaped to migrate cleanly into Postgres** later (a `reviews`
  table, `collections` table/column, artwork metadata columns).
- The generated `gallery-manifest.json` is **never hand-edited** — all added
  content (collections, per-painting story/metadata) lives in **separate
  data files keyed by painting slug**, so re-running `scripts/import-paintings.mjs`
  cannot wipe it.

All placeholder content is **unmistakably draft** (titles, prices, stories,
collection names, reviews) so nothing reads as a final, confirmed listing.

---

## 2. Data layer (new files)

### 2.1 `src/lib/collections.ts`
```ts
export type Collection = {
  slug: string;          // url segment, e.g. "tidal"
  title: string;         // PLACEHOLDER name
  story: string;         // PLACEHOLDER narrative (clearly draft)
  coverSlug: string;     // painting slug used as the cover image
  paintingSlugs: string[]; // ordered members (subset of manifest slugs)
};
```
- Define **4** placeholder collections partitioning all 26 paintings
  (≈6–7 each). Every painting belongs to exactly one collection.
- Helpers: `getCollections()`, `getCollection(slug)`,
  `getCollectionForPainting(paintingSlug)`, `getCollectionPaintings(slug)`
  (joins to `gallery.ts` items, preserving order).
- Pure data + lookups; no DB import. Unit-tested for: every manifest slug is
  assigned exactly once, every `coverSlug`/member slug exists, slugs unique.

### 2.2 `src/lib/reviews.ts`
```ts
export type Review = {
  id: string;
  author: string;        // PLACEHOLDER, e.g. "Sample Collector"
  rating: number;        // 1..5 integer
  body: string;          // PLACEHOLDER text, clearly sample
  productSlug: string | null; // null = general (home page); else ties to a painting/product slug
  dateISO: string;       // YYYY-MM-DD
  verified: boolean;     // false for all placeholders; true later = purchase-linked
};
```
- ~6–8 placeholder reviews: a few general (home), several tied to specific
  painting slugs. All `verified: false`.
- Helpers: `getFeaturedReviews(n)`, `getReviewsForProduct(slug)`,
  `getAverageRating(slug)` (returns `{ average, count }` or null).
- Unit-tested: rating bounds (1–5), average maths, product filtering, every
  non-null `productSlug` exists in the manifest.
- **Migration note (in-file comment):** mirrors a future `reviews` table; the
  display components read only these helpers, so swapping the data source to the
  DB later is a one-file change with no UI edits.

### 2.3 `src/lib/artwork-meta.ts`
```ts
export type ArtworkMeta = {
  story: string;         // PLACEHOLDER background/story
  medium: string;        // PLACEHOLDER, e.g. "Mixed media on canvas"
  dimensions: string;    // PLACEHOLDER, e.g. "60 × 80 cm"
  year: string;          // PLACEHOLDER, e.g. "2025"
  status: "available" | "sold"; // placeholder availability signal
};
```
- A record keyed by painting slug, with a `getArtworkMeta(slug)` returning a
  sensible default for any unlisted slug. Placeholder content for all 26.
- Consumed by the painting detail view and `/shop/[slug]`.

---

## 3. UI / pages

### 3.1 Painting detail view (the lightbox rebuild) — primary ask
Rebuild `src/components/GalleryGrid.tsx`'s lightbox from an image-only overlay
into a **two-pane overlay** (no full page navigation):

- **Left/top:** the artwork (`large`), object-contained, `hero-rise` in.
- **Right/bottom:** a scrollable info panel —
  - eyebrow: collection name (links to `/collections/[slug]`)
  - title (placeholder)
  - medium · dimensions · year (placeholders) + availability
  - **story/background** (placeholder)
  - the piece's **reviews** (stars + body) if any
  - CTA: "Enquire about this piece" (always) and, in `checkout` mode for shop
    items, a link to the shop product.
- Keep existing keyboard support (Esc / ← / →), scroll-lock, accent theming,
  and `prefers-reduced-motion` behaviour.
- Responsive: side-by-side on wide screens, stacked (image then info) on narrow.
- Accessibility: `role="dialog"`, labelled by title, focusable close, panel
  scrollable independently.

### 3.2 Collections
- **`/collections`** — index page. Each collection = card (cover image +
  placeholder name + story snippet + count), themed with the cover's accent.
- **`/collections/[slug]`** — header (placeholder title + full placeholder
  story) above a `GalleryGrid` of that collection's paintings. `generateMetadata`
  per collection. `notFound()` for unknown slugs.
- **Gallery filter chips** — `/gallery` gains an accessible filter row
  (All + each collection). Implemented in `GalleryGrid` (client) by passing all
  items plus a slug→collection map and filtering in state. Default "All".

### 3.3 Reviews placement
- **Home page** (`src/app/page.tsx`): a new "What collectors say" section
  rendering `getFeaturedReviews(3)` — stars + body + placeholder author. Clearly
  styled as testimonials, marked sample.
- **`/shop/[slug]`**: a reviews block (average rating + list) from
  `getReviewsForProduct(slug)`; plus the artwork story/medium/dimensions/year
  from `artwork-meta.ts` woven into the existing details column.

### 3.4 Navigation
- Add **"Collections"** to the header and footer nav (`SiteChrome.tsx` /
  `StoreShell.tsx` — whichever holds nav; confirm at implementation).

---

## 4. Shipping

Implement the placeholder in `src/lib/pricing.ts#computeShippingCents`:

- Named constants: `FLAT_SHIPPING_CENTS = 695` (£6.95),
  `FREE_SHIPPING_THRESHOLD_CENTS = 15000` (£150).
- Rule: subtotal `>=` threshold → £0; else flat fee. (Empty cart → £0.)
- Unit tests: below threshold, at threshold, above, empty.
- Surface the policy text on the Terms page and ensure the checkout session
  passes the computed shipping (verify `src/app/api/checkout/route.ts`).
- **Editability note (documented):** the constant is a one-line edit + redeploy.
  For dashboard-level control without redeploy, it can be moved to a Stripe
  shipping rate (`shipping_options` on the Checkout Session) later — documented
  in `EXTERNAL-SETUP.md`, not implemented now (rarely used).

---

## 5. Legal pages (made sound, honestly)

Update `src/app/privacy/page.tsx` and `src/app/terms/page.tsx`:

- **Privacy:** keep structure; set retention to a UK-sensible default
  (order/accounting records **6 years**, per HMRC norms) as a clearly-labelled
  default Anna can adjust; keep lawful bases (contract + legitimate interests);
  confirm **essential-cookies-only → no consent banner**.
- **Terms:** add the **14-day right to cancel** (Consumer Contracts
  (Information, Cancellation and Additional Charges) Regulations 2013) **with the
  commissioned/personalised-work exemption** stated explicitly; describe the
  shipping policy (§4); GBP pricing; VAT-status line.
- **Genuinely unknowable identity details** (legal/trading name, business
  address, contact email, VAT status, delivery regions) remain as
  **clearly-marked `[PLACEHOLDER]`** — these are Anna's to supply; the user has
  her info and will plug them in.
- New **`docs/LEGAL-CHECKLIST.md`**: exact list of placeholders to replace, what
  each means, and source links; states that a privacy policy is legally required
  under UK GDPR and that no cookie banner is needed while only essential cookies
  are used. Recommends (does not require) a solicitor/template-service final
  glance before going live.

---

## 6. Docs refinement

- **`EXTERNAL-SETUP.md` / `MANUAL-TODO.md`:** tighten into precise per-key steps —
  for each secret: what it is, where to get it (URL + dashboard path), the exact
  **local `.env` var** and the exact **Vercel env var** + which environment.
  Reaffirm: stay on the base `*.vercel.app` domain until sales justify a custom
  one.
- **New `docs/BUSINESS-NOTES.md`:**
  - UK business registration reality: the **£1,000 trading allowance**, that
    registration as a sole trader is only required once gross trading income
    passes it (by 5 Oct after that tax year), and that **the threshold applies
    separately** to Anna's art and to the engineer's web-design studio.
  - The "own web-design studio for CV/LinkedIn" plan: realistic and worth it;
    sole-trader is free/simple; the honest framing ("designed/built these client
    projects under my studio, for a fee") is legitimate once actually invoiced;
    register only on crossing £1,000.
  - Source links for every claim.

---

## 7. Out of scope (explicitly)

- No database schema migration in this batch (demo-layer first; DB columns/tables
  for collections/reviews/artwork-meta land with the admin phase).
- No admin UI for editing collections/reviews/stories (later phase).
- No Stripe `shipping_options` wiring (documented as the future editable path).
- No cookie consent banner (not required — essential cookies only).
- Real titles/prices/stories remain Anna's to supply; we ship obvious placeholders.

---

## 8. Testing & quality gates

- New unit tests for `collections`, `reviews`, and `pricing` (shipping) keep the
  Vitest suite green (currently 84 cases).
- `npm run typecheck`, `npm run lint`, `npm run build` must pass.
- Verify the live demo paths render: `/collections`, `/collections/[slug]`,
  gallery filter, the rebuilt lightbox, home reviews, `/shop/[slug]` reviews.

---

## 9. File map (anticipated)

**New:** `src/lib/collections.ts` (+ `.test.ts`), `src/lib/reviews.ts`
(+ `.test.ts`), `src/lib/artwork-meta.ts`, `src/app/collections/page.tsx`,
`src/app/collections/[slug]/page.tsx`, `docs/LEGAL-CHECKLIST.md`,
`docs/BUSINESS-NOTES.md`.

**Edited:** `src/components/GalleryGrid.tsx` (two-pane lightbox + filter),
`src/app/gallery/page.tsx`, `src/app/page.tsx` (reviews section),
`src/app/shop/[slug]/page.tsx` (story + reviews), `src/lib/pricing.ts`
(+ `pricing.test.ts`), `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`,
nav component(s), `docs/EXTERNAL-SETUP.md`, `docs/MANUAL-TODO.md`,
`docs/IMPLEMENTATION.md` (status update).
