---
phase: 166-retire-auth-user-id-entity-identity-from-grants
plan: 03
subsystem: database
tags: [postgres, supabase, pgtap, schema, migration, dev-seed, supabase-types, comment-hygiene]

requires:
  - phase: 166-01
    provides: get_candidate_user_data reading identity from grants; the anon census held as TODO (NC-4 red recorded)
  - phase: 166-02
    provides: no Edge Function or tests/ file reads or writes the link column
provides:
  - candidates and organizations without the auth link column; idx_candidates_auth_user_id and idx_organizations_auth_user_id gone
  - the regenerated single migration and regenerated database.ts (6 lines fewer), column-map.ts and permittedKeys.ts without the column
  - seed.sql linking the Test Candidate to its user by the editor grant alone
  - the 36-entity-identity census and 42703 check passing un-wrapped (NC-4 closed green)
  - 21-entity-organization Section 8 seeding candidate_a's grant rows explicitly through test_seed_identity_grants
  - 05/20 policy guards without the clauses naming the dropped column; 09 at plan (32)
  - every schema comment, fixture banner and test description in the 21 touched files written in the present tense, with no planning references
affects: [166-04, phase 169 pgTAP gate (re-runs the census), .claude/skills/database docs (166-04)]

actuals:
  tokens: 5200
  tasks: 3
  commits: 6
plan_head_before: 12e8f01b0b2c13485f88c4fe9c9c4fcbdfa32be9
plan_head_after: 3560e77be33eb0c4bb54b14d75d0ca77dd498399

tech-stack:
  added: []
  patterns:
    - "A pgTAP file that calls a function reading public.grants seeds that identity's rows itself through test_seed_identity_grants; create_test_data() writes no grant rows"
    - "Schema drop order: prettier -> schema:regenerate -> db:reset -> db:types -> test:db, all in the one commit with the drop"

key-files:
  created:
    - .planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-03-SUMMARY.md
    - .planning/phases/166-retire-auth-user-id-entity-identity-from-grants/deferred-items.md
  modified:
    - apps/supabase/supabase/schema/102-entities.sql
    - apps/supabase/supabase/schema/200-indexes.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/schema/303-column-grants.sql
    - apps/supabase/supabase/schema/502-email-helpers.sql
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/seed.sql
    - apps/supabase/supabase/tests/database/00-helpers.test.sql
    - apps/supabase/supabase/tests/database/02-candidate-self-edit.test.sql
    - apps/supabase/supabase/tests/database/03-anon-read.test.sql
    - apps/supabase/supabase/tests/database/05-organization-admin.test.sql
    - apps/supabase/supabase/tests/database/09-column-restrictions.test.sql
    - apps/supabase/supabase/tests/database/14-grants-migration.test.sql
    - apps/supabase/supabase/tests/database/20-storage-authority.test.sql
    - apps/supabase/supabase/tests/database/21-entity-organization.test.sql
    - apps/supabase/supabase/tests/database/36-entity-identity.test.sql
    - packages/supabase-types/src/database.ts
    - packages/supabase-types/src/column-map.ts
    - packages/dev-seed/src/template/permittedKeys.ts
    - packages/dev-seed/src/generators/OrganizationsGenerator.ts
    - packages/dev-seed/tests/generators/OrganizationsGenerator.test.ts
    - packages/dev-seed/src/templates/e2e/base.ts
    - .planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-NEGATIVE-CONTROLS.md
    - .planning/WINDOWS.md

key-decisions:
  - "21-entity-organization Section 8 replaces its redundant set_test_user/reset_role pair with SELECT test_seed_identity_grants ('candidate_a') rather than adding the call beside it; the rows the RPC reads are seeded explicitly in the file that calls it, and the declared count (21) is unchanged"
  - "permittedKeys.ts's FIELD_MAP note now uses first_name -> firstName as its example of a non-identity camel form"
  - "502's service-role rationale names nominations.created_by, the single census exemption, as the public column a user id is readable from"
  - "14-grants-migration's sections are renumbered 1-9 with their real TAP numbers (1-21); the history-only 'Section 8' block and the stale has_role paragraph are deleted"
  - "Task 3 did not hand off: context use stayed well below the 60% trigger after every file, so 166-03-CONTINUATION.md was never created"

patterns-established:
  - "The census exemption list is exactly public.nominations.created_by and is never widened to make the census pass"

requirements-completed: [AUTHID-05, AUTHID-06, AUTHID-07]

coverage:
  - id: D1
    description: "The link column and both its indexes are gone from candidates and organizations; the migration is regenerated and still single; database.ts, column-map.ts and both permittedKeys.ts entries match, held at compile time in both directions"
    requirement: AUTHID-05
    verification:
      - kind: integration
        ref: "yarn db:reset && yarn workspace @openvaa/supabase test:db (Files=36, Tests=1335, Result: PASS)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/supabase-types typecheck && yarn workspace @openvaa/dev-seed typecheck (exit 0 / exit 0)"
        status: pass
      - kind: other
        ref: "yarn lint:check exit 0 (assert:schema-migration-parity: 1 .sql file, generated copy current)"
        status: pass
      - kind: other
        ref: "test \"$(git grep -l auth_user_id -- apps packages tests)\" = apps/supabase/supabase/tests/database/36-entity-identity.test.sql (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A freshly reset post-drop stack still logs a candidate in end to end: seed.sql links the Test Candidate by the editor grant alone"
    requirement: AUTHID-05
    verification:
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-03-tracer --project candidate-a11y-scan (exit 0; expected 17, skipped 0, unexpected 0, flaky 0; preflight 0 failures / 1 success)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The anon census passes un-wrapped (exactly public.nominations.created_by) and anon selecting the link column from candidates raises 42703; NC-4 closed green after its 166-01 red"
    requirement: AUTHID-06
    verification:
      - kind: integration
        ref: "36-entity-identity.test.sql tests 1-2 'ok', no # TODO marker (npx supabase test db 00-helpers + 36 --debug, exit 0); 166-NEGATIVE-CONTROLS.md NC-4 GREEN"
        status: pass
    human_judgment: false
  - id: D4
    description: "Vacuous guards removed: 09 drops the two assertions on the dropped column (plan 32); 05 and 20 drop only the clauses naming it and keep their counts (22, 46) and the uid() identity-comparison guard (28 before and after)"
    requirement: AUTHID-05
    verification:
      - kind: integration
        ref: "test:db: 05-organization-admin ok, 09-column-restrictions ok, 20-storage-authority ok"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every file this plan touches passes the scoped hygiene scan as a whole, plus lint:check (assert:comment-hygiene) and format:check; no comment narrates the column's removal"
    requirement: AUTHID-07
    verification:
      - kind: other
        ref: "bash 166-hygiene-scan.sh <21 touched code files> (CLEAN, exit 0; one advisory cue, a false positive); yarn lint:check exit 0; yarn format:check exit 0"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-10-01
status: complete
---

# Phase 166 Plan 03: Drop the Entity Auth Link Column Summary

**`candidates.auth_user_id` and `organizations.auth_user_id` are gone, along with their indexes, seed value, fixture values, generated types, column-map entry and dev-seed permitted keys. The drop, the regenerated single migration and the regenerated `database.ts` landed in one commit. The anon-exposure census now passes un-wrapped (NC-4 closed green), so the editor grant is the only link from an auth user to an entity. Every schema comment, fixture banner and test description in the 21 touched files now describes that model in the present tense.**

## Performance

- **Duration:** about 20 min (2026-10-01T21:08:09Z to 21:28:24Z)
- **Started:** 2026-10-01T21:08:09Z
- **Completed:** 2026-10-01T21:28:24Z
- **Tasks:** 3/3 (no hand-off)
- **Files modified:** 23 code files, plus the negative-controls record, WINDOWS.md and the new deferred-items.md

## Pre-check (losslessness)

This ran on the local database before any edit. It counts rows whose link value has no matching `(entity, <type>, id, editor)` grant for the same user:

| Table | Rows with a link value | Rows with a link value and no matching editor grant |
|---|---|---|
| candidates | 1 (the seeded Test Candidate) | **0** |
| organizations | 0 | **0** |

Query used, recorded so any future non-local database can run the same check:
`SELECT count(*) FROM public.candidates c WHERE c.auth_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.grants g WHERE g.user_id = c.auth_user_id AND g.scope='entity' AND g.target_type='candidate' AND g.target_id=c.id AND g.role='editor')`, and the same query for `organizations` with `target_type='organization'`. No hosted database exists, so no data was migrated.

## Accomplishments

- **The drop.**
  - `102-entities.sql` loses both column definitions and their comments.
  - `200-indexes.sql` loses the banner and both `CREATE INDEX` lines.
  - The regenerated migration diff is exactly those 11 lines. `database.ts` loses 6 lines: Row, Insert and Update for both tables.
- **Seed.** The Test Candidate insert no longer names the column. The comments say that the editor grant written below links the record. The grant block states why the two rows exist and why the insert is arbitrated on the named key. The `162-06`, `162-08`, `162-15`, `D-14` and `D-19` references are gone.
- **Fixtures.**
  - `create_test_data()` and 03's extra candidate insert carry no link value.
  - 21 Section 8 seeds candidate_a's grant rows with `test_seed_identity_grants ('candidate_a')` before the project B insert. `create_test_data()` still seeds no grant rows.
  - 09 drops its two `throws_ok` blocks on the column and goes from `plan (34)` to `plan (32)`. pgTAP now counts 1335 assertions, down from 1337.
- **Census green.** The `todo_start` / `todo_end` pair is deleted from 36, and the two assertions are byte-identical to 166-01's. Both pass, and NC-4's closure is appended to `166-NEGATIVE-CONTROLS.md`.
- **Keys and map.**
  - `column-map.ts` loses `auth_user_id: 'authUserId'` and its heading.
  - `permittedKeys.ts` loses both entries.
  - The dev-seed column-absence test is deleted, along with its header clause and the `GEN-04` ids in the other test titles.
- **Schema comments (Task 2).**
  - 302's parent-reach paragraph, its two section banners, the self-update comment and the structural-columns sentence no longer mention the column.
  - 303 loses both protected-list bullets.
  - 502's service-role rationale names `nominations.created_by`.
  - 503's withheld list no longer lists the column.
  - The migration is regenerated so it carries these comment edits. `database.ts` is unchanged by them: `git diff --exit-code` exit 0 after `db:types`.
- **Guards (Task 2).**
  - 05 TEST B drops `AND qual NOT LIKE '%auth_user_id%'`; its comment and description name four predicates instead of five.
  - 05 TEST C drops `AND NOT (r ? 'auth_user_id')`.
  - 20 drops the clause from the public-bucket INSERT-pair count and the `OR … LIKE` line from "25. The absence set".
  - Every other clause stays, and the counts stay at 22 and 46.
- **Sweep (Task 3).** One file per commit, in plan order: 14 → base.ts → 03 → 00-helpers.
  - The `set_test_user` RAISE keeps `was handed a grant array that is not set-equal to that identity's rows in public.grants` verbatim, and 14's Section 7 still matches it.

## Task Commits

1. **Task 1 (tracer): the column is gone and the census turns green:** `e20e29bf7` (feat)
2. **Task 2: schema comments and policy guards describe the grant as the only link:** `2e126ac48` (docs)
3. **Task 3: whole-file sweep, one file per commit:**
   - `2ad06e851`: `14-grants-migration.test.sql` (style)
   - `46ea8a82b`: `templates/e2e/base.ts` (style)
   - `df0ccd8d1`: `03-anon-read.test.sql` (style)
   - `3560e77be`: `00-helpers.test.sql` (style)

**Tracer gate:** HUMAN_VERIFY_MODE is `end-of-phase` and the tracer's `<verify>` is automated-only, so after the Task 1 commit I re-ran `yarn db:reset && yarn workspace @openvaa/supabase test:db` on HEAD `e20e29bf7`: exit 0, `Result: PASS`, 0 `not ok`, 0 `# TODO`. Parity also passed. The E2E tracer ran against a working tree byte-identical to that commit. `⚡ Tracer verified end-to-end — expanding`.

## Verification

| Gate | Result |
|---|---|
| Task 1: `yarn db:reset && yarn workspace @openvaa/supabase test:db` | exit 0 / exit 0, `Files=36, Tests=1335`, `Result: PASS`, no `not ok`, no `# TODO` on any 36 line |
| Task 1: `supabase-types typecheck`, `dev-seed typecheck`, `dev-seed test:unit` | exit 0 / exit 0 / exit 0 (66 files, 897 passed: 898 minus the deleted absence case) |
| Task 1: `yarn lint:check` | exit 0 |
| Task 1: `yarn db:lint:sql` | exit 0, `0 error(s), 3 warning(s)` (the baseline) |
| Task 1: E2E tracer `166-03-tracer --project candidate-a11y-scan` | `tests/e2e-runs/166-03-tracer/exit` = `0`; stats expected 17, skipped 0, unexpected 0, flaky 0; preflight 0 failures / 1 success |
| Task 1: scan over its 8 files | CLEAN, exit 0 |
| Task 2: `yarn db:reset && test:db` | exit 0, 1335, PASS; 05, 20 and 02 `ok` |
| Task 2: `yarn assert:schema-migration-parity && dev-seed test:unit` | exit 0 / exit 0 (897 passed) |
| Task 2: scan over its 9 files | CLEAN, exit 0, no advisory cues |
| Task 3: population `test "$(git grep -l auth_user_id -- apps packages tests)" = …/36-entity-identity.test.sql` | exit 0 (only the census file remains) |
| Task 3: `yarn lint:check` / `yarn format:check` (each status read from its own exit file) | exit 0 / exit 0 |
| Task 3: `yarn test:unit` | exit 0, `Tasks: 25 successful, 25 total` |
| Task 3: `yarn db:reset && yarn db:lint:sql && yarn workspace @openvaa/supabase test:db` | exit 0 / exit 0 (`0 error(s), 3 warning(s)`) / exit 0 (`Files=36, Tests=1335`, `Result: PASS`) |
| Task 3: plan-scope scan over all 21 touched code files | CLEAN, exit 0; one advisory cue, justified below |
| `ls apps/supabase/supabase/migrations/*.sql \| wc -l` | 1 |

**Acceptance criteria, all PASS at plan end:**
- Task 1: the scoped `git grep -l` exits 1; there is 1 migration; the count of `todo_start|todo_end` is 0; `test_seed_identity_grants ('candidate_a')` appears once; `plan (32)` appears once; NC-4 ends green; the tracer exit is 0.
- Task 2: the scoped `git grep -l` exits 1; `nominations.created_by` appears in 502 at least once (1); `plan (22)` and `plan (46)` each appear once; the `uid()` count in 20 is 28 before and after.
- Task 3: the RAISE substring appears once; the scan exits 0; the population is exactly the census file; each of the four files' last commit subject is `style(166-03): …`; no continuation file exists, because no hand-off happened.

## Deviations from Plan

### Auto-fixed Issues

**1. [Plan inconsistency] Task 1's first acceptance grep could not pass until Task 2**
- **Found during:** Task 1 acceptance check
- **Issue:** The criterion greps `apps/supabase/supabase/schema` and `migrations`. Task 1's own action says "Nothing else in the schema changes in this task", and Task 2 owns the 302/303/502/503 comments. After Task 1 the grep printed 5 files (exit 0).
- **Fix:** I kept the task boundary. I checked that every remaining hit was a comment line (`git grep -n … | grep -v ':[0-9]+:[[:space:]]*--'` printed nothing): 9 comment lines, namely 302×5, 303×2, 502×1 and 503×1, mirrored in the migration. After Task 2 I re-ran the criterion verbatim: no output, exit 1.
- **Committed in:** `e20e29bf7`, `2e126ac48`

**2. [Rule 2 - D-19 whole-file sweep] Narrative and planning references beyond the plan's named hits**
- **09:** Two test descriptions said "so the allow-list change really landed". They now say "so the column is inside the UPDATE grant". (`e20e29bf7`)
- **21 Section 8:** The redundant `set_test_user`/`reset_role` pair is replaced by `test_seed_identity_grants ('candidate_a')`, not added beside it. The banner now says the function reads grant rows and that `create_test_data()` writes none. (`e20e29bf7`)
- **seed.sql:** The project comment's `162-08` and `D-14` narrative is also rewritten. (`e20e29bf7`)
- **02 Section 2:** The banner said "162-13 added a second gate". It now says "a second gate stands in front of it". (`2e126ac48`)
- **14:**
  - The header, the Section 1/5/6/7/8/9 banners and three test descriptions are rewritten. `IN-02`, `162-0x` and "retired-claim fallback 162-05 installed" are gone.
  - The history-only "Section 8: RETIRED BY 162-15" block is deleted.
  - The pgTAP `has_role` paragraph is deleted; the file has no `has_role` reference left.
  - The section numbers were stale: they claimed `(47-49)` in a file planned for 21. They now run 1-9 with the real TAP numbers.
  - (`2ad06e851`)
- **00-helpers:**
  - `create_test_data()`'s header claimed it wrote "Corresponding grant rows". That was false, and it now says it writes none.
  - Two banners cited `13-shim-parity.test.sql`, which no longer exists. They now cite `24-legacy-removal.test.sql`, the file that actually uses `set_test_retired_claim` and `test_rls_digest`.
  - One banner claimed that a test asserts `test_rls_digest`'s `prosecdef = false`. No test does, so the sentence is dropped.
  - The empty `-- ===== User roles =====` banner inside `create_test_data()` is deleted.
  - The `Phase 1` / `Phase 2` section titles matched the scan's phase-reference form and are now `Part 1` / `Part 2`.
  - The header's run-together helper list is now one sentence that names every helper, including four it had omitted.
  - (`3560e77be`)
- **base.ts:** The comment above CA-AA-1 called it "the perfect-match candidate (POLAR_MAX)". Its row carries `GENERIC` answers, so the comment now says so; this is factually wrong by inspection, not a judgment call. (`46ea8a82b`)

**3. [Scope boundary] One pre-existing fixture defect logged, not fixed**
- **Found during:** Task 3, the 03-anon-read sweep
- **Issue:** The comment says both terms-of-use controls carry a confirmed nomination. The `FutureTerms` nomination (…002b) is inserted with `confirmed = false`, so that control is hidden for a second reason. The comment is now accurate and makes no claim about confirmation state.
- **Why not fixed:** It predates this plan and has nothing to do with the column. Task 3 is comment-only.
- **Where recorded:** `deferred-items.md`, with the one-value fix and the red/green check it needs. Whether 16-anon-visibility already isolates that conjunct is **UNCONFIRMED**.

---

**Total deviations:** 3 (1 plan inconsistency resolved by task order, 1 sweep-scope addition, 1 out-of-scope defect deferred). **Impact:** None on scope. Each one was needed for a gate to pass, for a comment to be true, or for the hygiene requirement.

## Flagged Assumptions

- **Hand-off trigger:** The trigger is about 60% of the context window. I could not measure context use precisely. I estimated it before Task 3 and again after each file, and judged it well below the trigger each time. Every file was read whole, and no gate or narrative pass was skipped. That this was well below the trigger is an estimate, not a measurement.
- **AUTHID-07 ordering and concurrency** do not apply to comment hygiene within a serial phase, as the plan's probe-coverage note says.
- **Dead code left in 14:** `DROP TABLE IF EXISTS mig_backfill_image;` and `DROP TABLE IF EXISTS mig_oracle_image;` drop tables that nothing in `apps packages tests` creates. I left them because they are code, not comments, and Task 3 is comment-only. They are harmless no-ops.
- **Advisory cue left in place:** `base.ts:226` "used to exercise the longText render branch" is seed text in which "used to" means "employed to". It is not history.

## Known Stubs

None.

## Threat Flags

None. This plan removes surface (T-166-14) and adds none. The census exemption list was not widened: it is exactly `public.nominations.created_by`.

## Broken-Windows Ledger

Window **286** is now `fixed`. It was 166-01's skipped-test entry for the census held in `todo_start`/`todo_end`. The deferred 03 defect is recorded in `deferred-items.md` and has no window.

## User Setup Required

None.

## Next Phase Readiness

- **166-04 can start.** No continuation is open. `git grep -l auth_user_id -- apps packages tests` lists only the census file.
- 166-04's D-04 doc updates still need doing: `.claude/skills/database/SKILL.md` still says "B-tree on `auth_user_id`" and lists `auth_user_id` among the protected columns.
- The local edge-runtime container was not touched by this plan.

---
*Phase: 166-retire-auth-user-id-entity-identity-from-grants*
*Completed: 2026-10-01*

## Self-Check: PASSED

All 2 created files exist on disk; all 6 task commits (e20e29bf7, 2e126ac48, 2ad06e851, 46ea8a82b, df0ccd8d1, 3560e77be) resolve in git; commits measured from the ledger: 6.
