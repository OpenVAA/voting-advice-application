---
phase: 165-review-stack-comment-remediation
plan: 16
subsystem: database
tags: [comment-hygiene, postgres, supabase, rpc, bulk-operations, schema-migration-parity]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments (hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs) and the 165-08 / 165-12 comment-only schema method"
provides:
  - "Eleven function and utility schema files (000, 001, 010, 200, 500, 501, 502, 503, 504, 505, 900) with a reference-free, narrative-free comment layer and one-item-per-line header lists"
  - "Regenerated 00001_initial_schema.sql, code-identical to the phase base"
  - "hygiene-reads/165-16.tsv read records for all eleven schema files"
affects: [165-21, 165-24, 165-25, 165-26, 165-27]

actuals:
  tokens: 22974
  tasks: 3
  commits: 3
plan_head_before: a9eb2d3d3248a7505ad8c911f770d5062baac235
plan_head_after: 6e56fe90495d682f8cee9258e98a1a66024d5896

tech-stack:
  added: []
  patterns:
    - "Collapsed JSON input examples in SQL docblocks become `-- - ` bullets after a sentence ending in a colon, because the repo's forced-line-break rule (layer 5) rejects multi-line JSON inside `--` comments and SQL comments have no fence precedent"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-16.tsv
  modified:
    - apps/supabase/supabase/schema/000-enums.sql
    - apps/supabase/supabase/schema/001-role-settings.sql
    - apps/supabase/supabase/schema/010-utility-functions.sql
    - apps/supabase/supabase/schema/500-external-id.sql
    - apps/supabase/supabase/schema/501-bulk-operations.sql
    - apps/supabase/supabase/schema/502-email-helpers.sql
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/schema/504-admin-rpcs.sql
    - apps/supabase/supabase/schema/505-question-rpcs.sql
    - apps/supabase/supabase/schema/900-test-helpers.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql

key-decisions:
  - "bulk_import's input example now uses a factions row for the organization reference. The old example put it on a candidates row, but _bulk_upsert_record has no candidates relationship arm, so that key would not resolve"
  - "502's Depends on list adds 100-tenancy.sql (projects) and 301-auth-functions.sql (private.entity_project_id), which the recipient-bound test reads but the old list omitted"
  - "505's docblock no longer cites migration 00006, which does not exist (the tree has only 00001)"
  - "200-indexes.sql needed no change: its read is recorded at the phase-base blob"
  - "No hygiene-allow/165-16.tsv was created: the gate reported zero hits on all eleven files"
  - "get_entity_basic_data's Withheld list, with its is_generated token, is unchanged, and neither get_entity_basic_data nor upsert_answers is described as type-blind or typed, leaving both to plans 165-25, 165-26 and 165-27"

patterns-established:
  - "Before rewriting a comment inside `_bulk_upsert_record`'s CASE block, check the dev-seed parser: it slices from the first `CASE p_table_name` to `END CASE;` and matches `WHEN '<t>' THEN relationships := '...'::jsonb;`, so a comment must not contain any of those tokens"

requirements-completed: [165-SC3]

coverage:
  - id: D1
    description: "Each of the eleven schema files passes the per-changed-file hygiene gate, with current read records"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-changed-files.sh --check-reads --files <the eleven files> (exit 0, total failing items 0, read-log unread 0, VERDICT: CLEAN)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No SQL character changed in any of the eleven files or the regenerated migration"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "node .planning/phases/165-review-stack-comment-remediation/scripts/code-identity.mjs ship/v2.15-12-planning WORKTREE <the eleven files> apps/supabase/supabase/migrations/00001_initial_schema.sql (exit 0, 12 compared, 0 changed code)"
        status: pass
      - kind: other
        ref: "yarn assert:schema-migration-parity && yarn assert:rpc-nullability && yarn assert:grant-permission-enum (all exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Rewritten function-body comments leave every prosrc / pg_get_functiondef assertion's truth value unchanged"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "per-function comparison of body-comment tokens, phase base vs worktree (see the Function-body comment check table)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The collapsed header lists are one `-- - ` bullet per item"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "000 types list, 010/501/503/504/505 Functions lists, 500/501/502 Depends on lists, 500 transition list, 900 Parameters list (read in the diff); layer 5 reports 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The rewritten comments accurately describe what each function, type and grant does and why"
    verification: []
    human_judgment: true
    rationale: "Whether the prose matches function semantics is a reading judgment. The instruments prove only that no code changed and no hygiene pattern remains. Plan 165-24 resets the database and re-runs the full pgTAP estate."

duration: 11min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 16: Function and Utility Schema Files Comment Hygiene Summary

**The comment layers of the eleven function and utility schema files (`000`, `001`, `010`, `200`, `500`, `501`, `502`, `503`, `504`, `505`, `900`) now state what each type, function and grant does and why. They carry no brief sections, decision ids, review ids, plan ids, spike ids, planning paths, measurements or history. Every collapsed header list is one bullet per item. All eleven files pass the five-layer gate with zero hits, and `code-identity.mjs` proves that no SQL character changed.**

## Performance

- **Duration:** about 11 min
- **Started:** 2026-09-27T20:54:18Z
- **Completed:** 2026-09-27T21:05:05Z
- **Tasks:** 3 of 3
- **Files modified:** 12, plus 1 created (10 schema files, 1 regenerated migration, 1 read record; `200-indexes.sql` was read and recorded unchanged)

## Measurements

- **PLAN_BASE:** `a9eb2d3d3248a7505ad8c911f770d5062baac235`. The identity proofs compare against `ship/v2.15-12-planning`. That is exact for these files: at the start, `git diff --stat ship/v2.15-12-planning` listed none of them.
- **Gate at the start** (`--report-only`, all eleven files): 29 failing items (layer1=13, layer2=12, layer3=4). After Task 1 the seven small files were at 0. Task 2's first pass had 8 layer-5 hits: multi-line JSON examples inside `--` comments. Those examples became bullets, and the files went to 0. At the end, all eleven files are at 0.
- **Comment lines (`grep -cE '^[[:space:]]*--'`), base to HEAD, and file bytes:**

| File | Comment lines | Bytes |
|---|---|---|
| `000-enums.sql` | 14 → 20 | 4,806 → 3,530 |
| `001-role-settings.sql` | 9 → 9 | 942 → 771 |
| `010-utility-functions.sql` | 18 → 19 | 1,666 → 1,667 |
| `200-indexes.sql` | 13 → 13 | 3,456 → 3,456 (unchanged) |
| `500-external-id.sql` | 16 → 23 | 5,115 → 4,937 |
| `501-bulk-operations.sql` | 95 → 100 | 15,988 → 15,771 |
| `502-email-helpers.sql` | 35 → 41 | 10,827 → 8,636 |
| `503-entity-rpcs.sql` | 44 → 47 | 15,663 → 14,140 |
| `504-admin-rpcs.sql` | 9 → 9 | 1,160 → 1,236 |
| `505-question-rpcs.sql` | 18 → 18 | 4,459 → 4,030 |
| `900-test-helpers.sql` | 21 → 24 | 2,942 → 2,949 |

  The comment-line counts rise because collapsed lists became one bullet per item. The byte counts fall because the prose was cut.
- **`is_generated` in `503-entity-rpcs.sql`:** 1 at the phase base and 1 at HEAD.

## Function-body comment check

A `--` comment between `$$` markers is stored in `pg_proc.prosrc`. `git grep -n -E 'prosrc|pg_get_functiondef' -- apps/supabase/supabase/tests/database` finds assertions in suites 16, 19, 20, 28 and 31. None of them names a function in these eleven files except through suite 28. Suite 28 builds a call graph over the `prosrc` of every `public` function, with an edge wherever one body contains `<other public function name>(`.

Two text readers outside pgTAP also read these files:

- `packages/dev-seed/tests/template/permittedKeys.test.ts` slices `_bulk_upsert_record`'s `CASE p_table_name … END CASE;` block. It then parses each `WHEN '<table>' THEN relationships := '…'::jsonb;` arm and compares the schema copy of the block with the migration copy, byte for byte.
- `assertKnownRowProps.test.ts` parses the `skip_columns` array.

`scripts/bodycheck` (a scratch script) compared each function's body comments at the phase base and in the worktree. It counted call-like tokens in the comments, and it counted whole-body occurrences of calls, `LIKE`, `questions`, entity-type labels and `p_verb`.

| Function | Body comments changed | Assertions naming it | Result |
|---|---|---|---|
| `public._bulk_upsert_record` | the relationship-arm comment (1 line to 1), and the joined upsert comment (1 line split into 2) | suite 28 graph; the dev-seed CASE-block parser | Call-like tokens in comments: none before, none after. The whole-body call count stays 1, and `LIKE` stays 0 (one "like" was reworded to keep it there). The new comment has no `CASE p_table_name`, `END CASE;` or `WHEN '…' THEN` token. `permittedKeys.test.ts` and `assertKnownRowProps.test.ts` pass (60/60). |
| `public.resolve_email_variables` | seven comments (19 lines before, 19 after) | suite 28 graph | Call-like tokens in comments: none before, none after. The whole-body call count stays 4. `validate_nomination` is still named without a paren. |
| `public.get_questions` | the project-predicate comment (1 line to 1) | suite 28 graph | Call-like tokens: none before, none after. The whole-body call count stays 0. |
| `public.get_nominations` | the join-placement, project-predicate and defence-in-depth comments (6 lines to 6) | suite 28 graph; the nullability gate reads its `RETURNS TABLE` list, which is code | Call-like tokens: none before, none after. The whole-body call count stays 0. `assert:rpc-nullability` still derives 31 columns. |
| `resolve_external_ref`, `bulk_import`, `bulk_delete`, `get_entity_basic_data`, `get_candidate_user_data`, `upsert_answers`, `update_updated_at`, `get_localized`, `enforce_external_id_immutability`, `merge_question_custom_data`, `jsonb_recursive_merge`, `merge_jsonb_column` | **none** (prosrc is byte-identical) | suite 28 graph only | unchanged |

## Accomplishments

- **Task 1 (tracer): the seven small files.**
  - `000-enums.sql`: the collapsed header is now one bullet per type.
    - The scope and role comments state the constraint without brief sections or the `D-02` id.
    - The permission comment says the enum is in capability-matrix order and that the order is persisted, and names the guard that checks it.
    - `storage_verb` says why `storage_path_can` branches on the verb and why it is an enum. The operator-decision and `K2`/`K3` references are gone.
    - `nomination_shape` says the members are exactly the three flows. The `D-16` history and the "this phase exists to end" line are gone.
  - `001-role-settings.sql`: the timeout rationale no longer carries the spike id, the measurement figures or the `.planning/todos` path.
  - `010`, `500`, `504` and `900`: their collapsed `Functions:`, `Depends on:`, transition and `Parameters:` lists are one bullet per item. `504` now says that a row the policy hides gets the same error as an unknown id.
- **Task 2: `501`, `502`, `505`.**
  - `501`: the header, `Depends on:` and both input examples are bullets.
    - The `bulk_import` example uses a factions row (see Decisions).
    - The relationship-arm body comment states the dev-seed parity constraint without the plan history.
    - The joined `ON CONFLICT` comment is split into two lines.
    - The grant comment's broken sentence is rewritten.
  - `502`: `Depends on:` is one bullet per file, and two missing dependencies are added.
    - The body comments state the recipient bound, the two resolved entity kinds, the candidate-first order and the join shape.
    - The review ids, plan ids, brief section, ratification and measurement narrative are gone.
  - `505`: the reference to a nonexistent migration is gone.
- **Task 3: `503` and the plan-wide gates.**
  - The `Functions:` header is one bullet per function.
  - `get_nominations` keeps the join-placement and project-bound reasons. It states the defence-in-depth filter as the one class the filter still catches: a candidate hidden by `anon_select_candidates`' terms-of-use clause.
  - `get_entity_basic_data` and `get_candidate_user_data` no longer carry review ids, the spec section or the "no longer" narrative.
  - `upsert_answers` keeps the fact that the ids are not guaranteed disjoint, without the narrative or the advice.

## Task Commits

1. **Task 1: the seven small files** (`000`, `001`, `010`, `200`, `500`, `504`, `900`): `ce3c0a14a` (docs). The tracer gate was re-run before expanding: identity 0, gate 0, parity 0.
2. **Task 2: `501`, `502`, `505`:** `e552dc385` (docs)
3. **Task 3: `503`, the plan-wide gates and the read records:** `6e56fe904` (docs)

Every commit carries the `Hygiene: D-04` trailer and stages explicit paths only.

## Verification (statuses read directly, never through a pipe)

| Command | Exit | Output |
|---|---|---|
| `node .../code-identity.mjs ship/v2.15-12-planning WORKTREE <the eleven files> <00001_initial_schema.sql>` | 0 | `12 compared, 0 changed code` |
| `bash .../hygiene-changed-files.sh --check-reads --files <the eleven files>` | 0 | `total failing items: 0 ... unread=0`, `VERDICT: CLEAN` |
| `yarn assert:schema-migration-parity` | 0 | `generated copy is current` |
| `yarn assert:rpc-nullability` | 0 | 3 RPCs (4 / 31 / 14 columns), 0 violations |
| `yarn assert:grant-permission-enum` | 0 | 0 findings; self-test 7/7 |
| `node_modules/.bin/prettier --check <changed schema files> <00001_initial_schema.sql>` | 0 | all files use Prettier style |
| `bash .../tip-proofs.sh` | 0 | all proofs PASS, including the `LATER PLAN: 165-16` proofs on `000-enums.sql` and `503-entity-rpcs.sql` |
| `bash .../ledger-check.sh` | 0 | `VERDICT: PASSED`. This plan owns no review comments, and the 165-05 rows were already filled. |
| `npx vitest run tests/template/permittedKeys.test.ts tests/assertKnownRowProps.test.ts` (in `packages/dev-seed`) | 0 | 60 passed; both read `501-bulk-operations.sql` from disk |

## Files Created/Modified

- `apps/supabase/supabase/schema/{000,001,010,500,501,502,503,504,505,900}-*.sql`: comments only.
- `apps/supabase/supabase/schema/200-indexes.sql`: unchanged. Its comments were already clean, and the read was recorded at blob `e05dbee89efb9fb2caf32bf3aba2cbf5a03355c7`.
- `apps/supabase/supabase/migrations/00001_initial_schema.sql`: regenerated by `yarn schema:regenerate`. Plan 165-21 records its read, so this plan does not.
- `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-16.tsv`: 11 rows, one per schema file, each at its HEAD blob.

## Decisions Made

See `key-decisions` in the frontmatter. Reading the code rather than the old comments produced three corrections:

- The `bulk_import` example sent `"organization"` on a candidates row. `_bulk_upsert_record` has no candidates relationship arm, so that key would not resolve. The example now uses factions, whose arm resolves `organization`.
- `502`'s `Depends on:` list omitted `projects` and `private.entity_project_id`, although the recipient-bound test reads both.
- `505` sent the reader to "migration 00006", but the migrations directory holds only `00001_initial_schema.sql`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Accuracy] Three comments disagreed with the code at the tip**
- **Found during:** Task 2
- **Issue:** One example did not match the relationship map, one dependency list was incomplete, and one comment cited a migration that does not exist.
- **Fix:** All three now match the code (see Decisions Made). Comment-only.
- **Files modified:** `501-bulk-operations.sql`, `502-email-helpers.sql`, `505-question-rpcs.sql`
- **Verification:** code-identity exit 0; gate exit 0
- **Committed in:** `e552dc385`

**2. [Rule 3 - Blocking] Multi-line JSON examples failed layer 5**
- **Found during:** Task 2
- **Issue:** Restoring the collapsed `bulk_import` / `bulk_delete` input examples as indented multi-line JSON tripped the repo's forced-line-break rule (8 hits). Lines ending in `{` or `,` count as forced breaks.
- **Fix:** Each example is now one sentence ending in a colon, followed by one `-- - ` bullet per collection. The list-item exclusion admits that shape.
- **Committed in:** `e552dc385`

**3. [Verification scope] Two dev-seed unit specs were run**
- The wave-safety note limits runs to `schema:regenerate` and the three asserts. `permittedKeys.test.ts` and `assertKnownRowProps.test.ts` parse `501-bulk-operations.sql` from disk, and this plan edited a comment inside the block they parse. Both specs were run once. They are read-only and use no database, build or E2E.

**Total deviations:** 3 (1 accuracy, 1 blocking-format, 1 verification scope). **Impact on plan:** none. No SQL changed.

## Issues Encountered

- In zsh, an unquoted `$ALL` variable is passed to `code-identity.mjs` as one argument, and the script exits 2 (path does not exist). The re-run used the plan's literal command and exited 0.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plans 165-25 and 165-26 edit `502` and `503`, and plan 165-27 removes `is_generated`. Any edit voids the recorded blobs, so those plans must re-run `hygiene-changed-files.sh --files <file>` and re-record the read.
- `503` still has the "Withheld today" list with `is_generated`, and `upsert_answers`' "Not enforced" paragraph. Plan 165-26 replaces the paragraph.
- A comment inside `_bulk_upsert_record`'s CASE block must not contain `CASE p_table_name`, `END CASE;` or `WHEN '<t>' THEN relationships := … ::jsonb;`, because the dev-seed parser reads that block. No public function body comment may contain a public function name directly followed by `(` (suite 28).
- Following the wave-safety note, this plan ran no `db:reset`, pgTAP, build or E2E. Plan 165-24 resets and re-tests the applied database.

## Self-Check: PASSED

- The files exist: `apps/supabase/supabase/schema/503-entity-rpcs.sql` (contains `get_entity_basic_data`), `apps/supabase/supabase/schema/000-enums.sql` (contains `CREATE TYPE`), `apps/supabase/supabase/migrations/00001_initial_schema.sql` and `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-16.tsv`.
- Commits `ce3c0a14a`, `e552dc385` and `6e56fe904` are in `git log`.
- `git status --short` lists only the maintainer's unstaged `MainContent.svelte` and the untracked `.planning/milestone.lock`. Neither was staged.
