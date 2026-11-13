---
phase: 181-deployability-and-migration-model
plan: 07
subsystem: infra
tags: [migrations, prettier, comment-hygiene, guard, lint-check, vitest, dev-seed]

# Dependency graph
requires:
  - phase: 181-01
    provides: node_modules installed under Node 24.21.0, the rule that a status is read from the command itself, and the rule that a turbo gate is run with a cache private to the attempt
  - phase: 181-06
    provides: the scratch-checkout method for red controls (a detached worktree made from the commit under test), and the two-line output of the parity guard
provides:
  - the directory entry apps/supabase/supabase/migrations/ in .prettierignore, in place of the one baseline file
  - FROZEN_MIGRATIONS_PREFIX in scripts/assert-comment-hygiene.mjs, with its filter, its fail-closed check and its clause in the summary line
  - evidence/181-07-hygiene-exclusion-red.md, the three red controls of that exclusion
  - packages/dev-seed/tests/template/permittedKeys.test.ts and tests/cli/allowedTeardownTables.test.ts reading schema/501-bulk-operations.sql only
affects: [181-10, 181-12, 181-17, 182, 189]

# Actuals (#2632)
# tokens is chars/4 over the diff plan_head_before..plan_head_after (24034 characters, 5 files).
# commits is measured when this summary was written: git rev-list --count plan_head_before..HEAD.
# The commit of this summary and the state commit come after it and are not in the count.
actuals:
  tokens: 6008
  tasks: 2
  commits: 3
plan_head_before: 24bceb8d5e9d039a12c0fe29e1e6b8dcbf52bc13
plan_head_after: 51c6a05a67ba8d9eae1a9cc18ec51f167ca280a1

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A directory is taken out of the comment-hygiene guard by an exact path prefix in a named constant, with three pieces: the candidate filter, a fail-closed check that the prefix matches a tracked file, and a clause in the summary line with the number of files excused"
    - "A control that needs a guard to fail is run in a detached worktree made from the commit that holds the code under test, never in the working tree"

key-files:
  created:
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-07-hygiene-exclusion-red.md
  modified:
    - .prettierignore
    - scripts/assert-comment-hygiene.mjs
    - packages/dev-seed/tests/template/permittedKeys.test.ts
    - packages/dev-seed/tests/cli/allowedTeardownTables.test.ts
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/deferred-items.md

key-decisions:
  - "181-07: the migrations directory is outside prettier and outside the comment-hygiene guard. .prettierignore names apps/supabase/supabase/migrations/ and the guard holds the same string in FROZEN_MIGRATIONS_PREFIX. Nothing is frozen by this: the one file there is still the generated copy of schema/, which stays under both gates."
  - "181-07: the exclusion is an exact prefix tested with startsWith, not an alternative of SKIP_PATH_RE and not entries of VENDORED_EXCLUSIONS. It excuses every tracked, scannable file under the directory whatever its extension, and .prettierignore does the same for prettier."
  - "181-07: the guard's summary line has a new clause between the vendored clause and the rules clause: 'applied migrations excluded by prefix: N (apps/supabase/supabase/migrations/)'. On this tree N is 1 and the count of scanned files went from 1972 to 1971."
  - "181-07: permittedKeys.test.ts no longer compares the schema copy of the relationship CASE block with the baseline copy, and allowedTeardownTables.test.ts parses bulk_delete from schema/501-bulk-operations.sql. Until the freeze the byte-parity guard still holds the baseline equal to schema/; after it the built-database check of plan 181-10 is the only thing that does."
  - "181-07: the whole dev-seed suite was not run, on the orchestrator's instruction, because with a root .env its integration tier seeds the shared database. The acceptance criterion that names it is therefore not observed. The four spec files that read what this plan changed were run by name, and yarn lint:check and yarn format:check were run whole."

patterns-established:
  - "To take another directory out of the comment-hygiene guard: a named constant with the exact prefix and its reason, the filter, the fail-closed check, the summary clause, and three controls in a scratch checkout (the prefix matching nothing, a violating line under the prefix, the same line one directory away)."

# The plan's frontmatter lists SUPA-10 as the phase's closing requirement, and the template orders the
# list to be copied. This plan removes two ways the frozen model could break: SUPA-10 is NOT closed and
# was not marked complete (requirements.ready-ids answered "0/1 requirement(s) ready to mark complete").
requirements-completed: [SUPA-10]

coverage:
  - id: D1
    description: "Prettier skips every file under apps/supabase/supabase/migrations/, a file that does not exist yet included, and schema/ is still in scope and clean"
    requirement: SUPA-10
    verification:
      - kind: other
        ref: "prettier --file-info on the baseline and on a name that does not exist under the directory: ignored true for both; on schema/400-storage.sql: ignored false, parser sql"
        status: pass
      - kind: other
        ref: "prettier --check apps/supabase/supabase/schema: exit 0; yarn format:check on commit 51c6a05a6 with a private turbo cache: exit 0, 0 cached of 7"
        status: pass
    human_judgment: false
  - id: D2
    description: "The comment-hygiene guard skips the migrations directory by the exact prefix in FROZEN_MIGRATIONS_PREFIX, reports the prefix and the number of files excused, and SKIP_PATH_RE is unchanged"
    requirement: SUPA-10
    verification:
      - kind: other
        ref: "node scripts/assert-comment-hygiene.mjs: exit 0, summary line holds 'applied migrations excluded by prefix: 1 (apps/supabase/supabase/migrations/)'; --self-test: exit 0, 6 fixtures, 27 edge cases"
        status: pass
      - kind: other
        ref: "SKIP_PATH_RE compared with the parent commit as a string: byte-identical (202 characters)"
        status: pass
      - kind: other
        ref: "Task 1 <verify><automated> of 181-07-PLAN.md, run verbatim: exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "The exclusion has been seen failing: it fails closed when the prefix matches nothing, a violating line under the prefix is not reported, and the same line in schema/ is"
    requirement: SUPA-10
    verification:
      - kind: other
        ref: "evidence/181-07-hygiene-exclusion-red.md: FAIL_CLOSED_EXIT=1, EXCLUDED_FILE_NOT_REPORTED_EXIT=0, SAME_LINE_IN_SCHEMA_REPORTED_EXIT=1, in a scratch checkout of 6251aaa61 with SCRATCH_HAS_CODE_UNDER_TEST=yes"
        status: pass
    human_judgment: false
  - id: D4
    description: "The two dev-seed tests read the bulk-operation function bodies from schema/501-bulk-operations.sql and neither names the baseline; the throw on a missing declaration and the non-empty assertions are as strict as before"
    requirement: SUPA-10
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit tests/template/permittedKeys.test.ts tests/cli/allowedTeardownTables.test.ts: exit 0, 2 files, 34 tests"
        status: pass
      - kind: other
        ref: "Task 2 <verify><automated> of 181-07-PLAN.md, run verbatim: exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The whole dev-seed package suite passes after the change (acceptance criterion of Task 2)"
    verification: []
    human_judgment: true
    rationale: "Not run. The orchestrator ordered the specific test files only, because with a root .env the integration tier of the package seeds the shared local database. The verifier decides whether a whole-package run is owed and when."

# Metrics
duration: 10min
completed: 2026-10-12
status: complete
---

# Phase 181 Plan 07: Take the Migrations Out of Prettier and Comment Hygiene, and Re-point Two Tests Summary

**The migrations directory is now outside prettier (a directory entry in `.prettierignore`) and outside the comment-hygiene guard (the exact prefix in `FROZEN_MIGRATIONS_PREFIX`, reported in the summary line, failing closed when it matches nothing, and seen failing in a scratch checkout). The two dev-seed tests that read the baseline now read `schema/501-bulk-operations.sql`. Nothing is frozen.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-10-12T18:00:18Z
- **Completed:** 2026-10-12T18:10:30Z
- **Tasks:** 2 of 2
- **Files modified:** 5 in the task commits (one of them new), plus `deferred-items.md`

## Accomplishments

- `.prettierignore` ends in `apps/supabase/supabase/migrations/`. A migration added to the directory is out of prettier's scope on arrival. The comment above the entry holds no phase or plan id and is true before and after the freeze.
- The guard has a third kind of exclusion beside the skip pattern and the vendored list: one exact prefix in a named constant. It has the three pieces the vendored list has: the filter, the fail-closed check and the summary clause.
- Each way the exclusion can go wrong was seen once, in a scratch checkout made from the commit that adds the constant, without editing the real baseline or the real schema file.
- `permittedKeys.test.ts` and `allowedTeardownTables.test.ts` no longer name the baseline. Both will stay correct after the first appended migration that re-creates either function.

## Recorded gate statuses

All on Node v24.21.0, each status read from the command itself.

| Gate | Status | Notes |
|------|--------|-------|
| `node scripts/assert-comment-hygiene.mjs` (before the change) | 0 | 1972 files scanned, no migrations clause |
| `node scripts/assert-comment-hygiene.mjs` (after) | 0 | 1971 files scanned; `applied migrations excluded by prefix: 1 (apps/supabase/supabase/migrations/)`; 0 violations |
| `node scripts/assert-comment-hygiene.mjs --self-test` | 0 | 6 fixtures, 27 edge cases, 0 failures |
| `prettier --check apps/supabase/supabase/schema` | 0 | |
| `prettier --check` on the guard and on the two test files | 0 | |
| Task 1 `<verify><automated>`, verbatim | 0 | |
| `yarn workspace @openvaa/dev-seed test:unit tests/template/permittedKeys.test.ts tests/cli/allowedTeardownTables.test.ts` | 0 | 2 files, 34 tests |
| Task 2 `<verify><automated>`, verbatim | 0 | |
| `yarn workspace @openvaa/dev-seed test:unit tests/ciTypecheckGate.test.ts tests/schemaMigrationFreezeGate.test.ts` | 0 | 2 files, 29 tests. Supplementary: the two specs that read the guard file and the `lint:check` chain |
| `yarn workspace @openvaa/dev-seed lint` | 0 | `eslint src/`: 0 errors, 15 warnings, none in a file of this plan |
| `yarn workspace @openvaa/dev-seed typecheck` | 0 | `tsc --noEmit`; its `include` covers `tests/**` |
| `yarn format:check`, whole, on commit `51c6a05a6` | 0 | private `TURBO_CACHE_DIR` under `tmp/181-07/`, empty at the start. Turbo: `Cached: 0 cached, 7 total`. Prettier: all matched files pass, in both of its links |
| `yarn lint:check`, whole, on commit `51c6a05a6` | 0 | the same private cache, run after `format:check`. Turbo lint: `0 cached, 12 total`. Turbo typecheck: `6 cached, 23 total`; the six can only be results this attempt stored itself, minutes earlier and on the same commit. `svelte-check` found 0 errors in the frontend and in the docs. Every `assert:*` link printed its line; the hygiene guard's line holds the new clause |

The tree had no tracked change when the two whole gates ran, and `HEAD` was the same before and after.

**Not run:** the whole dev-seed suite, root `yarn test:unit`, `yarn build` as a gate of its own, and the E2E suite. No `supabase`, `yarn db:*` or `yarn dev*` command was run, and no database was used.

**By hand, not a gate:** `eslint` on the guard reports 24 errors and on `permittedKeys.test.ts` one. Both files report the same findings as they did before the plan, and no gate reads either file. See `deferred-items.md`.

## Task Commits

1. **Task 1: Exclude the migrations directory from prettier and from comment hygiene, with red controls**
   - `6251aaa61` (chore): the `.prettierignore` entry and the guard's constant, filter, fail-closed check and summary clause
   - `dbfcbdd28` (docs): the red-control record
2. **Task 2: Re-point the two tests that read the baseline as the current schema**
   - `51c6a05a6` (test)

## Red controls

From `evidence/181-07-hygiene-exclusion-red.md`, run in a scratch checkout of commit `6251aaa61a7a85909517d88a08455c0aa040cbc3`.

| Key | Value | What was seen |
|-----|-------|---------------|
| `SCRATCH_FROM_COMMIT` | `6251aaa61…` | the scratch checkout's own `HEAD` printed the same sha |
| `SCRATCH_HAS_CODE_UNDER_TEST` | yes | its guard holds `FROZEN_MIGRATIONS_PREFIX` on four lines; unchanged, it exits 0 with the migrations clause in its summary line |
| `FAIL_CLOSED_EXIT` | 1 | the constant set to `apps/supabase/supabase/no-such-directory/`: one error line that names that prefix. The baseline is scanned again in that run and is clean, so the status is the fail-closed check alone |
| `EXCLUDED_FILE_NOT_REPORTED_EXIT` | 0 | line 2 of the guard's own SQL fixture, a rule-1 violation, appended to the scratch baseline: exit 0, no file under the directory named |
| `SAME_LINE_IN_SCHEMA_REPORTED_EXIT` | 1 | the same line appended to the scratch `schema/400-storage.sql`: reported at line 906, and still nothing under the migrations directory |

One run beyond the plan's three, under a key that does not end in `_EXIT`: the guard of the parent commit, which has no constant, run over the scratch tree of control 2, exits 1 and reports the baseline at line 7860. So the 0 of control 2 comes from the exclusion, not from the line or from the file.

The scratch checkout was removed with `git worktree remove --force`; `git worktree list` no longer shows it and its directory is gone. It had no `node_modules`.

## Files Created/Modified

- `.prettierignore` - the last entry is the directory; the comment block above it says what the files are, that `scripts/assert-schema-migration-parity.mjs` compares their bytes, and that `schema/` stays in scope
- `scripts/assert-comment-hygiene.mjs` - `FROZEN_MIGRATIONS_PREFIX` with its docblock, the helper `isFrozenMigration`, the fail-closed check and the filter in `enumerateFiles` (which now returns `{ files, frozenMigrationCount }`), and one clause in the summary line. The header, `SCAN_ROOTS`, `SKIP_PATH_RE`, `VENDORED_EXCLUSIONS`, both rules and the self-test are unchanged
- `packages/dev-seed/tests/template/permittedKeys.test.ts` - the constant `MIGRATION_SQL` and the case "the schema copy and the applied migration copy of the CASE block agree" are gone; two docblocks say what is read now. 32 cases, where there were 33
- `packages/dev-seed/tests/cli/allowedTeardownTables.test.ts` - `SCHEMA_MIGRATION_PATH` is now `BULK_OPERATIONS_SCHEMA_PATH`, built from the new constant `BULK_OPERATIONS_SCHEMA_FILE`; the thrown message and one phrase of the docblock name the schema file
- `evidence/181-07-hygiene-exclusion-red.md` - the five verdict lines and the raw output of the controls
- `deferred-items.md` - two entries, on eslint findings in two files no gate lints

## Decisions Made

- **Nothing is frozen.** The one file under the prefix is still generated from `schema/`, and `schema/` is still under prettier and under both rules of the guard. No text leaves scrutiny by this change.
- **Both definitions are in `schema/501-bulk-operations.sql`.** Confirmed by reading: `public._bulk_upsert_record` and `public.bulk_delete` are created there and in no other schema file. `skip_columns`, `allowed_collections`, `delete_order` and the `CASE p_table_name` block each occur once in `schema/`, in that file. So neither test needed another file.
- **The prefix is compared after backslashes are turned into slashes.** The guard's candidate paths keep the separator `globSync` returns, and the tracked-set test already normalises it the same way.
- **The fail-closed check does not end the run.** Like the vendored check, it counts one violation and the scan goes on, so the summary line is still printed, with a count of 0 for the prefix.
- **The `.prettierignore` comment names the guard's file, not a script key.** `scripts/assert-schema-migration-parity.mjs` compares the files' bytes in the byte-parity mode of today and by sha256 after the freeze, so the sentence stays true across plan 181-17.
- **The path in `allowedTeardownTables.test.ts` is one constant used twice**, once to build the absolute path and once in the thrown message, so the message cannot name another file than the one read.
- **`extractCaseBlock` was kept** in `permittedKeys.test.ts`. It has one caller left, `parseRelationshipCase`, and still throws when the block is not found.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] A fourth run was added to the controls: the parent commit's guard over the same edit**
- **Found during:** Task 1, while writing the controls
- **Issue:** Control 2 ends in exit 0. On its own that does not show the appended line would have been reported in that file: control 3 shows it for a file one directory away.
- **Fix:** Between controls 2 and 3 the guard of `6251aaa61~1` was written into the scratch checkout under another name and run. It exits 1 and reports the baseline at line 7860. The key is `PARENT_GUARD_REPORTS_SAME_EDIT_STATUS`, which does not end in `_EXIT`, so the record holds the plan's three control lines and no fourth.
- **Files modified:** the record only
- **Verification:** the raw output in the record
- **Committed in:** `dbfcbdd28`

### Not done, on the orchestrator's instruction

**2. The whole dev-seed suite was not run**
- **Criterion:** Task 2, "`yarn workspace @openvaa/dev-seed test:unit` (the whole package, in the background and polled) exits 0, or every failing file is a spec that plans 181-05 and 181-06 are writing".
- **Why not:** the dispatch orders the specific test files only. With the root `.env` in place the integration tier of the package seeds the default template into the shared local database.
- **What was run instead:** the two files of the task (34 tests), the two gate specs that read the guard file and the `lint:check` chain (29 tests), the package's typecheck, and `yarn lint:check` whole.
- **What that leaves open:** no other spec of the package was run after the change. The change is to two test files and to no file under `src/`; a search of the repository outside `.planning/` finds no other spec that reads either file or `.prettierignore`.

---

**Total deviations:** 1 auto-fixed (1 missing critical), 1 criterion not observed by instruction
**Impact on plan:** the first makes control 2 mean what it is meant to mean. The second leaves one acceptance criterion unobserved; it is classified for the verifier as D5.

## Issues Encountered

- **The first version of the record did not hold the appended line as it was run.** The record was written with the file-writing tool, which turned the six-character escape in the pasted output into the character it encodes, in four places. A `cmp` of the record's raw block with the script's log found it. The block was then replaced by the log itself, copied by the shell, and `cmp` exits 0. The committed record is the corrected one; the first version was never committed.
- **A `git show` in the session shell printed a commit instead of a file.** The session shell is zsh, where `"$P:scripts/…"` applies a modifier to `$P` and the path is lost. The check it was part of (that `SKIP_PATH_RE` is unchanged) was run again with `"${P}:scripts/…"` and passed. The controls script runs under bash and was not affected: its parent-guard copy holds no `FROZEN_MIGRATIONS_PREFIX`, as the record shows.
- **Prettier refuses `.prettierignore` when the file is named on the command line** ("No parser could be inferred"), as it does `.gitattributes`. `prettier --check .` skips it.
- **No git hook ran on the commits.** This worktree sets `core.hooksPath` to `/dev/null`; the commits were made without `--no-verify`.

## What a later plan must know

- **The guard's summary line has one more clause.** Anything that reads the line must match it, not count its parts. The count in the clause grows by one with every migration added.
- **The exclusion covers everything under the directory, not only `.sql`.** A file of any scannable extension put under `apps/supabase/supabase/migrations/` is outside both rules of the guard, and a file of any kind there is outside prettier. Plan 181-17 should know this when it decides where the manifest lives: a JSON manifest inside the directory would not be formatted by prettier.
- **No entry was added for a file that does not exist.** A-08 also names the bootstrap SQL file for `.prettierignore`; the plan that creates that file adds its entry.
- **The guard has no fixture for its enumeration.** Its self-test exercises the two rules over text. The filter, the fail-closed check and the summary clause are covered by the red-control record only, so a change to `enumerateFiles` needs the three controls again.
- **Between now and the freeze**, the byte-parity guard is what holds the baseline's copy of the two functions equal to `schema/`. After the freeze nothing in the Node-only chain does; the built-database check of plan 181-10 takes that over.
- **Text that still describes the generated-file model** and was not touched here, because the plan does not list it: the header of the parity guard, `apps/supabase/README.md`, `.claude/skills/database/SKILL.md`, the docs page `developers-guide/backend/intro/+page.md` and the header of `scripts/assert-grant-permission-enum.mjs`. The comment in `.prettierignore` is the one item of that list that is now done.
- **Comments elsewhere still cite the baseline as the place a function lives** (`tests/tests/utils/adminCredentials.ts`, `tests/tests/utils/supabaseAdminClient.ts`). They are comments, not reads, and were left alone.
- **In the session shell (zsh), write `"${VAR}:path"`**, never `"$VAR:path"`, in `git show` and the like. A letter after the colon is taken as a modifier and the command silently gets another argument.
- **Do not paste output that holds a backslash-u escape through the file-writing tool.** Copy it from the log with the shell and compare with `cmp`.
- **Read with care:** `.planning/PROJECT.md` was read at its opening, Context and Constraints sections only. `181-RESEARCH.md` was read at the paragraph on prettier and comment hygiene in Q2 and at Pitfall 6; `181-PATTERNS.md` at the assignment of the hygiene guard; `181-CONTEXT.md` at D-01 to D-03 and A-04 to A-09. `.claude/skills/database/SKILL.md` was read at its section on the bulk RPCs only.

## Threat Flags

None. The change removes files from two gates and adds no endpoint, no file access outside the repository and no schema change. The register's T-181-19 (an exclusion that silently widens) is met by the exact prefix, the summary clause, the fail-closed check and control 3; T-181-20 by both tests reading `schema/`; T-181-SC by adding no package.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Two ways the frozen model could break after the cutover are removed: a later prettier or comment-rule change reddening a file nobody may edit, and two tests reading a function body that is no longer the applied one.
- Plan 181-17 finds the directory already outside both gates and adds nothing for it.
- No blocker from this plan. One criterion is unobserved (the whole dev-seed suite); it needs a moment when seeding the shared database is acceptable, or a run without the root `.env`.

## Self-Check: PASSED

- `.prettierignore`, the guard, the two test files and the evidence record exist.
- Commits `6251aaa61`, `dbfcbdd28` and `51c6a05a6` are ancestors of `HEAD`.
- `commits: 3` is `git rev-list --count 24bceb8d5..HEAD` with `HEAD` at `51c6a05a6`.
- Every acceptance criterion of both tasks was run again after the last task commit and passed, except the whole-package run of Task 2, which was not run (deviation 2).
- The plan-level verification holds: the guard and its self-test exit 0 on the real tree and the three controls are recorded; the two dev-seed tests pass and no longer name the baseline; `schema/` is prettier-clean.
- `git status --porcelain --untracked-files=no` printed nothing after the last task commit, apart from `deferred-items.md`, which is committed with this summary.

---
*Phase: 181-deployability-and-migration-model*
*Completed: 2026-10-12*
