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

> **Loading products is solved.** With a database connected, the shop reads
> products from the **database** (not the gallery manifest). The
> `npm run db:seed:paintings` script turns the 26 paintings (manifest +
> `artwork-meta.ts`) into real, buyable `products` rows, reusing the committed
> `/gallery` images — so you get a full shop without building an admin UI. (A
> proper admin for editing products is still a nice future addition, but isn't
> required to take payments.)

### B1. Database — [Neon](https://neon.tech) Postgres
1. Create a Neon project in **eu-west-2 (London)**.
2. Copy the **pooled** connection string (includes `?sslmode=require`) →
   **`DATABASE_URL`** (in `.env` locally for the seed, and in Vercel for prod).
3. Apply the schema and load the paintings:
   ```bash
   npm run db:migrate          # create the tables
   npm run db:seed:paintings   # insert the 26 paintings as originals
   ```
   Re-running the seed is safe (it upserts by slug). Set real per-piece prices in
   `src/db/seed-paintings.ts` (or later via an admin) before taking real money —
   they're the same obvious £450 draft until you do.

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

### B5. Prove a real payment works (the CV demo)

The whole point of Path B is being able to say *"I built a working payment
system."* You can demonstrate the full flow safely in **Stripe test mode** — no
real money — and screenshot it. Do this locally first:

1. **Start Postgres + load products** (one-off):
   ```bash
   docker compose up -d
   npm run db:migrate
   npm run db:seed:paintings
   ```
2. **Put Stripe TEST keys in `.env`** (Stripe → Developers → API keys, test mode):
   `STRIPE_SECRET_KEY=sk_test_…`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…`.
3. **Forward webhooks** with the Stripe CLI (so the "paid" event reaches you):
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET` in `.env`.
4. **Run the app against the database** (not demo mode):
   ```bash
   # DATABASE_URL set, DEMO_MODE unset, COMMERCE_MODE=checkout
   npm run dev
   ```
   (There's a ready-made `db` profile in `.claude/launch.json` with these envs.)
5. **Buy a painting:** open `/shop`, add one to the cart, check out, and pay with
   Stripe's test card **`4242 4242 4242 4242`** (any future expiry, any CVC).
6. **Watch it complete:** the Stripe CLI logs `checkout.session.completed`; the
   order flips to `paid`; the original is marked `sold` (atomically, so it can't
   be double-sold); a confirmation email is logged/sent. Screenshot the Stripe
   dashboard payment + the order — that's your evidence.

**Going live for real** is the same with **live** keys: set
`COMMERCE_MODE=checkout`, the live Stripe keys, the production webhook secret,
`DATABASE_URL`, `CART_SECRET` and Upstash in Vercel, then redeploy. (Remember the
plan is to run mostly in `inquiry` mode — flip back any time by setting
`COMMERCE_MODE=inquiry`. The Stripe integration stays in the codebase either way,
which is exactly the portfolio artifact you want.)

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
