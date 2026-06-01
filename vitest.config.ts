import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// Unit tests run in a Node environment against the server-side libraries
// (money, rate limiting, validation). No browser/jsdom needed yet — the
// commerce-critical logic we most need to protect is all server-side.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: true,
    // Unit tests exercise pure logic — no external services. Bypass the
    // boot-time secret validation (src/lib/env.ts) so importing server
    // libraries doesn't require a real DATABASE_URL/Stripe key to be present.
    env: {
      SKIP_ENV_VALIDATION: "true",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      // `server-only` throws when imported outside a React Server Component.
      // Unit tests have no RSC boundary, so swap it for an empty stub.
      "server-only": resolve(__dirname, "src/test/server-only-stub.ts"),
    },
  },
});
