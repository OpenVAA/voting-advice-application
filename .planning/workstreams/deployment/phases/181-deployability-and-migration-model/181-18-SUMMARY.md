---
phase: 181-deployability-and-migration-model
plan: 18
subsystem: database
tags: [supabase, migrations, frozen-baseline, manifest, lint-check, drift, documentation]
status: complete

# Dependency graph
requires:
  - phase: 181-17
    provides: the frozen baseline (00001_initial_schema.sql, FREEZE_COMMIT 12c98aa5c), migrations.manifest.json and the parity guard in frozen mode inside lint:check
  - phase: 181-06
    provides: checkFrozenMigrations and its sixteen fixtures
  - phase: 181-10
    provides: isolated-instance.sh and yarn check:schema-equivalence
provides:
  - evidence/181-18-frozen-model-observations.md -- yarn lint:check exit 1 on an edited real baseline (EDITED FROZEN MIGRATION), exit 0 on an appended 00002 migration with its manifest line, three guard controls at 1, schema:regenerate refusing, and check-drift.sh 0 clean / 1 planted against the real manifest
  - evidence/181-18-local-gates.md -- build, test:unit, lint:check and format:check all 0 on 58cf7a564, tree clean before and after
  - four documents that state the frozen model (README, database skill, docs backend intro, grant-enum guard header)
affects: [181-19, 189]

# Actuals (#2632)
# tokens is chars/4 over the lines added by this plan's three task commits (26512 characters).
# commits is git rev-list --count plan_head_before..HEAD when this summary was written.
actuals:
  tokens: 6628
  tasks: 3
  commits: 3
plan_head_before: 78fa17897764939647641f63869228348f9d2375
plan_head_after: 7ce67fed4ed56ddf6f6326c59115b3b95e7a4d1e

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A guard counts once seen failing on the real file: the edit is made only in a detached scratch checkout, removed afterwards"
    - "Gate records are attempts: a red or interrupted attempt stays in the scratch directory unread, and a new attempt reruns all four gates from the start"

key-files:
  created:
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-18-frozen-model-observations.md
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-18-local-gates.md
  modified:
    - apps/supabase/README.md
    - .claude/skills/database/SKILL.md
    - apps/docs/src/routes/(content)/developers-guide/backend/intro/+page.md
    - scripts/assert-grant-permission-enum.mjs

key-decisions:
  - "The dev-seed integration tier is part of yarn test:unit and needs the shared stack running; an attempt run with the stack stopped is not evidence, and the gate is rerun whole on a running stack rather than narrowed"

patterns-established:
  - "A scratch checkout used to run lint:check is built (yarn build) after yarn install --immutable, or the typecheck link fails before the guard is reached"

requirements-completed: [SUPA-10]

coverage:
  - id: D1
    description: "yarn lint:check fails on an edited frozen baseline and passes on an appended numbered migration with its manifest line"
    requirement: "SUPA-10"
    verification:
      - kind: other
        ref: "evidence/181-18-frozen-model-observations.md#LINT_CHECK_EDITED_BASELINE_EXIT=1, LINT_CHECK_APPENDED_MIGRATION_EXIT=0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The drift check against the real manifest is 0 on a clean isolated database and 1 with planted DDL"
    requirement: "SUPA-10"
    verification:
      - kind: integration
        ref: "evidence/181-18-frozen-model-observations.md#DRIFT_REAL_MANIFEST_CLEAN_EXIT=0, DRIFT_REAL_MANIFEST_PLANTED_EXIT=1"
        status: pass
    human_judgment: false
  - id: D3
    description: "No owning document teaches yarn schema:regenerate or a generated migration"
    verification:
      - kind: other
        ref: "Task 2 verify command (git grep, grant-enum self-test, prettier --check)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Build, unit tests, lint:check and format:check are green on the frozen tree"
    verification:
      - kind: other
        ref: "evidence/181-18-local-gates.md (attempt 20261020T185902Z.58cf7a564d5c) and Task 3 verify command"
        status: pass
    human_judgment: false

# Metrics
duration: about 6h wall clock (12:58Z to 19:02Z), most of it the wait for the shared stack between attempts of Task 3
completed: 2026-10-20
---

# Phase 181 Plan 18: Frozen-Model Observations and Corrected Documents Summary

**yarn lint:check seen red (EDITED FROZEN MIGRATION) on the real edited baseline and green on an appended 00002 migration, check-drift.sh seen 0/1 on the real manifest, four documents rewritten to the frozen-baseline-plus-manifest model, and all four local gates green on 58cf7a564.**

## Performance

- **Duration:** about 6h wall clock; the active work was three short runs (Task 1 observations, Task 2 edits, Task 3 gates of 2 minutes on a warm machine)
- **Started:** 2026-10-20T12:58:54Z (first attempt of Task 1)
- **Completed:** 2026-10-20T19:02Z
- **Tasks:** 3 of 3
- **Files modified:** 6 (4 documents, 2 evidence records)

## Accomplishments

- Criterion 4, guard clause: in a detached scratch checkout of 78fa17897, `yarn lint:check` exited 1 with `EDITED FROZEN MIGRATION: 00001_initial_schema.sql ...` after one newline byte was appended to the baseline, and exited 0 with `00002_probe.sql` and its manifest line (census: 2 migrations). The guard alone gave 1 for UNLISTED MIGRATION, DUPLICATE VERSION and BAD NAME; `yarn schema:regenerate` exited 1 and printed `00002_<name>.sql` and the three steps.
- Criterion 4, drift clause: on the isolated instance `drift`, `infra/scripts/check-drift.sh` with the default manifest exited 0 clean and 1 after `ALTER TABLE public.projects ADD COLUMN planted_drift text`, naming the column.
- The four owning documents state the frozen model in the present tense; the grant-enum guard header changed only in comments and its self-test is 0.
- Local gates on 58cf7a564 (attempt `20261020T185902Z.58cf7a564d5c`): BUILD_EXIT=0, TEST_UNIT_EXIT=0, LINT_CHECK_EXIT=0, FORMAT_CHECK_EXIT=0; tree clean and HEAD unchanged before and after. The parity guard's census reads `1 migration(s) in the manifest; baseline 00001_initial_schema.sql -> 9556 line(s); 16 fixture(s) checked; the frozen migrations match the manifest.`

## Task Commits

1. **Task 1: lint:check red on an edited baseline, green on an appended migration; drift on the real manifest** - `d758d515f` (docs)
2. **Task 2: Correct the text the freeze made false** - `58cf7a564` (docs)
3. **Task 3: Run every local gate on the frozen tree** - `7ce67fed4` (docs)

## Files Created/Modified

- `evidence/181-18-frozen-model-observations.md` - the eight observation statuses with the guard's and the drift check's lines quoted
- `evidence/181-18-local-gates.md` - one run of the four gates on 58cf7a564, a byte copy of its attempt file
- `apps/supabase/README.md`, `.claude/skills/database/SKILL.md`, the docs backend intro page, `scripts/assert-grant-permission-enum.mjs` - see below

## Files phase 189 must know about

Edited by this plan (commit `58cf7a564`):

- **`.claude/skills/database/SKILL.md`** (the project's database skill):
  - The Backend Overview paragraph that began "**The schema is declarative: you edit one copy, the other is generated.**" is replaced by the paragraph that begins "**The migrations are frozen: a schema change is appended, never edited in.**" (frozen baseline `00001_initial_schema.sql`, appended five-digit migrations, `migrations.manifest.json`, the three-part schema change, `yarn check:schema-equivalence`, the parity guard in `lint:check`, `schema:regenerate` refusing, buckets in the migration and deployment rows in `infra/scripts/bootstrap.sql`).
  - The `description:` line gains "and a frozen baseline migration followed by appended numbered migrations listed in a manifest".
  - Reviewing item 13 now names the three-part change and `check:schema-equivalence` instead of `schema:regenerate`.
  - The Key Source Locations entry for the migrations names the frozen baseline and the manifest.
  - A new Freshness Record entry dated 2026-10-20 records the change and two re-measured counts (1 migration file; 1 manifest entry). Older Freshness Record entries that describe a generated single migration were left as records of their dates; no other count was re-measured.
- **`apps/supabase/README.md`** - the passage on the declarative model replaced by the frozen model; the command list entry for `yarn schema:regenerate` reads "writes nothing: prints the three steps of a schema change".
- **`apps/docs/src/routes/(content)/developers-guide/backend/intro/+page.md`** - the instruction to run `yarn schema:regenerate` replaced by the three-part schema change and `yarn check:schema-equivalence`.
- **`scripts/assert-grant-permission-enum.mjs`** - one header comment sentence no longer speaks of regenerating into the migration; no code changed.

Not edited, and false or stale under the frozen model:

- **`.claude/skills/recommended-skills/SKILL.md`, conflict 1 "Migration workflow" (about lines 70-75)** - still says the schema workflow is the one the database skill describes under "The schema is declarative: you edit one copy, the other is generated" (edit the schema source, regenerate the single migration file), and that a second migration file is rejected by `yarn assert:schema-migration-parity`. That heading no longer exists in the database skill (dangling reference), and a second, numbered migration with its manifest line is now the correct workflow; only a timestamp-named one is rejected (BAD NAME). Owned by phase 181.1's file; for phase 189 to correct.

Other tracked hits of Task 2's search (`git grep -n -e 'schema:regenerate' -e 'exactly \*\*one\*\* file' -e 'is generated' -- . ':!.planning'`), none teaching the old model:

- `package.json` (the `schema:regenerate` key, pointing at the refusing `--write`), `scripts/assert-schema-migration-parity.mjs` (refusal text and header), `packages/dev-seed/tests/schemaMigrationFreezeGate.test.ts` (asserts the key points at `--write`) - correct for the frozen model.
- `packages/supabase-types/RPC-NULLABILITY.md` - an enumeration block generated from `schema/**` by `assert-rpc-return-nullability.mjs`, not about migrations; correct.
- `.claude/skills/components/SKILL.md`, `apps/docs/src/lib/navigation.type.ts`, the docs data-import, frontend intro, localization pages, `apps/frontend/messages/README.md`, `apps/frontend/src/lib/i18n/README.md` and its mocks, several frontend and dev-seed test/source comments, `packages/README.md`, `scripts/assert-project-scoped-queries.mjs`, `apps/supabase/supabase/tests/database/39-*.test.sql` and `40-*.test.sql`, `packages/dev-seed/README.md` and templates, `yarn.lock`, `.yarn/releases/yarn-4.18.1.cjs` - "is generated" in an unrelated sense (generated columns, Paraglide output, component listings, keys); not about the migration model.
- `CLAUDE.md` holds no hit of the search and was not edited.

Operational notes for anyone repeating these observations:

- `isolated-instance.sh stop --name <name>` leaves one Docker volume behind, `supabase_edge_runtime_openvaa-iso-<name>` (seen as `supabase_edge_runtime_openvaa-iso-drift`, created by the start); it had to be removed with `docker volume rm`.
- The scratch checkout of Task 1 needed `yarn build` after `yarn install --immutable`: without built packages the typecheck link of `yarn lint:check` fails before the parity guard is reached, which would make a red lint:check meaningless as evidence.

## Decisions Made

- The dev-seed integration tier inside `yarn test:unit` needs the shared stack running. The attempt `20261020T130742Z.58cf7a564d5c` (stack stopped, `default-template.integration.test.ts` failed with `bulkDelete failed: TypeError: fetch failed`) is not evidence and was not read again; after the operator had the stack started (`yarn db:start`, no reset), a new attempt reran all four gates from the start. No gate was narrowed.

## Deviations from Plan

None in the work itself. Task 3 took two attempts: the first was red only because the shared stack was stopped (environment, not tree); it stopped at a checkpoint, and the operator's instruction to start the database resolved it. The second attempt is the record.

## Issues Encountered

- The first Task 3 attempt ran with the shared Supabase stack stopped, so the dev-seed integration test could not reach the API. Resolved by starting the stack; the shared stack was left running, and its 13 containers had the same creation times before and after the second attempt.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Plan 181-19 can rely on `evidence/181-18-local-gates.md` as the current gate record; a re-run for a newer commit is a new attempt of the same record.
- Phase 189 must correct the dangling conflict-1 reference in `.claude/skills/recommended-skills/SKILL.md`.

## Self-Check: PASSED

The two evidence records and the four edited documents exist; the commits d758d515f, 58cf7a564 and 7ce67fed4 are ancestors of HEAD; Task 3 verify exited 0.
