---
phase: 165-review-stack-comment-remediation
plan: 09
subsystem: database
tags: [comment-hygiene, pgtap, rls, user-can, storage-parity]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments (hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs --blank-sql-literals) and the 165-04 method"
provides:
  - "12-user-can, 18-entity-policies and 28-storage-table-parity pgTAP suites with reference-free comments and assertion descriptions"
  - "hygiene-reads/165-09.tsv read records for the three suites at their current blobs"
affects: [165-25, 165-24, 165-36]

actuals:
  tokens: 14363
  tasks: 3
  commits: 3
plan_head_before: fbfa74e646c22dd00581f1f7c5372fecb878b734
plan_head_after: 8a6ad366d073beab5026a68be162f8b416f7eb8d

tech-stack:
  added: []
  patterns:
    - "Rewrites go through a guarded script: `block` items replace an anchor-to-anchor run of lines only if every old and new line is a `--` comment, `comment` items replace a substring only inside a comment line, and `literal` items replace a unique substring only on a non-comment line and never across lines"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-09.tsv
  modified:
    - apps/supabase/supabase/tests/database/12-user-can.test.sql
    - apps/supabase/supabase/tests/database/18-entity-policies.test.sql
    - apps/supabase/supabase/tests/database/28-storage-table-parity.test.sql

key-decisions:
  - "References to the implementation brief's section numbers (3.1, 3.3, 3.4) count as planning-document section numbers even where the gate did not flag them; they became 'the role x permission matrix' (grant_role_permissions) or 'the eight grant-bearing user types'"
  - "The section headers of 18-entity-policies sections 8-11 carried wrong assertion ranges at the tip (37-38, 39-43, 44-51, 58); they now carry the ranges counted from the file (41-42, 43-47, 48-58, 59)"
  - "SQL data literals that carry planning-era tokens (`m17_*` identifiers, `m17s_*@test.com` emails, `tracer-*` subtype values, `project_admin_tracer@test.com`) are code, not descriptions, and stay"
  - "No hygiene-allow/165-09.tsv was created: the gate reported zero hits on all three files after the rewrite, so there was no false positive to allowlist"

patterns-established:
  - "A description that justified itself by its history ('no longer share', 'a policy dropped rather than converted', 'still four -- V-6(A) re-expressed them') now states the present property ('do not share', 'a dropped policy', 'exactly four anon policies')"

requirements-completed: [165-SC3]

coverage:
  - id: D1
    description: "The three pgTAP files pass the per-changed-file hygiene gate, comments and descriptions alike, with current read records"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-changed-files.sh --check-reads --files <the three files> (exit 0, total failing items: 0, unread=0, VERDICT: CLEAN)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Only comments and single-quoted literals changed, and every changed literal is an assertion description"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "node .planning/phases/165-review-stack-comment-remediation/scripts/code-identity.mjs --blank-sql-literals ship/v2.15-12-planning WORKTREE <the three files> (exit 0, 3 compared, 0 changed code)"
        status: pass
      - kind: other
        ref: "code-identity.mjs ship/v2.15-12-planning WORKTREE <file> without the flag: 28 -> 7 literals, 12 -> 3, 18 -> 14, each the last text argument of a pgTAP call"
        status: pass
    human_judgment: false
  - id: D3
    description: "The targeted pgTAP run keeps the baseline assertion total"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "yarn workspace @openvaa/supabase supabase test db 00-helpers + 12 + 18 + 28 (exit 0, Files=4, Tests=134, Result: PASS, identical to the baseline)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The rewritten comments describe accurately what each assertion proves"
    verification: []
    human_judgment: true
    rationale: "Accuracy of prose against test semantics is a reading judgment; the instruments prove only that no code changed and no hygiene pattern remains"

duration: 9min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 09: user_can, Entity-Policy and Storage-Parity Suite Hygiene Summary

**The three authorization suites plan 165-25 later extends (12-user-can, 18-entity-policies, 28-storage-table-parity) now say what each assertion proves. The decision labels, brief section numbers, plan ids, timing figures and the history of removed helpers are gone. 24 assertion descriptions were rewritten, `code-identity.mjs --blank-sql-literals` proves no SQL character changed, and 00-helpers plus the three suites still report `Files=4, Tests=134, Result: PASS`.**

## Performance

- **Duration:** about 9 min
- **Started:** 2026-09-27T19:14:49Z
- **Completed:** 2026-09-27T19:23:30Z
- **Tasks:** 3 of 3
- **Files modified:** 3 test files and 1 read record

## Baseline and final pgTAP totals

Command, run from the repo root: `yarn workspace @openvaa/supabase supabase test db supabase/tests/database/00-helpers.test.sql supabase/tests/database/12-user-can.test.sql supabase/tests/database/18-entity-policies.test.sql supabase/tests/database/28-storage-table-parity.test.sql`

| Run | Exit | Line |
|---|---|---|
| Baseline, before any edit | 0 | `Files=4, Tests=134` / `Result: PASS` |
| After Task 3 (all three rewritten) | 0 | `Files=4, Tests=134` / `Result: PASS` |
| Task 1 subset (00-helpers + 28), before and after | 0 | `Files=2, Tests=30` / `Result: PASS` |
| Task 2 subset (00-helpers + 12), before and after | 0 | `Files=2, Tests=54` / `Result: PASS` |
| 00-helpers + 18, before | 0 | `Files=2, Tests=68` / `Result: PASS` |

The total reconciles with the plan counts: 9 from 00-helpers (`no_plan`) + `plan (45)` + `plan (59)` + `plan (21)` = 134. Every `plan (N)` is unchanged from `ship/v2.15-12-planning`.

## Changed description literals per file

Counted from `code-identity.mjs ship/v2.15-12-planning WORKTREE <file>` without `--blank-sql-literals`, which prints each changed literal line as a `-`/`+` pair. Every one is the last text argument of a pgTAP call.

| File | Literals | What was removed |
|---|---|---|
| `28-storage-table-parity.test.sql` | 7 | the `ROADMAP criterion 6, 162-SPEC.md ... 162-14` tail, `D-27''s named exception`, `criterion 6 forbids`, and the `3.3` section prefix in the four SEPARABILITY descriptions |
| `12-user-can.test.sql` | 3 | `no longer` in the SELECT/UPDATE predicate description, and the `Q2(D)` label on the two child-nominee descriptions |
| `18-entity-policies.test.sql` | 14 | `P-3(a)` x2, `new write path`, `admin_* is now a misnomer`, `D-09''s split`, `rather than converted`, `converted` / `two shims` / `retired`, `V-6(A)`, `D-21` / `D-36` x2, and the `D-21 structural,` prefix on five family descriptions |
| **Total** | **24** | |

## Gate and identity outputs (status read directly, never through a pipe)

| Command | Exit | Output |
|---|---|---|
| `hygiene-changed-files.sh --files`, at base | 1 | 28: 15 items, 12: 8 items, 18: 54 items |
| `hygiene-changed-files.sh --check-reads --files <the three files>`, at HEAD | 0 | `total failing items: 0 (layer1=0 ... layer5=0 unread=0)`, `VERDICT: CLEAN` |
| `code-identity.mjs --blank-sql-literals ship/v2.15-12-planning WORKTREE <the three files>` | 0 | `3 compared, 0 changed code (SQL literals blanked)` |
| `bash scripts/tip-proofs.sh` | 0 | all proofs pass |
| `bash scripts/ledger-check.sh` | 0 | this plan owns no review comment (`review_comments_owned: []`) |
| `yarn prettier --check` on each of the three files | 0 | `All matched files use Prettier code style!` |

## Accomplishments

- **28-storage-table-parity:** the header states the three things the file asserts: the two-mechanism partition, storage/table agreement per identity, verb and entity type, and read/write separability. It also says why the anonymous public read cannot route through `user_can`, why reach is a closure over `pg_proc.prosrc` (no storage policy names `user_can` directly), why neither half of a pair is a predicate call, and why the grid runs on a closed project. The ticked-wording narrative, the reference to a control S3 that does not exist in the file, and the `162-REVIEW CR-02` history of the un-nominated fixture are gone.
- **12-user-can:** the header lists the `user_can` properties the file asserts: the matrix vectors, reach per scope, the project-read and child-nominee branches, union, and deny on no grants, the wrong tenant, the wrong permission and malformed claims. The "observed RED against a deliberately over-permissive user_can" anecdote, the fixture history of the duplicate faction nomination, the `162-06` claim note and the checkpoint-decision provenance of section 11 are gone. The `nominations_entity_parent_contest_key` constraint remains, stated as the reason the chain reuses the shared faction row.
- **18-entity-policies:** section 6b now explains the mechanism (an `UPDATE ... WHERE` also consults the SELECT policies), where it used to narrate how a negative control caught it. The `entity_is_anon_visible` absence check is stated as a constraint, and the timing figures and re-pointing history are gone. The SELECT-family normaliser comment says why the terms-of-use conjuncts are stripped and points to `25-matrix-conformance.test.sql`, the guard that holds the eight assemblies identical.

## Task Commits

1. **Task 1 (tracer): baseline, then 28-storage-table-parity**: `4190a5a72` (docs). Tracer gate: identity 0, gate 0, pgTAP 30/30 equal to the sub-baseline, then expanded.
2. **Task 2: 12-user-can**: `724b86fa6` (docs)
3. **Task 3: 18-entity-policies, then the three-file run against the baseline**: `8a6ad366d` (docs)

Every commit carries the `Hygiene: D-04` trailer and stages explicit paths only.

## Files Created/Modified

- `apps/supabase/supabase/tests/database/28-storage-table-parity.test.sql`: comments and 7 descriptions, 25,908 to 23,946 bytes, blob `c64044e9`.
- `apps/supabase/supabase/tests/database/12-user-can.test.sql`: comments and 3 descriptions, 33,865 to 32,495 bytes, blob `2a1a41db`.
- `apps/supabase/supabase/tests/database/18-entity-policies.test.sql`: comments and 14 descriptions, 53,229 to 49,174 bytes, blob `8174012e`.
- `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-09.tsv`: three rows, one per file at the blobs above.

## Allowlist rows

None. The gate reported zero hits on all three files after the rewrite, so `hygiene-allow/165-09.tsv` was not created.

## Decisions Made

See `key-decisions` in the frontmatter. Each restated comment was checked against the tip schema first:
- the candidates SELECT and admin UPDATE quals in `302-rls.sql` (`project.edit_entities`);
- `user_can`'s two named branches and `grant_role_permissions` in `301-auth-functions.sql`;
- the fourteen/one storage split in `400-storage.sql`;
- the fixture's `candidate_b` AllianceEditor grant;
- the existence of `16-anon-visibility`, `25-matrix-conformance` and `01-tenant-isolation`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Comments that stated facts the tip contradicts**
- **Found during:** Tasks 1-3, while checking each rewritten comment against the file and the schema
- **Issue:**
  - 18's section headers for sections 8-11 carried assertion ranges that overlap the sections before them (`37-38`, `39-43`, `44-51`, `58`); the counted ranges are 41-42, 43-47, 48-58 and 59.
  - 18's project-editor fixture comment said section 6 asserts the edit_entities / edit_project_settings pair, but section 8 does.
  - 12's header said two extra nominations are created, but the file inserts one. The faction link is the shared fixture's row.
  - 28's header cited a "Control S3" that the file does not contain.
- **Fix:** the rewritten comments state the tip facts. All changes are comment-only (identity 0).
- **Commits:** `4190a5a72`, `724b86fa6`, `8a6ad366d`

**Total deviations:** 1 auto-fixed (comment accuracy). **Impact:** none on scope. Every change stayed inside comments and descriptions.

## Issues Encountered

None. Per the wave-safety note, no `db:reset`, build or E2E was run. pgTAP ran only through the targeted invocation.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Plan 165-25 edits these files for type-aware entity reach. It must re-run `hygiene-changed-files.sh --files <file>` and re-record the read, because any edit voids the recorded blob. Its entity-type collision control belongs in a new file, and nothing in 12-user-can anticipates it.

## Self-Check: PASSED

- The three test files and `hygiene-reads/165-09.tsv` exist on disk.
- Commits `4190a5a72`, `724b86fa6` and `8a6ad366d` are in `git log`.
- `git rev-list --count fbfa74e64..HEAD` = 3 before this SUMMARY commit.
- `git status --short` lists only the maintainer's unstaged `MainContent.svelte` and the untracked `.planning/milestone.lock`, and neither was staged.
