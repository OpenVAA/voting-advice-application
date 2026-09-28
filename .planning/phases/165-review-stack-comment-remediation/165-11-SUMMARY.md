---
phase: 165-review-stack-comment-remediation
plan: 11
subsystem: frontend-supabase-adapter
tags: [refactor, supabase-adapter, project-scoping-guard, comment-hygiene]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-01 instruments, 165-07 hygiene-clean project-scoping guard
provides:
  - supabase/utils/bySortOrderThenId.ts, parseStoredCustomization.ts and parseFailureMessages.ts, each helper with a colocated unit test
  - A supabaseDataProvider.ts whose top level is its imports and the SupabaseDataProvider class
  - Three new GUARDED_SOURCES entries (16 guarded sources, 16 on disk)
affects: [165-24, 165-26, 165-36]

actuals:
  tokens: 17700
  tasks: 3
  commits: 4
plan_head_before: 58c27ace2d8035bd1be78f600a6e1f90687beb1a
plan_head_after: efb5ca6a4d8acd766a2fc3ba2e1541bbd8080c19

tech-stack:
  added: []
  patterns:
    - "A module-level helper leaving an adapter file lands in supabase/utils/ with a colocated test and a GUARDED_SOURCES entry in the same commit, so the guard's Check 5 never sees an unregistered source"

key-files:
  created:
    - apps/frontend/src/lib/api/adapters/supabase/utils/bySortOrderThenId.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/bySortOrderThenId.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/parseStoredCustomization.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/parseStoredCustomization.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/parseFailureMessages.ts
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-11.tsv
  modified:
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/parseOutcome.ts
    - scripts/assert-project-scoped-queries.mjs
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md

key-decisions:
  - "The three new GUARDED_SOURCES entries go in alphabetical position inside the utils/ run (bySortOrderThenId before convertFilterValue; parseFailureMessages before parseJsonbColumn; parseStoredCustomization after parseOutcome), which is the list's existing order"
  - "parseOutcome.ts was brought into scope (comment-only) because its three supabaseDataProvider.ts:NN references pointed at code this plan moved. D-04 then required the whole file to be clean, so its planning labels were rewritten in the same commit"
  - "The `// reason:` notes keep the repo's `// reason:` prefix but drop the `class N` taxonomy, which is a planning label; each states its rationale as a present fact"
  - "No hygiene-allow/165-11.tsv was written: the gate needed no exception, so the plan's listed allowlist file does not exist"

requirements-completed: [165-SC2, 165-SC3, C-4105280581]

coverage:
  - id: D1
    description: "supabaseDataProvider.ts declares only its imports and the class at the top level"
    requirement: "C-4105280581"
    verification:
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/assert-absent.sh '^(type|const|function|let) ' -- apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts (exit 0, absent)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each moved helper has a colocated unit test, and the provider's tests pass unchanged"
    requirement: "C-4105280581"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit parseStoredCustomization bySortOrderThenId supabaseDataProvider (3 files, 105 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every new adapter source is in GUARDED_SOURCES and the guard stays green"
    requirement: "165-SC2"
    verification:
      - kind: other
        ref: "node scripts/assert-project-scoped-queries.mjs (exit 0, 16 guarded / 16 on disk), --self-test (exit 0)"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit projectScopingGate (121 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every changed file is hygiene-clean with a read record for its current blob"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "hygiene-changed-files.sh --check-reads --files <the nine changed shipped files> (exit 0, VERDICT: CLEAN)"
        status: pass
      - kind: other
        ref: "code-identity.mjs d508a21eb fcab6fd04 over the three comment-rewritten files (exit 0, 0 changed code)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The rewritten comments are accurate and concise"
    human_judgment: true
    rationale: "Prose quality is a reader's judgement; the gates prove only the absence of pattern-level residue"

duration: 10min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 11: Supabase Data Provider Helper Extraction Summary

**`supabaseDataProvider.ts` now holds only its imports and the `SupabaseDataProvider` class. The sort comparator, the customization parser and the two parse-failure event names moved into `supabase/utils/`, each helper with its own unit test, and the question row types moved to the provider's `.type.ts`. The three new sources are registered with the project-scoping guard. The provider's comments went from 118 lines to 87, and a comment-only rewrite with a code-identity proof removed the planning labels and history.**

## Performance

- **Duration:** about 10 min
- **Started:** 2026-09-27T19:38:19Z
- **Completed:** 2026-09-27T19:48:07Z
- **Tasks:** 3 of 3
- **Files changed:** 11 (5 created source/test files, 4 modified source files, the read record, the ledger)

## Accomplishments

- **Task 1 (tracer): `bySortOrderThenId`, moved end to end.** The comparator is now `utils/bySortOrderThenId.ts`, with a one-line docblock and five unit cases: ascending numeric order, nulls last, fallback to id on equal order (including both null), 0 only for equal id and order, and no mutation of its inputs. The provider imports it, and the guard lists it.
- **Task 2: the rest of the module-level block.** `utils/parseFailureMessages.ts` exports `CUSTOMIZATION_PARSE_FAILURE_MESSAGE` and `SETTINGS_PARSE_FAILURE_MESSAGE` under one shared comment. `utils/parseStoredCustomization.ts` exports the parser with a contract docblock. Its test covers four cases: absent (`undefined` and `null`) returns `{}` with no record; a valid customization comes back as parsed; with one malformed and one valid member, the valid one is kept, the record's `msg` is the constant, `preserved` is true, and the serialized record does not contain the sentinel value; a non-object value falls back to `{}` with `preserved: false`. `QuestionCategoryRow`, `QuestionRow` and `GetQuestionsPayload` are exported from `supabaseDataProvider.type.ts` and imported as types.
- **Task 3: comment hygiene.** The provider's `_getAppSettings` docblock lost its `162.1 D-05/D-06/D-17` and `162-08 Q4` citations, the threat ids and the decision labels. The inline notes lost the green-run citation, `(D-07)`/`(D-08)`, the `157-02` plan references, the `class N` taxonomy, the "used to read a second column" history for `subtype`, the "parties tab is empty during manual smoke" story and the "the previous client-side filter" narrative. The `nomination.ts:38-45` line references now name the `Nomination` invariant. The type file's `InternalFlatNomination` docblock now names `_getNominationData` and the invariant instead of "line ~326", and it no longer has the filename-convention and `Id`-import notes. A stray space before a period (`union .`) was also fixed.

## Task Commits

1. **Task 1: move bySortOrderThenId (tracer)**: `a498870ce` (refactor, `Review-Comment: C-4105280581`)
2. **Task 2: move the parser, the message constants and the row types**: `d508a21eb` (refactor, `Review-Comment: C-4105280581`)
3. **Task 3: comment hygiene over the provider, its type file and parseOutcome.ts**: `fcab6fd04` (docs, `Hygiene: D-04`)
4. **Task 3: read records and ledger row**: `efb5ca6a4` (chore, `Hygiene: D-04`)

## RED runs (TDD)

| Test | Command | Exit | Output |
|---|---|---|---|
| `bySortOrderThenId.test.ts` | `yarn workspace @openvaa/frontend test:unit bySortOrderThenId` | 1 | `Error: Failed to resolve import "./bySortOrderThenId" ... Does the file exist?`, `Test Files 1 failed (1)` |
| `parseStoredCustomization.test.ts` | `yarn workspace @openvaa/frontend test:unit parseStoredCustomization` | 1 | `Error: Failed to resolve import "./parseFailureMessages" ...`, `Test Files 1 failed (1)` |

The GREEN runs were exit 0, first with 2 files and 101 tests after Task 1, then with 3 files and 105 tests after Task 2. The provider suite's 96 cases passed unchanged throughout.

## Verification (every status read directly, never through a pipe)

| Check | Result |
|---|---|
| `yarn workspace @openvaa/frontend test:unit supabaseDataProvider parseOutcome parseStoredCustomization bySortOrderThenId eslint-parse-posture-guard` | exit 0, 5 files, 204 passed |
| `node scripts/assert-project-scoped-queries.mjs` | exit 0, `16 guarded source(s), 0 deferred, 16 adapter source(s) on disk ... 0 violation(s)` (was 13/13 at the phase base) |
| `node scripts/assert-project-scoped-queries.mjs --self-test` | exit 0 |
| `yarn workspace @openvaa/dev-seed test:unit projectScopingGate` | exit 0, 121 passed |
| `yarn workspace @openvaa/frontend check` | exit 0, `2776 FILES 0 ERRORS 0 WARNINGS` |
| frontend lint (`eslint --flag v10_config_lookup_from_file src/` from `apps/frontend`, the workspace `lint` script run through the root binary) | exit 0; the one warning is the pre-existing `candidateContext.svelte.test.ts` item already in deferred-items.md |
| `node scripts/assert-adapter-casts.mjs` / `node scripts/assert-comment-hygiene.mjs` | exit 0 / exit 0 |
| `assert-absent.sh 'function bySortOrderThenId' -- .../supabaseDataProvider.ts` | exit 0 |
| `assert-absent.sh '^(type\|const\|function\|let) ' -- .../supabaseDataProvider.ts` | exit 0 |
| `hygiene-changed-files.sh --check-reads --files` over the nine changed shipped files | exit 0, `VERDICT: CLEAN`, 0 items |
| `bash scripts/tip-proofs.sh` | exit 0 (the C-4080520279 proof searches the whole adapter directory, so the move did not affect it) |
| `ledger-check.sh` | exit 0, `VERDICT: PASSED` |
| Comment lines in `supabaseDataProvider.ts` (`grep -cE '^\s*(\*\|//)'`) | 118 at the phase base, 87 now |

The code-identity proof for the comment-only commit:

```text
$ node .planning/phases/165-review-stack-comment-remediation/scripts/code-identity.mjs d508a21eb fcab6fd04 apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts apps/frontend/src/lib/api/adapters/supabase/utils/parseOutcome.ts
code-identical: apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
code-identical: apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts
code-identical: apps/frontend/src/lib/api/adapters/supabase/utils/parseOutcome.ts

3 compared, 0 changed code
exit=0
```

## Review-comment dispositions

| Comment | Disposition | Evidence | Commit | Draft reply |
|---|---|---|---|---|
| [C-4105280581](https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4105280581) | fix | `assert-absent.sh` finds no top-level `type`, `const`, `function` or `let` in `supabaseDataProvider.ts` (exit 0); unit RED then GREEN 105/105; guard exit 0 with 16/16 sources | a498870ce, d508a21eb, fcab6fd04 | Done in a498870ce and d508a21eb. `bySortOrderThenId`, `parseStoredCustomization` and the two parse-failure event names now live in `supabase/utils/`, each helper with its own unit test. The question row and payload types moved to `supabaseDataProvider.type.ts`, and the three new files are registered with the project-scoping guard. The provider file now declares only its imports and the class; fcab6fd04 cleans up its comments. |

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug, D-04] `parseOutcome.ts` cited provider line numbers that the move made false**
- **Found during:** Task 1 read-first (`git grep parseStoredCustomization`)
- **Issue:** `utils/parseOutcome.ts` described its behaviour by pointing to `supabaseDataProvider.ts:76`, `:86` and `:72-90`. After Task 2, `parseStoredCustomization` no longer lives in the provider, so all three references pointed at unrelated code. The file was not in `files_modified`, and it failed the hygiene gate at the base with 9 items (decision labels `C4`, `A2`, `C5(b)`, `D8`, and threat ids).
- **Fix:** A comment-only rewrite in the Task 3 commit. The references now describe the behaviour itself, and the planning labels and the "donor" history are gone. `code-identity.mjs` exits 0 for the file. Its read is recorded, and the parseOutcome, parse-posture and provider tests pass.
- **Files modified:** apps/frontend/src/lib/api/adapters/supabase/utils/parseOutcome.ts
- **Commit:** fcab6fd04

**2. [Process] `eslint --fix` must not be run on the guard script**
- **Found during:** Task 1 pre-commit lint
- **Issue:** The repo's lint scripts do not cover `scripts/`. Running `eslint --fix` on `scripts/assert-project-scoped-queries.mjs` rewrote an existing template literal into a quoted string, and it reports 7 errors that predate this phase (`func-style`, `no-console`; the base blob reports 8).
- **Fix:** That one hunk was reverted before the commit, so the guard's diff is the three list entries only. Prettier's single complaint about the file is the pre-existing `user_can:` line that 165-07 logged for 165-26.
- **Commit:** none (reverted before a498870ce)

**3. [Plan artifact] `hygiene-allow/165-11.tsv` was not created**
- The plan lists it in `files_modified`, but no exception was needed, and an empty allowlist file would be noise.

**Total deviations:** 3 (1 correctness fix to an out-of-list file, 1 process catch, 1 artifact not needed). **Impact:** the only extra file is `parseOutcome.ts`, and its change is comment-only.

## Issues Encountered

- zsh does not word-split an unquoted `$F` path list, so the first multi-file eslint/prettier call matched no files. Every later multi-file call ran under `bash -c`.

## Known Stubs

None.

## Next Phase Readiness

- 165-26 edits `scripts/assert-project-scoped-queries.mjs` again (the `upsert_answers` disposition). That changes the blob and voids this plan's read row for the guard, so 165-26 must record its own read.
- The phase-wide gates (165-24 / 165-36) now also see `utils/parseOutcome.ts` in the changed-file set. It has a current read record.

## Self-Check: PASSED

- All five created source/test files and `hygiene-reads/165-11.tsv` exist on disk.
- Commits `a498870ce`, `d508a21eb`, `fcab6fd04` and `efb5ca6a4` are in `git log`. `git rev-list --count 58c27ace2..HEAD` is 4 before this SUMMARY commit.
- `git status --short` lists only the maintainer's unstaged `MainContent.svelte` and the untracked `.planning/milestone.lock`. Neither was staged.
