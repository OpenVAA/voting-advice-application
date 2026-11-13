---
phase: 181-deployability-and-migration-model
plan: 06
subsystem: infra
tags: [migrations, sha256, manifest, guard, lint-check, fixtures, vitest, gitattributes]

# Dependency graph
requires:
  - phase: 181-01
    provides: node_modules installed under Node 24.21.0, the parity guard's baseline status (exit 0, 29 schema files, 7859 lines), and the rule that a status is read from the command itself
provides:
  - checkFrozenMigrations({ migrationsDir, manifestPath }) and FROZEN_RULES, exported from scripts/assert-schema-migration-parity.mjs
  - scripts/fixtures/schema-migration-freeze, a clean fixture and one fixture for each of the 15 rules, each with its one committed finding
  - the frozen-mode self-test, run in every verifying invocation of the guard before its verdict, and alone under --self-test
  - packages/dev-seed/tests/schemaMigrationFreezeGate.test.ts, the wiring assertions and the checker over each fixture
  - .gitattributes, pinning the migrations and these fixtures to LF
  - evidence/181-06-freeze-checker-red.md, the four red controls
  - the manifest contract as implemented (baseline.name, baseline.file, baseline.commit, migrations[].file, migrations[].sha256)
affects: [181-12, 181-17, 182, 184, 187]

# Actuals (#2632)
# tokens is chars/4 over the diff plan_head_before..plan_head_after (65244 characters, 60 files).
# commits is measured when this summary was written: git rev-list --count plan_head_before..HEAD.
# The commit of this summary and the state commit come after it and are not in the count.
actuals:
  tokens: 16311
  tasks: 2
  commits: 5
plan_head_before: c2e0bcce966882a4a5b729f4353cca735d6471a7
plan_head_after: 285ac7ad80d10b6e96ff3af25f04c098cf757629

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A checker's rules are one exported list of { id, kind, fixture }; every finding is built from an entry of it, and a spec and a self-test compare the list with the fixture directories in both directions"
    - "A fixture directory holds the input, and expected.violations holds the exact finding text; a seeded fixture commits exactly one line"
    - "A guard that can be imported tests for direct invocation with both paths passed through realpathSync"

key-files:
  created:
    - packages/dev-seed/tests/schemaMigrationFreezeGate.test.ts
    - scripts/fixtures/schema-migration-freeze/ok/manifest.json
    - .gitattributes
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-06-freeze-checker-red.md
  modified:
    - scripts/assert-schema-migration-parity.mjs
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/deferred-items.md

key-decisions:
  - "181-06: nothing is frozen. There is no manifest of the real baseline, main() still gives the byte-parity verdict over the real paths, and --write still regenerates. The checker runs over the fixtures only; plan 181-17 points it at the real paths."
  - "181-06: a finding is the rule's kind, a colon and a space, a base name, and the detail. For a fault of the manifest the base name is path.basename(manifestPath): manifest.json in every fixture, and migrations.manifest.json on the real path after the freeze. A detail never holds a path derived from the two arguments; an fs error is reported by its code only."
  - "181-06: the 15 rules of the plan's table are the whole checker. Not checked, because no row asks for it: that baseline.file is the literal 00001_initial_schema.sql, that baseline.name is initial_schema, and that sha256 is 64 lower-case hex characters (a malformed one is reported as EDITED FROZEN MIGRATION)."
  - "181-06: the self-test runs in every verifying run and not under --write, which gives no verdict. When it fails the guard prints each problem and the withheld-verdict line and exits 1 before it reads the migration."
  - "181-06: the entry-point test passes both sides through realpathSync, where the plan orders the test of scripts/assert-env-pair-registry.mjs. That test was measured to skip main() and exit 0 with no output when the script path holds a symbolic link."
  - "181-06: a listed name is looked up in the directory listing before it is read, so a manifest entry with a path separator is reported as MISSING MIGRATION and never opened. An unreadable migrations directory is treated as empty, so every listed file is reported missing."

patterns-established:
  - "To add a rule to the frozen-mode checker: one entry in FROZEN_RULES, one fixture directory that breaks that rule and no other, one line in its expected.violations. The spec and the self-test fail until all three exist."
  - "A message of the checker is committed text: changing it means changing the line in the fixture's expected.violations in the same commit."

# The plan's frontmatter lists SUPA-10 as the phase's closing requirement, and the template orders the
# list to be copied. This plan builds the guard half only: SUPA-10 is NOT closed and was not marked
# complete (requirements.ready-ids answered "0/1 requirement(s) ready to mark complete").
requirements-completed: [SUPA-10]

coverage:
  - id: D1
    description: "checkFrozenMigrations and FROZEN_RULES are exported from the guard; the 15 rules equal the plan's table row for row and in order, and every finding is built from an entry of the list"
    requirement: SUPA-10
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/schemaMigrationFreezeGate.test.ts, block 'every rule of the checker has its fixture, and every fixture its rule' (3 cases)"
        status: pass
      - kind: other
        ref: "a node one-liner that parses the rule table of 181-06-PLAN.md and compares it with the imported FROZEN_RULES: 15 rows, 15 rules, equal in order"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each seeded fixture yields exactly its one committed finding and the clean fixture none, with the same text for a relative and an absolute path"
    requirement: SUPA-10
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/schemaMigrationFreezeGate.test.ts, block 'the frozen-migration checker over its fixtures' (18 cases; the 15 seeded cases failed against the skeleton, RED_EVIDENCE_OK)"
        status: pass
      - kind: other
        ref: "node scripts/assert-schema-migration-parity.mjs --self-test: exit 0, 16 fixtures named"
        status: pass
    human_judgment: false
  - id: D3
    description: "The guard checks its own fixtures in every verifying run and withholds its verdict when they do not match; a rule without its fixture reddens it"
    requirement: SUPA-10
    verification:
      - kind: other
        ref: "evidence/181-06-freeze-checker-red.md: SELF_TEST_CAN_FAIL_EXIT=1 and RULE_WITHOUT_FIXTURE_EXIT=1 in a scratch checkout of c2691ac1d, CHECKER_SEES_AN_EDIT=seen"
        status: pass
      - kind: other
        ref: "Task 2 <verify><automated> of 181-06-PLAN.md, run verbatim: exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The real-path run of the guard is still byte parity and yarn schema:regenerate still works; nothing is frozen"
    requirement: SUPA-10
    verification:
      - kind: other
        ref: "node scripts/assert-schema-migration-parity.mjs: exit 0, census 29 schema file(s) -> 7859 line(s), generated copy is current"
        status: pass
      - kind: other
        ref: "yarn schema:regenerate: exit 0, git status --porcelain -- apps/supabase/supabase/migrations empty afterwards"
        status: pass
    human_judgment: false
  - id: D5
    description: "The wiring of the guard is asserted: a link of lint:check by membership, the script key's exact command with no argument, the guard file's title"
    requirement: SUPA-10
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/schemaMigrationFreezeGate.test.ts, block 'the schema-migration guard is wired so it actually runs' (3 cases)"
        status: pass
    human_judgment: false
  - id: D6
    description: ".gitattributes sets text eol=lf on apps/supabase/supabase/migrations/*.sql and on everything under scripts/fixtures/schema-migration-freeze, and marks no existing file as modified"
    verification:
      - kind: other
        ref: "git check-attr text eol on the baseline and on two fixture files: text set, eol lf; git status --porcelain on the two paths: empty"
        status: pass
    human_judgment: false

# Metrics
duration: 15min
completed: 2026-10-12
status: complete
---

# Phase 181 Plan 06: The Frozen-Mode Checker, Its Fixtures and Its Red Controls Summary

**`scripts/assert-schema-migration-parity.mjs` now exports `checkFrozenMigrations` and its 15-rule list `FROZEN_RULES`, and checks 16 fixtures on every verifying run before it gives its verdict. Nothing is frozen: the real-path run is still byte parity (exit 0, 29 schema files, 7859 lines) and `yarn schema:regenerate` still works.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-10-12T17:41:16Z
- **Completed:** 2026-10-12T17:56:30Z
- **Tasks:** 2 of 2
- **Files modified:** 60 in the task commits (56 of them fixture files), plus `deferred-items.md`

## Accomplishments

- The checker takes a migrations directory and a manifest path and returns one finding for each fault. It does not throw for a fault in the content and never ends the process.
- Its rules are the plan's table: 15 entries of `{ id, kind, fixture }`, in the table's order. Every finding is built by one helper from an entry of that list.
- Each rule has a fixture that breaks that rule and no other, and `ok` breaks none. Each seeded fixture commits exactly one finding line.
- The guard runs the checker over every fixture before its verdict. A failed self-test withholds the verdict and exits 1.
- Each way the self-test can fail was seen once, in a scratch checkout, without editing the real baseline.

## Recorded gate statuses

All on Node v24.21.0, each status read from the command itself. The tree had no tracked change when each ran.

| Gate | Status | Notes |
|------|--------|-------|
| `node scripts/assert-schema-migration-parity.mjs` (the real-path run) | 0 | `census: 29 schema file(s) -> 7859 line(s); 00001_initial_schema.sql -> 7859 line(s); … holds 1 .sql file(s); generated copy is current`, then `frozen-mode self-test: 16 fixture(s) checked … 15 rule(s), each with its fixture` |
| `node scripts/assert-schema-migration-parity.mjs --self-test` | 0 | names all 16 fixture directories |
| `yarn schema:regenerate` | 0 | the migration is unchanged afterwards |
| `yarn workspace @openvaa/dev-seed test:unit tests/schemaMigrationFreezeGate.test.ts` | 0 | 24 passed |
| Task 1 `<verify><automated>`, verbatim | 0 | |
| Task 2 `<verify><automated>`, verbatim | 0 | |
| `yarn workspace @openvaa/dev-seed typecheck` | 0 | `tsc --noEmit`; its `include` covers `tests/**` |
| `yarn format:check` | 0 | Its first link is a turbo build: `Cached: 0 cached, 7 total`, so the seven tasks ran here. It used the cache the worktrees share and stored its results there. Prettier: all matched files pass, in both of its links |
| `eslint` on the spec, `prettier --check` on the spec and the guard | 0, 0 | |
| The 17 Node-only `assert:*` links of `lint:check`, and `assert:unit-coverage`, each run alone | 0 each | among them `assert:comment-hygiene` (1972 files, 0 violations, the new spec included) |

**Not run:** `yarn lint:check` as a whole (its turbo lint, `eslint tests` and the two repository-wide typechecks), `yarn test:unit` as a whole, `yarn build`, and the E2E suite. The whole dev-seed suite was not run either: with a root `.env` it runs the integration tier against the shared database, and this plan needs no database. No `supabase`, `yarn db:*` or `yarn dev*` command was run.

## Task Commits

1. **Task 1: The frozen-mode checker, its fixtures and the gate spec**
   - `9eedeec70` (test): the failing spec, the 16 fixtures, `.gitattributes`, and a skeleton of the two exports
   - `7871698f4` (feat): `FROZEN_RULES` and `checkFrozenMigrations`
2. **Task 2: Run the self-test in every invocation, and record the red controls**
   - `41c134015` (feat): the self-test, `--self-test`, the withheld verdict, the fixture count on the last line
   - `c2691ac1d` (fix): one full stop, not two, at the end of a self-test problem line
   - `285ac7ad8` (docs): the red-control record

## RED evidence

The record was passed to `gsd-tools check tdd-red-evidence` and returned `RED_EVIDENCE_OK` (`target_test_failed`). It is under `tmp/181-06/` (ignored by git).

| Target test | Result of the RED run | Semantic assessment |
|-------------|-----------------------|---------------------|
| `the frozen-migration checker over its fixtures > returns exactly the one committed finding for edited-file` | exit 1; 24 tests, 17 failed, 7 passed | The target ran and failed on its own `toEqual` (`expected [] to deeply equal [ Array(1) ]`), because the skeleton returns `[]`. No load, syntax or fixture fault. The 17 failures are the 15 seeded-fixture cases and two completeness cases, all on assertions. The 7 that passed assert the wiring, the clean fixture, path independence and unique ids, which hold for a checker that returns nothing. |

Taken with `--reporter=junit --outputFile` through `yarn workspace @openvaa/dev-seed test:unit`, on the spec as committed.

## Red controls

From `evidence/181-06-freeze-checker-red.md`, run on commit `c2691ac1d87b9af83d1c9e1d25a411c65c16644c`.

| Key | Value | What was seen |
|-----|-------|---------------|
| `FIXTURES_RED` | seen | `--self-test` prints one finding for each of the 15 seeded fixtures and none for `ok`; all 10 finding kinds appear |
| `SCRATCH_FROM_COMMIT` | `c2691ac1d…` | the scratch checkout's own `HEAD` printed the same sha |
| `SCRATCH_HAS_CODE_UNDER_TEST` | yes | its guard holds the self-test flag and `FROZEN_RULES`; its fixture directory lists the same 16 names; unchanged, it exits 0 |
| `SELF_TEST_CAN_FAIL_EXIT` | 1 | `edited-file/expected.violations` emptied: the guard with no argument exits 1 and prints the withheld-verdict line |
| `RULE_WITHOUT_FIXTURE_EXIT` | 1 | `version-gap` deleted: the guard exits 1 and names the rule `version-contiguous` |
| `CHECKER_SEES_AN_EDIT` | seen | one space appended to the baseline of a copy of `ok` outside the repository: `EDITED FROZEN MIGRATION: 00001_initial_schema.sql has sha256 …` |

The scratch checkout was removed with `git worktree remove --force`; `git worktree list` no longer shows it. The scratch checkout had no `node_modules`.

## Files Created/Modified

- `scripts/assert-schema-migration-parity.mjs` - `FROZEN_RULES`, `checkFrozenMigrations`, the self-test over the fixtures, the `--self-test` flag, and `main()` behind an entry-point test. The header, the byte-parity verdict, the `--write` branch and every existing message are unchanged.
- `scripts/fixtures/schema-migration-freeze/<case>/` - `migrations/*.sql`, `manifest.json` (absent in `missing-manifest`) and `expected.violations`, for `ok` and the 15 seeded cases
- `packages/dev-seed/tests/schemaMigrationFreezeGate.test.ts` - 24 cases: three wiring assertions, one case per fixture, path independence, and the rule and fixture lists compared both ways. It holds no count of rules or fixtures.
- `.gitattributes` - `text eol=lf` for `apps/supabase/supabase/migrations/*.sql` and for everything under the fixture directory
- `evidence/181-06-freeze-checker-red.md` - the six verdict lines and the raw output of the controls
- `deferred-items.md` - one entry, on the entry-point test of three other guards

## The finding texts

Each is the committed line of its fixture. `manifest.json` is the manifest's base name in the fixtures.

| Rule id | Finding |
|---------|---------|
| `manifest-exists` | `MALFORMED MANIFEST: manifest.json cannot be read (ENOENT).` |
| `manifest-json` | `MALFORMED MANIFEST: manifest.json is not valid JSON.` |
| `baseline-members` | `MALFORMED MANIFEST: manifest.json has no string value for baseline.name.` (every absent member is listed in the one finding) |
| `baseline-commit-shape` | `MALFORMED MANIFEST: manifest.json gives baseline.commit as "0123abc", which is not 40 lower-case hex characters.` |
| `migrations-array` | `MALFORMED MANIFEST: manifest.json does not give migrations as a non-empty array of objects with a string file and a string sha256.` |
| `baseline-first` | `BASELINE NOT FIRST: 00001_other.sql is the first entry of the manifest, and baseline.file is 00001_initial_schema.sql.` |
| `name-pattern` | `BAD NAME: 20261012120000_add_note.sql is not five digits, an underscore, a name of lower-case letters, digits and underscores, and .sql; rename it to the next number, 00002_<name>.sql.` |
| `version-unique` | `DUPLICATE VERSION: 00002_b.sql has version 00002, which 00002_a.sql already has.` |
| `version-order` | `NON-INCREASING VERSION: 00002_b.sql has version 00002, lower than 00003_a.sql before it.` |
| `version-contiguous` | `VERSION GAP: 00003_add_note.sql has version 00003, and no entry has version 00002.` |
| `file-exists` | `MISSING MIGRATION: 00002_add_note.sql is listed in the manifest and is not a readable file in the migrations directory.` |
| `file-hash` | `EDITED FROZEN MIGRATION: 00002_add_note.sql has sha256 <actual>, and the manifest records <recorded>.` |
| `file-listed` | `UNLISTED MIGRATION: 00002_add_note.sql is in the migrations directory and has no entry in the manifest; a new migration needs its line there.` |
| `baseline-not-empty` | `EMPTY BASELINE: 00001_initial_schema.sql is zero bytes long.` |
| `baseline-has-table` | ``EMPTY BASELINE: 00001_initial_schema.sql holds no line beginning `CREATE TABLE public.`.`` |

## Decisions Made

- **Nothing is frozen.** No manifest of the real baseline was added, and the real guard was not switched to frozen mode.
- **The manifest's base name in a finding is `path.basename(manifestPath)`.** The plan writes "`manifest.json` for the manifest"; that is what every fixture gives. On the real path it will print `migrations.manifest.json`.
- **No rule outside the table.** The literal value of `baseline.file`, the value of `baseline.name` and the shape of `sha256` are not checked.
- **The self-test does not run under `--write`.** The plan says not to change the `--write` branch, and that branch gives no verdict to withhold.
- **A failed self-test ends the run before the migration is read.** The byte-parity result is then not computed, which is what "withheld" means here.
- **The contiguity rule is anchored at the baseline's version.** A version below it is reported by `version-order` and is not a gap. If the baseline's own name is bad, the lowest version is the anchor. Gap findings come in version order.
- **The "next number" in a `BAD NAME` finding** is the highest valid version in the manifest plus one. It is a suggestion; the checker does not know where the file belongs.
- **The header of the guard was not touched**, as the plan orders. Its `Usage:` and `Exit codes:` sections therefore do not name `--self-test` or the frozen-mode self-test; the flag is documented at the constant and at the function. Plan 181-17 replaces the header.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The entry-point test resolves symbolic links on both sides**
- **Found during:** Task 1, before the first edit
- **Issue:** The plan orders the entry-point test of `scripts/assert-env-pair-registry.mjs`, a string comparison of `path.resolve(process.argv[1])` with the module's own path. Measured on that script: started through a path that holds a symbolic link, it printed nothing and exited 0. Node resolves links for the module's URL and not for `process.argv[1]`, so `main()` is never called. A guard that exits 0 without checking anything is a false green.
- **Fix:** The parity guard ends with `if (invokedDirectly()) main();`, where `invokedDirectly` compares `realpathSync` of both paths and returns false when `process.argv[1]` is absent or unreadable. Importing the file still does not run `main()`.
- **Files modified:** `scripts/assert-schema-migration-parity.mjs`
- **Verification:** started through a link, from the working directory `/`, the guard printed its two lines and exited 0; the spec imports the file and passes
- **Committed in:** `9eedeec70`
- **Left alone:** the three other guards with the plain test. See `deferred-items.md`.

**2. [Rule 3 - Blocking] The RED commit holds the fixtures and a skeleton of the two exports**
- **Found during:** Task 1
- **Issue:** The plan says to write the spec first and see it fail. With no export in the guard the spec fails while importing, and importing the unchanged guard would run `main()`. With no fixture directory the spec fails while it is collected. The TDD reference counts both as an invalid RED.
- **Fix:** `9eedeec70` holds the spec, the fixtures, `.gitattributes`, and in the guard an empty `FROZEN_RULES`, a `checkFrozenMigrations` that returns `[]`, and the entry-point test. The plan's objective allows the fixtures and the spec to be committed first as the task's red half. The implementation is in `7871698f4`.
- **Files modified:** as listed
- **Verification:** `RED_EVIDENCE_OK`
- **Committed in:** `9eedeec70`

**3. [Rule 1 - Bug] A self-test problem line ended in two full stops**
- **Found during:** Task 2, in the output of the first run of the controls
- **Issue:** The guard added a full stop to every problem line, and a problem that quotes a finding already ends in one.
- **Fix:** One helper prints the problems and adds the full stop only when it is absent. The guard had already been committed for the controls (`41c134015`), so the fix is its own commit, and the controls were run again from it. The record is of that second run and says so.
- **Files modified:** `scripts/assert-schema-migration-parity.mjs`
- **Verification:** the record's control 2 shows one full stop; self-test, real-path run and spec exit 0
- **Committed in:** `c2691ac1d`

---

**Total deviations:** 3 auto-fixed (1 missing critical, 1 blocking, 1 bug)
**Impact on plan:** none changes the contract of the `interfaces` block. The first is stricter than the plan's wording; the second and third change only the history.

## Issues Encountered

- **The controls script was run twice.** The first run (from `41c134015`) gave the same four results as the second. It is not the record: a display line of the script had a shell syntax error under the system's bash 3.2, and the guard was then corrected (deviation 3). Both runs made and removed their own scratch checkout.
- **The fixtures were written by a one-off script**, not by hand, so that each `sha256` is the output of `shasum -a 256` on the file it describes. The script is not committed. Every expected line in it is a literal written before the checker existed; none was copied from the checker's output. After the checker was written, each listed file that exists was compared again with `shasum -a 256`: the only mismatch is the seeded file of `edited-file`.
- **`yarn format:check` ran a turbo build with the default cache.** No private `TURBO_CACHE_DIR` was set for it. The `Cached:` line reads `0 cached, 7 total`, so nothing was replayed, and the seven results were stored in the cache the worktrees share.
- **Prettier refuses `.gitattributes` when the file is named on the command line** ("No parser could be inferred"). `prettier --check .`, which is what `yarn format:check` runs, skips it and exits 0.

## What a later plan must know

- **Import:** `import { checkFrozenMigrations, FROZEN_RULES } from '<root>/scripts/assert-schema-migration-parity.mjs'`. From a spec, load it with `pathToFileURL`, as the gate spec does. Importing does not run the guard.
- **Plan 181-17 (the freeze)** still has to do all of this: add the real manifest, make `main()` call the checker over the real paths, delete the byte-parity path, make `--write` refuse, and replace the header. The third wiring assertion of the gate spec looks for the title `SCHEMA-MIGRATION PARITY GUARD`; if the new header drops those words, that assertion changes with it.
- **The checker judges the baseline's content only by two rules** (`baseline-not-empty`, `baseline-has-table`). The floor of the byte-parity mode (20 schema files, 3000 lines) lives in `main()` and goes with it at the freeze.
- **A green run now prints two lines.** The census is the first, the fixture count the last. Anything that reads the census must match the line, not take the last one.
- **`--self-test` on the script's command line would skip the real check.** The spec asserts the exact command of the script key and the exact link of `lint:check`, so neither can carry it unnoticed.
- **Follow-up 181-R1** (the manifest names the commit) is built on its recommended option. If the operator rules that the manifest holds no commit: remove the entry `baseline-commit-shape` from `FROZEN_RULES` with its check, delete the fixture `bad-baseline-commit`, take `commit` out of `BASELINE_MEMBERS`, and take `baseline.commit` out of the other fixtures' manifests (their hashes do not change; the manifest is not hashed).
- **Open Question 7** (contiguous versions) is built as the planner chose: a gap is a finding. If it is overruled, remove the entry `version-contiguous`, its loop and the fixture `version-gap`.
- **Not observed:** what `.gitattributes` does on a checkout with `core.autocrlf` on. Only the attributes were read (`text: set`, `eol: lf`). The secret scan of CI was not run over the fixture hashes.
- **Read with care:** `.planning/PROJECT.md` was read at its opening, Context and Constraints sections only. `.claude/skills/database/SKILL.md` was searched for the parity guard and `schema:regenerate` and not read whole; its text on the single generated migration becomes false at the freeze, not here.

## Threat Flags

None. The checker opens only names that are in the migrations directory's own listing, so a manifest entry cannot make it read a file outside that directory.

## Known Stubs

None. The skeleton of the RED commit was replaced in `7871698f4`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The guard half of SUPA-10 is built and has been seen failing on fixtures. Only the manifest of the real baseline and the switch of `main()` are missing, and both are plan 181-17.
- Plan 181-12 can read the manifest contract from the docblock of `checkFrozenMigrations` and from `scripts/fixtures/schema-migration-freeze/ok/manifest.json`.
- No blocker from this plan. The freeze still waits for the other stream.

## Self-Check: PASSED

- `.gitattributes`, the spec, the guard, `scripts/fixtures/schema-migration-freeze/ok/manifest.json` and the evidence record exist.
- Commits `9eedeec70`, `7871698f4`, `41c134015`, `c2691ac1d` and `285ac7ad8` are ancestors of `HEAD`.
- `commits: 5` is `git rev-list --count c2e0bcce9..HEAD` with `HEAD` at `285ac7ad8`.
- Every acceptance criterion of both tasks was run again after the last task commit and passed. The log shows `test(181-06)` before `feat(181-06)`.
- `git status --porcelain --untracked-files=no` printed nothing after the last task commit, apart from `deferred-items.md`, which is committed with this summary.

---
*Phase: 181-deployability-and-migration-model*
*Completed: 2026-10-12*
