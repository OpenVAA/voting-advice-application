---
phase: 165-review-stack-comment-remediation
plan: 21
subsystem: database
tags: [comment-hygiene, column-documentation, postgres, supabase, jsonb, schema-migration-parity]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments (hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs) and the 165-16 comment-only schema method"
provides:
  - "A one-line `--` comment above every non-self-evident column of the 19 tables declared in 100-108, 300 and 400, with every JSONB comment naming its shape"
  - "Hygiene-clean comment layers in the eleven table-definition schema files, so all 26 schema files pass the gate"
  - "A regenerated 00001_initial_schema.sql that is hygiene-clean end to end and code-identical to the phase base"
  - "hygiene-reads/165-21.tsv read records for the eleven files and the migration"
affects: [165-24, 165-27, 165-36]

actuals:
  tokens: 33005
  tasks: 3
  commits: 7
plan_head_before: c9fe46988558256aa3613b7ddac98dbef530ed7f
plan_head_after: 3058b2ee9e1a9dbc3c92e6f5fdb1284500ca776d

tech-stack:
  added: []
  patterns:
    - "Column documentation is one `--` line directly above the column, so plan 165-27's column reorder can move a column and its comment together"
    - "Each task lands as two commits: a hygiene-only rewrite of the existing comments (`Hygiene: D-04`), then the new documentation (`Review-Comment: C-4094600054`), both proven comment-only with code-identity.mjs"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-21.tsv
  modified:
    - apps/supabase/supabase/schema/100-tenancy.sql
    - apps/supabase/supabase/schema/101-elections.sql
    - apps/supabase/supabase/schema/102-entities.sql
    - apps/supabase/supabase/schema/103-questions.sql
    - apps/supabase/supabase/schema/104-nominations.sql
    - apps/supabase/supabase/schema/105-answers.sql
    - apps/supabase/supabase/schema/106-app-settings.sql
    - apps/supabase/supabase/schema/107-feedback.sql
    - apps/supabase/supabase/schema/108-admin-jobs.sql
    - apps/supabase/supabase/schema/300-auth-tables.sql
    - apps/supabase/supabase/schema/400-storage.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md
    - .planning/phases/165-review-stack-comment-remediation/deferred-items.md

key-decisions:
  - "storage_config's key and value are documented in the block comment above the table, not above each column. The table is declared on one line, and splitting it would change the code skeleton that code-identity.mjs compares"
  - "The filter arrays on questions and categories are documented as JSON arrays whose null or empty value means all, because get_questions tests them with jsonb_array_length and the data model's FilterValue treats an empty filter as always shown. The research inventory called them uuid and int arrays; they are jsonb"
  - "projects.lock_nominations is documented as enforced. The old comment said nothing reads it, but private.project_nominations_locked reads it and three entity nomination policies call that function; the admin policies do not"
  - "The 300-auth-tables.sql header paragraph about the filename's history was dropped rather than rewritten, because it was historical narrative with no current fact to keep"
  - "108-admin-jobs.sql's header named a nonexistent `ArgumentGeneration` feature; it now names `ArgumentCondensation`, the actual AdminFeature value"
  - "No hygiene-allow/165-21.tsv was created: every gate reported zero hits"

patterns-established:
  - "Shared column comments are identical text across tables (localized string, Colors, StoredImage, sort_order, subtype, custom_data, external_id), so a reader and a grep see one definition per concept"

requirements-completed: [165-SC2, 165-SC3, C-4094600054]

coverage:
  - id: D1
    description: "Every non-self-evident column of the 19 tables has a one-line comment directly above it, and every JSONB column's comment names its shape"
    requirement: "C-4094600054"
    verification:
      - kind: other
        ref: "awk over 101-108 and 300: every `^  <col> jsonb` line has a `  --` line above it (101: 19/19, 102: 25/25, 103: 22/22, 104: 6/6, 106: 2/2, 108: 4/4)"
        status: pass
      - kind: other
        ref: "per-table list in this SUMMARY (documented vs self-evident)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The documentation and hygiene rewrites changed no SQL"
    requirement: "165-SC2"
    verification:
      - kind: other
        ref: "node .../code-identity.mjs ship/v2.15-12-planning WORKTREE <the eleven files> apps/supabase/supabase/migrations/00001_initial_schema.sql (exit 0, 12 compared, 0 changed code)"
        status: pass
      - kind: other
        ref: "yarn assert:schema-migration-parity, assert:rpc-nullability, assert:grant-permission-enum, assert:project-scoped-queries (all exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The eleven files and the regenerated migration pass the hygiene gate with current read records, and so do all 26 schema files"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "bash .../hygiene-changed-files.sh --check-reads --files <the migration and the eleven files> (exit 0, total failing items 0, unread 0, VERDICT: CLEAN)"
        status: pass
      - kind: other
        ref: "bash .../hygiene-changed-files.sh --files apps/supabase/supabase/schema/*.sql (26 files, exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The comments describe what each column holds accurately"
    verification: []
    human_judgment: true
    rationale: "Accuracy against the code is a reading judgment. Each claim was checked against its source (see Sources checked), but the instruments prove only that no code changed and no hygiene pattern remains."

duration: 15min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 21: Column Documentation and Table-File Comment Hygiene Summary

**Every non-self-evident column in the 19 tables now has a one-line `--` comment above it, and every JSONB comment names its shape: localized strings, `Colors`, `StoredImage`, `StoredAnswers`, `LocalizedChoice` arrays, the filter arrays, `StoredSettings` and `StoredCustomization`. The existing comments in the eleven table files lost their plan ids, brief sections, decision ids, review ids and history. All 26 schema files and the regenerated migration pass the hygiene gate, and `code-identity.mjs` proves that no SQL character changed.**

## Performance

- **Duration:** about 15 min
- **Started:** 2026-09-27T21:53:38Z
- **Completed:** 2026-09-27T22:08:34Z
- **Tasks:** 3 of 3
- **Files modified:** 14 (11 schema files, the regenerated migration, the ledger, deferred-items), plus 1 created (the read record)

## Measurements

- **Gate at the start** (`--report-only`, the eleven files): 53 failing items (layer1=16, layer2=35, layer3=2). At the end: 0 on the eleven files, 0 on the migration, 0 on all 26 schema files.
- **Comment lines (`grep -cE '^[[:space:]]*--'`), base to HEAD, and file bytes:**

| File | Comment lines | Bytes |
|---|---|---|
| `100-tenancy.sql` | 5 → 8 | 1,993 → 1,602 |
| `101-elections.sql` | 4 → 35 | 3,689 → 5,495 |
| `102-entities.sql` | 11 → 50 | 10,803 → 10,059 |
| `103-questions.sql` | 18 → 50 | 3,812 → 6,828 |
| `104-nominations.sql` | 42 → 38 | 10,582 → 6,506 |
| `105-answers.sql` | 30 → 32 | 5,621 → 5,624 |
| `106-app-settings.sql` | 5 → 7 | 798 → 1,131 |
| `107-feedback.sql` | 22 → 29 | 4,471 → 4,304 |
| `108-admin-jobs.sql` | 4 → 13 | 1,010 → 1,739 |
| `300-auth-tables.sql` | 32 → 33 | 8,934 → 6,554 |
| `400-storage.sql` | 181 → 181 | 42,333 → 42,398 |

  `102`, `104` and `300` get smaller despite the new column lines, because their old comments were multi-paragraph narratives.

## Per-table documentation

Shared comments, identical text on every table that has the column:

- `name`, `short_name`, `info`: localized string `{ "<locale>": string }` (short name and longer description).
- `color`: `Colors` from `@openvaa/data`, `{ normal, dark? }`.
- `image`: `StoredImage` from `@openvaa/app-shared`, storage paths, not URLs.
- `sort_order`: ascending display order, nulls last.
- `subtype`: a free-text label that tells apart objects of the same kind (organizations add the constituency-association example).
- `custom_data`: a free-form JSON object read as `customData` (questions and nominations add their known keys).
- `external_id`: the `bulk_import` key, unique per project and unchangeable once set.

Self-evident everywhere and left undocumented: `id`, `project_id`, `created_at`, `updated_at`. `is_generated` is left undocumented on purpose, because plan 165-27 removes it.

| Table | Documented | Self-evident (no comment) |
|---|---|---|
| `accounts` | `name` (plain text, not localized) | `id`, `created_at`, `updated_at` |
| `projects` | `name`, `default_locale`, `open_for_voters`, `lock_nominations` | `id`, `account_id`, `created_at`, `updated_at` |
| `elections` | shared set, `election_date`, `election_start_date`, `election_type`, `multiple_rounds`, `current_round` | `id`, `project_id`, timestamps |
| `constituency_groups` | shared set | `id`, `project_id`, timestamps |
| `constituencies` | shared set, `keywords` (localized comma-separated list), `parent_id` | `id`, `project_id`, timestamps |
| `constituency_group_constituencies` | none | both foreign keys (the table is a plain join) |
| `election_constituency_groups` | none | both foreign keys (the table is a plain join) |
| `organizations` | `auth_user_id`, shared set, `confirmed`, `answers` (`StoredAnswers`) | `id`, `project_id`, timestamps |
| `candidates` | shared set without `name`, `confirmed`, `auth_user_id`, `terms_of_use_accepted`, `answers` | `first_name`, `last_name`, `id`, `project_id`, timestamps |
| `factions` | `organization_id`, shared set, `confirmed` | `id`, `project_id`, timestamps |
| `alliances` | shared set, `confirmed` | `id`, `project_id`, timestamps |
| `question_categories` | shared set, `category_type`, `election_ids`, `election_rounds`, `constituency_ids`, `entity_type` | `id`, `project_id`, timestamps |
| `questions` | shared set, `custom_data` (`min`/`max`, `allowOpen`), `type`, `choices` (`LocalizedChoice` array), `settings`, the four filter arrays (within the category's list), `allow_open`, `required` | `category_id`, `id`, `project_id`, timestamps |
| `nominations` | shared set, `custom_data` (`requestedParentOrganization`), `created_by`, `entity_type` (generated), `election_round`, `election_symbol`, `parent_nomination_id`, `confirmed` | the four entity foreign keys (covered by the existing "exactly one must be set" line), `election_id`, `constituency_id`, `id`, `project_id`, timestamps |
| `app_settings` | `settings` (`StoredSettings`), `customization` (`StoredCustomization`), `external_id` | `id`, `project_id` (the header states the one-row-per-project UNIQUE), timestamps |
| `private.feedback_rate_limits` | `ip_address`, `count`, `window_start` | none |
| `feedback` | `rating`, `date` (against `created_at`), `url`, `user_agent` | `description`, `id`, `project_id` (the header covers its SET NULL), `created_at` |
| `admin_jobs` | `job_id`, `job_type`, `election_id`, `author`, `end_status`, `input`, `output`, `messages`, `metadata` | `start_time`, `end_time`, `id`, `project_id`, timestamps |
| `grants` | `scope`, `target_type`, `target_id`, `role` | `user_id`, `id`, `created_at` |
| `storage_config` | `key` and `value`, in the block comment above the one-line table (see Decisions) | none |

JSONB check (`awk` listing each `^  <col> jsonb` line and whether the line above is a `  --` comment):

```
101-elections.sql: jsonb columns 19, documented 19
102-entities.sql: jsonb columns 25, documented 25
103-questions.sql: jsonb columns 22, documented 22
104-nominations.sql: jsonb columns 6, documented 6
106-app-settings.sql: jsonb columns 2, documented 2
108-admin-jobs.sql: jsonb columns 4, documented 4
```

(`105-answers.sql` reports three `jsonb` lines, all plpgsql variables in function bodies rather than columns. `107` and `300` have no JSONB columns.)

## Sources checked

Each comment was written from the code it describes, not from the old comment:

- `open_for_voters`: the anon policies in `302-rls.sql`, and `SupabaseAdminClient.ensureProject`, which sets it to true.
- `lock_nominations`: `private.project_nominations_locked` (`301-auth-functions.sql`), called by `entity_insert_nominations`, `entity_insert_parent_nominations` and `entity_update_nominations`. The admin nomination policies do not call it.
- `confirmed` on the entity tables: `enforce_entity_immutability` (`011-validation-functions.sql`).
- `confirmed` and `created_by` on nominations: the INSERT and UPDATE grants in `303-column-grants.sql`, and `enforce_nomination_confirmation`.
- `requestedParentOrganization`: rule 1 of `enforce_nomination_confirmation`.
- The filter arrays: the `jsonb_array_length` / `@>` predicates in `505-question-rpcs.sql`, plus `FilterValue` and `intersectFilters` in `@openvaa/data`.
- `keywords`: the split in `supabaseDataProvider._getConstituencyData`.
- Question `custom_data`: the `allowOpen` and `min`/`max` lifting in `_getQuestionData`.
- `terms_of_use_accepted`: the anon candidate policy's `IS NOT NULL` and `< now()` conjuncts.
- `admin_jobs`: `SupabaseAdminWriter.insertJobResult`, `AdminJobRecord`, `jobRecord.ts` and `AdminFeature`.
- Feedback: `FeedbackData` and `SupabaseFeedbackWriter`.
- The feedback orphan disjuncts: `admin_select_feedback` and `admin_delete_feedback`, each with `user_can('global', NULL, …)` when `project_id IS NULL`.

## Task Commits

1. **Task 1 (tracer): `100-tenancy.sql`.**
   - `f033c6810` (hygiene, `Hygiene: D-04`)
   - `4159ee807` (documentation, `Review-Comment: C-4094600054`)
   - The tracer gate was re-run before expanding: identity 0, gate 0, parity 0.
2. **Task 2: `101` to `104`.**
   - `d3bc8ec3b` (hygiene)
   - `d03a56b2f` (documentation)
3. **Task 3: `105` to `108`, `300`, `400`, and the migration gate.**
   - `4dbbd89c8` (hygiene)
   - `871cf6cd0` (documentation)
   - `3058b2ee9` (chore: read records, the ledger row, deferred-items)

Every commit stages explicit paths only. `MainContent.svelte` and `.planning/milestone.lock` were never staged.

## Verification (statuses read directly, never through a pipe)

| Command | Exit | Output |
|---|---|---|
| `node .../code-identity.mjs ship/v2.15-12-planning WORKTREE <the eleven files> <00001_initial_schema.sql>` | 0 | `12 compared, 0 changed code` |
| `bash .../hygiene-changed-files.sh --check-reads --files <00001_initial_schema.sql> <the eleven files>` | 0 | `total failing items: 0 ... unread=0`, `VERDICT: CLEAN` |
| `bash .../hygiene-changed-files.sh --files apps/supabase/supabase/schema/*.sql` | 0 | 26 files in scope, 0 failing items |
| `yarn assert:schema-migration-parity` | 0 | generated copy is current |
| `yarn assert:rpc-nullability`, `assert:grant-permission-enum`, `assert:project-scoped-queries` | 0 | 0 violations each |
| `node_modules/.bin/prettier --check` on the changed schema files and the migration | 0 (except `300-auth-tables.sql`) | `300-auth-tables.sql` fails at the phase base too; it is logged in deferred-items for the gate plans |
| `bash .../tip-proofs.sh` | 0 | all proofs PASS |
| `bash .../ledger-check.sh` | 0 | `VERDICT: PASSED` (78 inline rows, 12-row appendix) |
| `npx vitest run tests/template/permittedKeys.test.ts tests/assertKnownRowProps.test.ts tests/cli/allowedTeardownTables.test.ts` (in `packages/dev-seed`) | 0 | 62 passed; these three read the schema or migration text from disk |

## Review-comment dispositions

| Comment | Disposition | Evidence | Commits | Draft reply |
|---|---|---|---|---|
| C-4094600054 (#877, `100-tenancy.sql:1`) | fix | code-identity exit 0 (12 files); `--check-reads` gate exit 0; 26-file schema gate exit 0; the JSONB awk check above | `4159ee807`, `d03a56b2f`, `871cf6cd0` | Fixed in 4159ee807, d03a56b2f and 871cf6cd0. Every column that is not self-evident, on every table, now has a one-line `--` comment directly above it. The schema has no `COMMENT ON`, so this follows the existing inline convention. Each JSONB comment names its shape: localized strings `{ "<locale>": string }` (`name`, `short_name`, `info`, `constituencies.keywords`), `Colors`, `StoredImage`, `StoredAnswers`, `LocalizedChoice` arrays, the election, round, constituency and entity-type filter arrays (null or empty means all), `StoredSettings`, `StoredCustomization`, and what writes each `admin_jobs` column. `is_generated` is left undocumented because it is being removed. |

The same row is filled in `165-LEDGER.md`.

## Files Created/Modified

- `apps/supabase/supabase/schema/{100,101,102,103,104,105,106,107,108,300,400}-*.sql`: comments only.
- `apps/supabase/supabase/migrations/00001_initial_schema.sql`: regenerated by `yarn schema:regenerate` after each commit's edits.
- `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-21.tsv`: 12 rows, one per file, each at its HEAD blob.
- `.planning/phases/165-review-stack-comment-remediation/165-LEDGER.md`: the C-4094600054 row.
- `.planning/phases/165-review-stack-comment-remediation/deferred-items.md`: the "From 165-21" entry.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Accuracy] Three comments or inventory entries disagreed with the code**
- **Found during:** Tasks 1, 2 and 3
- **Issue:**
  - The old `lock_nominations` comment said nothing reads the column, but three entity nomination policies do.
  - The research inventory called the filter arrays uuid and int arrays, but they are `jsonb`.
  - `108-admin-jobs.sql`'s header named an `ArgumentGeneration` feature, which does not exist.
- **Fix:** The comments now match the code (see Decisions). Comment-only.
- **Committed in:** `f033c6810`, `d03a56b2f`, `871cf6cd0`

**2. [Rule 3 - Blocking] `storage_config` cannot take per-column comments without a code change**
- **Found during:** Task 3
- **Issue:** The table is declared as `CREATE TABLE IF NOT EXISTS public.storage_config (key text PRIMARY KEY, value text NOT NULL);` on one line. `code-identity.mjs` compares line structure, so splitting the line to put a comment above each column counts as a code change.
- **Fix:** The block comment above the table documents both columns: `key` names the setting (`supabase_url` or `service_role_key`) and `value` holds it. The seed.sql note is kept.
- **Committed in:** `871cf6cd0`

**3. [Verification scope] Read-only asserts and three dev-seed specs were run**
- The wave-safety note limits runs to `schema:regenerate` and the parity check. Three more asserts and three dev-seed unit specs were also run, as plan 165-16 did. All six are read-only: `permittedKeys`, `assertKnownRowProps` and `allowedTeardownTables` parse the schema or migration text, and none uses a database, a build or E2E.

**4. [Commit shape] Read records in a separate chore commit**
- The plan lists the read record among Task 3's files. It was committed separately (`3058b2ee9`), with the ledger row and deferred-items, so that the thread's documentation commit `871cf6cd0` shows only documentation. Reads were recorded once at the end, not per task, because every regeneration changes the migration blob.

**Total deviations:** 4 (1 accuracy, 1 blocking-format, 1 verification scope, 1 commit shape). **Impact on plan:** none. No SQL changed.

## Issues Encountered

- The first `lock_nominations` rewrite used "no longer", which layer 3 (narrative) flagged. It was reworded to "cannot" before the commit.
- `300-auth-tables.sql` fails `prettier --check`. It failed at the phase base as well, and deferred-items already lists it, so plans 165-24 and 165-36 must apply the formatting-only fix and re-run pgTAP.

## Known Stubs

None.

## Threat Flags

None. The changes are comments only. The `storage_config` comment names the two setting keys and never a value (T-165-34, accepted).

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 165-27 reorders columns and removes `is_generated`. Every column comment sits on the line directly above its column, so a column and its comment move together. Any edit voids the recorded blobs, so 165-27 must re-run `hygiene-changed-files.sh --files <file>` and re-record the reads.
- All 26 schema files and the regenerated migration are hygiene-clean, so a later schema plan's gate on the migration isolates that plan's own comments.
- Following the wave-safety note, this plan ran no `db:reset`, pgTAP, build or E2E. Table and trigger comments are not stored in the database, and no function-body comment changed except the `105-answers.sql` header, which sits outside the `$$` body. Plan 165-24 resets and re-tests the applied database.

## Self-Check: PASSED

- The files exist: the eleven schema files, `apps/supabase/supabase/migrations/00001_initial_schema.sql` and `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-21.tsv`.
- Commits `f033c6810`, `4159ee807`, `d3bc8ec3b`, `d03a56b2f`, `4dbbd89c8`, `871cf6cd0` and `3058b2ee9` are in `git log`.
- `git status --short` lists only the maintainer's unstaged `MainContent.svelte` and the untracked `.planning/milestone.lock`, before this SUMMARY is committed.
