# Implementation Status & Roadmap

> **Single source of truth for what is built and what is next.** Update this file
> whenever you complete or start a piece of work. The architecture reference is
> [`anna-art-platform-plan.md`](./anna-art-platform-plan.md).

**Last updated:** 2026-06-07 (Phase 2c — collections, reviews, painting detail, shipping, legal)
**Decisions locked:** Hybrid hosting (Vercel app + AWS media) · Drizzle ORM ·
Originals + Prints · Stripe, UK-only (GBP) · **Stripe Checkout (hosted)** ·
**`COMMERCE_MODE` toggle (checkout now → enquiry later)** · signed-cookie cart ·
Auth.js passwordless (admin) · node-vibrant palette extraction · storage
abstraction (local adapter now, S3+CloudFront later) · light "gallery wall"
design system (`DESIGN.md`).

> **Setup, manual steps & API keys** (accounts, secrets, local services, what
> Anna still needs to provide): see [`EXTERNAL-SETUP.md`](./EXTERNAL-SETUP.md).
> **Adding/editing paintings:** [`ADDING-PAINTINGS.md`](./ADDING-PAINTINGS.md).
> **Docs index:** [`README.md`](./README.md).
>
> **Prototype:** runs with **no database/Stripe** whenever `DATABASE_URL` is
> unset (or `DEMO_MODE=true`) — the storefront serves an in-repo catalog built
> from Anna's real paintings (`src/lib/demo-data.ts` over
> `src/lib/gallery-manifest.json`, images in `public/gallery/`). Deployable to a
> Vercel preview with zero external services; see EXTERNAL-SETUP §0a.

---

## Legend

| Mark | Meaning |
|------|---------|
| ✅ | Done |
| 🚧 | In progress |
| ⬜ | Not started |
| 🔒 | Blocked on an external action (see [EXTERNAL-SETUP.md](./EXTERNAL-SETUP.md)) |

---

## Phase 0 — Foundations (groundwork)

| Status | Item | Notes |
|--------|------|-------|
| ✅ | Next.js 16 + TypeScript + Tailwind 4 scaffold | App Router, `src/`, import alias `@/*` |
| ✅ | `package.json` scripts | dev/build/lint/typecheck/format/db:* |
| ✅ | `.gitignore` hardened | secrets, terraform, env all ignored |
| ✅ | `.env.example` | every var documented; no real secrets |
| ✅ | Boot-time env validation | `src/lib/env.ts` (Zod), fails fast |
| ✅ | Security headers + CSP | `next.config.ts` (HSTS, CSP, X-Frame-Options…) |
| ✅ | Secret scanning config | `.gitleaks.toml` + CI step |
| ✅ | Drizzle schema | `src/db/schema.ts` (products, variants, images, orders, order_items) |
| ✅ | DB client | `src/db/index.ts` (postgres-js, server-only, pooled) |
| ✅ | Local Postgres | `docker-compose.yml` (Postgres 17) |
| ✅ | Rate limiting | `src/lib/rate-limit.ts` (auth 5/15min, checkout, webhook, admin, api; Upstash + in-memory dev fallback) |
| ✅ | Input validation guard | `src/lib/validation.ts` — body-size cap (413), malformed-JSON reject (400), Zod `.strict()` (400) |
| ✅ | Unit tests (Vitest) | `*.test.ts` for money, validation, rate-limit (17 cases); gates CI |
| ✅ | Security audit + OWASP map | `docs/SECURITY-AUDIT.md` |
| ✅ | Money helpers | `src/lib/money.ts` (integer pence) |
| ✅ | Stripe server client | `src/lib/stripe.ts` |
| ✅ | Health endpoint | `src/app/api/health/route.ts` |
| ✅ | Stripe webhook handler (stub) | `src/app/api/webhooks/stripe/route.ts` — verifies signature; fulfilment TODO |
| ✅ | CI pipeline | `.github/workflows/ci.yml` (format, lint, typecheck, **test**, build, audit, gitleaks) |
| ✅ | Design system & decisions | `docs/DESIGN.md` — dark-immersive, per-artwork accent + override, motion (approved; pending Anna feedback) |
| ✅ | Dependabot | `.github/dependabot.yml` |
| ✅ | Prettier + EditorConfig | formatting consistency |
| ✅ | Git hooks (husky) | pre-commit: lint-staged + gitleaks; pre-push: typecheck |
| ✅ | One-command dev spin-up | `npm run dev:up` (`scripts/dev.mjs`) |
| ✅ | First DB migration | `drizzle/0000_*.sql` generated |
| ✅ | Legal pages (drafts) | `/privacy`, `/terms` — **must be reviewed by Anna/solicitor** |
| 🔒 | Push to GitHub remote | repo exists; push after sanitising placeholders (done) |

---

## Phase 1 — Core domain (in progress)

> UI work in this phase follows the approved [`DESIGN.md`](./DESIGN.md)
> (dark-immersive theme, per-artwork accent, in-between motion).

**Phase 1a — domain + design foundation (this PR, `phase-1-domain-design`):**

| Status | Item | Notes |
|--------|------|-------|
| ✅ | Schema: per-artwork accent + uniform mode | `accent_hex` (+ DB hex CHECK), `palette_json`, `site_settings` singleton; migration `drizzle/0001_*.sql` |
| ✅ | Design system: light editorial "gallery wall" (redesigned 2026-06-05) | `globals.css` tokens (`--bg #f3efe6` paper / `--panel` / `--text` ink / `--accent #9c4221` sienna), Cormorant Garamond display + Hanken Grotesk body, paper grain + faint vignette (no glow). See `docs/DESIGN.md` |
| ✅ | Theme/accent provider | `AccentScope` writes `--accent`/`--accent-text`/`--accent-soft` per subtree (server-side, no flicker) |
| ✅ | Motion utilities (reduced-motion aware) | `Reveal` (scroll), `.hover-lift` + image zoom, `hero-rise`, `.wipe-underline`, `.btn`; all honour `prefers-reduced-motion`. Cursor glow removed in the 2026-06-05 redesign |
| ✅ | Accent contrast guard | `src/lib/color.ts` `clampAccentForText` is direction-aware (darkens accent-as-text to ≥4.5:1 on the paper canvas `PAGE_BG`); `src/lib/accent.ts` resolves accent + builds CSS vars |
| ✅ | Palette extraction (admin-time) | `src/lib/palette.ts` via `node-vibrant`; server-only, never on the client |
| ✅ | Storage abstraction + local adapter | `src/lib/storage/*` — `Storage` interface + `LocalStorage` (S3 adapter swaps in with no call-site changes) |
| ✅ | Product query layer (typed, parameterised) | `src/db/products.ts` (`listAvailableProducts`, `getProductBySlug`, `listAllProducts`), `src/db/settings.ts` |
| ✅ | Gallery + animated product detail page | `/shop` grid + `/shop/[slug]`; per-artwork accent retint; SSR (force-dynamic so availability is always current) |
| ✅ | Seed script with sample artwork | `npm run db:seed` — generates abstract art, extracts palettes, stores via adapter, inserts 6 products |
| ✅ | Unit tests for new logic | color (13), accent (8), storage (6), palette (2) — suite now 48 tests |

**Phase 1b — admin (next PR):**

| Status | Item | Notes |
|--------|------|-------|
| ⬜ | Apply migration to a live DB | `npm run dev:up` (Docker Postgres) then `db:migrate` + `db:seed` — local verification step |
| ⬜ | Admin auth | **Decided:** Auth.js v5 passwordless email magic-links via Resend (£0), JWT sessions, `ADMIN_EMAILS` allow-list, `limiters.auth` |
| ⬜ | Admin: product CRUD + image upload | uses the storage adapter + `extractPalette` on upload |
| ⬜ | Admin: accent controls | extracted swatches + colour picker (per `DESIGN.md` §2) |
| ⬜ | Admin: uniform-mode toggle | edits `site_settings` (no deploy) |
| 🔒 | Image pipeline: S3 upload + CloudFront | blocked on AWS ([EXTERNAL-SETUP.md](./EXTERNAL-SETUP.md)); add `S3Storage` implementing `Storage`, select in `getStorage()` |

## Phase 2 — Commerce (the critical path, in progress)

> **Decisions:** Cart = HMAC-signed cookie (prices never trusted from it).
> Checkout = **Stripe Checkout (hosted)** — PCI SAQ-A, minimal UI, £0; backtrack
> to embedded Elements later if on-site payment is wanted.

**Phase 2a — commerce core (this PR, `phase-2-commerce`):**

| Status | Item | Notes |
|--------|------|-------|
| ✅ | Cart (signed cookie) | `src/lib/cart.ts` (pure ops + HMAC sign/verify) + `cart-cookie.ts` (HttpOnly); server-action driven, works without JS |
| ✅ | Server-side price computation | `src/lib/pricing.ts` (+ `priceCartFromDb`); originals forced qty 1, variant prices from DB, stock-capped; cart never supplies price |
| ✅ | Stripe Checkout Session endpoint (rate-limited) | `src/app/api/checkout/route.ts` — same-origin guard, `limiters.checkout`, UK shipping address |
| ✅ | Webhook fulfilment (transaction) | `src/db/orders.ts#fulfilOrder` → mark paid + **atomic** stock decrement (original→sold; variant conditional UPDATE + DB CHECK) |
| ✅ | Idempotency keyed on event id | `processed_events` ledger inserted in the same tx; duplicate Stripe deliveries no-op |
| ✅ | Order confirmation email (Resend) | `src/lib/email.ts` (REST, no SDK dep); dev no-op without key; best-effort, never blocks the webhook |
| ✅ | Cart UI + checkout | `/cart`, add-to-cart on detail page, header count, `/shop/success` (clears cart) |
| ✅ | Vitest unit tests | cart (12) + pricing (8); suite now **68** |
| ⬜ | Playwright E2E: full checkout incl. replayed webhook | needs Stripe CLI + live DB (see EXTERNAL-SETUP) |
| ✅ | Real shipping rules | flat £6.95, free over £150 (placeholders) in `computeShippingCents`; passed to Stripe as `shipping_options`; 5 tests |

> **Oversell handling:** if a paid order can't claim stock (already sold), the
> line is logged for a **manual Stripe refund** — payment is real, so it's never
> silently dropped. See `RUNBOOK.md`.

**Phase 2b — gallery, enquiries, commerce model (`phase-2-commerce`):**

| Status | Item | Notes |
|--------|------|-------|
| ✅ | Painting import pipeline | `scripts/import-paintings.mjs` — HEIC→web (sharp + `heic-convert` fallback), EXIF/GPS stripped, node-vibrant accent, → `public/gallery/` + `src/lib/gallery-manifest.json` (26 works) |
| ✅ | Gallery showcase | `/gallery` masonry (true aspect ratios) + keyboard-accessible lightbox; manifest-driven |
| ✅ | Shop wired to real paintings | `src/lib/demo-data.ts` builds placeholder products from the manifest (titles/prices are drafts) |
| ✅ | **Commerce-model toggle** | `COMMERCE_MODE` (`checkout`\|`inquiry`) in `env.ts`; checkout API + cart + product CTAs switch to "Enquire to buy" in inquiry mode |
| ✅ | Direct-communication feature | `/contact` form → `POST /api/contact` (Zod `.strict()`, rate-limited `limiters.contact` 5/h, honeypot, same-origin) → `sendContactMessage` (Resend, reply-to, dev no-op) |
| ✅ | "Enquire about this piece" | product page + gallery lightbox deep-link to `/contact?artwork=…` |
| ✅ | Portfolio base (home) | story-driven editorial home: painter/engineer hero, selected work, practice essay, enquiry CTA; reduced-motion aware |
| ✅ | Bugfix | `COMMERCE_MODE` empty-string `.default()` gap would crash boot — fixed with preprocess |
| ✅ | Vitest unit tests | contact schema (8) + commerce-mode/contact-email env (5); suite now **84** |

> **Note:** titles/prices/stories on imported paintings are placeholders — see
> [`ADDING-PAINTINGS.md`](./ADDING-PAINTINGS.md) and EXTERNAL-SETUP §A.

**Phase 2c — collections, reviews, painting detail, shipping, legal (`phase-2-commerce`):**

| Status | Item | Notes |
|--------|------|-------|
| ✅ | Collections | `src/lib/collections.ts` (4 placeholder collections partition all 26 works); `/collections` index + `/collections/[slug]`; gallery filter chips; nav links; 7 tests |
| ✅ | Reviews | `src/lib/reviews.ts` (placeholder, `verified:false`, DB-ready); home "What collectors say" + per-product block + lightbox; 5 tests |
| ✅ | Painting detail view | `GalleryGrid` lightbox rebuilt to a two-pane overlay (artwork + story/medium/dimensions/year/reviews/enquire); `src/lib/artwork-meta.ts` (per-slug, override map) |
| ✅ | Shipping rules | flat £6.95 / free over £150 in `pricing.ts`; wired to Stripe `shipping_options`; 5 tests |
| ✅ | Legal pages made sound | privacy (UK GDPR, essential-cookies-only → no banner) + terms (14-day cancel + commissions exemption, CRA 2015, shipping); `docs/LEGAL-CHECKLIST.md` |
| ✅ | Docs | merged MANUAL-TODO→EXTERNAL-SETUP (single setup doc, exact key get/put + shipping); new `ADDING-PAINTINGS.md`, `BUSINESS-NOTES.md`, `docs/README.md` index |
| ✅ | Vitest unit tests | collections (7) + reviews (5) + shipping (5); suite now **101** |

## Phase 3 — Portfolio & polish

| Status | Item |
|--------|------|
| ✅ | Portfolio: home, gallery, collections, contact (per `DESIGN.md`) — *dedicated about page still parked* |
| ✅ | Motion polish: scroll reveals, hover effects (honour `prefers-reduced-motion`) |
| ⬜ | SEO: sitemap, structured data (Product schema) — *metadata done per route* |
| 🚧 | Accessibility pass + Core Web Vitals — *reduced-motion + labels in place; full audit pending* |
| ⬜ | Cookie consent banner (GDPR) |
| ⬜ | CSP hardening: nonce-based script-src (drop `unsafe-inline`) |

## Phase 4 — Productionise

| Status | Item |
|--------|------|
| ⬜ | Terraform: S3 private bucket + CloudFront + ACM (media pipeline) |
| ⬜ | Neon production database + pooled connection |
| ⬜ | Vercel production project + env vars + custom domain |
| ⬜ | Sentry (errors) + uptime monitor on `/api/health` |
| ⬜ | AWS Budget alarm |
| ⬜ | [`RUNBOOK.md`](./RUNBOOK.md) + [`HANDOVER.md`](./HANDOVER.md) finalised |
| ⬜ | Anna admin walkthrough |

---

## Known follow-ups / tech debt

- **CSP `unsafe-inline` on scripts** — acceptable for groundwork; replace with a
  per-request nonce in Phase 3 (`next.config.ts`).
- **Stripe API version pin** — confirm `apiVersion` in `src/lib/stripe.ts`
  matches your Stripe dashboard's current version before going live.
- **Legal pages are drafts** — `/privacy` and `/terms` need Anna's real business
  details and a solicitor/template-service review before launch.
- **Storefront is `force-dynamic`** — correct for live inventory, but revisit a
  data-cache/ISR strategy in Phase 3 for Core Web Vitals.
- **`node-vibrant` pulls a moderate-severity transitive dep** (`file-type` ASF
  loop). Dev/admin-time only, on Anna's own trusted images; CI gate is high-only.
  Re-check on `node-vibrant` updates.
- **Storefront images use the local-disk adapter** — `public/uploads` is
  git-ignored, so a fresh clone shows an empty gallery until `db:seed` runs.
  Real media lands with the S3 adapter (Phase 1b/4, blocked on AWS).
- **ESLint pinned to v9** — the Dependabot bump to ESLint 10 is incompatible with
  `eslint-config-next` 16 (`react/display-name` crashes). Revert the pin when
  the Next ESLint config supports v10.
- **Free shipping placeholder** — `computeShippingCents` returns 0; replace with
  Anna's real shipping rules (one function, with tests) once decided.
- **Checkout creates a pending order up front** — if payment is abandoned, a
  `pending` order lingers (no stock reserved, so harmless). Add a periodic
  cleanup of stale pending orders in Phase 4 if they accumulate.
