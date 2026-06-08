# Go-live runbook — from repo to a live site

A single, ordered checklist for putting the site live. Two paths — pick one:

- **Path A — Enquiry site (recommended now).** No database, no Stripe. Visitors
  browse the gallery and **enquire to buy** via the contact form, which emails
  Anna. This matches the agreed business model (Anna sells by conversation) and
  is the realistic near-term launch. ~1 hour, mostly account sign-ups.
- **Path B — Full card checkout (later).** Adds a database + Stripe so customers
  pay online. Needs one more piece of engineering first (see the ⚠️ in Path B).

Account-by-account detail lives in [`EXTERNAL-SETUP.md`](./EXTERNAL-SETUP.md);
this file is the **order to do things in**. Ownership rule: every account that
touches money or identity (Stripe, domain, bank) is in **Anna's** name; you (the
builder) get team access.

> **Where env vars go.** *Local* = a line in `.env` (copy from `.env.example`).
> *Production* = Vercel → Project → Settings → Environment Variables (Production
> scope), then **redeploy** (Vercel only applies env changes to new deployments).

---

## Path A — Enquiry site (no database, no Stripe)

### A1. Put the content right (before anyone sees it)
1. **Titles, prices, stories, collections, reviews** — replace the placeholders.
   Follow [`ADDING-PAINTINGS.md`](./ADDING-PAINTINGS.md). At minimum: real titles,
   and either real prices or remove price emphasis (in enquiry mode prices are
   only indicative).
2. **Legal pages** — fill the bracketed details in `/privacy` and `/terms`
   (trading name, contact email, VAT status, delivery regions). Checklist:
   [`LEGAL-CHECKLIST.md`](./LEGAL-CHECKLIST.md). A privacy policy is legally
   required; no cookie banner is needed (essential cookies only).
3. Run `npm run build` locally to confirm everything compiles.

### A2. Email (so enquiries actually reach Anna) — [Resend](https://resend.com)
1. Create a Resend account; create an API key → **`RESEND_API_KEY`** (`re_…`).
2. Verify Anna's sending domain (add the DNS records Resend shows), or use
   Resend's test sender to start. Set **`EMAIL_FROM`** to a verified address.
3. Set **`CONTACT_EMAIL`** to Anna's real inbox (where enquiries land).

> Without these the contact form still works but only logs server-side — so set
> them for a real launch, even though demo mode doesn't strictly require them.

### A3. Deploy on [Vercel](https://vercel.com)
1. Sign in with GitHub and **import the repo**. Framework auto-detects (Next.js);
   no build config needed.
2. In **Settings → Environment Variables** (Production), add:
   - `COMMERCE_MODE=inquiry` ← turns every buy button into "Enquire to buy"
   - `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_EMAIL` (from A2)
   - `ADMIN_EMAILS` = Anna's email (fallback enquiry inbox)
   - `NEXT_PUBLIC_SITE_URL` = your Vercel URL (e.g. `https://barnett-art.vercel.app`)
   - **Do NOT set `DATABASE_URL`** — leaving it unset keeps demo/enquiry mode on.
3. Deploy. Every push to the branch redeploys; every PR gets a preview URL.

### A4. Smoke test the live site
- Gallery, collections, the sliding artwork drawer, and per-piece detail all load.
- Product/gallery CTAs read **"Enquire to buy"** (confirms `COMMERCE_MODE=inquiry`).
- Submit the contact form → Anna receives the email (check spam until the domain
  is verified). The artwork enquiry link pre-fills the piece.
- `/privacy` and `/terms` show the real details.

### A5. (Optional) custom domain
Stay on the free `*.vercel.app` URL until sales justify a domain. When ready:
register `annabarnett.art` (Anna's name), add it in Vercel → Domains, follow the
DNS records, and update `NEXT_PUBLIC_SITE_URL`. TLS is automatic.

**That's a live enquiry site.** Everything below is only for online card payment.

---

## Path B — Full card checkout (when Anna wants online payment)

Everything in Path A still applies (content, legal, email, Vercel). Then add:

> ⚠️ **One engineering piece is needed first.** With a database connected, the
> shop reads products from the **database**, not the gallery manifest — and there
> is **no admin UI yet** (Phase 1b) and no importer that loads Anna's real
> paintings into the DB (`npm run db:seed` inserts *sample* art only). So before
> Path B, build **one** of: (a) the admin product CRUD (Phase 1b), or (b) a
> seed script that turns `gallery-manifest.json` + `artwork-meta.ts` into DB
> products. Until then, connecting a database would show an empty shop. This is
> the main remaining backend task for paid checkout.

### B1. Database — [Neon](https://neon.tech) Postgres
1. Create a Neon project in **eu-west-2 (London)**.
2. Copy the **pooled** connection string (includes `?sslmode=require`) →
   **`DATABASE_URL`** in Vercel (Production).
3. Apply the schema: run `npm run db:migrate` against that `DATABASE_URL`
   (locally with the prod URL, or as a one-off). Then load products (see ⚠️).

### B2. Payments — [Stripe](https://dashboard.stripe.com) (Anna's account)
1. Anna creates the Stripe account and completes business verification; add you
   as a team member.
2. **Live** API keys (Developers → API keys):
   - `sk_live_…` → **`STRIPE_SECRET_KEY`**
   - `pk_live_…` → **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`**
3. **Webhook endpoint:** Developers → Webhooks → add endpoint
   `https://<your-domain>/api/webhooks/stripe`, subscribe to
   **`checkout.session.completed`**, copy its signing secret (`whsec_…`) →
   **`STRIPE_WEBHOOK_SECRET`**.
4. Confirm the Stripe API version pinned in `src/lib/stripe.ts` matches your
   dashboard's version.
5. **Shipping** is computed in code (flat £6.95, free over £150). To change it,
   edit `FLAT_SHIPPING_CENTS` / `FREE_SHIPPING_THRESHOLD_CENTS` in
   `src/lib/pricing.ts`, or move it to a Stripe shipping rate (EXTERNAL-SETUP §12).

### B3. Rate limiting — [Upstash](https://console.upstash.com) Redis
Create a Redis database; copy REST URL + token →
**`UPSTASH_REDIS_REST_URL`**, **`UPSTASH_REDIS_REST_TOKEN`**. (Dev falls back to
in-memory; production needs real values.)

### B4. Other required production vars
- **`CART_SECRET`** — a strong random string, **≥16 chars** (HMAC-signs the cart
  cookie). Generate one and set it in Vercel.
- Keep `RESEND_API_KEY` / `EMAIL_FROM` (now also send order-confirmation emails).

### B5. Flip the switch & test
1. Set **`COMMERCE_MODE=checkout`** (or remove it; `checkout` is the default).
2. Redeploy.
3. Place a **real** test order end-to-end (use a Stripe test card first in a
   preview with test keys): pay → Stripe webhook fires → order marked `paid` →
   stock decremented / original marked `sold` → confirmation email sent. Verify
   in the Stripe dashboard (Webhooks → delivery) and your DB.

### B6. Recommended before heavy traffic
- **Sentry** for error monitoring (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`).
- An uptime monitor on `/api/health`.
- **AWS S3 + CloudFront** for media at scale (Terraform, Phase 4) — until then
  images are served from the repo's `public/gallery`, which is fine for launch.

---

## Quick reference — which vars each path needs

| Var | Path A (enquiry) | Path B (checkout) |
|---|---|---|
| `COMMERCE_MODE` | `inquiry` | `checkout` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | ✅ |
| `RESEND_API_KEY` / `EMAIL_FROM` | ✅ (for enquiry emails) | ✅ |
| `CONTACT_EMAIL` / `ADMIN_EMAILS` | ✅ | ✅ |
| `DATABASE_URL` | ❌ (must stay unset) | ✅ |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ❌ | ✅ |
| `STRIPE_WEBHOOK_SECRET` | ❌ | ✅ |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | ❌ | ✅ |
| `CART_SECRET` (≥16 chars) | ❌ | ✅ |
| `SENTRY_DSN` (optional) | – | recommended |

**Never commit secrets.** Local → `.env` (git-ignored). Production → Vercel env
vars. `NEXT_PUBLIC_*` is exposed to the browser by design — only publishable
(non-secret) values go there.
