# Manual TODO — things only you can do

> Consolidated checklist of actions Claude **cannot** do for you: creating
> external accounts, providing secrets, and running local services. Grouped by
> when you'll need them. Architecture context: [`anna-art-platform-plan.md`](./anna-art-platform-plan.md).
> External-account detail: [`EXTERNAL-SETUP.md`](./EXTERNAL-SETUP.md).

Legend: 🔴 blocks local testing now · 🟠 needed before deploy · 🟢 nice-to-have / later

---

## 0. Deploy a prototype for Anna (no accounts needed) 🟢

The fastest way to put a clickable preview in front of Anna — **no database, no
Stripe, nothing to provision, no env vars to set**. It serves a curated set of
sample paintings (public-domain placeholders until Anna's high-res photos
arrive); browsing, per-artwork colour, motion and the cart all work, and
checkout is shown as disabled.

**Demo mode turns itself on automatically whenever no `DATABASE_URL` is set** —
so a fresh deploy just works. (You can also force it with `DEMO_MODE=true`.)

1. Import the repo at <https://vercel.com/new> (free Hobby plan, sign in with
   GitHub). Pick the `phase-2-commerce` branch if prompted.
2. Click **Deploy** — leave everything default, **no env vars needed**.
3. Share the `*.vercel.app` URL with Anna.

CLI alternative (from the repo root): `npx vercel` → accept defaults →
`npx vercel --prod`.

> **Why your first try failed:** Vercel env vars are scoped per-environment and
> only apply to *new* deploys made after they're added, so a `DEMO_MODE` set
> after deploying didn't take effect. The app now auto-detects "no database" and
> serves the demo, so you don't need the flag at all.

Later, to go live for real: add `DATABASE_URL` + the Stripe vars (sections
below) and redeploy — demo mode switches itself off automatically.

---

## 1. To run + test the build locally (Phase 1 + 2)

- 🔴 **Start Docker Desktop**, then `npm run dev:up` (boots Postgres, runs
  migrations, starts the dev server). Docker wasn't running, so I couldn't
  execute the live DB path — the code is verified by typecheck/tests/build only.
- 🔴 **Seed sample artwork:** `npm run db:seed` (first run). Populates `/shop`.
- 🔴 **Create `.env`** from `.env.example` (`Copy-Item .env.example .env`). For
  pure local browsing you only strictly need `DATABASE_URL`; the rest have dev
  fallbacks. Add `CART_SECRET` if you want (a dev fallback is used otherwise).

### To test the **checkout flow** end-to-end locally

- 🔴 **Stripe test account** → copy test keys into `.env`:
  - `STRIPE_SECRET_KEY=sk_test_…`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…`
    from <https://dashboard.stripe.com/test/apikeys>.
- 🔴 **Stripe CLI** to forward + sign webhooks locally:
  ```powershell
  stripe login
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  # copy the printed whsec_… into STRIPE_WEBHOOK_SECRET in .env, then restart dev
  ```
  Then place a test order (card `4242 4242 4242 4242`, any future expiry/CVC) and
  confirm: order marked `paid`, stock decremented/original `sold`, and a
  confirmation log line (or email if Resend is configured).
- 🟢 **Resend** (optional locally): without `RESEND_API_KEY`/`EMAIL_FROM` the
  confirmation email is a no-op log line — fine for testing. Add real values to
  actually send. Free tier: <https://resend.com>.
- 🟢 **Upstash Redis** (optional locally): blank → in-memory rate limiting. Add
  `UPSTASH_REDIS_REST_URL`/`_TOKEN` (free tier) to test the real limiter.

---

## 2. Decisions / content I need from you (and Anna)

- 🟠 **Name + price the paintings.** The 26 imported photos show as placeholders
  ("Untitled No. 01", a uniform draft price) — *not* real listings. Give me real
  titles, sizes/media, and prices (or rename in `src/lib/gallery-manifest.json`
  and set prices in `src/lib/demo-data.ts`). Until then nothing should be
  presented to buyers as final.
- 🟠 **Crop the in-situ photos.** Several paintings are photographed on a
  desk/wall. Re-shoot or crop to just the artwork, drop into `paintings/`, and
  re-run `node scripts/import-paintings.mjs` for a cleaner gallery.
- 🟠 **Anna's enquiry inbox:** set `CONTACT_EMAIL` to where the "Contact Anna"
  form should deliver (falls back to `ADMIN_EMAILS`, then to a server log).
- 🟢 **Commerce model decision:** ships in `checkout` (Stripe live). When Anna
  wants to stop direct payment, set `COMMERCE_MODE=inquiry` in Vercel and
  redeploy — buy buttons become "Enquire to buy". See `EXTERNAL-SETUP.md` §11 /
  `anna-art-platform-plan.md` §2.4. No rush; decide when fulfilment load is real.
- 🟠 **Confirm the Stripe API version** pinned in `src/lib/stripe.ts`
  (`2026-05-27.dahlia`) matches your Stripe dashboard before going live.
- 🟠 **Shipping policy:** currently **free shipping** (placeholder in
  `computeShippingCents`, `src/lib/pricing.ts`). Tell me real rates (flat?
  per-item? free over £X? prints vs originals?) and I'll implement + test them.
- 🟠 **Legal pages:** `/privacy` and `/terms` are drafts — they need Anna's real
  business details and a solicitor/template-service review before launch.
- 🟠 **Admin auth (Phase 1b):** decided = Auth.js passwordless email magic-links
  via Resend. This needs a working Resend key (above). Anna's admin email goes in
  `ADMIN_EMAILS`.
- 🟢 **Design sign-off:** deploy a Vercel preview and get Anna's feedback on the
  dark-immersive look + per-artwork accents (`docs/DESIGN.md`).
- 🟢 **Real artwork + copy** from Anna to replace the generated seed samples
  (once the admin upload UI lands in Phase 1b).

---

## 3. Before production deploy (Phase 4, mostly 🟠/🟢)

All money/identity accounts in **Anna's name** (see `HANDOVER.md`).

- 🟠 **GitHub:** repo exists. Ensure CI secrets aren't needed (CI runs without a
  live DB by design).
- 🟠 **Neon** (managed Postgres): create project → set production `DATABASE_URL`
  (pooled, `sslmode=require`) in Vercel.
- 🟠 **Vercel:** create project, add all env vars (incl. a strong `CART_SECRET`,
  ≥16 chars), connect the repo, set the custom domain.
- 🟠 **Stripe LIVE:** switch to live keys in Vercel; create the **production
  webhook endpoint** (`/api/webhooks/stripe`) and copy its `whsec_…`. Enable the
  `checkout.session.completed` event.
- 🟠 **Domain** `annabarnett.art` — register/point DNS (Anna's name).
- 🟠 **AWS (media pipeline):** S3 private bucket + CloudFront + ACM, via Terraform
  (Phase 4). Until then the local-disk storage adapter is used. Set
  `S3_BUCKET_NAME`/`CLOUDFRONT_URL`/region once provisioned.
- 🟢 **Sentry** (errors) + uptime monitor on `/api/health`.
- 🟢 **AWS Budget alarm** to keep costs visible.

---

## 4. Known follow-ups for me (not your job, tracked here for visibility)

- **Phase 1b:** admin auth + product CRUD + image upload + accent controls +
  uniform-mode toggle; S3 storage adapter (swaps into `getStorage()`).
- **Phase 2 remainder:** Playwright E2E covering the full checkout incl. a
  replayed webhook; real shipping rules once you decide them.
- **Tech debt:** ESLint pinned back to v9 (the Dependabot bump to v10 is
  incompatible with `eslint-config-next` 16 — revert the pin when upstream
  supports it); `node-vibrant` moderate transitive dep (dev/admin-time only);
  `heic-convert` is a **devDependency** used only by `scripts/import-paintings.mjs`
  (one-time, local) — its moderate transitive advisories never ship to prod.

## 5. Portfolio — base shipped, stretch ideas parked

The portfolio **base** is live (story-driven home: painter/engineer hero,
selected work, practice essay, gallery, contact). Bigger ideas, deliberately
**not built yet** to avoid half-finished work — pick these up when there's time:

- 🟢 Dedicated `/about` long-form page with process/studio imagery.
- 🟢 Per-painting "story" fields (medium, year, dimensions, a sentence of
  narrative) once Anna provides them — shown on the gallery lightbox + product.
- 🟢 Scroll-driven parallax on the hero; an animated SVG signature.
- 🟢 A written **engineering case study** (problem → decisions → trade-offs →
  outcome, incl. the checkout→enquiry pivot) — the actual CV artifact.
- 🟢 Press / exhibitions section if/when Anna has coverage to show.
