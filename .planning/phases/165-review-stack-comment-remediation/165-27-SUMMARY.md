---
phase: 165-review-stack-comment-remediation
plan: 27
subsystem: database
tags: [supabase, postgres, schema, is_generated, column-order, dev-seed, supabase-types, pgtap, comment-hygiene]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-18 stopped every dev-seed producer writing is_generated; 165-21 put each column comment directly above its column; 165-01 instruments (assert-absent.sh, hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs, e2e-verdict.mjs)"
provides:
  - "No table, generated type, column map entry, dev-seed permitted key, test or database skill doc carries is_generated"
  - "candidates declares its columns in the organizations order; factions and alliances already did"
  - "Hygiene-clean comment layers in permittedKeys.ts and column-map.ts, and read records for every file this plan changed"
affects: [165-24, 165-35, 165-36]

actuals:
  tokens: 18800
  tasks: 3
  commits: 4
plan_head_before: f99899fc194e2706799384e51e690c7a5620a297
plan_head_after: 28aba4e313cdae2dd2d63cadf3817f354eadf853

tech-stack:
  added: []
  patterns:
    - "A column reorder is proven a pure permutation by comparing, per table, the sorted CREATE TABLE body lines of `git show HEAD:<file>` and the worktree, plus the (comment line, next line) pairs, so a comment that stayed behind is caught too"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-27.tsv
  modified:
    - apps/supabase/supabase/schema/101-elections.sql
    - apps/supabase/supabase/schema/102-entities.sql
    - apps/supabase/supabase/schema/103-questions.sql
    - apps/supabase/supabase/schema/104-nominations.sql
    - apps/supabase/supabase/schema/303-column-grants.sql
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts
    - packages/supabase-types/src/column-map.ts
    - packages/dev-seed/src/template/permittedKeys.ts
    - apps/supabase/supabase/tests/database/09-column-restrictions.test.sql
    - apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.test.ts
    - .claude/skills/database/schema-reference.md
    - .claude/skills/database/SKILL.md
    - .claude/skills/database/extension-patterns.md
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md

key-decisions:
  - "pgTAP 09's two is_generated update assertions were REPLACED, not deleted: each now asserts that an update of `id` is refused (42501). `id` is in 303's protected list for both tables and no other assertion in the file covered it; `sort_order`, the plan's example, was already covered. plan (34) is unchanged"
  - "'All related tables' for the column order means the three other entity tables, which share the organizations shape (research A3). Only candidates moved; factions and alliances already match. The other content tables list the shared columns in the same relative order and differ only in their own columns, so they were left alone"
  - "terms_of_use_accepted sits right after confirmed in candidates (research A4)"
  - "The database skill's entity listings were rewritten from the schema, not only stripped of the column: they were also missing `confirmed`, `terms_of_use_accepted` and `factions.organization_id`, and listed a `candidates.organization_id` the table does not have"
  - "No hygiene-allow/165-27.tsv was created: every gate hit was rewritten"

patterns-established:
  - "When a pgTAP assertion over a removed column goes, it is replaced by the same assertion over an uncovered protected column of that table where one exists, so the file's plan() count and protective coverage both hold"

requirements-completed: [165-SC2, 165-SC3, 165-SC4, C-4094555940, C-4094521874]

coverage:
  - id: D1
    description: "is_generated is gone from every table, the generated types, COLUMN_MAP, dev-seed's TABLE_COLUMNS, pgTAP 09, the mapRow test and the database skill docs, with no trace"
    requirement: "C-4094555940"
    verification:
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/assert-absent.sh 'is_generated' -- apps packages tests scripts .github .claude (exit 0, absent)"
        status: pass
      - kind: other
        ref: "psql: SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND column_name='is_generated' (0)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/dev-seed typecheck && yarn workspace @openvaa/supabase-types typecheck && yarn workspace @openvaa/frontend check (all exit 0)"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit mapRow (11/11); yarn workspace @openvaa/dev-seed test:unit --exclude 'tests/integration/**' (60 files, 794 tests)"
        status: pass
      - kind: integration
        ref: "yarn workspace @openvaa/supabase supabase test db 00-helpers + 09-column-restrictions (43 tests, Result: PASS)"
        status: pass
    human_judgment: false
  - id: D2
    description: "@openvaa/data's isGenerated data-model flag is untouched"
    requirement: "C-4094555940"
    verification:
      - kind: other
        ref: "git grep -c isGenerated -- packages/data/src (27 files, each count equal to ship/v2.15-12-planning)"
        status: pass
    human_judgment: false
  - id: D3
    description: "candidates, factions and alliances declare their columns in the organizations order, each comment with its column, no definition changed"
    requirement: "C-4094521874"
    verification:
      - kind: other
        ref: "scratch multiset.py: per table, sorted CREATE TABLE body lines and comment->column pairs identical between git show HEAD: and the worktree (exit 0)"
        status: pass
      - kind: other
        ref: "information_schema.columns ORDER BY ordinal_position on the reset database (listing in this SUMMARY)"
        status: pass
      - kind: integration
        ref: "yarn workspace @openvaa/supabase test:db (33 files, 1246 tests, Result: PASS); yarn db:lint:sql (exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every file this plan changed passes the hygiene gate with a current read record, and the full gate set is green"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "hygiene-changed-files.sh --check-reads --files <171 committed paths since ship/v2.15-12-planning> (166 in scope, VERDICT: CLEAN)"
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true yarn lint:check (exit 0)"
        status: pass
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-27 --no-db-reset; e2e-verdict.mjs (VERDICT: GREEN, 165 expected, 0 failed, 0 flaky, 0 did-not-run)"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-09-28
status: complete
---

# Phase 165 Plan 27: `is_generated` Removal and Entity Column Order Summary

**The `is_generated` column is gone from all ten tables and from everything that named it: the column-grant and RPC comments, the regenerated migration and types, `COLUMN_MAP`, dev-seed's `TABLE_COLUMNS`, pgTAP 09, the `mapRow` test and the database skill docs. `git grep` outside `.planning` finds nothing. `candidates` now declares its columns in the `organizations` order, proven a pure permutation. The full E2E suite is green (165 / 0 / 0 / 0).**

## Performance

- **Duration:** about 25 min
- **Started:** 2026-09-28T00:30:53Z
- **Completed:** 2026-09-28T00:56:02Z
- **Tasks:** 3 of 3
- **Files modified:** 15 shipped or doc files, plus the ledger and one new read record

## Accomplishments

- **Reader verdict (C-4094555940): nothing used the column that `external_id` cannot recover.** Its only reader was `COLUMN_MAP`, which mapped it to `isGenerated`. `@openvaa/data` reads that property only to skip `checkId` (`dataObject.ts`), and UUIDs pass `checkId` anyway. Dev-seed teardown keys on the `external_id` prefix. Plan 165-18 had already stopped every producer.
- **Removal census.** At plan start, `git grep -n is_generated -- ':!.planning'` found 95 lines in 15 files:

  | File | Lines |
  |---|---|
  | `packages/supabase-types/src/database.ts` (generated) | 30 |
  | `apps/supabase/supabase/migrations/00001_initial_schema.sql` (generated) | 16 |
  | `.claude/skills/database/schema-reference.md` | 11 |
  | `packages/dev-seed/src/template/permittedKeys.ts` | 10 |
  | `apps/supabase/supabase/tests/database/09-column-restrictions.test.sql` | 6 |
  | `apps/supabase/supabase/schema/303-column-grants.sql` | 5 |
  | `apps/supabase/supabase/schema/102-entities.sql` | 4 |
  | `apps/supabase/supabase/schema/101-elections.sql`, `.claude/skills/database/SKILL.md` | 3 each |
  | `apps/supabase/supabase/schema/103-questions.sql` | 2 |
  | `104-nominations.sql`, `503-entity-rpcs.sql`, `column-map.ts`, `mapRow.test.ts`, `extension-patterns.md` | 1 each |

  After the plan: `assert-absent.sh 'is_generated' -- apps packages tests scripts .github .claude` exits 0, and the reset database has 0 `information_schema.columns` rows with that name. None of the schema column lines had a comment above them, so no comment went with them. `git grep -c isGenerated -- packages/data/src` matches the phase base (27 files, same counts), so the data-model flag is untouched.
- **pgTAP 09: replaced, not deleted.** Each of the two `SET is_generated = true` assertions became `SET id = 'dddddddd-…-000000000099'::uuid`, expecting 42501. `id` is in 303's protected list for both tables, and no other assertion in the file covered it. `sort_order`, the plan's example, was already covered, so it could not be the replacement. The header bullets name `id` instead. `plan (34)` is unchanged, and 00 + 09 run 43 tests, PASS.
- **Column order (C-4094521874).** Only `candidates` moved. `factions` and `alliances` already followed the `organizations` order once the column was gone. `database.ts` did not change after `db:types`, because the generated types sort columns.
- **Hygiene (D-04).** `permittedKeys.ts` and `column-map.ts` lost their plan, review and threat ids (`162-07b`, `162-16`, `RES-7`, `T-144-11`, `CR-01`) and 25 + 1 pieces of history narrative: "MOVED here", "used to read", "was here and is not any more", "byte-identical to the set it used to declare inline", "which appears in older notes". Each note now states the current rule and the test that holds it. `code-identity.mjs HEAD WORKTREE` reported both files code-identical. `mapRow.test.ts` was already clean.

## Reorder proofs

Pure permutation. The command was `python3 multiset.py` (scratchpad), which compares `git show HEAD:apps/supabase/supabase/schema/102-entities.sql` (the post-removal commit) with the worktree. For each table it compares the sorted `CREATE TABLE` body lines and the sorted (comment line, following line) pairs. Exit 0:

```
organizations: lines before=28 after=28 sorted-multiset-identical=True comment->column-pairs-identical=True order_changed=False
candidates: lines before=30 after=30 sorted-multiset-identical=True comment->column-pairs-identical=True order_changed=True
factions: lines before=26 after=26 sorted-multiset-identical=True comment->column-pairs-identical=True order_changed=False
alliances: lines before=24 after=24 sorted-multiset-identical=True comment->column-pairs-identical=True order_changed=False
```

Ordinals on the reset database (`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '<t>' ORDER BY ordinal_position`):

```
organizations: id, project_id, auth_user_id, name, short_name, info, color, image, sort_order, subtype, custom_data, confirmed, created_at, updated_at, answers, external_id
candidates: id, project_id, auth_user_id, first_name, last_name, short_name, info, color, image, sort_order, subtype, custom_data, confirmed, terms_of_use_accepted, created_at, updated_at, answers, external_id
factions: id, project_id, organization_id, name, short_name, info, color, image, sort_order, subtype, custom_data, confirmed, created_at, updated_at, external_id
alliances: id, project_id, name, short_name, info, color, image, sort_order, subtype, custom_data, confirmed, created_at, updated_at, external_id
```

**Verdict on "all related tables":** the related tables are the three other entity tables (research A3), because they share the `organizations` shape. The remaining content tables were checked too. Elections, constituency groups, constituencies, question categories, questions and nominations all start `id, project_id, name, short_name, info, color, image, sort_order, subtype, custom_data, created_at, updated_at`, then their own columns, and end with `external_id`. That is the same relative order `organizations` uses for the columns they share, with each table's own columns after the timestamps, where `organizations` keeps `answers`. Nominations places `confirmed` among its nomination-specific columns, after `parent_nomination_id`, but its shape (four entity foreign keys, a generated `entity_type`, the election context) is not the entity shape. None of them were reordered.

## Gates

| Gate | Exit | Result |
|---|---|---|
| `yarn schema:regenerate && yarn db:reset && yarn db:types` (Task 1, and again in Task 2) | 0 / 0 / 0 | migration 6219 lines; Task 2 left `database.ts` unchanged |
| `assert-absent.sh 'is_generated' -- apps packages tests scripts .github .claude` | 0 | `absent` |
| dev-seed typecheck, supabase-types typecheck, frontend `check` | 0 / 0 / 0 | frontend: 2781 files, 0 errors, 0 warnings |
| frontend `test:unit mapRow`; dev-seed `test:unit --exclude 'tests/integration/**'` | 0 / 0 | 11/11; 60 files, 794 tests |
| pgTAP 00 + 09 | 0 | 43 tests, PASS |
| `yarn workspace @openvaa/supabase test:db` | 0 | 33 files, 1246 tests, PASS |
| `yarn db:lint:sql` | 0 | 0 errors, 3 warnings (the three FK-index warnings that were there before this plan) |
| type drift after a fresh `db:reset` + `db:types` | 0 | `git diff --quiet database.ts` |
| `TURBO_FORCE=true yarn lint:check` | 0 | every assert reports 0 violations |
| `bash scripts/tip-proofs.sh` | 0 | (it reads `503-entity-rpcs.sql` and `permittedKeys.ts`) |
| hygiene gate, committed changes, `--check-reads` | 0 | 171 paths, 166 in scope, `VERDICT: CLEAN` |
| hygiene gate, `--base ship/v2.15-12-planning --check-reads` | 1 | the only item is the maintainer's uncommitted `MainContent.svelte` (unread), excluded under the phase rule |
| `ledger-check.sh` | 0 | 78 rows, `VERDICT: PASSED` |
| E2E: `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-27 --no-db-reset` | 0 | preflight 1 success / 0 failures, HEAD `28aba4e31` |
| `e2e-verdict.mjs tests/e2e-runs/165-27` | 0 | `exit=0 expected=165 unexpected=0 flaky=0 skipped=0` / `VERDICT: GREEN (expected 165 >= 165, 0 failed, 0 flaky, 0 did-not-run)` |

## Review-comment dispositions

| Comment | Disposition | Commits | Evidence | Draft reply |
|---|---|---|---|---|
| C-4094555940 (#877 `101-elections.sql:13`) | fix | `304c59936`, `b7679296b` (seed data: the 165-18 commits) | reader census above; 95-line removal census; `assert-absent.sh` exit 0 including `.claude`; 0 live columns; typechecks, unit tests, pgTAP and E2E green | Fixed in 304c59936. Nothing used it that `external_id` cannot recover: the frontend mapped it to `isGenerated`, which only skipped an id check that UUIDs pass anyway, and dev-seed teardown already keys on the `external_id` prefix. The column is gone from all ten tables, the column grants, the generated types, `COLUMN_MAP`, dev-seed's permitted keys, the tests and the database skill docs, and nothing left mentions it. |
| C-4094521874 (#877 `102-entities.sql:50`) | fix | `64bd34e2f`, `b7679296b` | multiset proof and ordinal listing above; full pgTAP 1246 PASS; `db:lint:sql` exit 0; `database.ts` unchanged | Fixed in 64bd34e2f. `candidates` now declares its columns in the `organizations` order, each comment moving with its column and no definition changed. `factions` and `alliances` already follow that order. The other content tables share the same order for the columns they have in common and differ only in their own columns, so they stay as they are. |

Both rows are filled in `165-LEDGER.md` (Evidence, Commit, Draft reply), and `ledger-check.sh` exits 0.

## Task Commits

1. **Task 1: remove `is_generated` (tracer)**: `304c59936` (refactor). The tracer verify was re-run and green before expanding.
2. **Task 2: `organizations` column order**: `64bd34e2f` (refactor)
3. **Task 3: skill docs, hygiene, gates, E2E**: `b7679296b` (docs, skill listings), `28aba4e31` (docs, `Hygiene: D-04`)

## Files Created/Modified

- `apps/supabase/supabase/schema/101-104` — the column is removed; `candidates` is reordered (102)
- `apps/supabase/supabase/schema/303-column-grants.sql`, `503-entity-rpcs.sql` — the column is dropped from the protected-column bullets and from the "Withheld today" list
- `apps/supabase/supabase/migrations/00001_initial_schema.sql`, `packages/supabase-types/src/database.ts` — regenerated
- `packages/supabase-types/src/column-map.ts` — the mapping is removed; the one-key-per-property comment is restated
- `packages/dev-seed/src/template/permittedKeys.ts` — ten `TABLE_COLUMNS` entries are removed; the comment layer is rewritten
- `apps/supabase/supabase/tests/database/09-column-restrictions.test.sql` — the two assertions now cover `id`
- `apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.test.ts` — the fixture fields are dropped
- `.claude/skills/database/{schema-reference,SKILL,extension-patterns}.md` — the column is removed; the entity listings match the schema
- `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-27.tsv` — read records for the eleven gate-scoped files (`database.ts` is generated and skipped by the gate; the skill docs are exempt)

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The database skill's entity listings were wrong beyond the column**
- **Found during:** Task 3
- **Issue:** `schema-reference.md` listed `candidates.organization_id`, which the table does not have. It also left out `confirmed` on all four entity tables, `terms_of_use_accepted` on candidates and `organization_id` on factions. Stripping only `is_generated` would have left the docs untrue, and the plan requires them to be true.
- **Fix:** The four entity listings were rewritten from the schema in declared order, with `organizations` first as the reference.
- **Files modified:** `.claude/skills/database/schema-reference.md`
- **Commit:** `b7679296b`

**2. [Scope] `factions` needed no reorder**
- The plan's Task 2 action lists a target order for `factions`. After Task 1, `factions` already matched it (as the research said), so only `candidates` changed. The multiset proof covers all four tables.

**Total deviations:** 1 auto-fixed (1 bug) and 1 scope note. **Impact:** none on scope. The docs are now accurate.

## Issues Encountered

- The first `echo ====` in a zsh command failed (`==` expansion). The command was re-run with quoted separators; no file was affected.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- The schema-cleanup threads C-4094555940 and C-4094521874 are implemented at their stated breadth, with ledger rows filled.
- The gate plans (165-24, 165-35, 165-36) will find the migration and all 11 gate-scoped files recorded in `hygiene-reads/165-27.tsv` at their current blobs.

---
*Phase: 165-review-stack-comment-remediation*
*Completed: 2026-09-28*

## Self-Check: PASSED

- All key files exist on disk (`[ -f ]`), including `hygiene-reads/165-27.tsv`.
- Commits `304c59936`, `64bd34e2f`, `b7679296b` and `28aba4e31` are in `git log`.
- `git status --short` lists only the maintainer's `MainContent.svelte`, `.planning/milestone.lock` and this plan's uncommitted planning files (SUMMARY, ledger, read record).
