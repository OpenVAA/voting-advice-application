---
phase: 165-review-stack-comment-remediation
plan: 04
subsystem: database
tags: [comment-hygiene, pgtap, rls, rpc-security, column-grants]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments: hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs --blank-sql-literals"
provides:
  - "05-organization-admin, 07-rpc-security, 09-column-restrictions and 29-authenticated-disjunct-order pgTAP suites with reference-free comments and assertion descriptions"
  - "hygiene-reads/165-04.tsv read records for the four suites at their current blobs"
affects: [165-24, 165-25, 165-26, 165-27, 165-36]

actuals:
  tokens: 15321
  tasks: 3
  commits: 3
plan_head_before: 8e103394b3263f1154b19abbfaf4458b2d3cf0ff
plan_head_after: 11b3716b8b26230b6a66865d35b6b14ffa9b81ba

tech-stack:
  added: []
  patterns:
    - "Comment blocks are replaced by a content-anchored script that asserts every replaced line is a `--` comment, and descriptions by a unique-substring replacement that refuses a comment line; code-identity.mjs --blank-sql-literals then proves only comments and literals moved"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-04.tsv
    - .planning/phases/165-review-stack-comment-remediation/deferred-items.md
  modified:
    - apps/supabase/supabase/tests/database/05-organization-admin.test.sql
    - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
    - apps/supabase/supabase/tests/database/09-column-restrictions.test.sql
    - apps/supabase/supabase/tests/database/29-authenticated-disjunct-order.test.sql

key-decisions:
  - "The SQL identifier `d01_disjunct_order` in 29-authenticated-disjunct-order.test.sql is code and stays; the gate does not flag it"
  - "Comments that stated a wrong fact at the tip were corrected while being rewritten: 07's header cited 016-bulk-operations.sql and 017-email-helpers.sql (now 501-/502-), 05's header listed the candidates SELECT disjuncts in a different order from the applied qual, and 05's organizations grant list omitted `confirmed`"
  - "No hygiene-allow/165-04.tsv was created: the gate reported zero hits on all four files, so there was no false positive to allowlist"
  - "The pre-existing prettier failure of 07-rpc-security.test.sql (and three other SQL files) is logged in deferred-items.md, not fixed: it is in SQL code layout, which this plan may not change"

patterns-established:
  - "A count description states the count (`authenticated holds UPDATE on exactly 11 columns of candidates`); the non-obvious reason moves into the section comment as a constraint"

requirements-completed: [165-SC3]

coverage:
  - id: D1
    description: "The four pgTAP files pass the per-changed-file hygiene gate, comments and descriptions alike, with current read records"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-changed-files.sh --files <the four files> (exit 0, total failing items: 0, VERDICT: CLEAN)"
        status: pass
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-changed-files.sh --check-reads --files <the four files> (exit 0, unread=0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Only comments and single-quoted literals changed, and every changed literal is an assertion description"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "node .planning/phases/165-review-stack-comment-remediation/scripts/code-identity.mjs --blank-sql-literals ship/v2.15-12-planning HEAD <the four files> (exit 0, 4 compared, 0 changed code)"
        status: pass
      - kind: other
        ref: "node .../code-identity.mjs ship/v2.15-12-planning WORKTREE <file> without the flag: 29 -> 1 literal, 05 -> 5, 09 -> 6, 07 -> 7, each the last text argument of a pgTAP call"
        status: pass
    human_judgment: false
  - id: D3
    description: "The targeted pgTAP run keeps the baseline assertion total"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "yarn workspace @openvaa/supabase supabase test db 00-helpers + 05 + 07 + 09 + 29 (exit 0, Files=5, Tests=111, Result: PASS, identical to the baseline)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The rewritten comments describe accurately what each assertion proves"
    verification: []
    human_judgment: true
    rationale: "Accuracy of prose against test semantics is a reading judgment; the instruments prove only that no code changed and no hygiene pattern remains"

duration: 8min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 04: pgTAP Suite Comment Hygiene Summary

**The four pgTAP suites the schema plans later edit (05, 07, 09, 29) now state what each assertion proves, with no review ids, plan ids, decision labels, spike numbers or fixture history. 19 assertion descriptions lost their planning suffixes, `code-identity.mjs --blank-sql-literals` proves no SQL character changed, and 00-helpers plus the four suites still report `Files=5, Tests=111, Result: PASS`.**

## Performance

- **Duration:** about 8 min
- **Started:** 2026-09-27T17:44:09Z
- **Completed:** 2026-09-27T17:52:00Z
- **Tasks:** 3 of 3
- **Files modified:** 4 test files, plus 1 read record and 1 deferred-items log

## Baseline and final pgTAP totals

Command, run from the repo root: `yarn workspace @openvaa/supabase supabase test db supabase/tests/database/00-helpers.test.sql supabase/tests/database/05-organization-admin.test.sql supabase/tests/database/07-rpc-security.test.sql supabase/tests/database/09-column-restrictions.test.sql supabase/tests/database/29-authenticated-disjunct-order.test.sql`

| Run | Exit | Line |
|---|---|---|
| Baseline, before any edit | 0 | `Files=5, Tests=111` / `Result: PASS` |
| After Task 3 (all four rewritten) | 0 | `Files=5, Tests=111` / `Result: PASS` |
| Task 1 subset (00-helpers + 29), before and after | 0 | `Files=2, Tests=16` / `Result: PASS` |
| Task 2 subset (00-helpers + 05 + 09), before and after | 0 | `Files=3, Tests=65` / `Result: PASS` |

The total reconciles with the plan counts: 9 from 00-helpers (`no_plan`) + `plan (22)` + `plan (39)` + `plan (34)` + `plan (7)` = 111. Every `plan (N)` is unchanged from `ship/v2.15-12-planning`.

## Changed description literals per file

Counted from `code-identity.mjs ship/v2.15-12-planning WORKTREE <file>` without `--blank-sql-literals`, which prints each changed literal line as a `-`/`+` pair. Every one is the last text argument of a pgTAP call.

| File | Literals | What was removed |
|---|---|---|
| `29-authenticated-disjunct-order.test.sql` | 1 | `(162.1 D-01, variant B)` |
| `05-organization-admin.test.sql` | 5 | a plan-id tail on TEST A, `(162-REVIEW CR-02)` and `(SPEC section 7 row 3, CR-02)` on TEST C, `(CR-02)` and a doubled "called" on TEST B, the `D-21 ... D-36` tail on the equality |
| `09-column-restrictions.test.sql` | 6 | the history in the two count descriptions (now `exactly 11 columns of candidates` / `exactly 9 columns of organizations`), and the `CR-04` prefixes on four descriptions |
| `07-rpc-security.test.sql` | 7 | `(CR-01)` x2, `(WR-02)` x2, the `WR-01 census:` / `WR-01:` prefixes x3 |
| **Total** | **19** | |

## Gate and identity outputs (status read directly, never through a pipe)

| Command | Exit | Output |
|---|---|---|
| `hygiene-changed-files.sh --report-only`, at base | 0 | 29: 10 items, 05: 30 items, 09: 19 items, 07: 23 items |
| `hygiene-changed-files.sh --files <the four files>`, at HEAD | 0 | `total failing items: 0 (layer1=0 ... layer5=0 unread=0)`, `VERDICT: CLEAN` |
| `hygiene-changed-files.sh --check-reads --files <the four files>` | 0 | `unread=0`, `VERDICT: CLEAN` |
| `code-identity.mjs --blank-sql-literals ship/v2.15-12-planning HEAD <the four files>` | 0 | `4 compared, 0 changed code (SQL literals blanked)` |
| `git grep -c is_generated` on 09, base and worktree | — | `6` and `6` |
| `bash scripts/tip-proofs.sh` | 0 | all proofs PASS |
| `yarn prettier --check` on 05, 09, 29 | 0 | `All matched files use Prettier code style!` |
| `yarn prettier --check` on 07 | 1 | fails at base too; see Issues Encountered |

## Accomplishments

- **29-authenticated-disjunct-order:** the header states that the file asserts an evaluation order read from `pg_policies.qual`, why that order matters (an admin exits on the first call, and a public row never pays for the entity `user_can` calls), and why the check is structural instead of timed. The decision label, spike numbers, timing figures and plan ids are gone. So is the paragraph explaining why the file was created separately.
- **05-organization-admin:** the header's access-pattern paragraph is now five `-- - ` bullets in the applied qual's disjunct order. The TEST A / B / C comments state what each assertion proves and how TEST A bounds TEST C. The REKEYED, RE-POINTED, WINDOWS.md and D-36 narrative is gone. Two comments that ran two sentences together had their missing full stop restored.
- **09-column-restrictions:** the header states that the confirmation column is granted and guarded by `enforce_entity_immutability()` rule 1, and it adds `projects: account_id` to the protected-column list. The `external_id` rationale moved above the assertion it describes. The retired-`organization_id` note was removed. The section 5, 6 and 7 headers that had a sentence run into the title are split. The `CR-04` section is now "Section 8".
- **07-rpc-security:** the review ids are gone from the header, section 7, section 8, section 8b and section 8c. So are the 162-08/162-12 fixture history, the 161-02/161-03/161-07 anecdote about the `have: 4, want: 381` measurement, and the "probed on the live database" line. Section 8b's title names the branches it covers, and the header cites the schema files by their current names.

## Task Commits

1. **Task 1 (tracer): 29-authenticated-disjunct-order**: `68162ad05` (docs). Tracer gate: verify re-run at HEAD (identity 0, gate 0, pgTAP 16/16 = sub-baseline), then expanded.
2. **Task 2: 05-organization-admin and 09-column-restrictions**: `bafa9f860` (docs)
3. **Task 3: 07-rpc-security and the four-file run against the baseline**: `11b3716b8` (docs)

Every commit carries the `Hygiene: D-04` trailer and stages explicit paths only.

## Files Created/Modified

- `apps/supabase/supabase/tests/database/05-organization-admin.test.sql`: comments and 5 descriptions, 23,394 to 18,119 bytes.
- `apps/supabase/supabase/tests/database/07-rpc-security.test.sql`: comments and 7 descriptions, 35,196 to 32,295 bytes.
- `apps/supabase/supabase/tests/database/09-column-restrictions.test.sql`: comments and 6 descriptions, 22,447 to 18,179 bytes.
- `apps/supabase/supabase/tests/database/29-authenticated-disjunct-order.test.sql`: comments and 1 description, 6,749 to 5,581 bytes.
- `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-04.tsv`: four rows at blobs `6ee2cc3c` (29), `2064abd2` (05), `c7d95bda` (09) and the 07 blob recorded in Task 3.
- `.planning/phases/165-review-stack-comment-remediation/deferred-items.md`: the prettier finding.

## Allowlist rows

None. The gate reported zero hits on all four files, so `hygiene-allow/165-04.tsv` was not created.

## Decisions Made

See `key-decisions` in the frontmatter. Before each rewritten comment was restated, it was checked against the tip schema: the candidates SELECT qual in `302-rls.sql`, the organizations grant in `303-column-grants.sql`, `private.is_child_nominee` in `301-auth-functions.sql`, the file names of the bulk and email helpers, and the fixture's project-B nomination polarity in `00-helpers.test.sql`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Three comments stated facts the tip contradicts**
- **Found during:** Tasks 2 and 3, while checking each rewritten comment against the schema
- **Issue:** 07's header cited `016-bulk-operations.sql` and `017-email-helpers.sql`, which do not exist (the files are `501-bulk-operations.sql` and `502-email-helpers.sql`). 05's header listed the candidates SELECT disjuncts as project, entity, public, but the applied qual reads project, public, entity (the order 29 asserts). 05's organizations grant list omitted `confirmed`.
- **Fix:** the rewritten comments state the tip facts. All three changes are comment-only (identity 0).
- **Commits:** `bafa9f860`, `11b3716b8`

**Total deviations:** 1 auto-fixed (comment accuracy). **Impact:** none on scope. Every change stayed inside comments.

## Issues Encountered

- **`07-rpc-security.test.sql` fails `prettier --check`, and did so before this plan.** Three other SQL files fail the same way (`21-entity-organization.test.sql`, `24-legacy-removal.test.sql`, `schema/300-auth-tables.sql`). The differences are in SQL code layout, which this plan may not change, so the finding is logged in `deferred-items.md` for the plan that runs the phase-wide `yarn format:check` gate (165-24 / 165-36). The commit hooks are disabled in this worktree (`core.hooksPath=/dev/null`), and `.lintstagedrc` does not cover `.sql` anyway, so nothing reformatted the files during commit.
- zsh does not word-split an unquoted path variable. One four-file identity invocation passed the whole list as a single path, and `code-identity.mjs` failed on it. It was re-run with explicit arguments and its status read directly, and it exited 0.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Plans 165-25, 165-26 and 165-27 edit these files. Each must re-run `hygiene-changed-files.sh --files <file>` and re-record the read, because any edit voids the recorded blob.
- Plan 165-27 removes `is_generated`. All 6 tokens in 09 are intact, including the two header list entries and the two assertions.
- Per the wave-safety note, no `db:reset`, build or E2E was run. pgTAP ran only through the targeted invocation.

## Self-Check: PASSED

- The four test files, `hygiene-reads/165-04.tsv` and `deferred-items.md` exist on disk.
- Commits `68162ad05`, `bafa9f860` and `11b3716b8` are in `git log`.
- `git rev-list --count 8e103394b..HEAD` = 3 before this SUMMARY commit.
- `git status --short` lists only the maintainer's unstaged `MainContent.svelte` and the untracked `.planning/milestone.lock`, and neither was staged.
