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

const enforceRequired = isProd && !skipValidation;

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

  DATABASE_URL: skipValidation
    ? z.string().optional().default("")
    : z.string().min(1, "DATABASE_URL is required"),

  STRIPE_SECRET_KEY: requiredInProd(z.string().startsWith("sk_")),
  STRIPE_WEBHOOK_SECRET: requiredInProd(z.string().startsWith("whsec_")),

  UPSTASH_REDIS_REST_URL: requiredInProd(z.string().url()),
  UPSTASH_REDIS_REST_TOKEN: requiredInProd(z.string()),

  RESEND_API_KEY: requiredInProd(z.string().startsWith("re_")),
  EMAIL_FROM: requiredInProd(z.string().email()),

  AWS_REGION: z.string().default("eu-west-2"),
  S3_BUCKET_NAME: z.string().optional().default(""),
  CLOUDFRONT_URL: z.string().optional().default(""),
  AWS_ACCESS_KEY_ID: z.string().optional().default(""),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(""),

  ADMIN_EMAILS: z.string().default(""),

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
