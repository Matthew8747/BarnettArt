# Runbook — Operating the Barnett Art Platform

Operational reference for running and troubleshooting the live site. Grows as the
system matures; today it covers the groundwork.

## Environments

| Env | App | Database | Notes |
|---|---|---|---|
| Local | `npm run dev` | Docker Postgres | placeholder integrations OK |
| Preview | Vercel per-PR | Neon (branch/prod) | auto-created on PR |
| Production | Vercel `main` | Neon (pooled, SSL) | live Stripe + secrets |

## Common tasks

### Run locally
```powershell
npm run dev:up     # .env + Postgres (waited) + migrations + dev server
npm run dev:down   # stop the database container
```
`dev:up` is idempotent — safe to re-run. Use plain `npm run dev` if the DB is
already up and migrated.

### Change the database schema
1. Edit `src/db/schema.ts`.
2. `npm run db:generate` → review the generated SQL in `drizzle/`.
3. `npm run db:migrate` (local). In CI/prod, migrations run as a gated step.
4. Commit both the schema change and the generated migration.

### Inspect data
`npm run db:studio` opens Drizzle Studio against the DB in `DATABASE_URL`.

### Deploy
Push to `main` → Vercel builds and deploys. Roll back from the Vercel dashboard
(Deployments → previous → Promote).

### Test Stripe webhooks locally
```powershell
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

## Monitoring

- **Liveness:** `GET /api/health` (point an uptime monitor here).
- **Errors:** Sentry (Phase 4).
- **Infra/logs:** Vercel logs (app), CloudWatch (AWS media), Stripe dashboard
  (payments + webhook delivery attempts).
- **Cost:** AWS Budget alarm; review Vercel/Neon/Upstash usage monthly.

## Incident playbook (stubs — expand as the system grows)

### Payments failing
1. Stripe dashboard → Developers → Webhooks: check delivery + signature errors.
2. Confirm `STRIPE_WEBHOOK_SECRET` in Vercel matches the live endpoint's secret.
3. Check Vercel function logs for `/api/webhooks/stripe`.
4. Stripe is the source of truth — reconcile orders against Stripe payments.

### Site down
1. Vercel status + latest deployment health.
2. Roll back to the last good deployment if a release caused it.
3. `GET /api/health` to isolate app vs. dependency failure.

### Database issues
1. Neon dashboard: connection count, compute status.
2. Verify `DATABASE_URL` (pooled, `sslmode=require`) in Vercel.

### Suspected secret leak
1. Rotate the affected key in its provider immediately.
2. Update Vercel env var; redeploy.
3. Review `gitleaks` CI history; purge from git history if it was committed.

## Backups & retention
- Neon provides point-in-time restore (verify retention on the chosen plan).
- Document customer-data retention/deletion policy before launch (GDPR).
