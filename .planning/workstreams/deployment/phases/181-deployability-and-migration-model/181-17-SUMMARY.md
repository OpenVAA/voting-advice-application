---
phase: 181-deployability-and-migration-model
plan: 17
subsystem: database
tags: [supabase, migrations, freeze, manifest, guard, lint-check, one-way-door]
status: complete

# Dependency graph
requires:
  - phase: 181-06
    provides: checkFrozenMigrations, FROZEN_RULES and the sixteen fixtures under scripts/fixtures/schema-migration-freeze
  - phase: 181-10
    provides: yarn check:schema-equivalence on isolated instances
  - phase: 181-16
    provides: the full local E2E suite green on the pre-freeze tree
  - phase: 182
    provides: decision D-13 (contestant_app_public_config answers analytics.trackEvents) in schema/ and the baseline
provides:
  - apps/supabase/supabase/migrations.manifest.json, the frozen baseline (initial_schema, 00001_initial_schema.sql, commit 81e6a3f22, sha256 79bed444…)
  - the parity guard in frozen mode on the real paths, inside lint:check; its mode does not depend on the manifest being present
  - yarn schema:regenerate refuses and prints the next file name (00002_<name>.sql) and the three steps of a schema change
  - evidence/181-17-freeze-readiness.md and evidence/181-17-freeze.md, both from attempt 20261020T123414Z.2a2a67aa4aa9
affects: [181-18, 181-19, 184, v2.16 stream (follow-up X-1)]

# Actuals (#2632)
# tokens is chars/4 over the lines added by this plan's four commits (34678 characters).
# commits is git rev-list --count plan_head_before..HEAD when this summary was written.
actuals:
  tokens: 8670
  tasks: 3
  commits: 4
plan_head_before: a385f8c9f94b39441e0062dcd21813a05b064d45
plan_head_after: 0a09198e4f5db39c162c07409b1e1ecfe58c2521

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A frozen migration set: an ordered manifest whose first entry is the baseline, each file with its sha256; a schema change is a schema/ edit plus an appended five-digit migration and its manifest line, in one commit"
    - "A generator that must no longer generate keeps its script key and refuses with the steps to take instead"

key-files:
  created:
    - apps/supabase/supabase/migrations.manifest.json
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-17-freeze.md
  modified:
    - scripts/assert-schema-migration-parity.mjs
    - packages/dev-seed/tests/schemaMigrationFreezeGate.test.ts
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-17-freeze-readiness.md

key-decisions:
  - "181-17: the baseline 00001_initial_schema.sql is frozen by commit 12c98aa5c; the manifest names its parent 81e6a3f22 as the commit the baseline came from, and the blob there hashes to the manifest's sha256 (79bed444da347985daf22d44bccb451c00db2d67236ccd11fa9c2c7fae354ed8)"
  - "181-17: the operator's decision was freeze for attempt 20261020T123414Z.2a2a67aa4aa9 at head 81e6a3f22; the answer check passed and the decision was used once (TASK3_STARTED)"
  - "181-17: the guard's byte-parity verdict and the generator are deleted; a missing manifest is MALFORMED MANIFEST, never the old mode"

requirements-completed: [SUPA-10]

# Metrics
duration: 4h02m wall clock across the operator's wait (attempt 1 started 08:54Z, freeze records committed 12:55Z); Task 3 itself took about 7 minutes
completed: 2026-10-20
---

# Phase 181 Plan 17: The baseline freeze Summary

**`00001_initial_schema.sql` is frozen by commit `12c98aa5c`. A manifest records it as baseline `initial_schema`, gives `81e6a3f22` as the commit it came from, and holds its sha256. The guard in `lint:check` now checks the frozen migrations against the manifest, and `yarn schema:regenerate` refuses and points to `00002_<name>.sql`.**

## Performance

- **Duration:** 4h02m wall clock, most of it the operator's wait between Task 1 and Task 3. Task 3 took about 7 minutes.
- **Started:** 2026-10-20T08:54:50Z (attempt 1 of Task 1)
- **Completed:** 2026-10-20T12:55Z
- **Tasks:** 3 of 3
- **Files modified:** 3 code files in the freeze commit, plus 2 evidence records

## Accomplishments

- **The freeze commit `12c98aa5c3acc221a87b625d47a0547dde1c369e`** has exactly three files: the manifest, the guard and the gate spec. Its parent is `81e6a3f225061563939b935e898b9a4965807d22`, the commit the operator decided for. `git diff --quiet 12c98aa5c^..12c98aa5c -- …/00001_initial_schema.sql …/schema` exits 0, so no byte of the baseline or of `schema/` changed.
- **Manifest sha256 vs the blob at the parent:** both are `79bed444da347985daf22d44bccb451c00db2d67236ccd11fa9c2c7fae354ed8`, and so is the file on disk.
- **The guard in frozen mode** (`GUARD_FROZEN_MODE_EXIT=0`):
  - `main()` runs `checkFrozenMigrations` on the real migrations directory and the real manifest, both fixed as constants. Each finding is printed as its kind and file, then a remedy.
  - The self-test over the 16 fixtures still runs first and still withholds the verdict when it fails.
  - The census line now reads: 1 migration in the manifest; baseline 9556 lines; 16 fixtures checked.
  - The byte-parity verdict, `concatenateSchema`, `bytesEqual`, the comparator self-check and the non-vacuity floors (used only by byte-parity) are deleted.
  - The header is replaced. It keeps the five section headings and states the frozen-mode invariant, with the 181.1 timestamp-version sentence word for word.
- **A missing manifest fails.** In a scratch checkout of the freeze commit with the manifest moved aside, the guard exits 1 with `MALFORMED MANIFEST: migrations.manifest.json cannot be read (ENOENT).` The scratch checkout was removed afterwards.
- **`yarn schema:regenerate` refuses** (`SCHEMA_REGENERATE_EXIT=1`). It prints that the baseline is frozen, the next file name `apps/supabase/supabase/migrations/00002_<name>.sql`, and the three steps (edit `schema/`, write the numbered migration, add its manifest line with its sha256, all in one commit), then `yarn check:schema-equivalence`. It leaves `git status` unchanged.
- **The gate spec has four new assertions**, 28 tests in all, all passing:
  - the real tree has no finding;
  - the baseline is the manifest's first entry, and `baseline.commit` is 40 hex characters;
  - `--write` run as a process exits non-zero and prints `frozen`;
  - the `schema:regenerate` key is unchanged.

## Task Commits

1. **Task 1: re-check the preconditions** (two attempts):
   - `2a2a67aa4`: attempt 20261020T085450Z.a385f8c9f94b, not ready.
   - `81e6a3f22`: attempt 20261020T123414Z.2a2a67aa4aa9, `READY_TO_FREEZE=yes`.
2. **Task 2: the operator decides.** No commit, by design. The reply `freeze 20261020T123414Z.2a2a67aa4aa9` was recorded in the attempt file as `OPERATOR_DECISION=freeze attempt=20261020T123414Z.2a2a67aa4aa9 head=81e6a3f225061563939b935e898b9a4965807d22`.
3. **Task 3: the freeze.**
   - `12c98aa5c` (feat[db]): the freeze commit.
   - `0a09198e4` (docs): the two evidence records, copied from the attempt file after the freeze commit.

## Files Created/Modified

- `apps/supabase/supabase/migrations.manifest.json`: new. Holds the baseline's name, file and commit, and one migrations entry with its sha256.
- `scripts/assert-schema-migration-parity.mjs`: switched to frozen mode, with the refusing `--write`.
- `packages/dev-seed/tests/schemaMigrationFreezeGate.test.ts`: the four frozen-tree assertions.
- `evidence/181-17-freeze-readiness.md`: a `cp` of the whole attempt file.
- `evidence/181-17-freeze.md`: written with `sed -n '/^TASK3_STARTED=/,$p'` from the attempt file.

## Decisions Made

- The guard's findings each get a one-line remedy from a `REMEDY_BY_KIND` map that covers every kind in `FROZEN_RULES`. The guard fails if a kind has no remedy, so a new rule cannot ship without one.
- The next version for the `--write` refusal comes from the manifest's entries. When the manifest cannot be read, it comes from the directory listing, and the message says which source was used.

## Deviations from Plan

### Environment-limited acceptance item

**1. `yarn workspace @openvaa/dev-seed test:unit` exits 1, not 0.**
- **What ran:** 76 of 77 files passed (1197 tests passed, 10 skipped).
- **The one failure:** `tests/integration/default-template.integration.test.ts`, with `bulkDelete failed: TypeError: fetch failed`. That test needs the shared local Supabase stack, which is not running. The execution rules forbid touching the shared stack, so it was not started.
- **Cause:** environmental and known (see the memory note "unit gate needs running stack"). The failure is unrelated to this change.
- **Checks that passed:** the plan's own verify command runs only `tests/schemaMigrationFreezeGate.test.ts`, which passes (28/28). `yarn workspace @openvaa/dev-seed typecheck` exits 0.
- **To close it:** re-run the full dev-seed suite with the stack up. Plan 181-18's local gates are the natural place.

### Lint note (not a deviation of behaviour)

- Root `scripts/*.mjs` are not in the `lint:check` ESLint scope. The guard keeps the house style of the earlier file, so `console.log` for the success lines and one pre-existing template string are still flagged when eslint is pointed at the file directly. The earlier file had 19 such flags; this one has 6. The new code fixed `func-style` and `no-useless-assignment` locally.

Otherwise the plan was executed as written. The answer check ran first and exited 0, and `TASK3_STARTED` was written directly after it. The tree was clean at the freeze. `PARENT` equalled the decision's `head=` both when it was taken and directly before the commit. `V216_TIP_AT_FREEZE` equals `V216_TIP` (`2a2a67aa4`). Exactly one freeze commit exists.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- **For the operator, follow-up X-1:**
  - Before the next schema change on the v2.16 branch, merge `feat/deployment-terraform-supabase` into `feat/entity-signup-multi-grant` through the freeze commit `12c98aa5c`. Until that merge, `yarn schema:regenerate` there still rewrites `00001`.
  - After the merge, plan 178-04 is written as `00002_<name>.sql` with its manifest line.
- **Plan 181-18** updates the docs that still describe `yarn schema:regenerate` as a generator: `apps/supabase/README.md`, `.claude/skills/database/SKILL.md` and the docs-site backend intro.
- **Phase 184** makes the first hosted push. Until a push succeeds the baseline can still be corrected by editing the file and its manifest line in one commit, as D-01 allows.

## Self-Check: PASSED

- FOUND: apps/supabase/supabase/migrations.manifest.json
- FOUND: evidence/181-17-freeze.md, evidence/181-17-freeze-readiness.md
- FOUND in HEAD: 2a2a67aa4, 81e6a3f22, 12c98aa5c, 0a09198e4
- The Task 3 verify command and both Task 1 verify commands exit 0
