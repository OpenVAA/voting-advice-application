---
phase: 165-review-stack-comment-remediation
plan: 17
subsystem: database
tags: [comment-hygiene, pgtap, entity-immutability, storage-authority, matrix-conformance]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments (hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs --blank-sql-literals) and the 165-04 / 165-13 method"
provides:
  - "19-entity-immutability, 20-storage-authority and 25-matrix-conformance pgTAP suites with reference-free comments and assertion descriptions"
  - "hygiene-reads/165-17.tsv read records for the three suites at their current blobs"
affects: [165-25, 165-26, 165-24, 165-36]

actuals:
  tokens: 17052
  tasks: 3
  commits: 3
plan_head_before: fa07fe069d67ffc9399a06074cca8108b2107082
plan_head_after: e1a398721a3a09d4f7947707ce82d5ef9d53fb12

tech-stack:
  added: []
  patterns:
    - "Rewrites go through the guarded scratchpad script sqlrw.py: `block` and `comment` items may touch only `--` comment lines, and `literal` items replace a unique single-line substring on a non-comment line"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-17.tsv
  modified:
    - apps/supabase/supabase/tests/database/19-entity-immutability.test.sql
    - apps/supabase/supabase/tests/database/20-storage-authority.test.sql
    - apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql

key-decisions:
  - "19's section 6 states why the two trigger rules cannot be separated by caller: grant_role_permissions gives entity.confirm and entity.edit_immutable to exactly the same four rows (global admin, account admin, project admin, project editor), checked against 301-auth-functions.sql. The 'the plan's prescribed case is unreachable' narrative is gone"
  - "19's trigger-population description now names the 20 BEFORE UPDATE row registrations it counts, read from pg_trigger on the applied database: on each entity table the entity-immutability, external-id immutability, updated_at and image-cleanup triggers, plus answer validation and answer-file cleanup on candidates and organizations. It no longer says '14 measured before 162-13'"
  - "20's in-comment test numbers were off by one from test 19 onward. The comments now match the assertion order: 13-19 anon exposure set, 20-23 private bucket and anon writes, 24-27 structural. Test 27 holds the global naming form and test 11 the pair form"
  - "Implementation-brief section references (`section 3.1`, `section 3.3`) became 'the role x permission matrix' or the concrete grant_role_permissions entry. The separability descriptions in 20 name the candidate role and the permission, for example '(candidate: project.edit_structure withheld)'"
  - "25's eight-assembly section keeps the constraint behind the direct helper calls (a composing SECURITY DEFINER helper one level deeper made entity reads several times slower) and the reason for a relative and an absolute half. The timing figures, the revert date and the 923-assertion anecdote are gone"
  - "No hygiene-allow/165-17.tsv was created. The gate reported zero hits on all three files after the rewrite"

patterns-established:
  - "Where the codemod had dropped a possessive apostrophe from a description ('this caller entity', 'the other project structure rows'), the rewrite restores it as a doubled quote (`caller''s`). This is a literal-only change and the blanked-literal identity proof covers it"

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
        ref: "git diff ship/v2.15-12-planning over the three files: every added non-comment line matches `^+    '.*'$`, the last text argument of a pgTAP call (0 exceptions); 19 -> 10, 20 -> 23, 25 -> 5"
        status: pass
    human_judgment: false
  - id: D3
    description: "No assertion added, removed or moved, and the targeted pgTAP run keeps the baseline total"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "yarn workspace @openvaa/supabase supabase test db 00-helpers + 19 + 20 + 25 (exit 0, Files=4, Tests=166, Result: PASS, identical to the baseline); every plan (N) unchanged; 25's pgTAP call-site count 88 at base and at HEAD"
        status: pass
    human_judgment: false
  - id: D4
    description: "The rewritten comments describe accurately what each assertion proves"
    verification: []
    human_judgment: true
    rationale: "Whether the prose matches the test semantics is a reading judgment. The instruments prove only that no code changed and no hygiene pattern remains"

duration: 9min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 17: Entity-Immutability, Storage-Authority and Matrix-Conformance Suite Hygiene Summary

**Plans 165-25 and 165-26 will later edit three pgTAP suites: 19-entity-immutability, 20-storage-authority and 25-matrix-conformance. These suites now say what each assertion proves. The following are gone:**
- plan ids, decision and review labels (`D-21`, `D-36`, `K2`, `Q4 = A`, `CR-02`)
- implementation-brief section numbers and roadmap criteria
- perturbation-control labels
- the ordinal-registry history
- measurement anecdotes

**38 assertion descriptions were rewritten. `code-identity.mjs --blank-sql-literals` proves no SQL character changed. 00-helpers plus the three suites still report `Files=4, Tests=166, Result: PASS`.**

## Performance

- **Duration:** about 9 min
- **Started:** 2026-09-27T21:08:39Z
- **Completed:** 2026-09-27T21:17:30Z
- **Tasks:** 3 of 3
- **Files modified:** 3 test files and 1 read record

## Baseline and final pgTAP totals

Command, run from the repo root: `yarn workspace @openvaa/supabase supabase test db supabase/tests/database/00-helpers.test.sql supabase/tests/database/19-entity-immutability.test.sql supabase/tests/database/20-storage-authority.test.sql supabase/tests/database/25-matrix-conformance.test.sql`

| Run | Exit | Line |
|---|---|---|
| Baseline, before any edit | 0 | `Files=4, Tests=166` / `Result: PASS` |
| After Task 3 (all three rewritten) | 0 | `Files=4, Tests=166` / `Result: PASS` |
| Task 1 subset (00-helpers + 19), after | 0 | `Files=2, Tests=79` / `Result: PASS` |
| Task 2 subset (00-helpers + 20), after | 0 | `Files=2, Tests=55` / `Result: PASS` |

The total reconciles with the plan counts: 9 from 00-helpers (`no_plan`), plus `plan (70)`, `plan (46)` and `plan (41)`, is 166. The subsets reconcile the same way (9 + 70 = 79, 9 + 46 = 55). Every `plan (N)` is unchanged from `ship/v2.15-12-planning`. In 25, whose recorded guard-perturbation reds are identified by assertion number, the pgTAP call-site count is 88 at base and at HEAD.

## Changed description literals per file

Counted from `git diff ship/v2.15-12-planning` over each file, as added lines that are not `--` comments. Every one matches `^+    '.*'$`, which is the last text argument of a pgTAP call. `code-identity.mjs` without `--blank-sql-literals` lists the same pairs.

| File | Literals | What was removed or corrected |
|---|---|---|
| `19-entity-immutability.test.sql` | 10 | `before 162-10`, `no longer a privilege error ... really did enter`, `the retired privilege bar made unexercisable`, `section 3.3`, `D-21:`, `the 14 measured before 162-13 ... 162.1-03` (now the named trigger population), `rather than left unwatched`, `the asymmetry 162-07 recorded and 162-10 and 162-13 closed`, `the privilege bar 162-13 retired`, `STILL` / `still` |
| `20-storage-authority.test.sql` | 23 | `the generalisation, which no policy ... has ever permitted`, `not because the type is hardcoded`, `converted`, `(D-21, Q4 = A) ... ratified names ... retired name`, `the tightening, which no earlier policy made`, `D-21 structural`, `D-11b and D-21`, `legacy` / `retired` predicate wording (now `can_access_project, has_role`), `(3.3 Candidate / ... = own/granted/withheld)` x5, `K2 structural`. Nine possessive apostrophes are restored |
| `25-matrix-conformance.test.sql` | 5 | `quietly stopped` / `quietly started` and `ratified` in the two census descriptions, `162-REVIEW CR-02` x2, `since CR-02` |
| **Total** | **38** | |

## Gate and identity outputs (status read directly, never through a pipe)

| Command | Exit | Output |
|---|---|---|
| `hygiene-changed-files.sh --files <the three files>`, at base | 1 | `total failing items: 62 (layer1=17 layer2=38 layer3=7)` |
| `hygiene-changed-files.sh --check-reads --files <the three files>`, at HEAD | 0 | `total failing items: 0 (layer1=0 ... layer5=0 unread=0)`, `VERDICT: CLEAN` |
| `code-identity.mjs --blank-sql-literals ship/v2.15-12-planning WORKTREE <the three files>` | 0 | `3 compared, 0 changed code (SQL literals blanked)` |
| `bash scripts/tip-proofs.sh` | 0 | all proofs pass |
| `bash scripts/ledger-check.sh` | 0 | this plan owns no review comment (`review_comments_owned: []`) |
| `node_modules/.bin/prettier --check` on each of the three files | 0 | `All matched files use Prettier code style!` |

## Accomplishments

- **19-entity-immutability:**
  - The header states the three-cell grid, the fixture polarity and the locally built faction and alliance grantees.
  - The ordinal-registry paragraph, the `section 8.7(c)` option, the SUMMARY bookkeeping and the `set_test_user` fourth-parameter note are gone.
  - The collapsed Depends-on line is a list again.
  - Section 6 explains, from the matrix, why no caller separates the two rules.
  - The role-scope and `throws_unlike` comments state their constraints without the measurement anecdotes.
- **20-storage-authority:**
  - The header states what the file asserts and why every table half is a real operation. The roadmap criterion and the plan's verify-gate note are gone.
  - The collapsed Depends-on line is a list again.
  - The conversion, tracer and tightening history is gone from tests 5, 6, 7, 11, 12, 15, 16 and 27.
  - The in-comment test numbers match the assertion order.
  - The separability header names the entity-editor roles and the `storage_path_can` mapping instead of brief sections and `Q2 (A)`.
- **25-matrix-conformance:**
  - The header states what no sibling suite asserts (12-user-can.test.sql and the per-table suites) and why the grid runs closed.
  - The unenforced list states why no policy reads each member. Its `000-enums.sql:28` line citation became a content anchor.
  - The `first fourteen` claim was inaccurate, because the fourteen delegated members are not the first fourteen ops rows. It now reads `Fourteen of these`.
  - The eight-assembly section states the direct-call constraint and the relative-plus-absolute rationale.

## Task Commits

1. **Task 1 (tracer): baseline, then 19-entity-immutability**: `48caa88b7` (docs). Tracer gate: identity 0, gate 0, pgTAP 79 (equal to the baseline arithmetic), then expanded.
2. **Task 2: 20-storage-authority**: `3eafc5b89` (docs)
3. **Task 3: 25-matrix-conformance, then the three-file run against the baseline**: `e1a398721` (docs)

Every commit carries the `Hygiene: D-04` trailer and stages explicit paths only.

## Files Created/Modified

- `apps/supabase/supabase/tests/database/19-entity-immutability.test.sql`: comments and 10 descriptions, 43,305 to 41,235 bytes, blob `b7ec2e2e`.
- `apps/supabase/supabase/tests/database/20-storage-authority.test.sql`: comments and 23 descriptions, 44,604 to 42,848 bytes, blob `8774dccd`.
- `apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql`: comments and 5 descriptions, 36,040 to 33,454 bytes, blob `3cf3bbf3`.
- `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-17.tsv`: three rows, one per file at the blobs above.

## Allowlist rows

None. The gate reported zero hits on all three files after the rewrite, so `hygiene-allow/165-17.tsv` was not created.

## Decisions Made

See `key-decisions` in the frontmatter. Each restated fact was checked against the tip first:
- the permission matrix rows in `301-auth-functions.sql`;
- the trigger body and role guard of `enforce_entity_immutability` in `011-validation-functions.sql`;
- the storage verb mapping in `400-storage.sql`;
- the 15 storage policies (12 write) and the three `nominations` INSERT policies in `pg_policies`;
- the 20 entity-table BEFORE UPDATE row triggers in `pg_trigger`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Comments that the tip contradicts, and reflow damage**
- **Found during:** Tasks 1-3, while checking each rewritten comment against the file and the schema
- **Issue:**
  - 20's in-comment test numbers were off by one from test 19 onward (`19-22`, `22.`, `23-26`, `23.` to `26.`).
  - 20's exposure-set comment said "one positive and five negatives" over a range that holds two positives (13 and 16).
  - 25's ops comment said "the first fourteen" of the ops rows are the delegated members. They are fourteen scattered rows.
  - Two Depends-on lines had been collapsed onto one line by the earlier codemod.
  - Nine description literals in 20 had lost their possessive apostrophe.
- **Fix:** The comments now state the tip facts, and the lists and possessives are restored. Every change is comment- or description-only (identity exits 0).
- **Commits:** `48caa88b7`, `3eafc5b89`, `e1a398721`

**Total deviations:** 1 auto-fixed (comment accuracy and reflow). **Impact:** none on scope. Every change stayed inside comments and descriptions.

## Issues Encountered

None. Per the wave-safety note, no `db:reset`, build or E2E was run, and pgTAP ran only through the targeted invocation.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Plans 165-25 and 165-26 edit these files: the typed `user_can` call in 19, typed storage authority in 20, and the four-argument `user_can` regexes in 25. Any edit voids the recorded blob, so each of those plans must re-run `hygiene-changed-files.sh --files <file>` and re-record the read.
- 25's temp-table names (`m17_*`, including `m17_unenforced_ratified`) and fixture e-mails (`m17_*@test.com`) are code, so this plan left them unchanged. The hygiene gate does not flag them.

## Self-Check: PASSED

- The three test files and `hygiene-reads/165-17.tsv` exist on disk.
- Commits `48caa88b7`, `3eafc5b89` and `e1a398721` are in `git log`.
- `git rev-list --count fa07fe069..HEAD` = 3 before this SUMMARY commit.
- `git status --short` lists only the maintainer's unstaged `MainContent.svelte` and the untracked `.planning/milestone.lock`. Neither was staged.
