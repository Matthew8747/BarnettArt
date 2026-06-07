# Anna's Art Platform — Full Engineering Plan

A production-grade e-commerce and portfolio platform for selling original artwork and prints, built to professional standards and designed to showcase full-stack, cloud, and security engineering competence.

> **Status:** Planning. Greenfield build. This document is the single source of truth for the architecture and is intended to be handed to Claude Code to begin scaffolding.
>
> **Note on versions:** This plan was written against a January 2026 knowledge baseline. When you scaffold in Claude Code, confirm the latest stable major versions of each dependency (`npm view <pkg> version`) before pinning. The architecture below is version-stable; the exact numbers are not.

---

## 1. Project overview

### 1.1 What this is
A two-part product sharing one codebase and design system:

1. **The shop** — a storefront where customers browse Anna's artwork, view high-fidelity images, and buy originals (one-of-one inventory) and prints (multiple sizes / editions). Includes cart, secure checkout, order confirmation, and an admin area for Anna to manage listings and orders without touching code.
2. **The portfolio** — a curated showcase of Anna's work and practice, linked from the shop. This is the "brand" surface: about, gallery, press, contact. It drives traffic to the shop.

### 1.2 Who it's for
- **Customers** — discover and buy art with confidence (trust signals, secure payment, clear delivery).
- **Anna (admin)** — manage inventory, see orders, update the portfolio, all self-service.
- **You (engineer)** — a real client project with a real brief, deployed to real infrastructure, handling real money. The CV-defining qualities are reliability, security, and operational maturity — not feature count.

### 1.3 Guiding principles
- **It's a real client site first, a portfolio piece second.** Every decision is checked against "does this keep Anna's shop reliable and low-maintenance?" Impressive infrastructure that breaks under her is a net negative. The good news: the genuinely professional choices (managed services, IaC, CI/CD, monitoring) are *also* the most CV-worthy ones.
- **Never touch money or card data directly.** All payment data goes through a PCI-compliant processor. Your servers never see a card number. This is both the secure choice and the simple one.
- **Infrastructure as code, from day one.** Nothing is clicked into existence in a console. Everything is reproducible.
- **Document as you build.** A `RUNBOOK.md` and `HANDOVER.md` are deliverables, not afterthoughts. Being able to hand the site over is part of the professionalism story.

---

## 2. Scope

### 2.1 MVP (ship this first)
- Storefront with product listing and detail pages
- High-quality, optimised art imagery with zoom
- Originals (single inventory) and prints (variants: size, framing)
- Cart and secure checkout via hosted payment flow
- Order confirmation + emailed receipt
- Stock management (an original sold is marked unavailable atomically)
- Admin: create/edit/archive products, view orders, mark fulfilled
- Portfolio: home, gallery, about, contact
- Responsive, accessible, fast (Core Web Vitals green)
- HTTPS, security headers, input validation, rate limiting

### 2.2 Phase 2 (after launch)
- Customer accounts and order history
- Discount / promo codes
- Print-on-demand fulfilment integration (e.g. Prodigi/Printful) so prints ship automatically
- Wishlist / "notify me when a print restocks"
- Newsletter capture + email marketing
- Commission request workflow

### 2.3 Explicitly out of scope (for now)
- Multi-artist marketplace
- Subscriptions
- Native mobile apps
- Internationalisation / multi-currency (add only if Anna sells abroad)

Scoping discipline is itself a CV signal — "I shipped a focused MVP and iterated based on real usage" beats "I built 40 half-finished features."

### 2.4 Commerce model — direct payment now, enquiry-based later

A deliberate product decision, agreed with Anna, captured here as the source of
truth.

**The constraint.** Anna does not want customers buying instantly with one
click. She makes the work by hand and can't commit to the fulfilment volume and
turnaround that frictionless checkout invites. She would rather people **enquire
and order through a conversation with her** — so she can talk through size,
framing, commissions, and timing personally.

**The decision.** We still build the full **Stripe Checkout** integration first
(server-side pricing, Payment Intents, signed idempotent webhooks, atomic
inventory). That is the hard, genuinely impressive engineering and the
centrepiece of the CV story — it must be real, tested, and demonstrable. Then,
when Anna is ready, we **flip the site to enquiry-based ordering**: every buy
button becomes "Enquire to buy" and routes to a contact form that reaches her
directly. Payment is arranged off-platform, by conversation.

**How it's implemented.** A single environment variable, `COMMERCE_MODE`:

- `checkout` (default) — Stripe flow live.
- `inquiry` — direct payment disabled; cart and the `/api/checkout` endpoint
  refuse; CTAs across the product page, gallery and cart become enquiry links.

Flipping it is a one-line change in Vercel + redeploy. **No database migration,
and the Stripe code stays in the repo** — built, working, and on show. This is
the honest, senior framing for interviews:

> **CV line:** "Built a production Stripe Checkout integration — server-side
> pricing, webhook-driven idempotent fulfilment, atomic inventory — then adapted
> the commercial model to the client's real operating constraints, switching the
> storefront to an enquiry-based ordering flow behind a single config flag with
> zero data migration. Demonstrates both the payments engineering and the product
> judgement to know when not to ship frictionless checkout."

The direct-communication surface this depends on (the contact / enquiry feature)
is therefore not a "nice to have" — it's the eventual primary order channel, and
is built to that standard (validated, rate-limited, spam-guarded, emailed to
Anna with reply-to set so she can answer from her inbox).

---

## 3. Tech stack

The stack below is chosen for SEO (art shops live and die on being discoverable), image quality, security, and operational maturity — and to give you genuine, defensible things to talk about.

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Full-stack in one codebase, server components, excellent SEO via SSR/ISR, mature ecosystem, the de-facto standard for production e-commerce. TypeScript is non-negotiable for a money-handling app. |
| Styling | **Tailwind CSS** | Fast, consistent, small bundles. Pair with a few headless UI primitives (Radix) for accessible components. |
| Database | **PostgreSQL** (AWS RDS, or Neon serverless to start) | Relational integrity matters when inventory and orders must never desync. Postgres is the professional default. |
| ORM | **Drizzle** (or Prisma) | Type-safe queries, migrations as code, parameterised by default (SQL-injection safe). Drizzle is lighter and SQL-first; Prisma has a gentler learning curve. Either is defensible. |
| Auth | **Auth.js (NextAuth)** for customers; admin behind a separate hardened route | Delegate identity, don't roll your own crypto. If you want less to maintain, a managed provider (Clerk) is fine and arguably more secure. |
| Payments | **Stripe** (Payment Intents + webhooks, or Stripe Checkout) | PCI-compliant, battle-tested, your servers never store card data. Webhooks are the source of truth for "did this order actually get paid." |
| Image storage + CDN | **AWS S3 + CloudFront** | Originals are large; S3 stores them, CloudFront serves them globally and cached. This is also a clean "I built a media pipeline on AWS" story. |
| Image optimisation | **Next/Image + `sharp`**, or Cloudinary | Responsive sizes, modern formats (AVIF/WebP), lazy loading. Critical for art — quality and speed both matter. |
| Email | **Resend** or **AWS SES** | Transactional order confirmations. SES keeps you fully inside AWS; Resend has a nicer DX. |
| Validation | **Zod** | One schema validates API input, form input, and infers TypeScript types. Your first line of defence against malformed/malicious input. |
| Infra as code | **Terraform** | Every AWS resource defined in version-controlled `.tf` files. The single most impressive thing on this list for infra roles. |
| Containerisation | **Docker** | Reproducible builds, parity between local and prod. |
| CI/CD | **GitHub Actions** | Automated lint → typecheck → test → build → deploy on push. Shows you understand the full delivery lifecycle. |
| Monitoring | **Sentry** (errors) + **CloudWatch** (infra/logs) | You cannot run a real site blind. Knowing about an error before Anna does is the mark of an operator, not just a builder. |
| Testing | **Vitest** (unit) + **Playwright** (E2E) | Test the checkout flow end-to-end — the one path where bugs cost real money. |

---

## 4. Architecture

```
                        ┌─────────────────────────────┐
                        │          Customer            │
                        └──────────────┬──────────────┘
                                       │ HTTPS (TLS 1.2+)
                                       ▼
                        ┌─────────────────────────────┐
                        │   CloudFront (CDN) + AWS WAF │  ← rate limiting, bot rules,
                        │   ACM TLS certificate        │     security headers at the edge
                        └──────────────┬──────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                                              ▼
   ┌─────────────────────────┐                  ┌──────────────────────────┐
   │  Next.js app            │                  │  S3 bucket (art images)  │
   │  (ECS Fargate / Amplify)│                  │  private; served via CDN │
   │  - storefront (SSR/ISR) │                  └──────────────────────────┘
   │  - API routes           │
   │  - admin (protected)    │
   └───────────┬─────────────┘
               │
     ┌─────────┼──────────────────────────┐
     ▼         ▼                           ▼
┌─────────┐ ┌──────────────┐    ┌────────────────────────┐
│Postgres │ │ Stripe API   │    │ Email (SES / Resend)   │
│ (RDS)   │ │ + webhooks   │    │ order confirmations    │
└─────────┘ └──────┬───────┘    └────────────────────────┘
                   │ webhook (payment succeeded)
                   ▼
            ┌──────────────────┐
            │ /api/webhooks/    │  ← verifies Stripe signature,
            │ stripe (handler)  │     marks order paid, decrements stock
            └──────────────────┘

  Secrets in AWS Secrets Manager · Logs/metrics in CloudWatch · Errors in Sentry
  Everything provisioned by Terraform · Deployed by GitHub Actions
```

### 4.1 The one flow that must never break: checkout
1. Customer adds an item to cart (cart held in a signed cookie or DB-backed session).
2. At checkout, the **server** creates a Stripe Payment Intent for the verified server-side price (never trust a price sent from the browser).
3. Customer pays via Stripe's hosted/embedded form — card data goes directly to Stripe, never to your server.
4. Stripe sends a **webhook** to your `/api/webhooks/stripe` endpoint. This — not the browser redirect — is the source of truth that payment succeeded.
5. The webhook handler verifies the Stripe signature, then in a **single database transaction**: marks the order paid, decrements/locks inventory (an original goes to `sold` atomically so it can't be double-sold), and triggers the confirmation email.
6. Idempotency: webhook handlers must tolerate being called twice for the same event (Stripe retries). Key off the event ID.

This flow is your strongest interview story. It demonstrates you understand state consistency, idempotency, not trusting the client, and webhooks as a source of truth — all things junior engineers routinely get wrong.

---

## 5. Data model (initial)

```
products
  id, slug, title, description, type ('original'|'print'),
  base_price_cents, currency, status ('available'|'sold'|'archived'),
  created_at, updated_at

product_variants            -- prints only: sizes / framing options
  id, product_id (fk), name, price_cents, sku, stock_qty

images
  id, product_id (fk), s3_key, alt_text, width, height, position

orders
  id, status ('pending'|'paid'|'fulfilled'|'cancelled'),
  customer_email, shipping_address (jsonb), subtotal_cents,
  shipping_cents, total_cents, stripe_payment_intent_id,
  created_at, updated_at

order_items
  id, order_id (fk), product_id, variant_id (nullable),
  title_snapshot, unit_price_cents, quantity

-- Phase 2:
users / sessions / discount_codes / wishlist_items
```

Design notes worth articulating on a CV:
- **Price snapshots on `order_items`** — an order records what was paid at the time, decoupled from later price changes. (A surprising number of real shops get this wrong.)
- **Money stored as integer cents**, never floats. Floating-point money is a classic bug class.
- **Inventory integrity enforced in the database** (constraints + transactional updates), not just in application code.

---

## 6. Security architecture

This section is deliberately thorough — it's the part that separates a student project from a professional one, and it's directly braggable for any security-adjacent role.

### 6.1 Payments & PCI
- Card data **never touches your servers** — Stripe's hosted/embedded elements handle it. This keeps you in PCI SAQ-A scope (the lightest), which you can state explicitly.
- Webhook signatures are **always verified** before any state change.
- Prices are **always computed server-side**; the browser is never trusted to report what something costs.

### 6.2 Transport & headers
- **TLS everywhere** via AWS Certificate Manager. HTTP redirects to HTTPS.
- **HSTS** to force HTTPS on repeat visits.
- A **Content-Security-Policy** to mitigate XSS, plus `X-Content-Type-Options`, `Referrer-Policy`, and `X-Frame-Options`/frame-ancestors.

### 6.3 Application layer
- **Input validation with Zod** on every API boundary — reject malformed input before it reaches business logic.
- **Parameterised queries via the ORM** — no string-concatenated SQL, so no SQL injection.
- **Output encoding / React's default escaping** to prevent XSS; sanitise any rich text (e.g. product descriptions) with a library like DOMPurify if you allow HTML.
- **CSRF protection** on state-changing requests (built into Auth.js / framework where applicable).
- **Rate limiting** on auth, checkout, and webhook endpoints (Upstash Redis or AWS WAF rate rules) to blunt brute-force and abuse.

### 6.4 Auth & access control
- Admin area on a **separate, protected route** with its own auth and ideally IP allow-listing or MFA. Anna is the only admin.
- **No secrets in code or git.** All secrets (Stripe keys, DB credentials, API keys) live in **AWS Secrets Manager** / environment variables injected at runtime. Add a pre-commit secret scanner (e.g. `gitleaks`).
- **Principle of least privilege IAM** — each service gets only the permissions it needs. The app's role can read its S3 bucket and talk to RDS, nothing more.

### 6.5 Infrastructure & supply chain
- **AWS WAF** in front of CloudFront for managed rule sets (common exploits, bad bots) and rate limiting.
- **Dependabot + `npm audit` in CI** to catch vulnerable dependencies; CI fails on high-severity issues.
- **Encrypted at rest** (RDS encryption, S3 SSE) and in transit.
- **Least-privilege security groups** — the database is not publicly reachable; only the app can reach it.
- **Audit logging** — CloudTrail for infra changes, application logs for admin actions.

### 6.6 Privacy & compliance
- A clear privacy policy and cookie consent (UK/EU — GDPR applies).
- Collect the minimum customer data needed to fulfil an order.
- Document a data-retention and deletion approach.

> **CV line:** "Designed and implemented the security architecture for a live payment-handling platform: PCI-SAQ-A scoping via tokenised payments, defence-in-depth (WAF, CSP, rate limiting, least-privilege IAM), secrets management, and automated dependency scanning in CI."

---

## 7. Cloud infrastructure & DevOps

This is the other half of the CV story. The aim is to demonstrate you can stand up and operate real cloud infrastructure reproducibly.

### 7.1 Recommended approach — managed AWS, fully coded
Use **managed AWS services provisioned entirely through Terraform**. You get the infrastructure credibility without running and patching servers by hand.

Core resources (all in Terraform):
- **Compute:** ECS Fargate (containerised Next.js) or AWS Amplify Hosting if you want less to manage. Fargate is the more impressive, more "I understand container orchestration" choice.
- **Database:** RDS PostgreSQL (Multi-AZ optional; single-AZ is fine and cheaper for launch).
- **Media:** S3 (private bucket) + CloudFront distribution.
- **Networking:** A VPC with public/private subnets; the database lives in private subnets.
- **Edge/security:** CloudFront + WAF + ACM certificate.
- **Secrets:** Secrets Manager.
- **Observability:** CloudWatch log groups, metrics, and alarms.

### 7.2 The honest trade-off
Full AWS + Fargate + Terraform is the maximum-CV-value path, but it carries more operational surface than Anna needs on day one. Two legitimate alternatives:

- **Pragmatic hybrid:** host the Next.js app on **Vercel** (zero-maintenance, superb DX) and use **AWS only for the media pipeline** (S3 + CloudFront, in Terraform). You still get a real "I built cloud media infrastructure with IaC" story, and Anna gets a rock-solid app host. Lower bragging ceiling on compute, much lower maintenance.
- **Full AWS:** everything above. Higher ceiling, more to look after.

**Recommendation:** if you have the time and want the infra/security narrative to be the centrepiece, go **full AWS with Terraform**. If reliability-for-Anna and shipping speed matter more, do the **hybrid** and still come away with a genuine IaC + CDN story. Either is defensible — state the trade-off out loud in interviews and you look more senior, not less.

### 7.3 CI/CD pipeline (GitHub Actions)
On every push / PR:
1. **Lint** (ESLint) + **format check** (Prettier)
2. **Typecheck** (`tsc --noEmit`)
3. **Unit tests** (Vitest)
4. **Dependency audit** (`npm audit` / Dependabot gate)
5. **Build** the Docker image
6. **E2E tests** (Playwright) against a preview deploy
7. On merge to `main`: **push image + deploy** (to Fargate via Terraform/ECS, or Vercel)
8. **Database migrations** run as a gated, reversible step

> **CV line:** "Built a full CI/CD pipeline (GitHub Actions → containerised build → automated tests → IaC-driven deploy to AWS) with database migrations and security gates, and instrumented the service with Sentry and CloudWatch alarms."

### 7.4 Environments
- **Local** (Docker Compose: app + Postgres + LocalStack/S3 mock)
- **Preview** (per-PR ephemeral deploy)
- **Production**

---

## 8. Delivery roadmap

Sized so you can do the core in a few focused weeks and layer on the impressive infra without blocking the launch.

**Week 0 — Foundations**
- Repo, TypeScript + Next.js scaffold, Tailwind, linting/formatting, Docker Compose for local dev
- Terraform skeleton (VPC, S3 bucket, state backend) — or Vercel project if hybrid
- CI pipeline running lint + typecheck on day one

**Week 1 — Core domain**
- Data model + migrations
- Product listing + detail pages (SSR/ISR), image pipeline (S3 + CloudFront + Next/Image)
- Admin: product CRUD

**Week 2 — Commerce**
- Cart, server-side pricing
- Stripe Payment Intents + the webhook flow (the critical path)
- Order creation, atomic inventory decrement, confirmation email
- E2E test covering the full purchase

**Week 3 — Portfolio + polish**
- Portfolio pages (home, gallery, about, contact)
- Accessibility pass, Core Web Vitals, SEO (metadata, sitemap, structured data for products)
- Security headers, CSP, rate limiting, WAF rules

**Week 4 — Productionise**
- Full Terraform infra applied, deploy to production
- Monitoring + alarms (Sentry, CloudWatch), dependency scanning gate
- `RUNBOOK.md`, `HANDOVER.md`, and a written case study for your CV/portfolio
- Anna onboarding: walk her through the admin

Phase 2 features follow once it's live and earning.

---

## 9. Testing strategy
- **Unit (Vitest):** pricing logic, inventory rules, validation schemas.
- **Integration:** API routes against a test database.
- **E2E (Playwright):** the checkout journey, end to end, including the webhook → paid → stock-decremented path (use Stripe's test mode + CLI to replay webhooks).
- **CI gate:** nothing merges if lint, types, unit, or E2E fail.

---

## 10. What to put on your CV

Frame it around outcomes and engineering maturity, not feature lists.

- **Shipped a production e-commerce + portfolio platform for a real client**, handling live payments and physical-goods inventory.
- **Full-stack:** Next.js/TypeScript, PostgreSQL, type-safe data layer, server-rendered for SEO.
- **Payments & correctness:** Stripe integration with webhook-driven, idempotent order processing and transactional, race-condition-safe inventory — card data never touches the server (PCI SAQ-A).
- **Cloud infrastructure as code:** AWS (ECS Fargate / RDS / S3 / CloudFront / WAF) provisioned entirely with Terraform; reproducible, version-controlled environments.
- **Security engineering:** defence-in-depth — WAF, CSP and hardened headers, server-side validation, least-privilege IAM, secrets management, automated dependency scanning.
- **DevOps:** containerised, full CI/CD with automated testing and security gates; instrumented with Sentry and CloudWatch.
- **Operational maturity:** monitoring, runbook, and a clean handover — built to be maintained, not just demoed.

Then write it up as a **case study** (problem → decisions → trade-offs → outcome) on your portfolio site at the end of summer. The trade-offs section is what makes you sound senior.

---

## 11. Rough running costs
Ballpark, low traffic (confirm against current AWS pricing):
- Domain: ~£10/year
- Hybrid (Vercel free/hobby + small S3/CloudFront): often **£0–5/month** at launch volumes
- Full AWS (Fargate minimal + RDS small + S3/CloudFront + WAF): roughly **£25–60/month** depending on sizing and whether WAF is enabled
- Stripe: per-transaction fee only, no fixed cost
- Sentry / Resend: free tiers cover launch

Keep costs visible — being cost-conscious is part of running infrastructure professionally. Set an AWS Budget alarm.

---

## 12. Next steps in Claude Code
When you switch over to build:
1. Confirm latest stable versions of Next.js, the ORM, and key deps before pinning.
2. Scaffold the Next.js + TypeScript + Tailwind app and Docker Compose local stack.
3. Stand up the Terraform state backend and the S3 bucket first (smallest useful infra slice).
4. Get CI running (lint + typecheck) before writing feature code.
5. Build the data model and product pages, then the Stripe checkout flow.
6. Decide hybrid vs full-AWS early — it shapes the Terraform from the start.

Open questions to settle with Anna before/early in the build:
- Originals only, or prints too? (Drives the variant model.)
- Does she want to fulfil/ship herself, or use print-on-demand? (Phase 2 integration.)
- UK-only sales at launch, or international? (Tax, shipping, currency.)
- Who owns the domain and the AWS/Stripe accounts? (Set these up in *her* name where money is involved — you're the builder, not the merchant of record.)

---

*This plan is intentionally thorough so it can act as the project's reference document. Adjust scope to fit the time you have — a focused, well-built MVP on solid infrastructure beats an over-scoped one that never ships.*
