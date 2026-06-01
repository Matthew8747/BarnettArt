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
npm install        # also installs git hooks (husky)
npm run dev:up     # .env + Postgres + migrations + dev server, one command
```

`dev:up` creates `.env` from the example if missing, starts the Postgres
container and waits for it, applies migrations (generating the first one if
needed), then launches the dev server at `http://localhost:3000`. Requires
Docker Desktop running. Stop the DB with `npm run dev:down`.

Health check: `http://localhost:3000/api/health`

## Git hooks (automatic)

Installed via husky on `npm install`:

- **pre-commit** — `lint-staged` auto-fixes ESLint + Prettier on staged files,
  then a `gitleaks` secret scan (if gitleaks is installed) blocks committing keys.
- **pre-push** — `npm run typecheck` mirrors the CI gate so type errors surface
  before they reach the remote.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `test:watch` | Vitest unit tests (run once / watch) |
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
  lib/                 # env (Zod), stripe, rate-limit, money, validation
                       #   + co-located *.test.ts (Vitest)
docs/                  # plan, implementation, runbook, handover, setup,
                       #   security audit, design system
drizzle/               # generated migrations (after db:generate)
```

## Security

See [`SECURITY.md`](SECURITY.md) and the full OWASP Top-10 mapping +
remaining-findings list in [`docs/SECURITY-AUDIT.md`](docs/SECURITY-AUDIT.md).
Highlights: secrets never in git, server-side pricing, signature-verified
webhooks, hardened headers + CSP, parameterised queries, input validation with
size/shape limits (`src/lib/validation.ts`), rate limiting (auth = 5 attempts /
15 min), and automated dependency + secret scanning + unit tests in CI.

## Design

Look, feel, and motion decisions (with backtrack notes) live in
[`docs/DESIGN.md`](docs/DESIGN.md): dark-immersive theme, per-artwork accent
colour with an artist override, and reduced-motion-aware animation.
