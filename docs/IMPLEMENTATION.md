# Implementation Status & Roadmap

> **Single source of truth for what is built and what is next.** Update this file
> whenever you complete or start a piece of work. The architecture reference is
> [`anna-art-platform-plan.md`](./anna-art-platform-plan.md).

**Last updated:** 2026-06-01
**Decisions locked:** Hybrid hosting (Vercel app + AWS media) · Drizzle ORM ·
Originals + Prints · Stripe, UK-only (GBP).

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

## Phase 1 — Core domain (next up)

> UI work in this phase follows the approved [`DESIGN.md`](./DESIGN.md)
> (dark-immersive theme, per-artwork accent, in-between motion).

| Status | Item |
|--------|------|
| ⬜ | Generate + apply initial migration (`db:generate` → `db:migrate`) |
| ⬜ | Design system: theme/accent provider + motion utilities (reduced-motion aware) |
| ⬜ | Product repository/query layer (typed, parameterised) |
| ⬜ | Product listing/gallery page (SSR/ISR) + animated product detail page |
| ⬜ | Per-artwork accent: extract palette on upload; store `accent_hex` + uniform-mode flag |
| ⬜ | Image pipeline: S3 upload + CloudFront serving + `next/image` |
| ⬜ | Admin auth (allow-listed email + protected route, `limiters.auth`) |
| ⬜ | Admin: product CRUD + accent controls (swatch + picker, uniform override) |
| ⬜ | Seed script with sample artwork for local dev |

## Phase 2 — Commerce (the critical path)

| Status | Item |
|--------|------|
| ⬜ | Cart (signed cookie or DB-backed) |
| ⬜ | Server-side price computation (never trust the client) |
| ⬜ | Stripe PaymentIntent creation endpoint (rate-limited) |
| ⬜ | Webhook fulfilment: transaction → mark paid + atomic stock decrement + email |
| ⬜ | Idempotency keyed on Stripe event id |
| ⬜ | Order confirmation email (Resend) |
| 🚧 | Vitest unit tests: pricing, inventory, validation (validation + money done; inventory/pricing next) |
| ⬜ | Playwright E2E: full checkout incl. replayed webhook |

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
