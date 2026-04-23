#!/usr/bin/env npx tsx
/**
 * Standalone manual-dev entry to seed the local Supabase database with the
 * Phase 58 e2e built-in template.
 *
 * Equivalent to `yarn dev:seed --template e2e` (from the repo root); kept as a
 * convenience wrapper because it loads the repo-root .env the same way the
 * Playwright harness does (dotenv.config()) and exits with a clear message on
 * seed-path failures.
 *
 * Usage:   cd tests && npx tsx seed-test-data.ts
 * Prereqs: Supabase running (`yarn supabase:start`); env vars SUPABASE_URL +
 *          SUPABASE_SERVICE_ROLE_KEY set (via root .env).
 */

import dotenv from 'dotenv';
import { BUILT_IN_OVERRIDES, BUILT_IN_TEMPLATES, fanOutLocales, runPipeline, Writer } from '@openvaa/dev-seed';

dotenv.config();

async function seed() {
  const template = BUILT_IN_TEMPLATES.e2e;
  if (!template) throw new Error('BUILT_IN_TEMPLATES.e2e is undefined — Phase 58 regression?');
  const overrides = BUILT_IN_OVERRIDES.e2e ?? {};
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
