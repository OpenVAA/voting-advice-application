# Extension Patterns for OpenVAA Database

Step-by-step guides for the most common database extensions. Each guide is independent. The "Adding a New Table" guide cross-references the other two for follow-up. All file paths are relative to `apps/supabase/supabase/` unless stated otherwise.

## Adding a New Table

Reference implementation: `factions` table in `schema/102-entities.sql` (simple content table with all common columns).

Follow these steps in order. Each step names the file to create or modify.

1. **Create table in schema file** `schema/NNN-{domain}.sql`
   - Choose the next available number or add to an existing domain file
   - Include all common columns:
     - id: uuid PK DEFAULT gen_random_uuid()
     - project_id: uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE
     - name: jsonb, short_name: jsonb, info: jsonb
     - color: jsonb, image: jsonb
     - sort_order: integer, subtype: text, custom_data: jsonb
     - is_generated: boolean DEFAULT false
     - created_at: timestamptz NOT NULL DEFAULT now()
     - updated_at: timestamptz NOT NULL DEFAULT now()
   - Add domain-specific columns after the common columns
   - Pattern: copy the factions table definition from `schema/102-entities.sql`

2. **Add set_updated_at trigger** (in the same schema file as the table)
   - `CREATE TRIGGER set_{table}_updated_at BEFORE UPDATE ON {table} FOR EACH ROW EXECUTE FUNCTION update_updated_at();`

3. **Add external_id column** `schema/500-external-id.sql`
   - Add `ALTER TABLE {table} ADD COLUMN external_id text;`
   - Add composite unique partial index: `CREATE UNIQUE INDEX idx_{table}_external_id ON {table} (project_id, external_id) WHERE external_id IS NOT NULL;`
   - Add immutability trigger: `CREATE TRIGGER enforce_external_id_immutability BEFORE UPDATE ON {table} FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();`
   - Pattern: follow existing entries in 500-external-id.sql

4. **Add indexes** `schema/200-indexes.sql`
   - B-tree on project*id: `CREATE INDEX idx*{table}\_project_id ON {table} (project_id);`
   - B-tree on any FK columns: `CREATE INDEX idx_{table}_{fk} ON {table} ({fk});`
   - Pattern: follow existing index definitions in 200-indexes.sql

5. **Enable RLS and add policies** `schema/302-rls.sql`
   - `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;`
   - Add the standard 5-policy pattern (see "Adding RLS Policies" guide below)

6. **Add storage cleanup triggers** `schema/400-storage.sql` (only if table has image column)
   - Add cleanup_storage_on_delete trigger: `CREATE TRIGGER cleanup_storage_on_delete AFTER DELETE ON {table} FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();`
   - Add cleanup_image_on_update trigger: `CREATE TRIGGER cleanup_image_on_update BEFORE UPDATE ON {table} FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();`
   - Pattern: follow existing trigger creation in 400-storage.sql

7. **Update bulk operations** `schema/501-bulk-operations.sql` (if table needs bulk import/delete)
   - Add table to dependency order in bulk_import and bulk_delete functions
   - Import order (parents before children): elections, constituency_groups, constituencies, organizations, alliances, factions, candidates, question_categories, questions, nominations, app_settings
   - Delete order (reverse): app_settings, nominations, questions, question_categories, candidates, factions, alliances, organizations, constituencies, constituency_groups, elections
   - Position your table based on its FK dependencies

8. **Update COLUMN_MAP** `packages/supabase-types/src/column-map.ts` (repo root relative)
   - Add entries for any columns where snake_case differs from desired camelCase property name
   - Pattern: follow existing COLUMN_MAP entries (e.g., sort_order -> 'order', custom_data -> 'customData')

9. **Regenerate database types** `packages/supabase-types/src/database.ts` (repo root relative)
   - Run: `cd apps/supabase && npx supabase gen types typescript --local > ../../packages/supabase-types/src/database.ts`

10. **Add test data** `tests/database/00-helpers.test.sql`
    - Add a `test_id` entry for the new entity in the predictable UUID constants section
    - Add INSERT statement in `create_test_data()` for both Project A and Project B
    - Project A entities should be `confirmed = true` and reached by a confirmed nomination, in a project that is `open_for_voters`; Project B entities should be neither. That two-directional polarity is what every anon-read assertion discriminates on
    - Pattern: follow existing entity insertions in create_test_data()

11. **Write pgTAP tests** (see "Adding pgTAP Tests" guide below)

12. **Check whether the dev-seed templates must represent the table** `packages/dev-seed/src/templates/index.ts` (repo root relative)
   - A new table stays invisible to local development and to the Playwright suite until some template emits rows for it. Decide which templates need it, then change only those -- this is a check, not a sweep.
   - Start from the registry: `BUILT_IN_TEMPLATES` and `BUILT_IN_OVERRIDES` in `packages/dev-seed/src/templates/index.ts` (30 registered built-ins, backed by 40 `.ts` files under `packages/dev-seed/src/templates/`)
   - Usually in scope: `packages/dev-seed/src/templates/default.ts` (the `default` demo dataset) and `packages/dev-seed/src/templates/e2e/base.ts` (the canonical E2E base dataset)
   - Usually NOT in scope: the 28 per-permutation E2E fixtures under `packages/dev-seed/src/templates/e2e/perm/` (`perm-*` plus `show-feedback-survey`). Each exists to exercise one settings or topology combination; touch one only when the new table participates in the combination that fixture owns.
   - A template can only carry the table once the `Template` type declares a `{ count?, fixed? }` fragment for it in `packages/dev-seed/src/template/types.ts`; the fragment's field semantics are described in `packages/dev-seed/README.md` under "Template shape reference"
   - Pattern: follow existing `organizations` fragment in `packages/dev-seed/src/templates/default.ts`

## Adding RLS Policies

Reference: standard 5-policy pattern in `schema/302-rls.sql`.

Follow these steps for a new content table. Public visibility is section 3.4's all-of rule -- the project is open for voters, the nomination is confirmed, and every entity that nomination links is confirmed -- and there is no per-row publication column to add; 162-16 deleted the last of them:

1. **Enable RLS** in `schema/302-rls.sql`:
   - `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;`

2. **Add anon SELECT policy**:
   - `CREATE POLICY anon_select_{table} ON {table} FOR SELECT TO anon USING ((SELECT project_open_for_voters(project_id)));` -- add the nomination and entity conjuncts too if the table is an entity or a nomination; copy the shape from the nearest table in `schema/302-rls.sql`

3. **Add authenticated SELECT policy**:
   - `CREATE POLICY authenticated_select_{table} ON {table} FOR SELECT TO authenticated USING ((SELECT user_can('project', project_id, 'project.read_structure')) OR (SELECT project_open_for_voters(project_id)));` -- the public arm is NOT optional: without it a logged-in caller holding no grant sees strictly LESS than a logged-out one

4. **Add admin INSERT policy**:
   - `CREATE POLICY admin_insert_{table} ON {table} FOR INSERT TO authenticated WITH CHECK ((SELECT user_can('project', project_id, '{write member}')));` -- `{write member}` is the `grant_permission` section 3.3 names for this table, and it MUST NOT be the read member the SELECT above asks. Check 9001 in `apps/supabase/scripts/lint-schema.mjs` is an ERROR-level build gate that reddens when a table's read and write permission sets intersect.

5. **Add admin UPDATE policy**:
   - `CREATE POLICY admin_update_{table} ON {table} FOR UPDATE TO authenticated USING ((SELECT user_can('project', project_id, '{write member}'))) WITH CHECK ((SELECT user_can('project', project_id, '{write member}')));`

6. **Add admin DELETE policy**:
   - `CREATE POLICY admin_delete_{table} ON {table} FOR DELETE TO authenticated USING ((SELECT user_can('project', project_id, '{write member}')));`

7. **Add column-level restrictions** (only if table has columns that should be admin-only):
   - Add to `schema/303-column-grants.sql`:
   - `REVOKE UPDATE ON {table} FROM authenticated;`
   - `GRANT UPDATE (col1, col2, ...) ON {table} TO authenticated;`
   - Pattern: follow the per-entity blocks in `303-column-grants.sql`. Since 162-13 it covers all FOUR entity tables (`candidates`, `organizations`, `factions`, `alliances`) plus `nominations`, not two, and each block states its protected half as the explicit COMPLEMENT of its grant list -- a column is protected by omission, so adding a column without adding it to the list is the safe default.
   - A column grant cannot express an OLD-to-NEW transition rule. Where the rule is "this value may be set once and then never changed", or "only a holder of `<permission>` may turn this flag on", the enforcement belongs in a BEFORE UPDATE trigger beside the grant -- `enforce_external_id_immutability()`, `enforce_entity_immutability()` and `enforce_nomination_confirmation()` are the three house examples.

8. **Add self-edit policy** (only if authenticated users should edit their own records):
   - `CREATE POLICY entity_update_own_{table} ON {table} FOR UPDATE TO authenticated USING ((SELECT user_can('entity', id, 'entity.edit_answers'))) WITH CHECK ((SELECT user_can('entity', id, 'entity.edit_answers')));` -- the actor segment names the SCOPE the predicate asks at, and self-edit is a GRANT question, never an `auth_user_id` comparison

**Critical rules:**

- ALWAYS use `(SELECT auth.uid())` and `(SELECT auth.jwt())` -- scalar subqueries evaluated once per query, not per row
- ALWAYS specify `TO anon` or `TO authenticated` -- never omit the role target
- SELECT: USING only. INSERT: WITH CHECK only. UPDATE: USING + WITH CHECK. DELETE: USING only.
- Wrap helper function calls in (SELECT ...): `(SELECT user_can('project', project_id, 'project.read_structure'))` not the bare call
- NEVER nest a `SECURITY DEFINER` call inside another. Such a function is never inlined by the planner, so a composition calling two of them pays the per-row cost at depth 2 -- measured at 271.9 ms against 39.4 ms on the entity SELECT path. Call the helpers DIRECTLY from each policy qual and let `25-matrix-conformance.test.sql` section 5 guard the repeated assembly
- NEVER re-derive a rule a helper already owns: the parent -> child nomination hop is `is_child_nominee` and nothing else, the open-for-voters lookup is `project_open_for_voters` and nothing else

## Adding pgTAP Tests

Reference: `tests/database/01-tenant-isolation.test.sql` for structure, `tests/database/04-admin-crud.test.sql` for CRUD patterns.

Follow these steps to add a new test file:

1. **Choose file name** `tests/database/NN-{focus}.test.sql`
   - Pick the next available number (currently 00-09 are used)
   - Name describes the test focus (e.g., `10-new-table-rls.test.sql`)

2. **Write header comment** describing what the file tests and its dependencies:
   - `-- NN-{focus}.test.sql: Brief description`
   - `-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)`

3. **Write transaction boundary opening**:
   - `BEGIN;`
   - `SET search_path = public, extensions;`
   - `DROP TABLE IF EXISTS __tcache__;`
   - `SELECT plan(N);` -- N = total number of assertions (update at end)
   - `SELECT create_test_data();`

4. **Write positive assertion tests** (admin CAN do things):
   - Call `set_test_user('authenticated', test_user_id('admin_a'), test_user_grants('admin_a'));`
   - Assert with `ok()`: `SELECT ok((SELECT count(*) FROM {table} WHERE project_id = test_id('project_a'))::integer >= 1, 'admin can read');`
   - Call `reset_role();` after each test block

5. **Write negative assertion tests** (non-admin CANNOT do things):
   - For silent RLS denial (no error, just no rows affected):
     - `SELECT set_test_user('authenticated', test_user_id('candidate_a'), test_user_grants('candidate_a'));`
     - `SELECT lives_ok($$INSERT INTO {table} (...) VALUES (...)$$, 'insert does not raise');`
     - `SELECT reset_role();`
     - `SELECT is((SELECT count(*) FROM {table} WHERE ...)::integer, expected_count, 'insert had no effect');`
   - For expected error:
     - `SELECT throws_ok($$...$$, '42501', NULL, 'permission denied');`

6. **Write tenant isolation tests**:
   - Set user from Project A, verify they cannot see the data of Project B, which is closed to voters
   - Set user from Project B, verify they cannot modify Project A data
   - Pattern: follow `01-tenant-isolation.test.sql`

7. **Write anon access tests**:
   - `SELECT set_test_user('anon');`
   - Verify can read the records section 3.4 makes public
   - Verify cannot read the records it does not
   - Verify cannot INSERT/UPDATE/DELETE

8. **Add test data** (if not already done in "Adding a New Table" step 12):
   - Add test entities to `create_test_data()` in `00-helpers.test.sql`
   - Add `test_id` mapping if needed

9. **Close transaction**:
   - `SELECT * FROM finish();`
   - `ROLLBACK;`

10. **Update plan count**: Go back to `SELECT plan(N)` and set N to the exact number of test assertions in the file.

**Test user helpers:**

- `set_test_user('authenticated', user_id, user_grants)` -- simulates an authenticated user; the claim is projected out of `public.grants` by `test_grants_claim`, the same path the Access Token Hook takes. The third argument WRITES the rows it describes AND asserts they are set-equal to the table's projection; pass `'[]'::jsonb` when the file inserts its own grant rows
- `set_test_user('anon')` -- simulates anonymous user
- `reset_role()` -- switches back to postgres superuser for fixture operations
- `test_user_id('name')` -- returns predictable UUID for named test user (admin_a, admin_b, candidate_a, candidate_b, candidate_a2, organization_a, super_admin, account_admin_a)
- `test_user_grants('name')` -- returns the `public.grants` ROWS a named identity holds. **There is no `test_user_roles`; 162-15 renamed it, and calling the old name raises `function does not exist`**
- `test_seed_fixture_grants()` -- writes the whole fixture's authority rows into `public.grants`
- `test_id('entity')` -- returns predictable UUID for named test entity (project_a, project_b, election_a, org_a, candidate_a, etc.)

**Note on DELETE tests:** Entity tables with image columns have `cleanup_entity_storage_files()` AFTER DELETE triggers that call pg_net (network). This fails in test environments without network. Use non-entity tables (app_settings, accounts) for DELETE assertions, or expect and handle the trigger error.

## Verification After Extension

After completing any extension, verify:

1. `cd apps/supabase && supabase db reset` -- schema loads without errors
2. `cd apps/supabase && supabase test db` -- all pgTAP tests pass (existing + new)
3. `cd apps/supabase && npx supabase gen types typescript --local` -- types regenerate without errors
4. Check that all content table policies follow the naming convention: `{role}_{operation}_{table}`
5. Check that new indexes follow the naming convention: `idx_{table}_{column}`
6. If bulk operations updated: test bulk_import with the new table's data structure
7. Re-check this skill's own files -- `.claude/skills/database/extension-patterns.md`, `.claude/skills/database/rls-policy-map.md`, `.claude/skills/database/schema-reference.md` and `.claude/skills/database/SKILL.md` -- and update whatever the extension invalidated, in the same commit. They carry listings: enumerations of source files, type names, directory paths and counts, none of which any build step keeps true.
   - The cost is measured, not asserted. Re-derived 2026-09-13: `.claude/skills/database/schema-reference.md` opens by calling itself a complete column listing for 17 tables drawn from 18 SQL files, while `apps/supabase/supabase/schema/` declares 20 tables across 25 files -- three tables (feedback, feedback_rate_limits, admin_jobs) absent from a listing that announces itself complete. Nothing caught it, because nothing re-checked the skill after the schema grew.
