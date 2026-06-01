# External Setup — Your Action Checklist

Everything in this file is something **you (the engineer) or Anna must do outside
the code**: create accounts, copy keys, connect services. The codebase is ready
to consume each value via `.env` (local) and the Vercel dashboard (production).

> **Golden rule on ownership:** Any account that touches **money or the legal
> identity of the shop** must be created in **Anna's name** — Stripe, the bank
> account, the domain, and ideally the AWS billing account. You are the *builder*,
> not the merchant of record. You can be granted team/collaborator access. This
> protects both of you and is the professional default.

Legend: 🟢 do now (unblocks local dev) · 🟡 before first deploy · 🔵 before launch.

---

## 0. 🟢 Local development (no external accounts needed)

You can run the whole app locally before signing up for anything.

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and
   [Node.js 20+](https://nodejs.org).
2. In the project root:
   ```powershell
   npm install        # installs deps + git hooks
   npm run dev:up     # one command: .env + Postgres + migrations + dev server
   ```
3. Visit `http://localhost:3000/api/health` — you should get `{"status":"ok"}`.
4. **(Recommended) Install [gitleaks](https://github.com/gitleaks/gitleaks#installing)**
   so the pre-commit hook can scan for secrets locally before they're committed
   (the same check that runs in CI). On Windows: `winget install gitleaks` or
   `scoop install gitleaks`.

The app boots with placeholder Stripe/Upstash/Resend values in development; those
integrations only become required in production (enforced by `src/lib/env.ts`).

---

## 1. 🟢 GitHub repository

**Why:** version control + CI.

1. Create a **private** repo on GitHub (suggested name: `barnett-art`).
2. Connect this local repo and push:
   ```powershell
   git remote add origin https://github.com/<you>/barnett-art.git
   git add .
   git commit -m "Foundations: scaffold, security baseline, data model, CI"
   git push -u origin main
   ```
3. The CI workflow runs automatically on push (lint, typecheck, build, audit,
   secret scan). No setup beyond pushing.

**Produces:** nothing for `.env`; enables CI + Vercel/Dependabot integration.

---

## 2. 🟡 Stripe (payments) — **Anna's account**

**Why:** takes payments. Card data never touches our servers (PCI SAQ-A).

1. Anna creates a Stripe account at <https://dashboard.stripe.com> and completes
   business verification (needs business/bank details — that's why it's hers).
2. Add you as a team member (Settings → Team) with developer access.
3. Stay in **Test mode** for all development. Copy from Developers → API keys:
   - **Publishable key** (`pk_test_…`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (`sk_test_…`) → `STRIPE_SECRET_KEY`
4. **Webhook secret** for local testing — install the Stripe CLI and run:
   ```powershell
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   The CLI prints a `whsec_…` secret → `STRIPE_WEBHOOK_SECRET`.
5. For production you'll later add a webhook endpoint in the dashboard pointing at
   `https://<your-domain>/api/webhooks/stripe`, which gives a separate live
   `whsec_…` for Vercel.

**Produces:** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
`STRIPE_WEBHOOK_SECRET`.

---

## 3. 🟡 Neon (production PostgreSQL)

**Why:** managed Postgres for production; local dev uses Docker.

1. Sign up at <https://neon.tech> (free tier is fine to start).
2. Create a project in region **eu-west-2 (London)** to match Anna's UK customers.
3. Copy the **pooled** connection string (it includes `?sslmode=require`).

**Produces:** production `DATABASE_URL` (set in Vercel, **not** committed).

---

## 4. 🟡 Upstash (rate-limiting Redis)

**Why:** distributed rate limiting on checkout/auth/webhooks. Dev falls back to
in-memory, so this is only required for production.

1. Sign up at <https://console.upstash.com> and create a **Redis** database
   (region near your Vercel deployment, e.g. eu-west-1).
2. From the database page, copy the **REST URL** and **REST token**.

**Produces:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

---

## 5. 🟡 Resend (transactional email)

**Why:** order confirmation emails.

1. Sign up at <https://resend.com>.
2. Add and **verify Anna's sending domain** (DNS records — see §8). Until the
   domain is verified you can use Resend's test sender for development.
3. Create an API key.

**Produces:** `RESEND_API_KEY`, `EMAIL_FROM` (a verified address on Anna's domain).

---

## 6. 🟡 Vercel (app hosting)

**Why:** hosts the Next.js app; rock-solid, zero server maintenance.

1. Sign up at <https://vercel.com> and **import the GitHub repo**.
2. Framework preset auto-detects Next.js. No build config needed.
3. In **Project → Settings → Environment Variables**, add the production values
   (the live counterparts of everything in `.env.example`): `DATABASE_URL`
   (Neon), Stripe **live** keys, Upstash, Resend, AWS media vars, `ADMIN_EMAILS`,
   and `NEXT_PUBLIC_SITE_URL` (your production URL).
4. Every push to `main` deploys; every PR gets a preview URL.

**Produces:** the live site + per-PR previews. No `.env` entries (Vercel injects).

---

## 7. 🔵 AWS (media pipeline: S3 + CloudFront) — provisioned by Terraform

**Why:** stores and globally serves Anna's high-resolution artwork. Built with
Terraform in Phase 4 (infra-as-code — nothing clicked by hand).

1. Create an AWS account (billing in Anna's name if she's the merchant).
2. **Set a Budget alarm immediately** (Billing → Budgets) — e.g. alert at £20/mo.
3. Create an IAM user for Terraform with least-privilege (we'll define the exact
   policy in the Terraform phase). Store its keys in your local AWS profile, never
   in the repo.
4. The Terraform we add later creates: a **private** S3 bucket (SSE encryption),
   a CloudFront distribution, and an ACM certificate.

**Produces (later, from Terraform outputs):** `S3_BUCKET_NAME`, `CLOUDFRONT_URL`,
`AWS_REGION`, and app IAM credentials/role.

---

## 8. 🔵 Domain + DNS — **Anna's name**

**Why:** the public address + email deliverability.

1. Anna registers the domain (e.g. `annabarnett.art`) — ~£10–40/yr depending on
   the `.art` TLD. Keep it in her account.
2. Point it at Vercel (Vercel → Domains shows the exact A/CNAME records).
3. Add the **Resend DNS records** (SPF, DKIM, DMARC) so order emails don't land
   in spam.
4. TLS certificates are automatic (Vercel for the app, ACM for CloudFront).

**Produces:** `NEXT_PUBLIC_SITE_URL` (e.g. `https://annabarnett.art`), verified email.

---

## 9. 🔵 Sentry (error monitoring) — optional but recommended

1. Sign up at <https://sentry.io> (free tier) and create a Next.js project.
2. Copy the DSN.

**Produces:** `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`. Wired up in Phase 4.

---

## Quick reference — which step produces which secret

| Env var | From | When |
|---|---|---|
| `DATABASE_URL` (local) | Docker Compose default | 🟢 now |
| `DATABASE_URL` (prod) | Neon (§3) | 🟡 |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe (§2) | 🟡 |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI / dashboard (§2) | 🟡 |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Upstash (§4) | 🟡 |
| `RESEND_API_KEY` / `EMAIL_FROM` | Resend (§5) | 🟡 |
| `S3_BUCKET_NAME` / `CLOUDFRONT_URL` / AWS creds | AWS + Terraform (§7) | 🔵 |
| `NEXT_PUBLIC_SITE_URL` | Domain/Vercel (§6, §8) | 🟡 |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Sentry (§9) | 🔵 |
| `ADMIN_EMAILS` | You decide (Anna's email) | 🟢 |

**Never paste any of these into the repo.** Local → `.env` (git-ignored).
Production → Vercel env vars / AWS Secrets Manager.
