# Implementation Status & Roadmap

> **Single source of truth for what is built and what is next.** Update this file
> whenever you complete or start a piece of work. The architecture reference is
> [`anna-art-platform-plan.md`](./anna-art-platform-plan.md).

**Last updated:** 2026-06-01 (Phase 2a)
**Decisions locked:** Hybrid hosting (Vercel app + AWS media) · Drizzle ORM ·
Originals + Prints · Stripe, UK-only (GBP) · **Stripe Checkout (hosted)** ·
signed-cookie cart · Auth.js passwordless (admin) · node-vibrant palette
extraction · storage abstraction (local adapter now, S3+CloudFront later).

> **Manual steps you must do** (accounts, secrets, local services): see
> [`MANUAL-TODO.md`](./MANUAL-TODO.md).
>
> **Prototype:** set `DEMO_MODE=true` to run with **no database/Stripe** — the
> storefront serves a curated in-repo catalog of sample paintings
> (`src/lib/demo-data.ts`, images in `public/sample-art/`). Deployable to a
> Vercel preview with zero external services; see MANUAL-TODO §0.

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
| ✅ | Design system: dark-immersive theme | `globals.css` tokens (`--bg/--panel/--text/--accent…`), Fraunces display + Geist body, ambient glows |
| ✅ | Theme/accent provider | `AccentScope` writes `--accent`/`--accent-text`/`--accent-soft` per subtree (server-side, no flicker) |
| ✅ | Motion utilities (reduced-motion aware) | `Reveal` (scroll), `.hover-lift`, `hero-rise`, `CursorGlow` (desktop only); all honour `prefers-reduced-motion` |
| ✅ | Accent contrast guard | `src/lib/color.ts` clamps accent-as-text to ≥4.5:1 on dark; `src/lib/accent.ts` resolves accent + builds CSS vars |
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
| ⬜ | Playwright E2E: full checkout incl. replayed webhook | needs Stripe CLI + live DB (see MANUAL-TODO) |
| ⬜ | Real shipping rules | currently free (placeholder); awaiting Anna's policy |

> **Oversell handling:** if a paid order can't claim stock (already sold), the
> line is logged for a **manual Stripe refund** — payment is real, so it's never
> silently dropped. See `RUNBOOK.md`.

## Phase 3 — Portfolio & polish

| Status | Item |
|--------|------|
| ⬜ | Portfolio: home, gallery, about, contact (per `DESIGN.md`) |
| ⬜ | Motion polish: scroll reveals, hover/cursor effects (honour `prefers-reduced-motion`) |
| ⬜ | SEO: metadata, sitemap, structured data (Product schema) |
| ⬜ | Accessibility pass (incl. accent-on-dark contrast clamp) + Core Web Vitals |
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
