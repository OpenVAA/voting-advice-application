---
phase: 165-review-stack-comment-remediation
plan: 12
subsystem: database
tags: [comment-hygiene, postgres, supabase, storage, triggers, schema-migration-parity]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments (hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs) and the 165-08 comment-only schema method"
provides:
  - "011-validation-functions.sql with a one-bullet-per-function header and reference-free docblocks for every validation function and trigger"
  - "400-storage.sql with one-item-per-line Depends on / Provides lists and a reference-free comment layer for the storage helpers, policies and cleanup triggers"
  - "Regenerated 00001_initial_schema.sql, identical in code to the phase base"
  - "hygiene-reads/165-12.tsv read records for both schema files"
affects: [165-21, 165-24, 165-25]

actuals:
  tokens: 36294
  tasks: 3
  commits: 3
plan_head_before: 5a3390b3fdc7ee1d309c6d8d0fc0257b8e818af3
plan_head_after: b4491928d5e8968c5809dbb87c94fad16231341d

tech-stack:
  added: []
  patterns:
    - "Per-function comparison of body comments at the phase base and in the worktree, counting the exact tokens each prosrc assertion matches (call-like tokens, LIKE, questions, entity-type labels, quoted permission literals, p_verb)"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-12.tsv
  modified:
    - apps/supabase/supabase/schema/011-validation-functions.sql
    - apps/supabase/supabase/schema/400-storage.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql

key-decisions:
  - "The 011 header Functions list names all nine functions; the old collapsed line omitted enforce_nomination_confirmation"
  - "storage_path_is_public's project-structure comment says five tables, matching its IN list; the old text said six"
  - "storage_path_can's docblock now states why it is SECURITY DEFINER (the type/id lookup reads the table, not the caller's RLS view; authority still comes from user_can), which the old text never said"
  - "The cleanup-function body comments (cleanup_entity_storage_files, cleanup_old_image_file, cleanup_old_answer_files) were left unchanged, so suite 31's prosrc checks read identical text"
  - "No hygiene-allow/165-12.tsv was created: the gate reported zero hits on both files"

patterns-established:
  - "A docblock that restates a count (tables in a list, policies in a file) is re-derived from the code it describes before being kept"

requirements-completed: [165-SC3]

coverage:
  - id: D1
    description: "400-storage.sql and 011-validation-functions.sql pass the per-changed-file hygiene gate, with current read records"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-changed-files.sh --check-reads --files apps/supabase/supabase/schema/400-storage.sql apps/supabase/supabase/schema/011-validation-functions.sql (exit 0, total failing items 0, unread=0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No SQL character changed in either schema file or the regenerated migration"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "node .planning/phases/165-review-stack-comment-remediation/scripts/code-identity.mjs ship/v2.15-12-planning WORKTREE <400> <011> <00001_initial_schema.sql> (exit 0, 3 compared, 0 changed code)"
        status: pass
      - kind: other
        ref: "yarn assert:schema-migration-parity (exit 0, generated copy is current)"
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
    description: "The rewritten comments accurately describe what each function, policy and trigger does and why"
    verification: []
    human_judgment: true
    rationale: "Accuracy of prose against function semantics is a reading judgment; the instruments prove only that no code changed and no hygiene pattern remains. Plan 165-24 resets the database and re-runs the full pgTAP estate."

duration: 10min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 12: Storage and Validation Functions Comment Hygiene Summary

**The comment layers of `011-validation-functions.sql` and `400-storage.sql` now say what each function, policy and trigger checks, when it refuses and why, with no plan ids, decision ids, brief sections, commit ids, dates or probe transcripts. The collapsed header lists are one bullet per item. Both files pass the five-layer gate with zero hits, and `code-identity.mjs` proves no SQL character changed.**

## Performance

- **Duration:** about 10 min
- **Started:** 2026-09-27T19:58:59Z
- **Completed:** 2026-09-27T20:08:35Z
- **Tasks:** 3 of 3
- **Files modified:** 4 (2 schema, 1 regenerated migration, 1 read record)

## Measurements

- **PLAN_BASE:** `5a3390b3fdc7ee1d309c6d8d0fc0257b8e818af3`. The identity proofs compare against `ship/v2.15-12-planning`. That is exact for these files: `git diff --stat ship/v2.15-12-planning` on both was empty at the start.
- **Gate at the start** (`--report-only`, both files): 76 failing items (layer1=34 layer2=39 layer3=3). After Task 1: 0 in `011`. After Task 2: 29 in `400`, all at or below the `delete_storage_object` docblock (line 597 and later). After Task 3: 0 in both.
- **Comment lines, `grep -cE '^[[:space:]]*--'`:**
  - `011-validation-functions.sql`: 134 at the phase base, 149 at HEAD. The rise comes from the one collapsed `Functions:` line, which became nine bullets, and from three collapsed example lines that were split.
  - `400-storage.sql`: 170 at the phase base, 181 at HEAD. The rise comes from the two collapsed header lines, which became six `Depends on:` and ten `Provides:` bullets, and from the collapsed path-format line, which became three bullets.
- **File size:** `011` went from 33,796 to 29,641 bytes, and `400` from 47,159 to 42,333 bytes.

## Function-body comment check

A `--` comment between `$$` markers is stored in `pg_proc.prosrc`. `git grep -n -E 'prosrc|pg_get_functiondef' -- apps/supabase/supabase/tests/database` finds these assertions on functions in these files:

- `19-entity-immutability.test.sql`: `enforce_entity_immutability` must match `IF OLD\.confirmed THEN`. It must also contain no `entity_type` label: the pattern is `candidate|alliance|...`, derived from `pg_enum` and matched case-sensitively.
- `20-storage-authority.test.sql`: `storage_path_can` must contain `p_verb` (count 1). Its quoted `'entity|project|nomination.read_*'` literals must be 3 distinct, its `edit_*` literals 6 distinct, and the two sets must not intersect.
- `28-storage-table-parity.test.sql`: a call graph over the `prosrc` of every `public` function. An edge exists wherever one body contains `<other public function name>(`.
- `31-storage-cleanup.test.sql`: `cleanup_entity_storage_files` must match `starts_with\s*\(\s*(\w+\.)?name\s*,\s*path_prefix\s*\)` and must not match `\mLIKE\M` (case-insensitive). `cleanup_old_answer_files` must not match `questions` (case-insensitive).

A script compared each function's body comments at the phase base and in the worktree. It counted exactly the tokens those patterns match.

| Function | Body comments changed | Assertions naming it | Result |
|---|---|---|---|
| `public.is_image` | the `WHEN raise_exception` rationale (1 line before, 1 after) | none by name; it is in the suite-28 graph | call-like tokens in comments: none before, none after. The whole-body call count stays 1 (the `validate_image(` code call). |
| `public.validate_nomination` | the tenancy comment and the own-organization comment (9 lines before, 9 after) | none by name; it is in the suite-28 graph | call-like tokens in comments: none before, none after. No edge changed. |
| `public.enforce_nomination_confirmation` | the cap comment (8 lines before, 8 after) | none by name; it is in the suite-28 graph | call-like tokens in comments: none before, none after. The whole-body call count stays 5. |
| `public.enforce_entity_immutability` | **none**: its three body comments are unchanged | suite 19 (`IF OLD\.confirmed THEN`; no entity-type label) | prosrc is byte-identical, so both assertions keep their truth value. Its docblock sits outside `$$`. |
| `public.storage_path_can` | the mapping, entity-scope, account/global, fall-through and both refusal comments (7 lines before, 7 after) | suite 20 (`p_verb`, 3/6/0 permission literals); suite 28 graph | comments contain no quoted permission literal before or after. The whole-body quoted-literal count stays 12, `p_verb` stays 7 and call-like tokens stay 4. The 3/6/0 answer and the `p_verb` count of 1 are unchanged. |
| `public.storage_path_is_public` | the five-table and entity-table comments (4 lines before, 4 after) | suite 28 graph | call-like tokens in comments: none before, none after. The whole-body call count stays 9. |
| `public.cleanup_entity_storage_files` | **none** | suite 31 (`starts_with(... name, path_prefix)`, no `LIKE`) | prosrc is byte-identical. The `LIKE` discussion stays in the docblock, outside `$$`. |
| `public.cleanup_old_answer_files` | **none** | suite 31 (no `questions`) | prosrc is byte-identical. The `questions` join discussion stays in the docblock, outside `$$`. |
| `public.delete_storage_object`, `public.referenced_storage_paths`, `public.cleanup_old_image_file`, and `is_localized_string`, `is_valid_choice_id`, `validate_image`, `validate_answer_value`, `enforce_nomination_entity_columns` | none | suite 28 graph only | unchanged |

## Accomplishments

- **`011-validation-functions.sql` (Task 1, tracer):**
  - The header's collapsed `Functions:` line is one `-- - name(args) - purpose` bullet per function, and the missing `enforce_nomination_confirmation` entry is added.
  - `is_localized_string`, `is_valid_choice_id`, `validate_image` and `validate_answer_value` get their collapsed example and return lines split into sentences.
  - `is_image` states that it is the predicate form of the rule, that no schema object calls it, and why only `raise_exception` becomes FALSE. The "no caller today / until one of those lands" narrative is gone.
  - `validate_nomination` states the tenancy rule, the own-organization rule and why it is SECURITY DEFINER, and it keeps the 23-nominations-write test. The plan history, the threat-register id and the measurement are gone. The accepted disclosure is kept as one reason.
  - `enforce_nomination_confirmation` keeps its three rules, why rule 2 is scoped to the effective role (with the two-seed-run test), the project-editor consequence, the cap's reason to repeat the policy, and why it is SECURITY INVOKER.
  - `enforce_nomination_entity_columns` states the arrangement, not the history of the old grant.
  - `enforce_entity_immutability` keeps its two rules in present tense. Rule 1 refuses a flag change in either direction. Rule 2 is read from the OLD row, and rule 1 runs first. The docblock also keeps why a trigger and not a grant or policy, the non-absolute freeze and its test, the role scope and its accepted cost, why SECURITY INVOKER, the TG_ARGV-only body and the stable refusal prefixes.
- **`400-storage.sql` header through the policies (Task 2):**
  - `Depends on:` has one bullet per file, and `Provides:` has one bullet per object.
  - `storage_path_can` keeps the verb-to-permission mapping over the eleven segments, the read/write separability and its two test cases, the caller-controlled-text rule, and the type/id and project checks. It now also states why it is SECURITY DEFINER. The ratification history, counts and measurements are gone.
  - `storage_path_is_public` keeps the visibility rule, why it is not `user_can`, the project-level conjunct and its test, the terms-of-use guards, and the accepted anon-list cost with the private-bucket caveat. The timings and spike reference are gone.
  - The policy section keeps the path format (now three bullets), the two-questions split and the one-string-per-scope assertion. The twelve write policies' block states what each name's prefix means, not the rename history.
- **`400-storage.sql` cleanup half (Task 3):**
  - `delete_storage_object` keeps the single-object route, the untrusted-path whitelist and its reasoning, the API-role revoke, the accepted public-URL residual and the degrade behaviour. The commit ids, dates, probe transcripts, spike ids and decision ids are gone.
  - `cleanup_entity_storage_files`, `cleanup_old_image_file` and `cleanup_old_answer_files` keep every limit in present tense. The "no longer" wording and the history of the prefix bug are gone.

## Task Commits

1. **Task 1 (tracer): `011-validation-functions.sql` end to end:** `6e47fb511` (docs). Tracer gate: the verify commands were re-run at HEAD (identity 0, gate with `--check-reads` 0, parity 0), then work continued.
2. **Task 2: `400-storage.sql` header, `storage_config`, the path functions and the policies:** `f9f7cfc69` (docs)
3. **Task 3: `400-storage.sql` cleanup functions and triggers, whole-file gates, read record:** `b4491928d` (docs)

Every commit carries the `Hygiene: D-04` trailer and stages explicit paths only.

## Verification (statuses read directly, never through a pipe)

| Command | Exit | Output |
|---|---|---|
| `bash .../hygiene-changed-files.sh --check-reads --files <400> <011>` | 0 | `total failing items: 0 ... unread=0` |
| `node .../code-identity.mjs ship/v2.15-12-planning WORKTREE <400> <011> <00001_initial_schema.sql>` | 0 | `3 compared, 0 changed code` |
| `yarn assert:schema-migration-parity` | 0 | `generated copy is current` |
| `node_modules/.bin/prettier --check <400> <011> <00001_initial_schema.sql>` | 0 | all files use Prettier style |
| `bash .../tip-proofs.sh` | 0 | all proofs PASS |
| `bash .../ledger-check.sh` | 0 | `VERDICT: PASSED`; this plan owns no review comments, and the 165-05 rows were already filled |

## Files Created/Modified

- `apps/supabase/supabase/schema/011-validation-functions.sql`: comments only, including the body comments of `is_image`, `validate_nomination` and `enforce_nomination_confirmation`.
- `apps/supabase/supabase/schema/400-storage.sql`: comments only, including the body comments of `storage_path_can` and `storage_path_is_public`.
- `apps/supabase/supabase/migrations/00001_initial_schema.sql`: regenerated by `yarn schema:regenerate`. Plan 165-21 records the read, so this plan does not.
- `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-12.tsv`: `011-validation-functions.sql` at blob `d1cdf5c350ea41e99ca615348bbac0a570bd0846`, `400-storage.sql` at blob `7ba2d023f7a7e4f1f37e8b2e1980f93a0aa3953f`.

## Decisions Made

See `key-decisions` in the frontmatter. Reading the code rather than the old comments produced three corrections:

- The `011` header omitted `enforce_nomination_confirmation`, which the file defines. It is now listed.
- `storage_path_is_public` called its structure branch "the six project-structure families", but its `IN` list names five tables. The comment now says five.
- `storage_path_can` is SECURITY DEFINER, but its docblock never said why. It now says that the type/id lookup reads the table itself rather than the caller's row-level-security view, and that the authority answer still comes from `user_can`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Accuracy] Three comments disagreed with the code at the tip**
- **Found during:** Tasks 1 and 2
- **Issue:** The header omitted a function, a branch comment gave the wrong table count, and a docblock did not say why the function is SECURITY DEFINER.
- **Fix:** All three now match the code (see Decisions Made). Comment-only.
- **Files modified:** `011-validation-functions.sql`, `400-storage.sql`
- **Verification:** code-identity exit 0; gate exit 0
- **Committed in:** `6e47fb511`, `f9f7cfc69`

**2. [Scope] The `011` header list was collapsed too**
- **Found during:** Task 1
- **Issue:** The plan named only `400-storage.sql`'s header lists. The `011` `Functions:` list was collapsed onto one line in the same way.
- **Fix:** It is now one bullet per function, like 165-08's `301` list. Comment-only.
- **Committed in:** `6e47fb511`

**Total deviations:** 2 (1 accuracy, 1 scope). **Impact on plan:** none. No SQL changed.

## Issues Encountered

None. Layer 3 flagged `no longer` in three cleanup docblocks. They were reworded to "the NEW row does not use / reference / return", and the gate then reported 0.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 165-25 edits both files (`storage_path_can` and `enforce_entity_immutability` pass the entity type to `user_can`). Any edit voids the recorded blobs, so 165-25 must re-run `hygiene-changed-files.sh --files <file>` and re-record the read.
- `enforce_entity_immutability`'s body must stay free of entity-type labels (suite 19), including in comments. The storage cleanup bodies must stay free of `LIKE` and `questions` (suite 31). No public function body comment may contain a public function name directly followed by `(` (suite 28).
- Following the wave-safety note, no `db:reset`, pgTAP, build or E2E was run. Plan 165-24 resets and re-tests the applied database.

## Self-Check: PASSED

- `apps/supabase/supabase/schema/011-validation-functions.sql`, `apps/supabase/supabase/schema/400-storage.sql`, `apps/supabase/supabase/migrations/00001_initial_schema.sql` and `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-12.tsv` exist.
- Commits `6e47fb511`, `f9f7cfc69` and `b4491928d` are in `git log`.
- `git status --short` lists only the maintainer's unstaged `MainContent.svelte` and the untracked `.planning/milestone.lock`. Neither was staged.
