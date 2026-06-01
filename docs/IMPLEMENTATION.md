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
| ✅ | Rate limiting | `src/lib/rate-limit.ts` (Upstash + in-memory dev fallback) |
| ✅ | Money helpers | `src/lib/money.ts` (integer pence) |
| ✅ | Stripe server client | `src/lib/stripe.ts` |
| ✅ | Health endpoint | `src/app/api/health/route.ts` |
| ✅ | Stripe webhook handler (stub) | `src/app/api/webhooks/stripe/route.ts` — verifies signature; fulfilment TODO |
| ✅ | CI pipeline | `.github/workflows/ci.yml` (lint, typecheck, build, audit, gitleaks) |
| ✅ | Dependabot | `.github/dependabot.yml` |
| ✅ | Prettier + EditorConfig | formatting consistency |
| ✅ | Legal pages (drafts) | `/privacy`, `/terms` — **must be reviewed by Anna/solicitor** |
| 🔒 | First DB migration generated | run `npm run db:generate` after `npm install` + `.env` |
| 🔒 | Push to GitHub remote | needs the repo created (see EXTERNAL-SETUP) |

---

## Phase 1 — Core domain (next up)

| Status | Item |
|--------|------|
| ⬜ | Generate + apply initial migration (`db:generate` → `db:migrate`) |
| ⬜ | Product repository/query layer (typed, parameterised) |
| ⬜ | Product listing page (SSR/ISR) + detail page |
| ⬜ | Image pipeline: S3 upload + CloudFront serving + `next/image` |
| ⬜ | Admin auth (allow-listed email + protected route) |
| ⬜ | Admin: product CRUD (create/edit/archive, variants, images) |
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
| ⬜ | Vitest unit tests: pricing, inventory, validation |
| ⬜ | Playwright E2E: full checkout incl. replayed webhook |

## Phase 3 — Portfolio & polish

| Status | Item |
|--------|------|
| ⬜ | Portfolio: home, gallery, about, contact |
| ⬜ | SEO: metadata, sitemap, structured data (Product schema) |
| ⬜ | Accessibility pass + Core Web Vitals |
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
