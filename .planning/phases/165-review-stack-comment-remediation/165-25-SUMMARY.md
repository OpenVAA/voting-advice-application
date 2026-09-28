---
phase: 165-review-stack-comment-remediation
plan: 25
subsystem: database
tags: [rls, authorization, user_can, entity-type, pgtap, supabase, security]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-24's green interim gate (pgTAP 1204, E2E 165/0/0) and the 165-01 instruments (hygiene gate, read log, code-identity, assert-absent, e2e-verdict, ledger-check)
provides:
  - public.user_can(p_scope, p_target_id, p_permission, p_target_type public.entity_type DEFAULT NULL), where entity-scope reach is type-qualified and a NULL type denies
  - private.entity_project_id(entity_type, uuid), a CASE with one table per type and no UNION ALL ... LIMIT 1
  - private.is_child_nominee(parent_type, parent_id, child_type, child_id)
  - public.get_entity_basic_data(entity_type, uuid), which probes only the named table
  - a type argument at every entity-scope call site (21) and every entity_project_id call site (8) in the schema
  - 33-entity-type-collision.test.sql, a cross-type, cross-project entity-id collision negative control (30 assertions)
affects: [165-26, 165-35, 165-36]

actuals:
  tokens: 21676
  tasks: 3
  commits: 5
plan_head_before: f3a566e0cad95e0895d16586f2280038b4df538d
plan_head_after: 4ca723a04c2e7311e80c3506a35e38a6f876c7e3

tech-stack:
  added: []
  patterns:
    - "An entity is named by (entity_type, id) at every authority hop; an id alone is never resolved"
    - "Census of call arity over the APPLIED database (pg_policies.qual/with_check + pg_proc.prosrc) with a paren-depth, string-aware argument splitter, cross-checked against a comment-stripped scan of the schema files and observed red on the pre-change schema"

key-files:
  created:
    - apps/supabase/supabase/tests/database/33-entity-type-collision.test.sql
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-25.tsv
  modified:
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/schema/011-validation-functions.sql
    - apps/supabase/supabase/schema/400-storage.sql
    - apps/supabase/supabase/schema/502-email-helpers.sql
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts
    - apps/supabase/supabase/tests/database/05-organization-admin.test.sql
    - apps/supabase/supabase/tests/database/12-user-can.test.sql
    - apps/supabase/supabase/tests/database/18-entity-policies.test.sql
    - apps/supabase/supabase/tests/database/19-entity-immutability.test.sql
    - apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql
    - apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts
    - .claude/skills/database/SKILL.md
    - .claude/skills/database/rls-policy-map.md
    - .claude/skills/database/schema-reference.md
    - .claude/skills/database/extension-patterns.md
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md

key-decisions:
  - "enforce_entity_immutability derives the row's type as left(TG_TABLE_NAME, -1)::public.entity_type rather than the plan's CASE TG_TABLE_NAME. 19-entity-immutability #56 asserts that the trigger body names no entity-type label, so the one body serves every entity table. A CASE would redden that guard, and changing the guard would weaken it. A table outside the entity naming fails the cast, so the update raises rather than being decided without a type"
  - "Every three-argument entity-scope call in the pgTAP estate gains its type, including the ones in files that still passed. A deny assertion asked without a type would pass on the NULL-type denial rather than on the rule it names"
  - "18's self-update family normalises only each table's OWN type literal (left(tablename, -1)), so a policy passing another table's type stays a distinct expression. That is stricter than the SELECT family's any-label normaliser"
  - "The entity policies cast their literal explicitly ('candidate'::public.entity_type), matching the existing entity_has_confirmed_nomination calls; the nomination policies pass the row's generated entity_type column"
  - "07, 17, 20, 22, 28 and 29, which the plan named, needed no change: each passes and holds no three-argument entity-scope call. Their structural regexes match the four-argument qual, and 29's position() probes still find 'user_can(''entity'''"

patterns-established:
  - "Pair every allow with the other type's deny for the same shared id, so a predicate answering true for both, or false for both, fails"

requirements-completed: [165-SC2, 165-SC3, 165-SC4, C-4080520234, C-4094736695]

coverage:
  - id: D1
    description: "A project admin of project B who inserts a candidate reusing project A's organization id gains no permission on that organization, and the reverse holds for the candidate; entity grants, the child-nominee branch, get_entity_basic_data and the entity UPDATE policy keep the two entities apart; a NULL type denies for every caller"
    requirement: "C-4080520234"
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/33-entity-type-collision.test.sql (30/30; RED before the schema change)"
        status: pass
      - kind: integration
        ref: "yarn workspace @openvaa/supabase test:db (Files=33, Tests=1234, Result: PASS)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every entity-scope user_can call and every entity_project_id call in the schema passes the entity type (21 + 8), in the applied database and in the source files"
    requirement: "165-SC2"
    verification:
      - kind: other
        ref: "census.py db over pg_policies + pg_proc.prosrc: 21 typed / 0 untyped; census.py files over schema/*.sql: 21 typed / 0 untyped; the same census over HEAD~ schema: 0 typed / 21 untyped (exit 1)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Project-scope callers are unchanged: supabaseAdminWriter and the Edge Functions' callerMayOnProject still send three named arguments, which the DEFAULT resolves; flowConformance asserts the four-parameter declaration and the DEFAULT NULL"
    requirement: "165-SC4"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/supabase test:unit (15 files, 170 tests); flowConformance planted control (DEFAULT NULL removed -> 1 failed)"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit supabaseAdminWriter requireAdminIdentity (2 files, 41 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Full gate on the final tree: SQL lint, lint, format, frontend check, the full E2E suite, and the branch-wide hygiene gate over committed changes"
    requirement: "165-SC4"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/165-25 (wrapper exit 0, 165 passed; e2e-verdict.mjs exit=0 expected=165 unexpected=0 flaky=0 skipped=0 GREEN)"
        status: pass
      - kind: other
        ref: "yarn db:lint:sql (0); TURBO_FORCE=true yarn lint:check (0); yarn format:check (0); yarn workspace @openvaa/frontend check (0 errors)"
        status: pass
      - kind: other
        ref: "hygiene-changed-files.sh --check-reads --files <161 committed paths since ship/v2.15-12-planning> (VERDICT: CLEAN)"
        status: pass
    human_judgment: false

duration: 38min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 25: Type-aware user_can Summary

**Entity-scope authorization now resolves an entity only as the pair of type and id. `user_can` takes `p_target_type` (default NULL, which denies at entity scope). `entity_project_id` and `is_child_nominee` read the one table the type names. All 21 entity-scope call sites pass their type. So project B's admin can no longer take over project A's organization by inserting a candidate with the same UUID.**

## Performance

- **Duration:** 38 min
- **Started:** 2026-09-27T23:11:52Z
- **Completed:** 2026-09-27T23:50:22Z
- **Tasks:** 3 of 3
- **Files modified:** 20 shipped (plus the ledger and the read log)

## Accomplishments

- The takeover is closed (#877, C-4080520234). Before the fix, a rolled-back probe as project B's admin, after inserting a candidate with `org_a`'s id, got `user_can('entity', org_a, 'entity.edit_answers') = t`, and its `UPDATE organizations ... WHERE id = org_a` **wrote project A's row**. After the fix, the same shapes are denied, and `33-entity-type-collision.test.sql` asserts them.
- `user_can` is type-qualified at every reach rule. The global, account and project arms resolve through the typed hop. Entity-grant equality requires `g_target_type = p_target_type::text` as well as id equality. Named branch 1 uses the grant's own type, and branch 2 passes the asked type as the child type. `SECURITY DEFINER`, `search_path = ''`, text comparison of the claim fields and deny-by-default are all unchanged.
- `get_entity_basic_data(entity_type, uuid)` and `is_child_nominee(..., child_type, child_id)` are typed. They are part of the maintainer's broader request (C-4094736695), which plan 165-26 completes.
- The pgTAP estate, the Edge Function contract test and the database skill docs all describe the four-argument shape. No assertion was weakened, and `plan (N)` is unchanged in every pre-existing file.

## Task Commits

1. **Task 1: collision negative control, then type-aware reach through every call site (tracer)**: `58e68e611` (fix)
2. **Task 2: pgTAP estate and the Edge Function contract in the typed shape**: `0d3f6913d` (test), plus `2b8944940` (docs, `Hygiene: D-04`, flowConformance)
3. **Task 3: skill docs, hygiene closure and the full E2E suite**: `ba54fbb77` (docs), `4ca723a04` (docs, read log)

**Plan metadata:** the SUMMARY commit that follows this file.

## RED run (Task 1, before the schema change)

`yarn supabase test db 00-helpers.test.sql 33-entity-type-collision.test.sql` against the tip database exited 1:

```text
psql:.../33-entity-type-collision.test.sql:111: ERROR:  function private.entity_project_id(unknown, uuid) does not exist
Failed 29/30 subtests
Parse errors: Bad plan.  You planned 30 tests but ran 1.
Result: FAIL
```

The documented leak, which is not in the file, is the three-argument variant in a rolled-back transaction (`docker exec -i supabase_db_openvaa-local psql`):

```text
 admin_b user_can(entity, org_a, entity.edit_answers)                         | t
 org_a.custom_data after admin_b UPDATE                                       | {"written_by": "admin_b"}
 organization_a user_can(entity, <candidate id = org_a>, entity.edit_answers) | t
```

Assertion 1 of the file (`lives_ok` of the insert) passed on the tip too. The admin-insert path admits a client-chosen `id`, which is the attack's precondition.

After GREEN: `00-helpers + 33` gave `Files=2, Tests=39, Result: PASS` (exit 0), and `yarn assert:schema-migration-parity` exited 0.

## Census: every entity-scope call carries its type

`census.py` parses every `user_can(`, `entity_project_id(` and `is_child_nominee(` call with a paren-depth, string-aware argument splitter. That way a call spread over several lines counts once, and a call inside a string literal is not a call. An entity-scope `user_can` is one whose first argument is the literal `'entity'`.

- **Applied database**: `pg_policies` (`qual` and `with_check`), plus `pg_proc.prosrc` for the `public` and `private` schemas with comments stripped:
  ```text
  SUMMARY db: user_can entity-scope: 21 typed, 0 untyped
  SUMMARY db: entity_project_id: 8 typed, 0 untyped
  SUMMARY db: is_child_nominee: 1 typed, 0 untyped
  ```
  The 21 are the 12 entity-table policy clauses (4 tables × SELECT, UPDATE USING and UPDATE WITH CHECK), the 4 nomination policy clauses, `caller_nominated_in_contest`, `enforce_entity_immutability` × 2, `storage_path_can` and `get_entity_basic_data`. A deparsed example: `('entity'::grant_scope_type, organizations.id, 'entity.read_answers'::grant_permission, 'organization'::entity_type)`.
- **Schema files**, comment-stripped: `SUMMARY files: user_can entity-scope: 21 typed, 0 untyped` (8 and 1 for the other two). These are the same 21 sites: 16 in `302-rls.sql`, 2 in `011`, 1 in `301`, 1 in `400` and 1 in `503`.
- **Negative control**: the same census over `git archive HEAD` taken before Task 1 exits 1 with `0 typed, 21 untyped` (8 and 1 untyped for the other two).

`assert-absent.sh 'UNION ALL' -- schema/301-auth-functions.sql` exits 0 (`absent`). `grep -n 'p_target_type public.entity_type DEFAULT NULL' 301-auth-functions.sql` finds line 449.

## pgTAP change list (Task 2)

The first full run after Task 1 failed in 05 (the `get_entity_basic_data(uuid)` call), 12 (`is_child_nominee` arity, and vectors 15-18), 18 (#58), 19 (#56) and 25 (#18-26). After Task 2 the full run gave `Files=33, Tests=1234, Result: PASS` (exit 0, 0 `not ok`). That is 1204 at the 165-24 baseline plus the 30 new assertions.

| File | `plan (N)` before → after | Assertions edited | What changed |
|---|---|---|---|
| 05-organization-admin | 22 → 22 | 2 | TEST C and its paired opposite call `get_entity_basic_data('candidate', <id>)`; the header comment names the type |
| 12-user-can | 45 → 45 | 17 | `pg_temp.allowed` takes a type and the 7 entity-scope vector calls pass their target's type; the NULL-target, no-row and same-project denials, the 5 `is_child_nominee` calls (child type added) and the 2 child-nominee-branch calls are typed |
| 18-entity-policies | 59 → 59 | 1 | #58, the self-update family, normalises the table name and the table's own type literal only |
| 19-entity-immutability | 70 → 70 | 1 | the precondition's `user_can(..., 'entity.edit_immutable', 'candidate')`; #56 is unchanged and holds because of the `left(TG_TABLE_NAME, -1)` derivation |
| 25-matrix-conformance | 41 → 41 | 0 statements | the section-2 grid `DO` block that feeds matrix rows #3-#25 passes each entity-scope probe's target type; the expected vectors are unchanged |
| 33-entity-type-collision | new | 30 | the collision fixture and its paired assertions |

No assertion was added, removed or reordered in a pre-existing file, and no expected value changed.

The other Task 2 gates:

- `yarn db:lint:sql` exited 0 (`No schema errors found`; lint-schema reported the same 3 pre-existing FK-index warnings).
- `yarn workspace @openvaa/supabase test:unit` exited 0 (15 files, 170 tests).
- `yarn workspace @openvaa/frontend test:unit supabaseAdminWriter requireAdminIdentity` exited 0 (41 tests).
- `yarn workspace @openvaa/frontend check` exited 0 (0 errors, 0 warnings).
- `TURBO_FORCE=true yarn lint:check` exited 0 (`0 cached`; every guard reported `0 violation(s)`; the warnings are the pre-existing 15/1/2 recorded by 165-24).
- `yarn format:check` exited 0.

The flowConformance planted control: with `DEFAULT NULL` removed from `301-auth-functions.sql`, the test exited 1 (`expected 'p_target_type public.entity_type' to match ...`). The file was then restored with `git checkout` from HEAD.

## E2E verdict (Task 3)

`tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-25 --no-db-reset` ran at HEAD `4ca723a04`, 23:36:03Z-23:46:48Z. The worktree status showed only the maintainer's `MainContent.svelte` and `.planning/milestone.lock`. Results: `165 passed (10.6m)`, playwright exit 0, preflight 0 failures / 1 success, wrapper exit 0.

`node scripts/e2e-verdict.mjs tests/e2e-runs/165-25` exited 0: `exit=0 expected=165 unexpected=0 flaky=0 skipped=0`, `VERDICT: GREEN (expected 165 >= 165, 0 failed, 0 flaky, 0 did-not-run)`.

## Hygiene

- Every schema and pgTAP file this plan touched was clean before and after, and so was the regenerated migration. `flowConformance.test.ts` was not pre-cleaned (53 items: review ids, plan ids, section anchors, decision ids, narrative). It was restated in `2b8944940`. `code-identity.mjs HEAD WORKTREE` reports its six `it()` title strings as the only non-comment difference, and its 19 tests pass.
- Reads were recorded for all 15 shipped files this plan changed (`hygiene-reads/165-25.tsv`).
- `hygiene-changed-files.sh --check-reads --files <161 committed paths since ship/v2.15-12-planning, minus .planning/>` exited 0 (`VERDICT: CLEAN`). The plan's literal `--base ship/v2.15-12-planning --check-reads` exited 1 on exactly one item: the maintainer's uncommitted `MainContent.svelte`, which by the orchestrator's instruction gets no read row. This is the same result 165-24 recorded.
- `assert-absent.sh "user_can\(grant_scope_type, uuid, grant_permission\)" -- .claude/skills/database` exited 0.
- `scripts/tip-proofs.sh` exited 0, both after Task 1 and at the end.
- `ledger-check.sh` exited 0.

## Review-comment dispositions

| Comment | Disposition | Commits | Evidence | Draft reply |
|---|---|---|---|---|
| C-4080520234 (#877 `301-auth-functions.sql:528`) | fix | 58e68e611, 0d3f6913d, ba54fbb77 | `33-entity-type-collision.test.sql` 30/30 (RED before); census 21/21 typed over the applied database; pgTAP 1234 PASS; E2E `165-25` GREEN | Fixed in 58e68e611: entity reach is type-qualified. `user_can` takes the entity type and denies an entity-scope question without one. An entity grant reaches only the entity of its own `target_type`, and `entity_project_id` / `is_child_nominee` resolve the pair of type and id from one table. So a UUID shared across entity tables or projects no longer confers authority. |
| C-4094736695 (#877 `503-entity-rpcs.sql:105`) | fix (owned by 165-26) | 58e68e611 (partial: `get_entity_basic_data`, `is_child_nominee`) | This plan types two of the id-taking functions; 165-26 types `upsert_answers`, runs the census of every other id-taking function and fills the ledger row | (165-26) |

## Decisions Made

See `key-decisions` in the frontmatter. The one a later plan should know about: at entity scope, `user_can` now denies without a type. A new entity-scope call site that omits the type fails closed, and E2E or pgTAP catches that as a denial, not a leak.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's `CASE TG_TABLE_NAME` would break guard 19 #56**
- **Found during:** Task 2 (first full pgTAP run)
- **Issue:** `19-entity-immutability` #56 asserts that `enforce_entity_immutability`'s body names no entity-type label (checked against a label list from `pg_enum`), so one generic body serves all four tables. The CASE mapping that Task 1 committed (as the plan specified) named the tables and failed the guard.
- **Fix:** `v_entity_type := left(TG_TABLE_NAME, -1)::public.entity_type`. The four entity tables share the plural naming, and a table outside it fails the cast, so the update raises instead of being decided without a type. The header comment states the derivation. The guard is unchanged and green.
- **Files modified:** `schema/011-validation-functions.sql`, the migration
- **Verification:** 19 passes 70/70, and the full pgTAP run passes
- **Committed in:** `0d3f6913d`

**2. [Rule 2 - Missing critical] Three-argument entity calls typed in pgTAP files that still passed**
- **Found during:** Task 2
- **Issue:** Some deny assertions in 12 and 19 call `user_can('entity', x, perm)` and still passed, but only because of the new NULL-type denial, not the rule they name. That silently weakens them.
- **Fix:** Each gained its entity type. A census over the test files leaves only the three deliberate NULL-type assertions in 33 as untyped entity-scope calls.
- **Files modified:** `12-user-can.test.sql`, `19-entity-immutability.test.sql`
- **Committed in:** `0d3f6913d`

**3. [Rule 2 - Missing critical] `extension-patterns.md` updated as well**
- **Found during:** Task 3
- **Issue:** The skill's self-edit policy template used the three-argument entity call. A policy built from it would deny every self-edit.
- **Fix:** The template passes `'{entity type}'::public.entity_type` and says why.
- **Committed in:** `ba54fbb77`

**4. [Rule 3 - Blocking] zsh did not word-split the path list passed to `record-hygiene-read.sh`**
- **Found during:** Task 3
- **Fix:** The command was re-run under `bash -c`. The failed first attempt recorded nothing (exit 2).

**Total deviations:** 4 auto-fixed (1 bug, 2 missing-critical, 1 blocking). **Impact:** none on scope. Each change keeps a guard or an assertion as strong as it was.

## Issues Encountered

- The first background-task notification for the E2E run arrived while the run was still at 51/165, with its processes alive. The run was left to finish and then read from its own run directory (`ended`, `exit`, `results.json`).

## Known Stubs

None.

## Threat Flags

None. The change narrows existing entity-scope authority. It adds no endpoint, no auth path, no file access and no trust-boundary schema. `get_entity_basic_data`'s signature change keeps the same `REVOKE`/`GRANT` posture (authenticated only).

## User Setup Required

None.

## Next Phase Readiness

- Ready for 165-26: `upsert_answers` is the last type-blind id-taking RPC. The collision fixture in `33-entity-type-collision.test.sql` is there for it to extend.
- The database was reset for this plan and has since run pgTAP and the E2E suite. A `db:types` drift check must be preceded by a fresh `db:reset` (the pgTAP helpers persist).

---
*Phase: 165-review-stack-comment-remediation*
*Completed: 2026-09-27*

## Self-Check: PASSED

- Created files exist: `33-entity-type-collision.test.sql`, `hygiene-reads/165-25.tsv`, this SUMMARY (checked with `[ -f ]`).
- Commits `58e68e611`, `0d3f6913d`, `2b8944940`, `ba54fbb77`, `4ca723a04` and `538a3eb72` exist (`git cat-file -e`).
- `git status --short` lists only the maintainer's `MainContent.svelte` and `.planning/milestone.lock`.
