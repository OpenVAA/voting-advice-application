#!/usr/bin/env npx tsx
/**
 * Standalone manual-dev entry to seed the local Supabase database with the
 * canonical `e2e/base` built-in template.
 *
 * Equivalent to `yarn db:seed --template e2e/base` (from the repo root); kept
 * as a convenience wrapper because it loads the repo-root .env the same way the
 * Playwright harness does (dotenv.config()) and exits with a clear message on
 * seed-path failures.
 *
 * Usage:   cd tests && npx tsx seed-test-data.ts
 * Prereqs: Supabase running (`yarn supabase:start`); env vars SUPABASE_URL +
 *          SUPABASE_SERVICE_ROLE_KEY set (via root .env).
 */

import { BUILT_IN_OVERRIDES, BUILT_IN_TEMPLATES, fanOutLocales, runPipeline, Writer } from '@openvaa/dev-seed';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  const template = BUILT_IN_TEMPLATES['e2e/base'];
  if (!template) throw new Error("BUILT_IN_TEMPLATES['e2e/base'] is undefined — Phase 93 regression?");
  const overrides = BUILT_IN_OVERRIDES['e2e/base'] ?? {};
  const seed = template.seed ?? 42;
  const prefix = template.externalIdPrefix ?? '';
  const rows = runPipeline(template, overrides);
  fanOutLocales(rows, template, seed);
  const writer = new Writer();
  await writer.write(rows, prefix);
}

seed().catch((e) => {
  const msg = (e as Error)?.message ?? String(e);
  console.error('Seed failed:', msg);
  process.exit(1);
});
