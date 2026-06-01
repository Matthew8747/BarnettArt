# Barnett Art Platform

Production e-commerce + portfolio platform for selling original artwork and
prints. Built to professional standards: secure payments, type-safe data layer,
infrastructure as code, and CI/CD.

> Full architecture: [`docs/anna-art-platform-plan.md`](docs/anna-art-platform-plan.md)
> · Build status & roadmap: [`docs/IMPLEMENTATION.md`](docs/IMPLEMENTATION.md)
> · Setup checklist: [`docs/EXTERNAL-SETUP.md`](docs/EXTERNAL-SETUP.md)

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL — Neon (prod), Docker (local) |
| ORM | Drizzle |
| Payments | Stripe (PaymentIntents + webhooks) — card data never hits our servers |
| Validation | Zod |
| Rate limiting | Upstash Redis (in-memory fallback in dev) |
| Hosting | Vercel (app) + AWS S3/CloudFront (media, via Terraform) |
| CI/CD | GitHub Actions |

## Quick start

```powershell
Copy-Item .env.example .env     # placeholders are fine for local dev
npm install
docker compose up -d            # local Postgres
npm run db:generate             # generate first migration from schema
npm run db:migrate              # apply migrations
npm run dev                     # http://localhost:3000
```

Health check: `http://localhost:3000/api/health`

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` / `format:check` | Prettier write / check |
| `npm run db:generate` | Generate SQL migration from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Drizzle Studio (DB browser) |

## Project layout

```
src/
  app/                 # App Router routes
    api/health/        # liveness probe
    api/webhooks/stripe # Stripe webhook (signature-verified)
    privacy, terms     # legal pages
  db/                  # Drizzle schema + client
  lib/                 # env (Zod), stripe, rate-limit, money
docs/                  # plan, implementation status, runbook, handover, setup
drizzle/               # generated migrations (after db:generate)
```

## Security

See [`SECURITY.md`](SECURITY.md). Highlights: secrets never in git, server-side
pricing, signature-verified webhooks, hardened headers + CSP, parameterised
queries, rate limiting, automated dependency + secret scanning in CI.
