---
phase: 165-review-stack-comment-remediation
plan: 08
subsystem: database
tags: [comment-hygiene, postgres, supabase, authorization, column-grants, schema-migration-parity]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments (hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs) and the 165-03 comment-only schema method"
provides:
  - "303-column-grants.sql with one-item-per-line protected-column and Depends-on lists and a reference-free comment layer"
  - "301-auth-functions.sql with a one-bullet-per-function Functions list and concise docblocks for every authorization function"
  - "Regenerated 00001_initial_schema.sql, identical in code to the phase base"
  - "hygiene-reads/165-08.tsv read records for both schema files"
affects: [165-21, 165-24, 165-25, 165-26, 165-27]

actuals:
  tokens: 38346
  tasks: 3
  commits: 3
plan_head_before: 6c1ff0d99795f35da0c58c2440b3e59bca643894
plan_head_after: 8583e7a9dc13ac87d6b108e7a3d7e78f211b245a

tech-stack:
  added: []
  patterns:
    - "Comment runs are replaced by a content-anchored script that refuses a non-comment line on either side, then proven with code-identity.mjs"
    - "Function-body comments of public functions never contain `<name>(`, because 28-storage-table-parity.test.sql derives a call graph from prosrc with `LIKE '%' || name || '(%'`"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-08.tsv
  modified:
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/303-column-grants.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql

key-decisions:
  - "The nominations `Protected on INSERT` list now names only the five columns absent from the INSERT grant; the old list also named nine columns the grant admits, which the trigger guards instead"
  - "The header Functions list in 301-auth-functions.sql names all fifteen functions in the file, not only the four the old collapsed line named"
  - "caller_unconfirmed_originated_count's comment names both of its consumers (the insert policy and the cap check in enforce_nomination_confirmation), because the old text claimed the policy was the only one"
  - "No hygiene-allow/165-08.tsv was created: the gate reported zero hits on both files"

patterns-established:
  - "Before rewriting a function-body comment, diff the call-like tokens of the old and new body comments per function, in addition to reading every prosrc / pg_get_functiondef assertion"

requirements-completed: [165-SC3]

coverage:
  - id: D1
    description: "301-auth-functions.sql and 303-column-grants.sql pass the per-changed-file hygiene gate, with current read records"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-changed-files.sh --check-reads --files apps/supabase/supabase/schema/301-auth-functions.sql apps/supabase/supabase/schema/303-column-grants.sql (exit 0, total failing items 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No SQL character changed in either schema file or the regenerated migration"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "node .planning/phases/165-review-stack-comment-remediation/scripts/code-identity.mjs ship/v2.15-12-planning HEAD <301> <303> <00001_initial_schema.sql> (exit 0, 3 compared, 0 changed code)"
        status: pass
      - kind: other
        ref: "yarn assert:schema-migration-parity (exit 0, 26 schema files -> 5976 lines, generated copy is current)"
        status: pass
      - kind: other
        ref: "yarn assert:grant-permission-enum (exit 0) and yarn assert:rpc-nullability (exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Rewritten function-body comments leave every prosrc / pg_get_functiondef assertion's truth value unchanged"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "per-function diff of body-comment call-like tokens and assertion patterns, old vs new (grant_role_permissions and user_can only; no new `name(` token)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The rewritten comments accurately describe what each grant and function admits and why"
    verification: []
    human_judgment: true
    rationale: "Accuracy of prose against grant and function semantics is a reading judgment; the instruments prove only that no code changed and no hygiene pattern remains. Plan 165-24 re-runs the full pgTAP estate."

duration: 11min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 08: Authorization Functions and Column Grants Comment Hygiene Summary

**The comment layers of `301-auth-functions.sql` and `303-column-grants.sql` are rewritten to say what each grant and function admits, when it denies and why, with no planning references, rulings or measurement anecdotes. The collapsed header lists are now one bullet per item, both files pass the five-layer gate with zero hits, and `code-identity.mjs` proves no SQL character changed.**

## Performance

- **Duration:** about 11 min
- **Started:** 2026-09-27T19:01:32Z
- **Completed:** 2026-09-27T19:12:30Z
- **Tasks:** 3 of 3
- **Files modified:** 4 (2 schema, 1 regenerated migration, 1 read record)

## Measurements

- **PLAN_BASE:** `6c1ff0d99795f35da0c58c2440b3e59bca643894`. The identity proofs compare against `ship/v2.15-12-planning`, which is exact for these files: no earlier phase-165 commit touched them (`git diff --stat ship/v2.15-12-planning` was empty at the start).
- **Comment lines, `grep -cE '^[[:space:]]*--'`:**
  - `301-auth-functions.sql`: 198 at the phase base, 196 at HEAD. The header's one collapsed `Functions:` line became fifteen bullets. The count still falls because the docblocks are shorter and three short paragraphs were merged.
  - `303-column-grants.sql`: 83 at the phase base, 120 at HEAD. It rises because five collapsed `Protected (admin-only) columns:` lines and the two-line `Depends on:` list became one bullet per item.
- **File size:** `301` 48,727 to 38,537 bytes; `303` 16,187 to 10,697 bytes.
- **Gate at the phase base** (`--report-only`, both files): 71 failing items (layer1=22 layer2=40 layer3=9). After Task 1: 0 in `303`. After Task 2: 24, all below the `-- user_can: may the caller do this verb to this object?` docblock. After Task 3: 0.
- **`is_generated` in `303-column-grants.sql`:** 5 at `ship/v2.15-12-planning`, 5 at HEAD.

## Function-body comment check

A `--` comment between `$$` markers is stored in `pg_proc.prosrc`. `git grep -n -E 'prosrc|pg_get_functiondef' -- apps/supabase/supabase/tests/database` gives these assertions:

- `19-entity-immutability.test.sql`: `enforce_entity_immutability` (`IF OLD\.confirmed THEN`, and the entity-type label pattern).
- `20-storage-authority.test.sql`: `storage_path_can` (`p_verb`).
- `31-storage-cleanup.test.sql`: `starts_with` / `LIKE`, and `questions`, on storage functions.
- `16-anon-visibility.test.sql`: `pg_get_functiondef` of `nomination_entities_confirmed` must contain `project_open_for_voters` and `entity_has_confirmed_nomination`.
- `28-storage-table-parity.test.sql`: builds a call graph over the `prosrc` of every `public` function, with an edge wherever one body contains `<other public function name>(`.
- `14-grants-migration.test.sql:259` is a comment only.

Of the fifteen functions in `301-auth-functions.sql`, only two had body comments that changed. A script compared each function's body comments at the phase base and at HEAD.

| Function | Body comments changed | Assertions naming it | Result |
|---|---|---|---|
| `public.grant_role_permissions` | the seven matrix-arm comments (7 lines before, 7 after) | none by name; it is in the `28-storage-table-parity` graph | call-like tokens without a space: none before, none after. No edge was added or removed. |
| `public.user_can` | the NULL-claim, Half 1, Half 2, entity-reach and both NAMED BRANCH comments (10 lines before, 10 after) | none by name; it is in the `28-storage-table-parity` graph as the authority sink | call-like tokens: `option (` before, none after. Neither is a public function name followed directly by `(`, so no edge changed. `LIKE` appears once before and once after (the "Like branch 1" sentence). The `31-storage-cleanup` `LIKE` check reads a different function. |
| `private.nomination_entities_confirmed` | none (its body has no comments) | `16-anon-visibility` `pg_get_functiondef` | unchanged; both helper names are in its code |
| all other functions in the file | none | — | unchanged |

## Accomplishments

- **`303-column-grants.sql`:**
  - The header states the file's limit in one sentence: a grant pair is global per role, so it cannot depend on a row's state or tell two callers apart, and those rules live in `enforce_entity_immutability()` and `enforce_nomination_confirmation()`. `Depends on:` is one bullet per file.
  - Every `Protected (admin-only) columns:` list is one `-- - column - reason` bullet per column.
  - The `confirmed` blocks state the current fact: the column is in the allowed list and `enforce_entity_immutability()`'s rule 1 guards it. The history of when it moved is gone.
  - The nominations blocks keep the INSERT/UPDATE asymmetry of `confirmed`, the two-statement consequence for authenticated administrators, why the bulk paths are not reached, and the union-then-trigger design for the nine admin columns. The `projects` block keeps the re-parenting rationale, without the review id.
- **`301-auth-functions.sql`, header to `nomination_entities_confirmed` (Task 2):**
  - The `Functions:` list is one `-- - name(args) - purpose` bullet for each of the fifteen functions.
  - The `private` schema block keeps the oracle and `permission denied` reasoning.
  - The hook keeps the key-set contract and its test.
  - The matrix keeps "encoded once" and the fall-through arm.
  - The hierarchy hops state what they return and that NULL denies. `entity_project_id` is not argued for or against.
  - `nomination_entities_confirmed` drops the "PRE-... BODY, RESTORED BY ..." narrative. It keeps what the function checks and the negative control it must not void, and it cites `25-matrix-conformance.test.sql` for the eight-assembly identity.
- **`user_can` onward (Task 3):**
  - The `user_can` docblock states the two halves, the union rule and the state-versus-authority split. It also states that the function reads only the caller's `grants` claim, why claim fields are compared as text, and why it is SECURITY DEFINER with an empty `search_path`.
  - Each named branch says what it admits and why its permission is a literal.
  - `user_has_account_grant` keeps why it is not a `user_can` call and what the bounded disclosure is. The ruling history is gone.
  - The four nomination helpers keep their deny direction and security rationale. The reflow-damaged line break in `caller_nominated_in_contest` is repaired.

## Task Commits

1. **Task 1 (tracer): `303-column-grants.sql` end to end**: `38d1e3bc4` (docs). Tracer gate: verify re-run at HEAD (identity 0, gate 0, parity 0), then expanded.
2. **Task 2: `301-auth-functions.sql` from the header to the `user_can` docblock**: `3f0b28e77` (docs)
3. **Task 3: `user_can` and the remaining functions, whole-file gates, read record**: `8583e7a9d` (docs)

Every commit carries the `Hygiene: D-04` trailer and stages explicit paths only.

## Verification (statuses read directly, never through a pipe)

| Command | Exit | Output |
|---|---|---|
| `bash .../hygiene-changed-files.sh --check-reads --files <301> <303>` | 0 | `total failing items: 0 ... unread=0` |
| `node .../code-identity.mjs ship/v2.15-12-planning HEAD <301> <303> <00001_initial_schema.sql>` | 0 | `3 compared, 0 changed code` |
| `yarn assert:schema-migration-parity` | 0 | `26 schema file(s) -> 5976 line(s); ... generated copy is current` |
| `yarn assert:grant-permission-enum` | 0 | `grant_permission: 23 / 23 / 23`, 0 findings |
| `yarn assert:rpc-nullability` | 0 | clean |
| `yarn prettier --check <301> <303>` | 0 | all files use Prettier style |
| `bash .../tip-proofs.sh` | 0 | all proofs PASS, including the `jsonb_set(claims, '{grants}'` proof that names this file |
| `bash .../ledger-check.sh` | 0 | this plan owns no review comments; the 165-05 rows were already filled |

## Files Created/Modified

- `apps/supabase/supabase/schema/303-column-grants.sql`: comments only.
- `apps/supabase/supabase/schema/301-auth-functions.sql`: comments only, including the body comments of `grant_role_permissions` and `user_can`.
- `apps/supabase/supabase/migrations/00001_initial_schema.sql`: regenerated by `yarn schema:regenerate`. Plan 165-21 records the read, so this plan does not.
- `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-08.tsv`: `303-column-grants.sql` at blob `516e95bb5a1391ede5d5da75ccf895f8c9933509`, `301-auth-functions.sql` at blob `9924bd5f991c6f0e758f1f418682bf5d17806cb1`.

## Decisions Made

See `key-decisions` in the frontmatter. Two corrections came from reading the tip rather than the old comments:

- The nominations INSERT list called `name`, `short_name`, `info`, `color`, `image`, `sort_order`, `subtype`, `election_symbol` and `external_id` protected. The `GRANT INSERT` below it admits all nine, and `enforce_nomination_entity_columns()` refuses them to a caller without `project.edit_nominations`. The list now names only the columns the grant omits, and the `Allowed on INSERT` paragraph keeps the trigger's role.
- `caller_unconfirmed_originated_count` is called by the nomination insert policy and also by the cap check in `enforce_nomination_confirmation()` (011-validation-functions.sql). That check is scoped to `current_user = 'authenticated'`, so the "harmless for a tokenless caller" reasoning still holds for both consumers, and the comment now says so.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Accuracy] Two comments contradicted the code at the tip**
- **Found during:** Tasks 1 and 3
- **Issue:** The nominations `Protected on INSERT` list named nine columns the INSERT grant admits. The cap-count comment said a policy was its only consumer, but the cap trigger also calls it.
- **Fix:** Both are now restated to match the code (see Decisions Made). Comment-only.
- **Files modified:** `303-column-grants.sql`, `301-auth-functions.sql`
- **Verification:** code-identity exit 0; gate exit 0
- **Committed in:** `38d1e3bc4`, `8583e7a9d`

**2. [Rule 3 - Blocking] The comment-line acceptance criterion needed three paragraph merges**
- **Found during:** Task 3
- **Issue:** Once the fifteen header bullets were added, `301` had 201 comment lines, above the base's 198.
- **Fix:** Three short paragraphs were merged into neighbouring ones: the hook's two opening lines, `own` into the REACH item, and "reads only the grants claim" into the claim-fields paragraph. The count is now 196.
- **Committed in:** `8583e7a9d`

**Total deviations:** 2 auto-fixed (1 accuracy, 1 blocking). **Impact on plan:** none on scope. No SQL changed.

## Issues Encountered

- `hygiene-changed-files.sh` layer 5 (lint rule 2) flagged the factions note placed directly under the unpunctuated allowed-columns line. The note was moved above the list. The gate then reported 0.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plans 165-25, 165-26 and 165-27 edit these files. Any edit voids the recorded blobs, so each of those plans must re-run `hygiene-changed-files.sh --files <file>` and re-record the read. Plan 165-27 removes the five `is_generated` bullets in `303` together with the column.
- Body comments in `user_can` and `grant_role_permissions` must never contain a public function name followed directly by `(`. That text would add an edge to the `28-storage-table-parity.test.sql` call graph.
- Following the wave-safety note, no `db:reset`, pgTAP, build or E2E was run. Plan 165-24 resets and re-tests the applied database.

## Self-Check: PASSED

- `apps/supabase/supabase/schema/301-auth-functions.sql`, `apps/supabase/supabase/schema/303-column-grants.sql`, `apps/supabase/supabase/migrations/00001_initial_schema.sql` and `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-08.tsv` exist.
- Commits `38d1e3bc4`, `3f0b28e77` and `8583e7a9d` are in `git log`.
- `git status --short` lists only the maintainer's unstaged `MainContent.svelte` and the untracked `.planning/milestone.lock`. Neither was staged.
