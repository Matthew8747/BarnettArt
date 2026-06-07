# Design — Gallery, direct-to-Anna enquiries, commerce-model pivot, portfolio base

**Date:** 2026-06-05
**Branch:** `phase-2-commerce`
**Status:** Approved, in implementation.

## Goal

Continue development of Anna Barnett's art platform with four threads:

1. Turn the 26 real painting photos (`paintings/`) into web-ready assets and a
   **Gallery** showcase, plus shop placeholders Anna can edit.
2. Add a **direct-communication-with-Anna** feature (contact / enquiry form).
3. Introduce a **commerce-model toggle** so the site can move from Stripe
   checkout to enquiry-based ordering with a single env var — Stripe is retained
   as a built, demonstrable artifact (CV story), then disabled later.
4. Lay the **base of the portfolio site**: a story-driven, design-led home that
   presents Anna as both painter and engineer, with smooth, restrained motion.

All decisions confirmed with the user 2026-06-05.

## Context

- Next.js 16 App Router + TypeScript, Tailwind v4, Drizzle/Postgres, Stripe,
  Resend, Upstash rate-limit. Light "gallery wall" design system (DESIGN.md).
- Shop currently serves a **demo catalog** (`src/lib/demo-data.ts`) of
  public-domain placeholders; `isDemoMode` (env.ts) drives the no-DB path.
- Existing `src/lib/email.ts` sends order confirmations via Resend with a dev
  no-op fallback — the pattern the contact form reuses.
- `src/lib/rate-limit.ts`, `src/lib/validation.ts` exist and are reused.

## 1. Image pipeline — `scripts/import-paintings.mjs`

One-time, **re-runnable** Node script (not part of the build). For each file in
`paintings/`:

- **HEIC → web:** decode via `sharp` (bundled libheif); if a file can't be
  decoded, fall back to the pure-JS `heic-convert` package (added as a
  `devDependency` only if needed). JPEGs pass straight through.
- **Resize:** a large web image (longest edge ~2000px) and a grid thumbnail
  (~800px), emitted as **WebP + JPEG fallback**.
- **Strip EXIF:** `sharp` re-encode drops all metadata. **Required** — iPhone
  HEIC embeds GPS coordinates of where each painting was photographed; shipping
  them is a privacy leak. (Documented as a security note.)
- **Accent:** extract a dominant accent hex with `node-vibrant`.
- **Output:** optimised images to `public/gallery/`, and a generated
  `src/lib/gallery-manifest.json`: `{ slug, title (placeholder), large, thumb,
  width, height, accentHex }[]`.

Slugs derive from filenames; titles are obvious placeholders (`Untitled —
IMG_0364`) flagged for Anna to rename.

## 2. Gallery page — `/gallery`

Portfolio showcase of every painting. Responsive masonry/grid, per-artwork
accent on hover (thin rule / label, consistent with DESIGN.md — no glows),
click-to-enlarge lightbox. Each tile links to "Enquire about this piece".
Added to header nav and footer.

## 3. Shop placeholders

A manifest-driven set of products joins the catalog with placeholder titles and
**clearly-marked draft prices** (a "draft pricing — to confirm" note in the
admin/handover docs, never a misleading live price). Demo mode keeps working.

## 4. Commerce-model toggle — `COMMERCE_MODE`

New env var, `z.enum(["checkout","inquiry"]).default("checkout")` in `env.ts`,
exported as a helper `commerceMode` / `isInquiryMode`.

- `checkout` (current): Stripe Checkout flow unchanged.
- `inquiry` (the pivot): cart/checkout CTAs render as **"Enquire to buy"**,
  linking to `/contact?artwork=<slug>`. Checkout API returns 403 in inquiry mode
  (defence in depth, mirroring the existing demo-mode guard).

Threaded through: `CheckoutButton`, product detail page, cart page. One env var
flips the whole site. No data migration.

## 5. Direct-communication-with-Anna

- **Page:** `/contact` — intro copy + validated form (name, email, message,
  optional hidden `artwork` ref pre-filled from the query string).
- **Transport:** server action / route `POST /api/contact`:
  - Zod-validated (`contactSchema` in `validation.ts`), length-bounded.
  - **Rate-limited** via existing limiter (per-IP, e.g. 5/hour).
  - Sends to Anna via new `sendContactMessage()` in `email.ts` (Resend REST,
    HTML-escaped, dev no-op log — same shape as `sendOrderConfirmation`).
  - New env `CONTACT_EMAIL` (Anna's inbox); falls back to first `ADMIN_EMAILS`.
- **Entry points:** "Enquire about this piece" on product + gallery tiles;
  Contact in nav + footer.
- **Success/empty states:** inline confirmation; graceful message if email is
  unconfigured (still logs server-side).

## 6. Portfolio base (home redesign)

A design-led home that tells a story, scaled so it's a strong base, not a
finished marketing site. Sections:

1. **Hero** — Anna Barnett, painter & engineer; one-line statement; a featured
   painting; quiet entrance motion.
2. **Selected work** — 3–4 paintings pulled from the manifest → Gallery.
3. **Practice / story** — short editorial prose: the dialogue between painting
   and engineering (design-oriented, text-forward, as requested).
4. **Enquire** — soft CTA into `/contact`.

Motion: reuse existing `Reveal` / wipe-underline / image-zoom utilities; staggered
reveals on scroll; respects `prefers-reduced-motion`. No purple, no glow, no
generic AI aesthetic (per DESIGN.md decision log).

Built with the **frontend-design** skill to keep quality high. Stretch ideas
(below) that exceed this pass are recorded as TODOs in the docs rather than
half-built.

### Stretch ideas → docs TODO (not built now)
- Dedicated `/about` long-form with process imagery.
- Per-painting detail "story" fields (medium, year, narrative).
- Scroll-driven parallax hero; animated SVG signature.
- Case-study write-up of the engineering (the CV artifact).

## 7. Docs

- `EXTERNAL-SETUP.md`: `CONTACT_EMAIL` + `COMMERCE_MODE`; what's needed now
  (Resend for contact) vs later; EXIF/privacy note.
- `anna-art-platform-plan.md` + dated decision entry: **pivot to enquiry-based
  ordering**, Stripe retained then disabled, framed for the CV narrative.
- `HANDOVER.md` / `MANUAL-TODO.md`: editing titles/prices; flipping to inquiry
  mode; portfolio stretch TODOs.

## 8. Testing & verification

- Unit: `contactSchema` validation; commerce-mode helper.
- Keep existing 71 tests green; `typecheck`, `lint`, `build` clean.
- Manual: gallery renders, contact form dev no-op logs, inquiry mode flips CTAs.

## Out of scope

Admin CRUD/auth, real pricing, print-on-demand, AWS media pipeline, the stretch
portfolio ideas above.
