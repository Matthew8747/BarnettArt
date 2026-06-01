import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * env.ts parses process.env at import time, so each case resets the module
 * registry and stubs the environment before a fresh dynamic import.
 */
describe("environment validation (dev / build)", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("tolerates empty-string optional integration vars (a freshly-copied .env)", async () => {
    // Reproduces `npm run build` locally with .env copied from .env.example,
    // where Upstash/Stripe/Resend values are present but blank.
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SKIP_ENV_VALIDATION", "false");
    vi.stubEnv("DATABASE_URL", "postgresql://x:y@localhost:5432/db");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");

    const mod = await import("./env");
    expect(mod.env.UPSTASH_REDIS_REST_URL).toBe("");
    expect(mod.env.STRIPE_SECRET_KEY).toBe("");
  });

  it("still accepts a valid optional value when one is provided", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SKIP_ENV_VALIDATION", "false");
    vi.stubEnv("DATABASE_URL", "postgresql://x:y@localhost:5432/db");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://eu1.upstash.io");

    const mod = await import("./env");
    expect(mod.env.UPSTASH_REDIS_REST_URL).toBe("https://eu1.upstash.io");
  });
});
