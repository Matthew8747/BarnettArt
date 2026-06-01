# Security

Security posture for the Barnett Art platform. This handles real payments and
real customer data, so security is a first-class requirement, not an add-on.

## Reporting a vulnerability

Email **security@annabarnett.art** (or the maintainer directly). Please do not
open a public issue for security problems. We aim to acknowledge within 72 hours.

## Controls implemented

### Secrets
- No secrets in git. `.env` is git-ignored; only `.env.example` (placeholders)
  is tracked. `.gitignore` also blocks `*.key`, `*.pem`, tfvars, credentials.
- Boot-time validation (`src/lib/env.ts`) — the app refuses to start with a
  missing/malformed secret rather than failing obscurely later.
- `gitleaks` scans every push in CI for accidentally committed secrets.
- Production secrets live in the Vercel dashboard / AWS Secrets Manager, injected
  at runtime — never in the repo or the image.

### Payments (PCI SAQ-A)
- Card data never touches our servers — handled entirely by Stripe's hosted/
  embedded elements.
- Prices are computed **server-side**; the browser is never trusted to report
  what something costs.
- Webhook signatures are **always verified** (`src/app/api/webhooks/stripe`)
  before any state change, and handlers are designed to be idempotent.

### Transport & headers (`next.config.ts`)
- HSTS (2 years, includeSubDomains, preload).
- Content-Security-Policy restricting script/style/frame/connect sources
  (Stripe allow-listed). _Follow-up: nonce-based script-src to drop
  `unsafe-inline` — tracked in IMPLEMENTATION.md._
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`.
- `poweredByHeader` disabled.

### Application layer
- Input validated with Zod at every boundary.
- Parameterised queries via Drizzle — no string-concatenated SQL.
- React's default output escaping mitigates XSS; any rich text will be sanitised.
- Rate limiting on checkout/webhook/admin/api endpoints (`src/lib/rate-limit.ts`).

### Access control
- Admin area behind an email allow-list (`ADMIN_EMAILS`) on a protected route.
- Database not publicly reachable in production; least-privilege IAM for AWS.

### Supply chain & infra
- `npm audit --audit-level=high` gates CI; Dependabot opens weekly update PRs.
- Encryption at rest (RDS/Neon, S3 SSE) and in transit (TLS everywhere).
- Terraform-provisioned infra (no click-ops) with least-privilege security groups.

### Privacy (UK GDPR)
- Collect the minimum customer data needed to fulfil an order.
- Privacy policy and cookie consent at `/privacy`; data-retention approach
  documented as part of launch.

## Responsible defaults checklist (before launch)

- [ ] Switch Stripe to live keys; production webhook endpoint configured.
- [ ] All production secrets set in Vercel (none in repo).
- [ ] CSP reviewed against the live page (no console violations).
- [ ] Rate limits tuned with real Upstash backing.
- [ ] Legal pages reviewed by Anna / a solicitor.
- [ ] AWS Budget alarm active; CloudTrail enabled.
