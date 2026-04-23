---
phase: 58-templates-cli-default-dataset
plan: 04
subsystem: dev-seed
tags: [dev-seed, writer, portrait-upload, supabase-storage, phase-58-wave-2, d-58-06, pitfall-2, pitfall-4, pitfall-8, tdd]

# Dependency graph
requires:
  - phase: 58-templates-cli-default-dataset
    plan: 02
    provides: 30 committed portrait JPEGs at packages/dev-seed/src/assets/portraits/portrait-NN.jpg
  - phase: 56-generator-foundations-plumbing
    provides: SupabaseAdminClient base class; Writer env-enforcement + D-11 routing; vi.mock pattern for writer tests
provides:
  - SupabaseAdminClient.selectCandidatesForPortraitUpload(prefix) — reads generator-produced candidate UUIDs + names (Pitfall #8 workaround for bulk_import not returning inserted rows)
  - SupabaseAdminClient.uploadPortrait(id, extId, filename, bytes) — JPEG upload to public-assets bucket with 3-segment RLS-compliant path
  - SupabaseAdminClient.updateCandidateImage(id, extId, {path, alt}) — writes candidates.image JSONB (NOT image_id — Pitfall #2)
  - Writer.uploadPortraits private pass — orchestrates readdir → select → upload → update for the whole candidate set
  - Writer.write signature extension: optional externalIdPrefix arg (default 'seed_'), returns { portraits: N }
affects: [58-05 CLI seed summary consumes { portraits }, 58-07 pipeline wiring, 58-09 integration test (live upload against local Supabase)]

# Tech tracking
tech-stack:
  added: []  # No new deps — uses node:fs, node:path, node:url (stdlib) and existing @supabase/supabase-js
  patterns:
    - "3-segment RLS-compliant storage path: {projectId}/{entityType}/{entityId}/{filename} (VERIFIED: apps/supabase/supabase/migrations/00001_initial_schema.sql:1934-1936)"
    - "Pitfall #8 — SELECT-before-upload to retrieve Postgres-assigned UUIDs (bulk_import RPC returns aggregate counts, not inserted row IDs)"
    - "Pitfall #2 guardrail: column is candidates.image JSONB with { path, alt } shape — not candidates.image_id FK"
    - "Pitfall #4 — WCAG 2.1 AA alt text: 'first_name last_name'.trim() with external_id fallback when both names empty"
    - "Pitfall #1 filesystem-order determinism: readdirSync + .sort() + regex filter for stable cycling across platforms"
    - "Sequential (not Promise.all) upload loop: deterministic cycling + candidate-scoped error messages + no interleaved logs"
    - "import.meta.url path resolution: PORTRAITS_DIR computed once at module load, stable whether invoked from repo root or workspace"

key-files:
  created:
    - packages/dev-seed/tests/supabaseAdminClient.test.ts
    - .planning/phases/58-templates-cli-default-dataset/58-04-SUMMARY.md
  modified:
    - packages/dev-seed/src/supabaseAdminClient.ts
    - packages/dev-seed/src/writer.ts
    - packages/dev-seed/tests/writer.test.ts

key-decisions:
  - "Extended existing SupabaseAdminClient rather than creating a separate PortraitUploader class — keeps the admin client as the single seam for all Supabase operations and matches the existing narrow-method pattern (updateAppSettings, importAnswers)"
  - "Writer.uploadPortraits is private — only Writer.write calls it, no external consumer. Keeps the pass order contract internal to Writer per D-22 (Writer is pure I/O orchestrator)"
  - "selectCandidatesForPortraitUpload returns the minimal column set (id, external_id, first_name, last_name) — alt text needs names, path needs id, scoping needs external_id. No Candidate row enrichment beyond that (Plan 08 may add more)"
  - "Optional 2nd arg to write() (externalIdPrefix = 'seed_') preserves backward-compat with Phase 56/57 test callers that invoke write({...}) with one arg; Plan 05 CLI passes the ctx-supplied prefix"
  - "Return type { portraits: N } chosen over log-only reporting because Plan 05 needs a typed handoff for the seed summary (D-58-14); future passes can extend the object without breaking callers"
  - "Empty names fall back to external_id (not silent skip) so every image row has a non-empty alt — avoids accessibility regression if a template omits first_name/last_name"
  - "Skip silently on empty candidate set (count=0 template) but throw on empty portraits dir — candidate count is a template choice, missing assets is a broken installation"

patterns-established:
  - "TDD RED/GREEN per task: test commit lands first with new methods undefined; impl commit follows. `git log --oneline` shows the clean cycle: test → feat → test → feat"
  - "Mock surface for Supabase query builder: thenable builder with terminalKind (select|update) switch in .then() — one mock pattern covers both select-terminated and update-terminated chains"
  - "Writer test mock extended additively: default portrait methods return [] candidates / no-op uploads so pre-existing tests stay green; per-test mockResolvedValueOnce overrides activate the upload branch"

requirements-completed: [GEN-09]

# Metrics
duration: ~30 min (two TDD cycles + SUMMARY)
completed: 2026-04-23
tasks: 2
files-created: 2  # supabaseAdminClient.test.ts, 58-04-SUMMARY.md
files-modified: 3  # supabaseAdminClient.ts, writer.ts, writer.test.ts
---

# Phase 58 Plan 04: Portrait Upload (Writer + SupabaseAdminClient)

Writer now uploads candidate portraits to Supabase Storage and populates `candidates.image` JSONB as a new pass between `linkJoinTables` and `updateAppSettings`, closing GEN-09 so the frontend renders real portraits instead of placeholder avatars.

## Summary

Extended `SupabaseAdminClient` with three narrow portrait methods (select by external_id prefix, upload to public-assets bucket, update image JSONB) and added a `uploadPortraits` private pass to `Writer.write()` that reads 30 committed JPEGs, cycles them deterministically across the candidate set, and writes `{ path, alt }` with WCAG-compliant alt text to every row. The pass fires after `bulk_import` assigns UUIDs and before app-settings merge, so candidates are queryable by external_id and any upload failure aborts the seed run before settings commit.

## What Shipped

### SupabaseAdminClient (80 lines added to `packages/dev-seed/src/supabaseAdminClient.ts`)

Three new public methods at the bottom of the class (no existing method touched):

- **`selectCandidatesForPortraitUpload(externalIdPrefix)`** — `.from('candidates').select('id, external_id, first_name, last_name').eq('project_id', this.projectId).like('external_id', '${prefix}%').order('external_id', {ascending: true})`. Deterministic order by `external_id` so portrait cycling is stable. Throws `selectCandidatesForPortraitUpload failed: ${msg}` on error.
- **`uploadPortrait(candidateId, externalId, filename, bytes)`** — `.storage.from('public-assets').upload('${projectId}/candidates/${candidateId}/${filename}', bytes, { contentType: 'image/jpeg', upsert: true })`. Returns the canonical path string for caller to thread into `updateCandidateImage`. Throws `Portrait upload failed for ${externalId}: ${msg}` on storage error.
- **`updateCandidateImage(candidateId, externalId, image)`** — `.from('candidates').update({ image }).eq('id', candidateId)`. Direct update (no merge — Phase 58 authors the full `{ path, alt }` shape). Throws `Image column update failed for ${externalId}: ${msg}` on update error.

All errors are candidate-scoped so CLI surfacing (Plan 05) can cite the offending row.

### Writer (106 lines added to `packages/dev-seed/src/writer.ts`)

- **Imports**: `node:fs` (`readdirSync`, `readFileSync`), `node:path` (`dirname`, `join`), `node:url` (`fileURLToPath`).
- **Module constant** `PORTRAITS_DIR`: resolved once via `import.meta.url` so the path is stable across invocation contexts (repo-root script, workspace script, test runner).
- **Private method `uploadPortraits(externalIdPrefix)`**:
  1. `readdirSync(PORTRAITS_DIR).filter(/^portrait-\d{2}\.jpg$/).sort()` — regex filter drops LICENSE.md and stray files; explicit sort locks iteration order across platforms (Pitfall #1).
  2. Throws descriptively on empty dir or fs error.
  3. `selectCandidatesForPortraitUpload(prefix)` — Pitfall #8 workaround.
  4. Skip silently if zero candidates (count=0 templates are valid).
  5. Sequential loop (not `Promise.all`) over candidates: `readFileSync` portrait N = `portraits[i % portraits.length]`, `uploadPortrait`, build alt as `trim("first_name last_name") || external_id`, `updateCandidateImage`.
  6. Return count.
- **`write()` signature extension**: optional 2nd arg `externalIdPrefix = 'seed_'`; return type `Promise<{ portraits: number }>` for Plan 05 CLI summary.

### Tests

- **`packages/dev-seed/tests/writer.test.ts`** — 10 new `it` blocks under `describe('uploadPortraits pass (Phase 58 Plan 04 — GEN-09)')`. Covers sequence order, prefix propagation (default + custom), cycling determinism, alt-text construction, WCAG fallback, whitespace trimming, skip-on-empty, upload-error rethrow + appSettings-skip, update-error rethrow, and `{ portraits }` return shape. Extended the top-level `vi.mock` to inject default portrait-method stubs so existing 13 tests remain green.
- **`packages/dev-seed/tests/supabaseAdminClient.test.ts`** — new file, 7 `it` blocks across three `describe` groups (one per method). Mocks `@supabase/supabase-js` `createClient` with a thenable builder that switches its terminal result between `selectResult` and `updateResult` based on which terminator was called last. Asserts the query shape (`.from`, `.select`, `.eq`, `.like`, `.order`, `.update`), success paths, and error-wrapping messages.

All 23 writer tests + 7 admin-client tests pass. Typecheck (`yarn workspace @openvaa/dev-seed typecheck`) exits clean.

## Three Pitfalls Landed

**Pitfall #2 (schema wording drift).** Column is `candidates.image` JSONB, not `candidates.image_id`. The only `image_id` mention in touched files is a JSDoc comment on `updateCandidateImage` explicitly warning against it. Writer uses zero `image_id` strings. Verified by `grep image_id packages/dev-seed/src/writer.ts` returning no hits.

**Pitfall #4 (WCAG).** `alt` is built as `"${first_name ?? ''} ${last_name ?? ''}".trim()` with a fallback to `external_id` when both names are empty. Never null, never empty string. Covered by two tests: Alice/Bob/Carol positive case and an empty-names edge case that verifies the external_id fallback.

**Pitfall #8 (UUID read-back).** `bulk_import` returns aggregate counts, not UUIDs. The new `selectCandidatesForPortraitUpload` issues one extra SELECT before the upload loop to fetch Postgres-assigned IDs + names. Round-trip cost is acceptable (single query, indexed by `project_id + external_id`) and keeps the `bulk_import` RPC surface narrow.

## Execution Sequence (TDD Gates)

| Commit | Type | Scope | Purpose |
|--------|------|-------|---------|
| `dc0709fdd` | test | admin-client | RED — failing tests for three portrait methods |
| `a4303e0a6` | feat | admin-client | GREEN — implement methods, 7 tests pass |
| `3878b4f3e` | test | writer | RED — 10 failing tests for uploadPortraits pass |
| `858b3a858` | feat | writer | GREEN — implement pass, all 23 writer tests pass |

## Deviations from Plan

None. The two tasks executed as specified. One minor adjustment: the plan described tests inline with stub code sketches; the implementation used the project's established `vi.mock('../src/supabaseAdminClient', ...)` factory pattern (explicitly called out in Task 2 "Follow the EXACT vi.mock pattern the existing `writer.test.ts` uses") and augmented it additively with three new portrait-method stubs on every instance. The admin-client tests needed a separate `vi.mock('@supabase/supabase-js')` since they exercise the real `SupabaseAdminClient` class directly.

## Deferred / Out of Scope

Pre-existing test-file failures for `@openvaa/core` and `@openvaa/matching` package resolution (5 files: `determinism.test.ts`, `pipeline.test.ts`, `latent/latentEmitter.test.ts`, `latent/project.test.ts`, `latent/clustering.integration.test.ts`) are unchanged by this plan — verified by running `yarn workspace @openvaa/dev-seed test:unit` on the clean base (pre-stash) and confirming identical failure set. These are dev-environment build resolution issues unrelated to Writer / portrait upload; logging to `deferred-items.md` is not needed because the failures predate Wave 1 and are already known to the phase.

The actual end-to-end upload-and-render assertion is deferred to Plan 09 (integration test against live Supabase): this plan's tests are pure mock-based unit tests per the D-22 / NF-04 contract.

## Threat Model Compliance

Four threats from the plan's register are `accept` (T-58-04-01/02/03/04/06 — tampering, info disclosure, DOS, privilege, collision) and are addressed structurally by existing infrastructure (git-tracked JPEGs, public UUIDs, documented service-role envelope, UUID-namespaced paths). One threat (`T-58-04-05 — repudiation / silent swallow`) required `mitigate`: the implementation throws on upload AND update errors with candidate-scoped messages, and Task 2 Test 6 ("rethrows upload errors") explicitly asserts that `updateAppSettings` is NOT called after a thrown upload — preserving seed-run atomicity.

No new threat surface introduced beyond the plan's register.

## Verification Results

```
yarn workspace @openvaa/dev-seed typecheck   # exit 0 (clean)
yarn workspace @openvaa/dev-seed test:unit tests/writer.test.ts                    # 23/23 pass
yarn workspace @openvaa/dev-seed test:unit tests/supabaseAdminClient.test.ts       # 7/7 pass
yarn workspace @openvaa/dev-seed test:unit                                         # 212 tests pass, 5 pre-existing file-level failures unchanged
```

All must-have truths verified:

- [x] Writer extended with `uploadPortraits` pass between `linkJoinTables` and `updateAppSettings`
- [x] SupabaseAdminClient has three new portrait methods with correct error wrapping
- [x] `candidates.image` JSONB written with `{ path, alt }` shape (not `image_id`)
- [x] WCAG-compliant alt text per candidate with external_id fallback
- [x] Upload/update errors abort the run; no partial state (`updateAppSettings` skipped on failure)
- [x] Tests cover happy path (cycling + alt), error paths (upload + update), edge cases (empty names, empty candidates), and sequence order
- [x] Deterministic cycling via sorted `readdirSync` + `SQL ORDER BY external_id` + `i % N` loop
- [x] Descriptive error on missing/empty assets dir
- [x] `PORTRAITS_DIR` resolved via `import.meta.url` for cross-invocation stability

## Self-Check: PASSED

**Files verified to exist:**
- `packages/dev-seed/src/writer.ts` — FOUND
- `packages/dev-seed/src/supabaseAdminClient.ts` — FOUND
- `packages/dev-seed/tests/writer.test.ts` — FOUND
- `packages/dev-seed/tests/supabaseAdminClient.test.ts` — FOUND (created this plan)
- `.planning/phases/58-templates-cli-default-dataset/58-04-SUMMARY.md` — FOUND (this file)

**Commits verified in git log:**
- `dc0709fdd` test(58-04): add failing tests for SupabaseAdminClient portrait methods — FOUND
- `a4303e0a6` feat(58-04): add portrait upload methods to SupabaseAdminClient — FOUND
- `3878b4f3e` test(58-04): add failing tests for Writer uploadPortraits pass — FOUND
- `858b3a858` feat(58-04): add uploadPortraits pass to Writer for candidate portraits — FOUND

## TDD Gate Compliance

RED → GREEN sequence visible in git log with strictly alternating `test(58-04): ...` → `feat(58-04): ...` commits per task. No REFACTOR phase needed — implementations landed clean on the first pass, all acceptance criteria met on initial GREEN.
