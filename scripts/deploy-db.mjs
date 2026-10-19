#!/usr/bin/env node
/**
 * Runs on every deploy (see "vercel-build" in package.json):
 *   1. prisma migrate deploy  — applies pending migrations (never resets data)
 *   2. prisma db seed         — idempotent: default plans, templates, platform settings, super admin
 * Skipped with a warning when DATABASE_URL is not set, so preview builds without a DB still work.
 */
import "dotenv/config";
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL is not set — skipping migrations & seed. The app needs a database to run.");
  process.exit(0);
}

const run = (cmd) => {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
};

run("pnpm prisma migrate deploy");
if (process.env.SKIP_SEED === "true") console.log("SKIP_SEED=true — seed skipped");
else run("pnpm prisma db seed");
