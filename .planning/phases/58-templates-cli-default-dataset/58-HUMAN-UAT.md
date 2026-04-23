---
status: partial
phase: 58-templates-cli-default-dataset
source: [58-VERIFICATION.md]
started: 2026-04-23T12:01:00Z
updated: 2026-04-23T12:01:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Run `yarn dev:reset-with-data` and browse the VAA
expected: VAA loads with 4 locales (en/fi/sv/da), 8 parties, 13 constituencies, 100 candidates each showing a portrait; political compass shows visible party clustering
result: [pending]

### 2. Run integration test with live Supabase
expected: `yarn workspace @openvaa/dev-seed test:unit tests/integration/default-template.integration.test.ts` with `supabase start` active (SUPABASE_URL set) passes, confirming NF-01 <10s budget, 100 candidates with image.path populated, 100 portrait objects in Storage bucket, all 4 locale keys on elections.name, relational wiring
result: [pending]

### 3. Visually verify candidate portrait renders with alt text
expected: Portrait JPEG visible on candidate profile; browser inspector shows `alt` attribute populated from first+last name (e.g. 'Anna Virtanen') or external_id fallback
result: [pending]

### 4. Live custom .ts template load
expected: `yarn dev:seed --template ./path-to-custom.ts` with a custom .ts template against running Supabase loads via dynamic import, validates via zod, seeds successfully; no modification to @openvaa/dev-seed needed
result: [pending]

### 5. Teardown preserves bootstrap rows
expected: `yarn dev:seed:teardown` after `dev:reset-with-data`: row counts for accounts, projects, app_settings, storage_config identical pre/post; generator-produced rows (external_id LIKE 'seed_%') fully removed
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
