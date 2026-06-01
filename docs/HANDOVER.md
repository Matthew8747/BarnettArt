# Handover — Barnett Art Platform

For whoever maintains this site after the build (including Anna for day-to-day
shop operations, and any future engineer). Finalised in Phase 4; this is the
living skeleton.

## What the site is
A storefront for selling original artwork and prints, plus a portfolio. Payments
run through Stripe; images are served from a CDN; everything is version-controlled
and deploys automatically.

## Accounts & ownership
All money/identity accounts are in **Anna's name** (Stripe, bank, domain, AWS
billing). The engineer holds collaborator/team access. See
[`EXTERNAL-SETUP.md`](./EXTERNAL-SETUP.md) for the full list.

| Service | Purpose | Owner |
|---|---|---|
| GitHub | Code + CI | Engineer (Anna optional) |
| Vercel | App hosting | Engineer/Anna team |
| Neon | Database | Engineer/Anna team |
| Stripe | Payments | **Anna** |
| Upstash | Rate limiting | Engineer |
| Resend | Order emails | Engineer/Anna |
| AWS | Image storage/CDN | **Anna** (billing) |
| Domain registrar | annabarnett.art | **Anna** |

## For Anna (non-technical, once the admin is built)
- **Add/edit artwork:** Admin → Products. Upload images, set price, mark
  available/sold/archived. (Built in Phase 1.)
- **See orders:** Admin → Orders. Mark an order fulfilled once posted.
- **An original sells out automatically** — it's marked sold the moment payment
  succeeds, so it can't be double-sold.
- **You never see card numbers** — Stripe handles all of that.
- If something looks wrong with a payment, check the **Stripe dashboard** first.

## For an engineer
- Architecture: [`anna-art-platform-plan.md`](./anna-art-platform-plan.md).
- Current status: [`IMPLEMENTATION.md`](./IMPLEMENTATION.md).
- Operations: [`RUNBOOK.md`](./RUNBOOK.md).
- Security: [`../SECURITY.md`](../SECURITY.md) + audit [`SECURITY-AUDIT.md`](./SECURITY-AUDIT.md).
- Design system & decisions: [`DESIGN.md`](./DESIGN.md).
- Local setup: README + [`EXTERNAL-SETUP.md`](./EXTERNAL-SETUP.md).

## Key invariants — do not break
1. **Card data never touches our servers.** Keep payments on Stripe elements.
2. **Prices are computed server-side.** Never trust a price from the browser.
3. **Webhook signatures are verified** before any state change; handlers are
   idempotent (Stripe retries).
4. **Money is integer pence**, never floats.
5. **Order line items are price snapshots** — never recompute a historical order.
6. **Secrets never enter git.** Local `.env`, prod via Vercel/Secrets Manager.

## Routine maintenance
- Merge Dependabot PRs after CI passes (weekly).
- Watch the AWS Budget alarm and monthly service usage.
- Rotate Stripe/API keys if ever exposed (see RUNBOOK → secret leak).
