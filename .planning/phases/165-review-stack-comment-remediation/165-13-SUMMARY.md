---
phase: 165-review-stack-comment-remediation
plan: 13
subsystem: database
tags: [comment-hygiene, pgtap, rls, user-can, schema-absence]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments (hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs --blank-sql-literals) and the 165-04 / 165-09 method"
provides:
  - "10-schema-migrations, 17-project-structure-authority and 22-content-policies pgTAP suites with reference-free comments and assertion descriptions"
  - "hygiene-reads/165-13.tsv read records for the three suites at their current blobs"
affects: [165-25, 165-26, 165-28, 165-24, 165-36]

actuals:
  tokens: 15447
  tasks: 3
  commits: 3
plan_head_before: 101fcc7f4c4634f9bf4ce23b1b1972db4327e0f5
plan_head_after: 0a16b0630c1edeb66ae118ca3d096bebefbb3ef9

tech-stack:
  added: []
  patterns:
    - "Rewrites go through the guarded scratchpad script sqlrw.py: `block` items replace an anchor-to-anchor run of lines only if every old and new line is a `--` comment, `comment` items replace a substring only inside a comment line, and `literal` items replace a unique substring only on a non-comment line and never across lines"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-13.tsv
  modified:
    - apps/supabase/supabase/tests/database/10-schema-migrations.test.sql
    - apps/supabase/supabase/tests/database/17-project-structure-authority.test.sql
    - apps/supabase/supabase/tests/database/22-content-policies.test.sql

key-decisions:
  - "22-content-policies' feedback INSERT section states the policy fact only: both INSERT policies are `WITH CHECK (true)` because anonymous voters submit feedback and no permission models a submission, bounded by the table's CHECK and rate-limit trigger. Per the plan, it does not claim that a trigger enforces the project requirement, because plan 165-28 has not landed"
  - "The retired-vocabulary absence descriptions in 10-schema-migrations keep the claim and one clause of why the absence matters (for example 'user_role_type does not exist (a role type here would be a second authority vocabulary beside the grant map)'). The re-expression history, the `K1` label and the '76 policy call sites once' figure are gone"
  - "Brief-section references (`section 3.2`, `section 3.3`, `section 11.1`) count as planning-document section numbers. They became 'the role x permission matrix (grant_role_permissions)', 'two different permissions' and 'the settings split'"
  - "No hygiene-allow/165-13.tsv was created: the gate reported zero hits on all three files after the rewrite, so there was no false positive to allowlist"

patterns-established:
  - "Where a comment justified the test by a measurement anecdote ('observed RED against a planted always-true predicate'), it now states the property the anecdote proved, for example 'a DELETE there could pass on an empty table, because under a wide-open predicate the preceding deny assertion would already have removed the row'"

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
        ref: "code-identity.mjs ship/v2.15-12-planning WORKTREE <file> without the flag: 17 -> 7 literals, 22 -> 8, 10 -> 12, each the last text argument of a pgTAP call"
        status: pass
    human_judgment: false
  - id: D3
    description: "The targeted pgTAP run keeps the baseline assertion total"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "yarn workspace @openvaa/supabase supabase test db 00-helpers + 10 + 17 + 22 (exit 0, Files=4, Tests=254, Result: PASS, identical to the baseline)"
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

# Phase 165 Plan 13: Schema-Migration, Project-Structure Authority and Content-Policy Suite Hygiene Summary

**The three pgTAP suites that later schema plans edit (10-schema-migrations, 17-project-structure-authority and 22-content-policies) now say what each assertion proves. The plan ids, criterion labels, ratification dates, brief section numbers and retired-vocabulary history are gone. 27 assertion descriptions were rewritten. `code-identity.mjs --blank-sql-literals` proves no SQL character changed, and 00-helpers plus the three suites still report `Files=4, Tests=254, Result: PASS`.**

## Performance

- **Duration:** about 8 min
- **Started:** 2026-09-27T20:11:50Z
- **Completed:** 2026-09-27T20:19:07Z
- **Tasks:** 3 of 3
- **Files modified:** 3 test files and 1 read record

## Baseline and final pgTAP totals

Command, run from the repo root: `yarn workspace @openvaa/supabase supabase test db supabase/tests/database/00-helpers.test.sql supabase/tests/database/10-schema-migrations.test.sql supabase/tests/database/17-project-structure-authority.test.sql supabase/tests/database/22-content-policies.test.sql`

| Run | Exit | Line |
|---|---|---|
| Baseline, before any edit | 0 | `Files=4, Tests=254` / `Result: PASS` |
| After Task 3 (all three rewritten) | 0 | `Files=4, Tests=254` / `Result: PASS` |
| Task 1 subset (00-helpers + 17), before and after | 0 | `Files=2, Tests=96` / `Result: PASS` |
| Task 2 subset (00-helpers + 22), before and after | 0 | `Files=2, Tests=77` / `Result: PASS` |
| 00-helpers + 10, before | 0 | `Files=2, Tests=99` / `Result: PASS` |

The total reconciles with the plan counts: 9 from 00-helpers (`no_plan`) + `plan (90)` + `plan (87)` + `plan (68)` = 254. Every `plan (N)` is unchanged from `ship/v2.15-12-planning`.

## Changed description literals per file

Counted from `code-identity.mjs ship/v2.15-12-planning WORKTREE <file>` without `--blank-sql-literals`. That run prints each changed literal line as a `-`/`+` pair, and every one is the last text argument of a pgTAP call.

| File | Literals | What was removed |
|---|---|---|
| `17-project-structure-authority.test.sql` | 7 | the `WIDENING, gaining side:` / `NARROWING, gaining side:` / `NARROWING, losing side:` / `THIRD POPULATION CHANGE:` prefixes, `where only the root admin could`, `the widening is scoped to its own`, `may now read`, `deletion moved to the account tier`, and `the criterion-2 exemption this table was to receive is WITHDRAWN` |
| `22-content-policies.test.sql` | 8 | `-- section 11.1` x2, `-- criterion 5''s second clause` x3, `still` / `the retired per-row column`, the `D-15 / K3:` prefix, and `converted policies` |
| `10-schema-migrations.test.sql` | 12 | `162-15 retired the role vocabulary`, `strengthened from ... the pre-162-15 assertion`, `K1 opened a shim window over`, `the shim 76 policy call sites once delegated to`, `the pre-rename name`, `the widened ... branch`, `after the widening`, `existing` / `the retired role table`, `before the constraint ... inserted cleanly`, `it was the only one of the thirteen references`, and the role-vocabulary tail on the entity_type description |
| **Total** | **27** | |

## Gate and identity outputs (status read directly, never through a pipe)

| Command | Exit | Output |
|---|---|---|
| `hygiene-changed-files.sh --files`, at base | 1 | 17: 8 items, 10: 5 items (22 was not run at base; its planning references were read in full and removed) |
| `hygiene-changed-files.sh --check-reads --files <the three files>`, at HEAD | 0 | `total failing items: 0 (layer1=0 ... layer5=0 unread=0)`, `VERDICT: CLEAN` |
| `code-identity.mjs --blank-sql-literals ship/v2.15-12-planning WORKTREE <the three files>` | 0 | `3 compared, 0 changed code (SQL literals blanked)` |
| `bash scripts/tip-proofs.sh` | 0 | all proofs pass (its `hasnt_function ... merge_custom_data` proof on file 10 still holds) |
| `bash scripts/ledger-check.sh` | 0 | this plan owns no review comment (`review_comments_owned: []`) |
| `node_modules/.bin/prettier --check` on each of the three files | 0 | `All matched files use Prettier code style!` |

## Accomplishments

- **17-project-structure-authority:**
  - The header states what the seven-table grid asserts and why every allow is paired with a refused caller.
  - The three-caller list that the codemod collapsed into one line is a `-- - item` list again.
  - Section 7 says why comparing the two qual strings is not enough.
  - Sections 19 and 20 state the account-tier update and delete rules as they stand; the ratification history and the "third population change" story are gone.
  - The section-23 non-vacuity comment states the control (a non-empty scanned population) without its re-expression history or the hand-off note.
- **22-content-policies:**
  - The header states which nineteen policies the file covers, why the settings split needs its own identity, and why the feedback pair is separated only structurally.
  - The feedback INSERT section (section 11) states that anon and authenticated callers may insert unconditionally at the policy level (`WITH CHECK (true)`) because anonymous voters submit feedback.
  - The `admin_jobs` section states the `project.edit_questions` mapping and its disclosure reason without the checkpoint ruling.
- **10-schema-migrations:**
  - The header's collapsed list is a list again.
  - Two collapsed setup comments are split back into sentences: rate limiting, and the merge-test fixture.
  - The absence block (`role_scope_type`, `user_roles`, `has_role`, `can_access_project`) says what the catalogue reads guarantee, without the "re-expressed as inverses" history.

## Task Commits

1. **Task 1 (tracer): baseline, then 17-project-structure-authority**: `92ba49136` (docs). Tracer gate: identity 0, gate 0, pgTAP 96/96 equal to the sub-baseline, then expanded.
2. **Task 2: 22-content-policies**: `ca2719011` (docs)
3. **Task 3: 10-schema-migrations, then the three-file run against the baseline**: `0a16b0630` (docs)

Every commit carries the `Hygiene: D-04` trailer and stages explicit paths only.

## Files Created/Modified

- `apps/supabase/supabase/tests/database/17-project-structure-authority.test.sql`: comments and 7 descriptions, 53,028 to 50,859 bytes, blob `ad4de830`.
- `apps/supabase/supabase/tests/database/22-content-policies.test.sql`: comments and 8 descriptions, 47,253 to 43,733 bytes, blob `4b839925`.
- `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql`: comments and 12 descriptions, 35,822 to 34,095 bytes, blob `660d9eed`.
- `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-13.tsv`: three rows, one per file at the blobs above.

## Allowlist rows

None. The gate reported zero hits on all three files after the rewrite, so `hygiene-allow/165-13.tsv` was not created.

## Decisions Made

See `key-decisions` in the frontmatter. Each restated comment was checked against the tip schema first:
- `feedback.project_id ... ON DELETE SET NULL`, the rating-or-description CHECK and the `check_feedback_rate_limit` trigger in `107-feedback.sql`;
- the feedback policies and their orphan disjunct in `302-rls.sql`;
- `feedback.read` / `feedback.manage` holders in `grant_role_permissions` (`301-auth-functions.sql`);
- `user_has_account_grant`'s account-or-project reach;
- `grants.scope grant_scope_type` in `300-auth-tables.sql`;
- `nominations_election_round_check` in `104-nominations.sql`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Comments that stated facts the tip contradicts, and reflow damage**
- **Found during:** Tasks 1-3, while checking each rewritten comment against the file and the schema
- **Issue:**
  - 22's header justified creating the project-editor identity locally with a `14-grants-migration` reverse-completeness argument that depends on `user_role_type`. File 10 asserts that `user_role_type` does not exist.
  - 22's section 0 said the orphan's reachability is asserted in section 5. It is asserted in section 12.
  - 22's section 12 called the SELECT and DELETE policies "both surviving policies".
  - 10's entity_type description cited a role vocabulary that the file asserts is absent.
  - Three comment blocks had been collapsed onto single lines by the earlier codemod: 17's caller list, 10's header list and 10's rate-limit and merge-setup comments.
- **Fix:** The rewritten comments state the tip facts, and the collapsed lists and sentences are restored. All changes are comment-only (identity 0).
- **Commits:** `92ba49136`, `ca2719011`, `0a16b0630`

**Total deviations:** 1 auto-fixed (comment accuracy and reflow). **Impact:** none on scope. Every change stayed inside comments and descriptions.

## Issues Encountered

None. Per the wave-safety note, no `db:reset`, build or E2E was run. pgTAP ran only through the targeted invocation.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Plans 165-25 and 165-26 edit these files (typed `entity_project_id`, the four-argument `user_can` in 22's map, typed RPC signatures in 10). Each must re-run `hygiene-changed-files.sh --files <file>` and re-record the read, because any edit voids the recorded blob.
- When plan 165-28 lands the feedback project trigger, 22's section 11 comment may add that the project requirement is enforced by that trigger.

## Self-Check: PASSED

- The three test files and `hygiene-reads/165-13.tsv` exist on disk.
- Commits `92ba49136`, `ca2719011` and `0a16b0630` are in `git log`.
- `git rev-list --count 101fcc7f4..HEAD` = 3 before this SUMMARY commit.
- `git status --short` lists only the maintainer's unstaged `MainContent.svelte` and the untracked `.planning/milestone.lock`. Neither was staged.
