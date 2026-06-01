import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Single shared Drizzle client.
 *
 * The connection is cached on globalThis in development so Next.js hot-reloads
 * don't open a new pool on every change (a classic dev-time connection leak).
 * `server-only` guarantees this module can never be bundled into client code,
 * keeping the DATABASE_URL off the browser.
 */

const globalForDb = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__pgClient ??
  postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === "production" ? 10 : 5,
    // Neon and most managed Postgres require TLS in production.
    ssl: env.NODE_ENV === "production" ? "require" : undefined,
  });

if (env.NODE_ENV !== "production") globalForDb.__pgClient = client;

export const db = drizzle(client, { schema });
export { schema };
