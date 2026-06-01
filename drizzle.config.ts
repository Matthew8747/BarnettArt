import { defineConfig } from "drizzle-kit";

// drizzle-kit runs OUTSIDE the Next.js runtime, so it can't import src/lib/env.
// Load .env directly for migration/studio commands.
import { config } from "dotenv";
config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and fill it in.",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
