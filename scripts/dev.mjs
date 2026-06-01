#!/usr/bin/env node
/**
 * One-command local dev spin-up:  npm run dev:up
 *
 * 1. Ensures a .env exists (copies from .env.example on first run).
 * 2. Starts the local Postgres container and waits until it's healthy.
 * 3. Syncs the database schema (generates the first migration if none exist,
 *    then applies all migrations).
 * 4. Starts the Next.js dev server on http://localhost:3000.
 *
 * Cross-platform (works in PowerShell and bash). Requires Docker Desktop running.
 */
import { execSync } from "node:child_process";
import { existsSync, copyFileSync, readdirSync } from "node:fs";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const step = (msg) => console.log(`\n\x1b[36m▶ ${msg}\x1b[0m`);

// 1. Environment file
if (!existsSync(".env")) {
  if (!existsSync(".env.example")) {
    console.error("✗ .env.example is missing — cannot bootstrap .env.");
    process.exit(1);
  }
  copyFileSync(".env.example", ".env");
  step("Created .env from .env.example (placeholder values are fine for dev).");
}

// 2. Database container
step("Starting Postgres (docker compose up -d --wait)…");
try {
  run("docker compose up -d --wait");
} catch {
  console.error("\n✗ Could not start the database. Is Docker Desktop running?");
  process.exit(1);
}

// 3. Schema sync via migrations
const hasMigrations =
  existsSync("drizzle") &&
  readdirSync("drizzle").some((f) => f.endsWith(".sql"));

if (!hasMigrations) {
  step("No migrations found — generating the initial migration…");
  run("npm run db:generate");
}
step("Applying migrations…");
run("npm run db:migrate");

// 4. Dev server
step("Starting Next.js dev server → http://localhost:3000");
run("npm run dev");
