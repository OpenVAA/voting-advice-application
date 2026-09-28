---
phase: 165-review-stack-comment-remediation
plan: 10
subsystem: testing
tags: [dev-seed, playwright-teardown, comment-hygiene, error-messages, tdd]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments (hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs, assert-absent.sh, ledger-check.sh); 165-05 comment-restoration precedent (intermediate-rev code-identity)"
provides:
  - "perm-closed-project teardown that reopens the shared E2E project in a finally"
  - "unknownPropertyMessage that names the real failure (unknown column at _bulk_upsert_record) and all four declarations"
  - "restored summary.ts, FeedbackGenerator.ts and QuestionCategoriesGenerator.test.ts comments"
  - "hygiene-reads/165-10.tsv read records for all six changed files"
  - "165-LEDGER.md rows for C-4080508380, C-4080515679, C-4080515735, C-4080515761, C-4080515791"
affects: [165-24, 165-36]

actuals:
  tokens: 5392
  tasks: 3
  commits: 4
plan_head_before: c7a189134866fea7892c712709d173fb4db19e2e
plan_head_after: 23b0692ba595808d4752cfb89e58f4ca6baa470f

tech-stack:
  added: []
  patterns:
    - "A code-string hygiene edit (test titles) goes in its own `Hygiene: D-04` commit, so the review-comment commit stays comment-only and is proven with code-identity against that intermediate commit"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-10.tsv
  modified:
    - tests/tests/setup/perm/perm-closed-project.teardown.ts
    - packages/dev-seed/src/assertKnownRowProps.ts
    - packages/dev-seed/tests/assertKnownRowProps.test.ts
    - packages/dev-seed/src/cli/summary.ts
    - packages/dev-seed/src/generators/FeedbackGenerator.ts
    - packages/dev-seed/tests/generators/QuestionCategoriesGenerator.test.ts
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md

key-decisions:
  - "The unknown-property message says the key would be forwarded to the database write (`_bulk_upsert_record` for the bulk-import tables), because feedback rows go through a direct upsert instead, and both paths fail on an unknown column"
  - "QuestionCategoriesGenerator.test.ts test titles carried the requirement id GEN-04, which layer 1 of the gate flags and the allowlist cannot cover; the titles were renamed in a separate Hygiene: D-04 commit (7bd6e65de) so the Review-Comment commit stays comment-only"
  - "FeedbackGenerator.ts's header said `project_id` is required; 107-feedback.sql makes it nullable ON DELETE SET NULL, so the header now says so"

patterns-established:
  - "Split a comment-only proof around a code-string hygiene edit: commit the string edit first, then prove code-identity from that commit to WORKTREE"

requirements-completed: [165-SC2, 165-SC3, C-4080508380, C-4080515679, C-4080515735, C-4080515761, C-4080515791]

coverage:
  - id: D1
    description: "perm-closed-project teardown reopens the shared project in a finally, with no catch (C-4080508380)"
    requirement: "C-4080508380"
    verification:
      - kind: other
        ref: "yarn typecheck:tests (exit 0); eslint on the file (exit 0); hygiene-changed-files.sh --files <file> (exit 0)"
        status: pass
      - kind: other
        ref: "grep -n 'finally\\|ensureProject\\|catch' tests/tests/setup/perm/perm-closed-project.teardown.ts — ensureProject() only on the line inside finally, no catch"
        status: pass
    human_judgment: true
    rationale: "The behavioural proof is the full E2E run in plan 165-24; this plan runs no E2E (wave safety)"
  - id: D2
    description: "unknownPropertyMessage names the unknown-column failure at _bulk_upsert_record and all four declarations; the test pins it (C-4080515679)"
    requirement: "C-4080515679"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/assertKnownRowProps.test.ts (RED 2 failed; GREEN 34/34 across 2 files)"
        status: pass
      - kind: other
        ref: "assert-absent.sh 'silently dropped' -- packages/dev-seed/src/assertKnownRowProps.ts (exit 0); yarn workspace @openvaa/dev-seed typecheck (exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Three restored comments: summary.ts example, FeedbackGenerator.ts header, QuestionCategoriesGenerator.test.ts header (C-4080515735, C-4080515761, C-4080515791)"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "code-identity.mjs 7bd6e65de WORKTREE <three files> (exit 0); code-identity.mjs ship/v2.15-12-planning WORKTREE summary.ts FeedbackGenerator.ts (exit 0)"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit QuestionCategoriesGenerator (6/6)"
        status: pass
      - kind: other
        ref: "hygiene-changed-files.sh --check-reads --files <all six> (exit 0); node scripts/assert-comment-hygiene.mjs (0 violations)"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 10: Dev-seed and E2E-teardown Review Fixes Summary

**The perm-closed-project teardown now reopens the shared E2E project in a `finally`. The seed guard's unknown-property message now names the real failure (an unknown column at `_bulk_upsert_record`) and all four declarations in `permittedKeys.ts`. Three dev-seed comments damaged by the codemod reflow are restored, and the proof shows the change is comment-only.**

## Performance

- **Duration:** about 8 min
- **Started:** 2026-09-27T19:25:48Z
- **Completed:** 2026-09-27T19:33:12Z
- **Tasks:** 3 of 3
- **Files modified:** 6 shipped files, plus the read log and the ledger

## Accomplishments

- `perm-closed-project.teardown.ts`: `unregisterCandidate` and `runTeardownAsserted` run inside `try`, and `ensureProject()` runs in `finally`. There is no `catch`, so a delete failure still fails the teardown, but only after the project has been reopened. The header no longer cites `162.1 D-21` / `162.1-05`.
- `assertKnownRowProps.ts`: the message says the key is not a declared column, relationship ref, link sentinel or non-column field, so it would be forwarded to the database write (`_bulk_upsert_record` for the bulk-import tables) and fail there as an unknown column. It still lists the permitted keys. It then says which declaration to use: `TABLE_COLUMNS` for a new database column, `RELATIONSHIP_REFS` for a foreign-key reference, or `LINK_SENTINELS` / `COLLECTION_NON_COLUMNS` for a key the pipeline consumes before the write. Both this file and its test were made hygiene-clean: `TMPL-02`, `CR-01` and `144-01` are gone from the describe titles, labels and comments, and so is the historical narrative.
- `summary.ts`: the example is `formatSummary`'s real output line for line, inside a `text` fence. I compared it against a live `formatSummary` run with spaces made visible.
- `FeedbackGenerator.ts`: the header now reads "That limitation remains until feedback seeding becomes useful." It names `apps/supabase/supabase/schema/107-feedback.sql` instead of "migration lines 949–961". The `is_generated` bullet is removed. The broken "apply — see ElectionsGenerator.ts" line is now one sentence. The header also states that `project_id` is nullable.
- `QuestionCategoriesGenerator.test.ts`: the header's first sentence ends after "spot-check", and the next sentence begins "The `_elections` join sentinel". "acceptance (a)–(e)" became a plain list of what the spec covers.

## Task Commits

1. **Task 1: teardown reopens the project in `finally` (tracer)** — `7ca090594` (fix). Tracer gate: interactive mode, end-of-phase, automated-only verify, so I re-ran the verify commands (typecheck, eslint, prettier and hygiene all exit 0) and continued.
2. **Task 2: unknown-property message (TDD)** — `6b18d6761` (fix). RED: 2 failed, 28 passed. GREEN: 34/34 (the filter also matches `assertKnownRowProps.builtins.test.ts`).
3. **Task 3: three restored comments** — `7bd6e65de` (test, `Hygiene: D-04`: test titles only) and `23b0692ba` (docs, comment-only, three `Review-Comment:` trailers).

## Review-comment dispositions

| Comment | Disposition | Commit | Evidence |
|---|---|---|---|
| C-4080508380 | fix | `7ca090594` | `finally` holds the only `ensureProject()` call, and the file has no `catch`. `yarn typecheck:tests`, eslint and the hygiene gate exit 0. The behavioural proof is the full E2E run in plan 165-24. |
| C-4080515679 | fix | `6b18d6761` | The test pins `_bulk_upsert_record`, `/unknown column/`, all four declaration names and the absence of "silently dropped" (RED 2 failed, GREEN 34/34). `assert-absent.sh 'silently dropped'` exits 0. |
| C-4080515735 | fix | `23b0692ba` | The fenced example matches a real `formatSummary` run. code-identity against `ship/v2.15-12-planning` exits 0. |
| C-4080515761 | fix | `23b0692ba` | `grep -c 'remains until feedback seeding becomes useful'` returns 1. `assert-absent.sh 'is_generated'` exits 0. code-identity exits 0. |
| C-4080515791 | fix | `23b0692ba` | The header has a sentence break after "spot-check". code-identity against `7bd6e65de` exits 0, and the tests pass 6/6. |

All five rows in `165-LEDGER.md` are filled (Evidence, Commit, Draft reply). `ledger-check.sh` exits 0.

## Verification (every status read directly)

| Command | Exit |
|---|---|
| `yarn typecheck:tests` | 0 |
| `node_modules/.bin/eslint --flag v10_config_lookup_from_file tests/tests/setup/perm/perm-closed-project.teardown.ts` | 0 |
| `yarn workspace @openvaa/dev-seed test:unit assertKnownRowProps` (RED / GREEN) | 1 / 0 |
| `assert-absent.sh 'silently dropped' -- packages/dev-seed/src/assertKnownRowProps.ts` | 0 |
| `yarn workspace @openvaa/dev-seed typecheck` | 0 |
| `code-identity.mjs ship/v2.15-12-planning WORKTREE summary.ts FeedbackGenerator.ts QuestionCategoriesGenerator.test.ts` | 1 (only the two test titles changed in `7bd6e65de`; see Deviations) |
| `code-identity.mjs ship/v2.15-12-planning WORKTREE summary.ts FeedbackGenerator.ts` | 0 |
| `code-identity.mjs 7bd6e65de WORKTREE <all three>` | 0 |
| `yarn workspace @openvaa/dev-seed test:unit QuestionCategoriesGenerator` | 0 (6/6) |
| `hygiene-changed-files.sh --check-reads --files <all six>` | 0 |
| `assert-absent.sh 'is_generated' -- packages/dev-seed/src/generators/FeedbackGenerator.ts` | 0 |
| `node scripts/assert-comment-hygiene.mjs` | 0 (0 violations) |
| dev-seed lint (`eslint src/` from the package, with the root eslint binary) | 0 (15 pre-existing warnings, 0 errors) |
| `bash scripts/tip-proofs.sh` | 0 |
| `bash scripts/ledger-check.sh` | 0 |

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The hygiene gate flagged `GEN-04` in two test titles, which the comment-only proof could not absorb**
- **Found during:** Task 3
- **Issue:** Layer 1 of the gate flags `GEN-04` in two `it(...)` titles in `QuestionCategoriesGenerator.test.ts`, and layer 1 cannot be allowlisted. Titles are code strings, though, so fixing them breaks the plan's single `code-identity.mjs ship/v2.15-12-planning WORKTREE <three files>` proof, which exits 1.
- **Fix:** I renamed the titles in their own commit, `7bd6e65de`, with a `Hygiene: D-04` trailer. The Review-Comment commit `23b0692ba` is comment-only: code-identity from `7bd6e65de` to WORKTREE exits 0 for all three files, and from `ship/v2.15-12-planning` it exits 0 for `summary.ts` and `FeedbackGenerator.ts`. This follows plan 165-05's intermediate-rev precedent.
- **Commits:** `7bd6e65de`, `23b0692ba`

**2. [Rule 1 - Bug] FeedbackGenerator.ts listed `project_id` as required**
- **Found during:** Task 3, reading `107-feedback.sql` to name it
- **Fix:** The header now says `project_id` is nullable (`ON DELETE SET NULL`) and that the generator always sets it. This is a comment change only.
- **Commit:** `23b0692ba`

**3. [Rule 3] Import order in `assertKnownRowProps.test.ts`**
- **Issue:** The file had a `simple-import-sort` error before this plan. This worktree sets `core.hooksPath=/dev/null`, so lint-staged's `eslint --fix` never runs on commit.
- **Fix:** I ran `eslint --fix` on the two Task 2 files, which is what lint-staged would have done. It only reordered imports.
- **Commit:** `6b18d6761`

**4. The hygiene allowlist file was not created**
- `hygiene-allow/165-10.tsv` is in `files_modified`, but no hit needed an exception, so no row and no file were written.

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug) plus 1 artifact not needed. **Impact:** none on scope. Every Review-Comment commit is still answerable with one link.

## Issues Encountered

- Other dev-seed generator tests still carry `(GEN-04)` in their titles: Alliances, AppSettings, Candidates, Constituencies, ConstituencyGroups, Elections, and others. `packages/dev-seed/README.md:281` does too. This plan does not change those files, so the per-changed-file rule (D-04) does not reach them. I am recording them here and not fixing them.

## Known Stubs

None.

## Next Phase Readiness

- The E2E behaviour of the teardown (a failing delete step still leaves the project open) is proven by the full-suite run in plan 165-24.

## Self-Check: PASSED

- All six shipped files and `hygiene-reads/165-10.tsv` exist on disk.
- Commits `7ca090594`, `6b18d6761`, `7bd6e65de` and `23b0692ba` are in `git log`.
- `git status --short` lists only the maintainer's `MainContent.svelte` edit and `.planning/milestone.lock`, apart from this SUMMARY and the ledger.
