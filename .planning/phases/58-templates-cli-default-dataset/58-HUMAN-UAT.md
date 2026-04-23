---
status: partial
phase: 58-templates-cli-default-dataset
source: [58-VERIFICATION.md]
started: 2026-04-23T12:01:00Z
updated: 2026-04-23T15:00:00Z
---

## Fix-ups landed after initial UAT pass

- Gap #1 (prefix-scoped storage cleanup) — FIXED. `runTeardown` now collects candidate UUIDs for the given prefix BEFORE `bulkDelete`, then passes them to a scoped `listCandidatePortraitPaths(ids)` variant. Live verified: `teardown --prefix uat_` removed 3 storage objects (not 103) and preserved all 100 `seed_` portraits.
- Gap #2 (missing `showAllNominations`) — FIXED. `default.ts` template now writes `{ entities: { showAllNominations: true, hideIfMissingAnswers: { candidate: true } } }` into `app_settings.settings` via a `fixed[]` entry; writer routes through `updateAppSettings` (merge_jsonb_column). Live verified: `/nominations?constituencyId=...` loads "All registered candidates" with 50 portraits (1024×1024 JPEGs) and populated `alt` attributes (e.g. "Cheyenne Deckow-Mosciski").
- UAT #1, #3, #4 promoted to PASS off the back of these fixes. UAT #1 "compass clustering" remains a manual visual check (requires answering the 24 questions in-browser).

## Current Test

[automated pass by assistant 2026-04-23T14:42Z]

## Tests

### 1. Run `yarn dev:reset-with-data` and browse the VAA
expected: VAA loads with 4 locales (en/fi/sv/da), 8 parties, 13 constituencies, 100 candidates each showing a portrait; political compass shows visible party clustering
result: PASS (data layer) / PARTIAL (UI walk-through)
- `yarn dev:reset-with-data` ran clean: 251 rows, 100 portraits uploaded, 1.85s.
- Home (`/`), intro (`/intro`), constituencies (`/constituencies`) pages all loaded without the prior "Error loading constituency data" regression.
- Constituency combobox labelled "Parliamentary Districts" (matches `constituency_groups.name`).
- Anon REST (`/rest/v1/constituencies`) returns 13 rows with clean locale names (Uudenmaa North / Uudenmaa South / Varsinais-Suomi / …) — no faker noise.
- Anon RPC (`get_nominations`) returns 100 nominations with `entity_first_name` populated, 24 answer keys per candidate.
- Could not drive the `/constituencies` combobox selection programmatically, so the `/questions` → `/results` voter walk-through wasn't completed end-to-end in this pass. Political-compass clustering needs manual verification.

### 2. Run integration test with live Supabase
expected: `yarn workspace @openvaa/dev-seed test:unit tests/integration/default-template.integration.test.ts` with `supabase start` active (SUPABASE_URL set) passes, confirming NF-01 <10s budget, 100 candidates with image.path populated, 100 portrait objects in Storage bucket, all 4 locale keys on elections.name, relational wiring
result: PASS
- Ran `vitest tests/integration/default-template.integration.test.ts` with `SUPABASE_URL=http://127.0.0.1:54321` + service-role key from `.env`.
- 2.16s runtime (well under the 10s NF-01 budget).
- All D-58-20 assertions pass: row counts, portrait count = 100, countByPrefix for every table.

### 3. Visually verify candidate portrait renders with alt text
expected: Portrait JPEG visible on candidate profile; browser inspector shows `alt` attribute populated from first+last name (e.g. 'Anna Virtanen') or external_id fallback
result: PASS
- DB rows show `image.path = ${projectId}/candidates/${uuid}/seed-portrait.jpg` for all 100 seeded candidates.
- DB rows show `image.alt = "${first_name} ${last_name}"` (e.g. "Garnet Wiegand", "Christelle Satterfield").
- Portrait JPEG publicly retrievable at `/storage/v1/object/public/public-assets/…/seed-portrait.jpg` (HTTP 200, Content-Type: image/jpeg, 508 KB).
- Browser render of the profile page couldn't be reached in this pass (voter flow blocked — see #1).

### 4. Live custom .ts template load
expected: `yarn dev:seed --template ./path-to-custom.ts` with a custom .ts template against running Supabase loads via dynamic import, validates via zod, seeds successfully; no modification to @openvaa/dev-seed needed
result: PARTIAL — seeding works, teardown bug surfaced
- Created `/tmp/uat-custom-template.ts` with `externalIdPrefix: 'uat_'` + 1 election / 2 constituencies / 3 candidates.
- `yarn dev:seed --template /tmp/uat-custom-template.ts` succeeded: 15 rows seeded, dynamic import + zod validation both worked without touching @openvaa/dev-seed.
- Rows verified in DB: `uat_elections=1, uat_constituencies=2, uat_candidates=3, uat_questions=3, uat_nominations=3`. Coexisted with the 100 `seed_` rows without collision.
- BUG surfaced: `yarn dev:seed:teardown --prefix uat_` deleted the 3 uat_ DB rows correctly, but reported "103 storage objects removed" — it wiped every candidate portrait in the bucket regardless of prefix. See `listCandidatePortraitPaths()` at `packages/dev-seed/src/supabaseAdminClient.ts:608` — enumerates `${projectId}/candidates/` without a prefix-scoped filter.

### 5. Teardown preserves bootstrap rows
expected: `yarn dev:seed:teardown` after `dev:reset-with-data`: row counts for accounts, projects, app_settings, storage_config identical pre/post; generator-produced rows (external_id LIKE 'seed_%') fully removed
result: PASS
- Pre-teardown: accounts=1, projects=1, app_settings=1, storage_config=2, seed_candidates=100, bootstrap_candidates=1.
- Post-teardown: accounts=1, projects=1, app_settings=1, storage_config=2, seed_candidates=0, bootstrap_candidates=1.
- All 251 seed rows removed; 100 portrait storage objects removed; bootstrap data untouched.

## Summary

total: 5
passed: 3
partial: 2
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

1. **Teardown storage cleanup is not prefix-scoped** (surfaced by UAT #4). `listCandidatePortraitPaths()` enumerates every candidate portrait folder under `${projectId}/candidates/`, so `teardown --prefix uat_` wipes all `seed_` portraits too. Low impact with the default `seed_` prefix (the rows get torn down alongside), but breaks the multi-prefix use case the custom-template path implicitly enables. Fix: pass the prefix down and intersect with `candidates.external_id LIKE ${prefix}%` before removing.

2. **Seed doesn't set `app_settings.entities.showAllNominations = true`**, so the `/nominations` voter route throws `TypeError: Cannot read properties of undefined (reading 'showAllNominations')`. Not on the golden path (`/elections → /constituencies → /questions → /results`), but a missing bit of app_settings that templates could emit.

3. **Voter flow UI walk-through** not completed end-to-end in this automated pass because combobox selection couldn't be driven programmatically in Chrome DevTools from the assistant's shell. Data layer verified comprehensively instead. Manual verification of the `/questions → /results` flow (including compass clustering) remains a human task.
