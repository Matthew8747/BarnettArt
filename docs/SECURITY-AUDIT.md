# Security Audit — Barnett Art Platform

**Audit date:** 2026-06-01 · **Phase:** Foundations complete, pre-commerce.
**Scope:** the application codebase (Next.js app, API routes, lib, data model,
CI). Out of scope (not yet provisioned): Terraform infra, AWS WAF, production
Vercel/Neon/Upstash configuration — audited again before launch.

This is a living document. Re-run the audit at the end of each phase and before
launch (the launch checklist lives in [`../SECURITY.md`](../SECURITY.md)).

---

## 1. Summary

The foundations are in a strong security posture. Secrets management, SQL
injection prevention, transport hardening, and the payment-trust model are all
in place and (where logic exists) unit-tested. The remaining risk is almost
entirely **"not built yet"** rather than "built insecurely": auth, the admin
area, the cart, and the checkout endpoint don't exist, so their controls are
designed but unproven. No real secret is committed to git; nothing sensitive is
bundled into the client.

| Severity | Open findings |
|----------|---------------|
| Critical | 0 |
| High | 0 |
| Medium | 2 (CSP `unsafe-inline` on scripts; dev-only transitive deps) |
| Low / informational | 4 (see §4) |

---

## 2. OWASP Top 10 (2021) mapping

| # | Category | Status | Where / evidence |
|---|----------|--------|------------------|
| A01 | Broken Access Control | 🟡 Designed | Admin behind `ADMIN_EMAILS` allow-list (`src/lib/env.ts`); `frame-ancestors 'none'` + `X-Frame-Options: DENY` block clickjacking. **Admin auth not built yet** — Phase 1. |
| A02 | Cryptographic Failures | ✅ | HSTS 2yr preload + `upgrade-insecure-requests` (`next.config.ts`); TLS everywhere (Vercel/CloudFront); card data never on our servers (Stripe). Money as integer pence, no FP. |
| A03 | Injection | ✅ | Drizzle parameterised queries only — no string-built SQL (`src/db`). DB CHECK constraints (`schema.ts`). Input validated/ sanitised via Zod + `parseJsonRequest` (`src/lib/validation.ts`). React auto-escaping for XSS; CSP as defence-in-depth. |
| A04 | Insecure Design | ✅ | Payment trust model: prices computed server-side, webhook signature is source of truth, idempotency keyed on Stripe event/PaymentIntent id, atomic stock decrement (designed in `schema.ts` + webhook route). |
| A05 | Security Misconfiguration | ✅ | `poweredByHeader` off; full security-header set; `.gitignore` blocks env/keys/tfvars; env schema fails fast on misconfig. |
| A06 | Vulnerable & Outdated Components | 🟡 | `npm audit --audit-level=high` gates CI; Dependabot weekly. 6 **moderate** transitive advisories remain (dev-only) — see §4.2. |
| A07 | Identification & Auth Failures | 🟡 Designed | Auth delegated (Auth.js/managed planned — no rolled crypto). Brute-force protection: **auth limiter = 5 attempts / 15 min / IP** (`src/lib/rate-limit.ts`, unit-tested). Auth flow itself is Phase 1. |
| A08 | Software & Data Integrity Failures | ✅ | Webhook signature verified against raw bytes before any state change (`api/webhooks/stripe`). `gitleaks` in CI. `.npmrc` strict install. Lockfile committed; `npm ci` in CI. |
| A09 | Logging & Monitoring Failures | 🟡 Planned | `/api/health` liveness probe live. Sentry + uptime monitor are Phase 4. No PII in logs by design. |
| A10 | Server-Side Request Forgery | ✅ | No user-controlled outbound URL fetching exists. `next/image` remote patterns restricted to the configured CloudFront host only (`next.config.ts`). |

Legend: ✅ implemented & verified · 🟡 partially done / designed but not yet built.

---

## 3. Controls implemented (with code references)

### Secrets
- `.env` is git-ignored; only `.env.example` (angle-bracket placeholders) is
  tracked. Verified: `git ls-files` shows no `.env`; a repo-wide scan for
  `sk_`/`pk_`/`whsec_`/`re_`/`AKIA`/private-key/`password=` patterns returns no
  real secrets.
- Only `NEXT_PUBLIC_*` values can reach the browser (enforced by Next.js); the
  Stripe **secret** key, DB URL, Upstash token, etc. are server-only.
- `gitleaks` pre-commit hook + CI step.

### Input handling (sanitise everything; reject oversized/malformed)
- `parseJsonRequest` (`src/lib/validation.ts`) — the single front door for
  user JSON. Enforces a **100 KB body cap** (Content-Length fast-reject **and**
  actual-byte check), rejects **malformed JSON (400)**, validates against a Zod
  schema (**400 + issues**), and — with `.strict()` schemas — rejects unknown
  keys to remove the mass-assignment surface. Unit-tested (7 cases).

### Rate limiting (all endpoints)
- `src/lib/rate-limit.ts` — per-class limiters: **auth 5/15min**, checkout
  10/min, webhook 100/min, admin 30/min, api 60/min, keyed on client IP.
  Upstash Redis in prod, in-memory fallback in dev. Auth + IP-extraction
  unit-tested (4 cases). Live endpoints (`/api/health`, webhook) already call a
  limiter; every new route MUST call one (see §5 / SECURITY.md).

### Transport & headers (`next.config.ts`)
- CSP, HSTS (2yr, preload), `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `Referrer-Policy`,
  `Permissions-Policy`, `base-uri`/`form-action`/`object-src` locked down.

### Payments
- Signature verified before state change; raw body read; idempotency + atomic
  fulfilment designed (transaction wiring lands in Phase 2 commerce).

---

## 4. Open findings & remaining risk

### 4.1 Medium — CSP allows `'unsafe-inline'` for scripts
- **Risk:** weakens the XSS mitigation a strict CSP would give (an injected
  inline `<script>` would not be blocked by CSP alone).
- **Compensating controls:** React's automatic output-escaping is the primary
  XSS defence; no `dangerouslySetInnerHTML`; no user-supplied HTML rendered yet.
- **Fix:** move `script-src` to a per-request **nonce** and drop
  `'unsafe-inline'`. Tracked in `IMPLEMENTATION.md` (Phase 3).

### 4.2 Medium — transitive dev-dependency advisories (6 moderate)
- `postcss <8.5.10` (via `next`) and `esbuild <=0.24.2` (via `drizzle-kit`).
- Both are **build/dev-time** tools and not shipped in the production bundle;
  the esbuild advisory only affects a locally-exposed dev server.
- Below the `--audit-level=high` CI gate, so they don't fail CI. Track upstream
  fixes via Dependabot; re-evaluate before launch.

### 4.3 Low / informational
- **Admin auth & the admin area are not implemented** (Phase 1). The allow-list
  is configured but unenforced until the route exists. **Do not ship admin
  without it.**
- **Webhook fulfilment is stubbed** — signature verification is real, but the
  DB transaction / stock decrement / email are TODO (Phase 2). Idempotency must
  be proven with tests when built.
- **CSRF:** no state-changing browser forms exist yet. When they do, rely on
  Auth.js CSRF protection / same-site cookies and verify it.
- **Rate-limit fallback is per-process in dev** — fine locally; production MUST
  have Upstash configured (enforced by `env.ts` in prod).

---

## 5. Rules for new endpoints (keep the posture)

Every new API route MUST:
1. Call the appropriate `limiters.*` for its class (auth routes → `limiters.auth`).
2. Parse any JSON body through `parseJsonRequest` with a `.strict()` Zod schema.
3. Return `429` on rate-limit, `400` on malformed/invalid, `413` on oversized.
4. Never interpolate user input into SQL — Drizzle query builder only.
5. Never log secrets or full PII; never return internal error detail to clients.

---

## 6. Test coverage (security-relevant)

| Area | File | Cases |
|------|------|-------|
| Money integrity (integer pence) | `src/lib/money.test.ts` | 6 |
| Input validation / payload limits | `src/lib/validation.test.ts` | 7 |
| Rate-limit policy (auth 5/15min, per-IP) | `src/lib/rate-limit.test.ts` | 4 |

Run with `npm test`. Tests gate CI (lint → typecheck → **test** → build).

**Next test targets:** webhook idempotency, server-side price computation,
atomic stock decrement (all Phase 2, the money-critical path).
