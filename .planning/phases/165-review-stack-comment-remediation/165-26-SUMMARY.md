---
phase: 165-review-stack-comment-remediation
plan: 26
subsystem: database
tags: [rpc, upsert_answers, entity-type, census, pgtap, supabase, data-writer, hygiene]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-25's type-aware user_can, the typed entity_project_id / is_child_nominee / get_entity_basic_data, and the collision fixture in 33-entity-type-collision.test.sql
provides:
  - public.upsert_answers(p_entity_type public.entity_type, p_entity_id uuid, p_answers jsonb, p_overwrite boolean DEFAULT false), which writes only the table the type names and raises for any other type or a NULL type
  - SupabaseDataWriter passing p_entity_type on every upsert_answers call
  - a census of all 32 schema functions that take or derive an entity id, with 0 untyped
  - the project-scoping guard's upsert_answers disposition naming the typed identity
  - hygiene-clean supabaseDataWriter.ts and its test
affects: [165-35, 165-36]

actuals:
  tokens: 9776
  tasks: 3
  commits: 5
plan_head_before: f460915079f6cd1ce69f85c4ab25d4d45ff8b1fa
plan_head_after: 0b02755a0820762721f6a54d083b44316725fbd1

tech-stack:
  added: []
  patterns:
    - "An answers write names its entity by (entity_type, id); a CASE on the type selects the one table the UPDATE touches, so no id is tried against a second table"
    - "Id-taking function census: a comment-stripped scan of schema/*.sql cross-checked against the applied pg_proc, one verdict per function (typed / typed by column / typed by binding / typed by table name / no entity id)"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-26.tsv
  modified:
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts
    - apps/supabase/supabase/tests/database/33-entity-type-collision.test.sql
    - apps/supabase/supabase/tests/database/10-schema-migrations.test.sql
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - scripts/assert-project-scoped-queries.mjs
    - .claude/skills/database/schema-reference.md
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md

key-decisions:
  - "The overwrite and merge forms share one UPDATE per table: the base is CASE WHEN p_overwrite THEN '{}' ELSE the stored answers END, merged with p_answers. A NULL p_overwrite merges, as the old IF p_overwrite did"
  - "A NULL type raises 'Entity type <NULL> has no answers' through the CASE's ELSE rather than returning NULL, so a caller that omits the type fails loudly"
  - "The not-found message stays 'Entity not found or access denied: <id>', which 10-schema-migrations asserts exactly"
  - "No other function needed a type argument. Every one the census found is typed, typed by a per-type column, bound to one table, names its table, or resolves no entity id. 301-auth-functions.sql, 19-entity-immutability and 07-rpc-security, which the plan named, needed no change: the full pgTAP run failed only in 10"
  - "The two test titles carrying '(decision B3)' and '(T-157-17)' were renamed in their own commit after the comment-only commit, so that commit stays provably code-identical"

patterns-established:
  - "An RPC that writes one of several entity tables takes the entity type and selects the table from it; it never falls through from one table to the next"

requirements-completed: [165-SC2, 165-SC3, 165-SC4, C-4094736695]

coverage:
  - id: D1
    description: "With a candidate and an organization sharing one UUID, upsert_answers writes only the table its type names: the candidate's editor writes the candidate and is refused the organization; the global admin, who may edit both, reaches each only when the type names it; faction, alliance and NULL types raise and change nothing"
    requirement: "C-4094736695"
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/33-entity-type-collision.test.sql (42/42; RED before the schema change: 12 failed, function public.upsert_answers(unknown, uuid, jsonb, boolean) does not exist)"
        status: pass
      - kind: integration
        ref: "yarn workspace @openvaa/supabase test:db (Files=33, Tests=1246, Result: PASS)"
        status: pass
    human_judgment: false
  - id: D2
    description: "SupabaseDataWriter passes p_entity_type on every upsert_answers call, and the regenerated types make the argument required"
    requirement: "C-4094736695"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit supabaseDataWriter (RED 3 failed / 54 passed; GREEN 57/57)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend check (0 errors); packages/supabase-types/src/database.ts upsert_answers Args carries p_entity_type: Database['public']['Enums']['entity_type']"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every schema function that takes or derives an entity id either takes its type or has a recorded reason it needs none"
    requirement: "165-SC2"
    verification:
      - kind: other
        ref: "census-scan.py over comment-stripped schema/*.sql (29 entity-id hits of 53 functions, plus bulk_import, bulk_delete and resolve_external_ref) cross-checked against pg_proc in public and private; 32 rows, 0 untyped"
        status: pass
    human_judgment: false
  - id: D4
    description: "Full gate on the final tree: SQL lint, guard, lint, format, unit, the full E2E suite and the branch-wide hygiene gate"
    requirement: "165-SC4"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/165-26 (wrapper exit 0, preflight 1 success / 0 failures; e2e-verdict.mjs exit=0 expected=165 unexpected=0 flaky=0 skipped=0 GREEN)"
        status: pass
      - kind: other
        ref: "yarn db:lint:sql (0); node scripts/assert-project-scoped-queries.mjs (0); TURBO_FORCE=true yarn lint:check (0); yarn format:check (0); yarn test:unit (25/25 tasks)"
        status: pass
      - kind: other
        ref: "hygiene-changed-files.sh --check-reads --files <163 committed paths since ship/v2.15-12-planning> (VERDICT: CLEAN)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The rewritten writer comments are accurate, concise and free of historical narrative"
    human_judgment: true
    rationale: "Whether a rewritten comment still states its contract correctly is a reader's judgement; the gates only prove the absence of pattern-level residue and that no code changed"

duration: 31min
completed: 2026-09-28
status: complete
---

# Phase 165 Plan 26: Typed upsert_answers and the Id-Taking Function Census Summary

**`upsert_answers` now takes `p_entity_type` and writes only that type's table (`candidate` → `candidates`, `organization` → `organizations`). Any other type raises. The data writer passes the type on every call. A census of all 32 schema functions that take or derive an entity id finds none left that resolves an id without its type, which answers the maintainer's "examine whether we could require it for all such functions" with yes.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-09-27T23:55:29Z
- **Completed:** 2026-09-28T00:26:08Z
- **Tasks:** 3 of 3
- **Files modified:** 9 shipped (plus the ledger and the read log)

## Accomplishments

- **The defect, shown before the change.** In a rolled-back probe on the untyped function, the global admin called `upsert_answers(org_a, {question_b: ...})` after project B's candidate had been inserted with `org_a`'s id. The write landed on the candidate (`candidate.answers = {question_b: 1}`, `organization.answers = {}`). An answer to project A's `question_a` meant for the organization raised `Question ... not found in project`, because the candidate branch ran first. So some organization writes landed on the wrong row and others were impossible.
- **Typed RPC.** `public.upsert_answers (p_entity_type public.entity_type, p_entity_id uuid, p_answers jsonb, p_overwrite boolean DEFAULT false)` uses a `CASE p_entity_type` that selects one table for both forms. `ELSE` raises `Entity type % has no answers`. The not-found / access-denied raise is unchanged. The function stays `SECURITY INVOKER`, so RLS still decides, and `GRANT EXECUTE` names the new signature. The comment above the function now states its contract: the type selects the table.
- **Caller.** `SupabaseDataWriter._setAnswers` passes `p_entity_type: type`. Its guard already restricts `type` to candidates, and the regenerated types make the argument required.
- **Census** (below): 32 rows, 0 untyped.
- **Guard and docs.** The project-scoping guard's `upsert_answers` disposition reads `scoped-by-identity: entity type + entity id + RLS`. `schema-reference.md` now lists the four entity RPCs with their signatures.
- **Writer hygiene.** `supabaseDataWriter.ts` and its test keep their contracts and lose the review ids, decision labels and history. That covers why the upload extension is whitelisted, why the read-back is validated, why `absent` and `malformed` are treated alike, and where the parse failure is reported. The comment commit is code-identical to its parent.

## Census: every schema function that takes or derives an entity id

How the rows were found: a comment-stripped scan of `apps/supabase/supabase/schema/*.sql`. It matched 29 of the 53 function definitions on entity-id argument names, per-type FK columns, the four entity tables, or `OLD.id`/`NEW.id`. Three functions that carry ids inside jsonb (`bulk_import`, `bulk_delete`, `resolve_external_ref`) were added by reading them. The set was cross-checked against `pg_proc` in `public` and `private`, excluding the pgTAP helpers. Verdicts:

- **typed**: the function takes the entity type, or matches `entity_type` alongside the id.
- **typed by column**: the id comes from a per-type column or is paired with the row's own `entity_type`.
- **typed by binding**: a trigger bound to one table, so the table is the type.
- **typed by table name**: the caller names the one table the id is resolved in.
- **no entity id**: the scan hit, but the function resolves no entity id.

| Function | Arguments | Verdict | Evidence |
|---|---|---|---|
| `public.upsert_answers` | `p_entity_type, p_entity_id, p_answers, p_overwrite` | typed (this plan) | `CASE p_entity_type` selects one table; `33` §9 (12 assertions) |
| `public.user_can` | `p_scope, p_target_id, p_permission, p_target_type` | typed (165-25) | `p_scope = 'entity' AND p_target_type IS NULL` denies; entity-grant equality compares `g_target_type = p_target_type::text`; `33` §3-§5 |
| `private.entity_project_id` | `p_entity_type, p_entity_id` | typed (165-25) | `CASE p_entity_type` with one table per arm; `33` §2 |
| `private.is_child_nominee` | `p_parent_type, p_parent_id, p_child_type, p_child_id` | typed (165-25) | `child.entity_type = p_child_type`, `parent.entity_type = p_parent_type`; `33` §6 |
| `public.get_entity_basic_data` | `p_entity_type, p_entity_id` | typed (165-25) | `CASE p_entity_type` probes one table; `33` §8 |
| `private.entity_has_confirmed_nomination` | `p_entity_type, p_entity_id, p_project_id` | typed | `n.entity_type = p_entity_type` beside the id match |
| `private.nomination_exists_in_contest` | `p_entity_type, p_entity_id, p_election_id, p_constituency_id, p_election_round` | typed | `n.entity_type = p_entity_type` beside the id match |
| `public.get_candidate_user_data` | `p_project_id, p_entity_type` | typed | derives the entity from `auth.uid()`; each branch is gated by `p_entity_type = 'candidate'` / `'organization'` |
| `public.storage_path_can` | `p_scope, p_project, p_type, p_id, p_verb` | typed | the path's type segment names the table (`public.%I`) and maps to `v_entity_type`, passed to `user_can` |
| `public.storage_path_is_public` | `p_project, p_type, p_id` | typed | the type segment names the table, and the mapped type goes to `entity_has_confirmed_nomination` |
| `private.caller_nominated_in_contest` | `p_election_id, p_constituency_id, p_election_round, p_permission` | typed by column | `user_can('entity', COALESCE(n.candidate_id, ...), p_permission, n.entity_type)` pairs the id with the row's own type |
| `private.nomination_entities_confirmed` | `p_nomination_id` | typed by column | each per-type FK column is read only against its own table |
| `public.get_nominations` | `p_project_id, p_election_id, p_constituency_id, p_include_unconfirmed, p_election_round` | typed by column | `LEFT JOIN` of each FK column to its own table |
| `public.validate_nomination` | trigger on `nominations` | typed by column | the child type comes from which FK is set, and factions are read by `NEW.faction_id` only |
| `public.resolve_email_variables` | `p_project_id, p_user_ids, p_template_body, p_template_subject` | typed by column | grants carry `target_type`: `entity_project_id(g.target_type, g.target_id)`, with a candidate or organization branch chosen by `target_type` |
| `public.custom_access_token_hook` | `p_event` | typed by column | projects each grant's `(target_type, target_id)` pair into the claim; resolves no entity itself |
| `public.enforce_entity_immutability` | trigger on the four entity tables | typed by binding | `left(TG_TABLE_NAME, -1)::public.entity_type` (165-25) |
| `public.cleanup_grants_on_delete` | trigger; `('entity', '<type>')` per entity table | typed by binding | deletes `g.target_type = TG_ARGV[1]::public.entity_type AND g.target_id = OLD.id` |
| `public.cleanup_entity_storage_files` | trigger on 10 tables | typed by binding | prefix `{project_id}/{TG_TABLE_NAME}/{id}/` |
| `public.cleanup_old_image_file` | trigger on 10 tables | typed by binding | the same table-named prefix |
| `public.cleanup_old_answer_files` | trigger on `candidates`, `organizations` | typed by binding | the same table-named prefix |
| `public._bulk_upsert_record` | `p_table_name, p_item, p_project_id` | typed by table name | `INSERT INTO public.%I` of the named table; each FK resolves in its relationship's own table |
| `public.resolve_external_ref` | `p_ref, p_target_table, p_project_id` | typed by table name | `SELECT id FROM public.%I` of the named table |
| `public.bulk_import` | `p_data` | typed by table name | per-collection, calls `_bulk_upsert_record(col_name, ...)` |
| `public.bulk_delete` | `p_data` | typed by table name | `DELETE FROM public.%I WHERE ... id = ANY(...)` per named collection |
| `public.merge_jsonb_column` | `p_table_name, p_column_name, p_row_id, p_partial_data` | typed by table name | `UPDATE public.%I ... WHERE id = $2` (test helper, `900-test-helpers.sql`) |
| `public.user_has_account_grant` | `p_account_id` | no entity id | account target only |
| `public.enforce_nomination_confirmation` | trigger on `nominations` | no entity id | reads the nomination's own flags and project |
| `public.enforce_nomination_entity_columns` | trigger on `nominations` | no entity id | compares FK columns OLD against NEW, resolves nothing |
| `private.caller_unconfirmed_originated_count` | none | no entity id | counts nominations by `created_by` |
| `public.cascade_question_delete_to_jsonb_answers` | trigger on `questions` | no entity id | removes a question key from both tables by project |
| `public.validate_question_type_change` | trigger on `questions` | no entity id | validates both tables' answers by project and question |

Totals: 10 typed, 6 typed by column, 5 typed by binding, 5 typed by table name, 6 no entity id, **0 untyped**.

## RED and GREEN

| Run | Command | Result |
|---|---|---|
| RED pgTAP | `supabase test db 00-helpers 33-entity-type-collision` | exit 1; `Failed 12/42`; `function public.upsert_answers(unknown, uuid, jsonb, boolean) does not exist` |
| RED unit | `yarn workspace @openvaa/frontend test:unit supabaseDataWriter` | exit 1; 3 failed / 54 passed (the three `toHaveBeenCalledWith('upsert_answers', ...)` cases) |
| apply | `yarn schema:regenerate && yarn db:reset && yarn db:types` | 0 / 0 / 0 |
| GREEN pgTAP | same | exit 0; `Result: PASS` |
| GREEN unit | same | exit 0; 57 passed |
| types | `yarn workspace @openvaa/frontend check` | 0 errors, 0 warnings |

## Gates on the final tree

All statuses were read directly, never through a pipe.

| Gate | Exit | Output |
|---|---|---|
| `yarn workspace @openvaa/supabase test:db` | 0 | `Files=33, Tests=1246`, `Result: PASS` |
| `yarn db:lint:sql` | 0 | `0 error(s), 3 warning(s)` (the three pre-existing FK-index warnings the 165-24 gate recorded) |
| `node scripts/assert-project-scoped-queries.mjs` | 0 | `0 violation(s)`, self-test matching |
| `yarn workspace @openvaa/dev-seed test:unit projectScopingGate` | 0 | 121 passed |
| `TURBO_FORCE=true yarn lint:check` | 0 | every guard reports 0 violations |
| `yarn format:check` | 0 | all files use Prettier style |
| `yarn test:unit` | 0 | 25/25 tasks |
| `bash scripts/tip-proofs.sh` (phase) | 0 | every proof passes, including the ones marked `LATER PLAN: 165-26` |
| hygiene gate, committed changes, `--check-reads` | 0 | 163 files, `VERDICT: CLEAN` |
| hygiene gate, `--base ship/v2.15-12-planning --check-reads` | 1 | the only item is the maintainer's uncommitted `MainContent.svelte` (unread), excluded per the phase rule |
| `ledger-check.sh` | 0 | 78 rows, `VERDICT: PASSED` |

**E2E verdict:** `tests/e2e-runs/165-26`, wrapper exit 0, preflight 1 success and 0 failures. `e2e-verdict.mjs`: `exit=0 expected=165 unexpected=0 flaky=0 skipped=0`, `VERDICT: GREEN (expected 165 >= 165, 0 failed, 0 flaky, 0 did-not-run)`.

## Task Commits

1. **Task 1: typed `upsert_answers` end to end (tracer)**: `3a6a55f52` (fix). The tracer gate re-ran `<verify>` end to end and all of it passed, so the plan expanded.
2. **Task 2: census, every call site, guard disposition, skill doc**: `79ad98e98` (fix)
3. **Task 3: writer hygiene**: `2f25f3e74` (docs, comment-only; `code-identity.mjs 79ad98e98 HEAD` exits 0), `12fb44d3f` (test, two test titles), `0b02755a0` (docs, read record)

## Review-comment dispositions

| Comment | Disposition | Commits | Evidence | Draft reply |
|---|---|---|---|---|
| C-4094736695 (#877 `503-entity-rpcs.sql:105`, kaljarv) | fix | 58e68e611 (165-25), 3a6a55f52, 79ad98e98 | The census above (32 functions, 0 untyped). `33-entity-type-collision.test.sql` 42/42 (RED before). pgTAP 1246 PASS. E2E `165-26` GREEN | Yes: every id-taking function now requires its entity type or is bound to one. `user_can`, `entity_project_id`, `is_child_nominee` and `get_entity_basic_data` became typed in 58e68e611, and `upsert_answers` in 3a6a55f52, which writes only the table the type names. The census of all 32 id-taking functions (79ad98e98) finds none left that resolves an id without its type. |

## Decisions Made

See `key-decisions` in the frontmatter. The one later plans should know: `upsert_answers` has no three-argument form any more. A PostgREST caller that omits `p_entity_type` gets a 404 for a missing function rather than a write to whichever table matches first.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Accuracy] Test 10's comments described the fall-through the change removes**
- **Found during:** Task 2
- **Issue:** Two comments in `10-schema-migrations.test.sql` said the organizations attempt runs only when the candidate update matched no row. One test description said the organization branch was gated "not merely by the id not matching a candidate". Both describe the removed fall-through.
- **Fix:** They now state the typed behaviour. The unknown-id case names the organization type, and its description reads "an id matching no organization raises the not-found exception". The assertion is unchanged and `plan (90)` is unchanged.
- **Commit:** `79ad98e98`

**2. [Rule 2 / D-04] Two test-title literals carried planning ids**
- **Found during:** Task 3
- **Issue:** `describe('_setAnswers read-back (decision B3)', ...)` and `it('... into the record (T-157-17)', ...)` failed the hygiene gate. They are string literals, not comments, so the comment-only commit could not fix them.
- **Fix:** Renamed in their own commit, after the comment commit. `code-identity.mjs --report` shows exactly those two title changes, and the file's 57 tests pass.
- **Commit:** `12fb44d3f`

**3. [Plan scope] Files the plan named that needed no change**
- `301-auth-functions.sql`, `19-entity-immutability.test.sql` and `07-rpc-security.test.sql` are unchanged. The census typed no further function, and the full pgTAP run after Task 1 failed only in `10`. `19` mentions `upsert_answers` only in a comment that stays true, and `07` does not reference it. `hygiene-allow/165-26.tsv` was not created, because no hit needed allowing.

**4. [Rule 3 - Environment] Port 5173 held by another checkout**
- A Vite server from `voting-advice-application-spike` was listening on `[::1]:5173`. The wrapper uses its own port (5273), which was free, so nothing was stopped.

**Total deviations:** 4 (1 accuracy, 1 D-04 literal, 1 scope note, 1 environment note). **Impact:** none on scope; no assertion was weakened.

## Issues Encountered

None beyond the deviations above.

## Known Stubs

None.

## Threat Flags

None. The change narrows an existing write path: the named table is the only one written, and `SECURITY INVOKER` and the `authenticated` grant are unchanged. No new endpoint, auth path or file access. T-165-43 is mitigated by `33` §9, and T-165-44 by the census.

## User Setup Required

None.

## Next Phase Readiness

- Ready for the gate plans (165-35 / 165-36). `upsert_answers` has one production caller, and it passes the type.
- The database was reset for this plan and has since run pgTAP and the E2E suite. Run a fresh `db:reset` before any `db:types` drift check, because the pgTAP helpers persist.

---
*Phase: 165-review-stack-comment-remediation*
*Completed: 2026-09-28*

## Self-Check: PASSED

- Created files exist: this SUMMARY and `hygiene-reads/165-26.tsv` (checked with `[ -f ]`).
- Commits `3a6a55f52`, `79ad98e98`, `2f25f3e74`, `12fb44d3f`, `0b02755a0` and `00a02230f` exist (`git cat-file -e`), as does the cited 165-25 commit `58e68e611`.
- `git status --short` lists only the maintainer's `MainContent.svelte` and `.planning/milestone.lock`.
