import { z } from "zod";

/**
 * Centralised, validated environment access.
 *
 * Importing `env` anywhere guarantees the variable exists and is well-formed —
 * a missing DATABASE_URL or a malformed Stripe key fails fast at boot with a
 * readable error, instead of surfacing as a confusing runtime crash later.
 *
 * Rules:
 *  - Never read `process.env.X` directly in app code. Import from here.
 *  - Only NEXT_PUBLIC_* values are safe to reference in client components.
 */

const isProd = process.env.NODE_ENV === "production";

// `next build` evaluates server modules to collect page data, but runtime
// secrets aren't (and shouldn't be) present at build time — Vercel injects them
// at runtime. Skip strict validation during the build phase (and when explicitly
// opted out). Runtime in production still validates on first import, so the
// fail-fast guarantee is preserved where it matters.
const skipValidation =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.SKIP_ENV_VALIDATION === "true";

// Demo/prototype mode: serve a curated in-repo catalog with no database or
// payment provider, so a Vercel preview boots with zero external services. When
// on, the integration secrets below are NOT required even in production.
//
// Enabled explicitly via DEMO_MODE=true, OR automatically whenever no
// DATABASE_URL is configured — so a fresh deploy with no database shows the
// sample catalog instead of crashing (and you don't have to remember to set the
// flag, or worry about Vercel per-environment scoping). A real deploy always has
// DATABASE_URL, so demo turns itself off there.
const hasDatabaseUrl =
  typeof process.env.DATABASE_URL === "string" &&
  process.env.DATABASE_URL.length > 0;
const isDemo = process.env.DEMO_MODE === "true" || !hasDatabaseUrl;

const enforceRequired = isProd && !skipValidation && !isDemo;

// Required in production runtime; optional (blank-allowed) in dev and at build.
// In the relaxed (dev/build) case we accept either a value that satisfies the
// refined schema (e.g. a real `https://` URL or `sk_…` key), an empty string
// (a freshly-copied .env leaves integration vars blank), or nothing at all.
// Without the empty-string branch, refinements like `.url()`/`.email()` reject
// "" and break `npm run build` locally.
const requiredInProd = (schema: z.ZodString) =>
  enforceRequired
    ? schema.min(1)
    : z
        .union([schema, z.literal("")])
        .optional()
        .default("");

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  DATABASE_URL:
    skipValidation || isDemo
      ? z.string().optional().default("")
      : z.string().min(1, "DATABASE_URL is required"),

  // "true" enables the no-database demo catalog (see isDemoMode below).
  DEMO_MODE: z.string().optional().default(""),

  STRIPE_SECRET_KEY: requiredInProd(z.string().startsWith("sk_")),
  STRIPE_WEBHOOK_SECRET: requiredInProd(z.string().startsWith("whsec_")),

  UPSTASH_REDIS_REST_URL: requiredInProd(z.string().url()),
  UPSTASH_REDIS_REST_TOKEN: requiredInProd(z.string()),

  RESEND_API_KEY: requiredInProd(z.string().startsWith("re_")),
  EMAIL_FROM: requiredInProd(z.string().email()),

  // Where the "contact Anna" form delivers. Optional: if unset, contact
  // messages fall back to the first ADMIN_EMAILS entry, and if neither is set
  // the form logs server-side instead of sending (dev-friendly, never crashes).
  CONTACT_EMAIL: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .default(""),

  // Commerce model (see docs/anna-art-platform-plan.md §"Commerce model"):
  //  - "checkout": Stripe Checkout is live (current; the engineering CV story).
  //  - "inquiry":  direct payment is disabled; buy CTAs become "Enquire to buy"
  //    and route to the contact form. Flip this one var to switch the whole
  //    site to enquiry-based ordering — no data migration.
  // Preprocess so an empty/blank value (a freshly-copied .env) is treated as the
  // default rather than crashing the enum — `.default()` alone only fills
  // `undefined`, not "".
  COMMERCE_MODE: z.preprocess(
    (v) => (v === "" || v == null ? "checkout" : v),
    z.enum(["checkout", "inquiry"]),
  ),

  AWS_REGION: z.string().default("eu-west-2"),
  S3_BUCKET_NAME: z.string().optional().default(""),
  CLOUDFRONT_URL: z.string().optional().default(""),
  AWS_ACCESS_KEY_ID: z.string().optional().default(""),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(""),

  ADMIN_EMAILS: z.string().default(""),

  // Secret used to HMAC-sign the cart cookie (tamper detection). Required in
  // production; in dev a fixed fallback keeps local carts working without setup.
  CART_SECRET: enforceRequired
    ? z.string().min(16, "CART_SECRET must be at least 16 chars")
    : z.string().default("dev-only-insecure-cart-secret-change-me"),

  SENTRY_DSN: z.string().optional().default(""),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: requiredInProd(
    z.string().startsWith("pk_"),
  ),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().default(""),
});

function parse<T extends z.ZodTypeAny>(schema: T, source: unknown): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${issues}\n` +
        `See .env.example and docs/EXTERNAL-SETUP.md.`,
    );
  }
  return result.data;
}

export const env = {
  ...parse(serverSchema, process.env),
  ...parse(clientSchema, {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  }),
};

/** Parsed list of admin email addresses (lower-cased, trimmed). */
export const adminEmails = env.ADMIN_EMAILS.split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Inbox for "contact Anna" enquiries: CONTACT_EMAIL if set, else the first
 * admin email, else "" (the email layer then logs instead of sending).
 */
export const contactEmail = env.CONTACT_EMAIL || adminEmails[0] || "";

/** Active commerce model. See COMMERCE_MODE above. */
export const commerceMode = env.COMMERCE_MODE;

/**
 * True when direct payment is switched off and the site takes orders as
 * enquiries to Anna instead of Stripe checkout. Drives the buy-CTA copy and
 * hard-disables the checkout API as defence in depth.
 */
export const isInquiryMode = env.COMMERCE_MODE === "inquiry";

/**
 * Demo/prototype mode — true when `DEMO_MODE=true` OR no `DATABASE_URL` is
 * configured. The storefront then serves a curated in-repo catalog
 * (src/lib/demo-data.ts) and never touches the database; checkout is disabled.
 * Lets a fresh Vercel deploy run with no external services and never crash for
 * lack of a database.
 */
export const isDemoMode = env.DEMO_MODE === "true" || !env.DATABASE_URL;
