# Extension Patterns for OpenVAA Database

Step-by-step guides for the most common database extensions. Each guide is independent. The "Adding a New Table" guide cross-references the other two for follow-up. All file paths are relative to `apps/supabase/supabase/` unless stated otherwise.

## Adding a New Table

Reference implementation: `factions` table in `schema/003-entities.sql` (simple content table with all common columns).

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
   - Pattern: copy the factions table definition from `schema/003-entities.sql`

2. **Add set_updated_at trigger** (in the same schema file as the table)
   - `CREATE TRIGGER set_{table}_updated_at BEFORE UPDATE ON {table} FOR EACH ROW EXECUTE FUNCTION update_updated_at();`

3. **Add published column** `schema/011-auth-tables.sql`
   - Add `ALTER TABLE {table} ADD COLUMN published boolean NOT NULL DEFAULT false;` in the published column section
   - Pattern: follow the existing ALTER TABLE statements in 011-auth-tables.sql

4. **Add external_id column** `schema/015-external-id.sql`
   - Add `ALTER TABLE {table} ADD COLUMN external_id text;`
   - Add composite unique partial index: `CREATE UNIQUE INDEX idx_{table}_external_id ON {table} (project_id, external_id) WHERE external_id IS NOT NULL;`
   - Add immutability trigger: `CREATE TRIGGER enforce_external_id_immutability BEFORE UPDATE ON {table} FOR EACH ROW EXECUTE FUNCTION enforce_external_id_immutability();`
   - Pattern: follow existing entries in 015-external-id.sql

5. **Add indexes** `schema/009-indexes.sql`
   - B-tree on project_id: `CREATE INDEX idx_{table}_project_id ON {table} (project_id);`
   - B-tree on any FK columns: `CREATE INDEX idx_{table}_{fk} ON {table} ({fk});`
   - Pattern: follow existing index definitions in 009-indexes.sql

6. **Add published partial index** `schema/011-auth-tables.sql`
   - `CREATE INDEX idx_{table}_published ON {table} (published) WHERE published = true;`
   - Add in the partial indexes section (after the published column additions)

7. **Enable RLS and add policies** `schema/010-rls.sql`
   - `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;`
   - Add the standard 5-policy pattern (see "Adding RLS Policies" guide below)

8. **Add storage cleanup triggers** `schema/014-storage.sql` (only if table has image column)
   - Add cleanup_storage_on_delete trigger: `CREATE TRIGGER cleanup_storage_on_delete AFTER DELETE ON {table} FOR EACH ROW EXECUTE FUNCTION cleanup_entity_storage_files();`
   - Add cleanup_image_on_update trigger: `CREATE TRIGGER cleanup_image_on_update BEFORE UPDATE ON {table} FOR EACH ROW EXECUTE FUNCTION cleanup_old_image_file();`
   - Pattern: follow existing trigger creation in 014-storage.sql

9. **Update bulk operations** `schema/016-bulk-operations.sql` (if table needs bulk import/delete)
   - Add table to dependency order in bulk_import and bulk_delete functions
   - Import order (parents before children): elections, constituency_groups, constituencies, organizations, alliances, factions, candidates, question_categories, questions, nominations, app_settings
   - Delete order (reverse): app_settings, nominations, questions, question_categories, candidates, factions, alliances, organizations, constituencies, constituency_groups, elections
   - Position your table based on its FK dependencies

10. **Update COLUMN_MAP** `packages/supabase-types/src/column-map.ts` (repo root relative)
    - Add entries for any columns where snake_case differs from desired camelCase property name
    - Pattern: follow existing COLUMN_MAP entries (e.g., sort_order -> 'order', custom_data -> 'customData')

11. **Regenerate database types** `packages/supabase-types/src/database.ts` (repo root relative)
    - Run: `cd apps/supabase && npx supabase gen types typescript --local > ../../packages/supabase-types/src/database.ts`

12. **Add test data** `tests/database/00-helpers.test.sql`
    - Add a `test_id` entry for the new entity in the predictable UUID constants section
    - Add INSERT statement in `create_test_data()` for both Project A and Project B
    - Project A entities should be published=true; Project B entities should be published=false
    - Pattern: follow existing entity insertions in create_test_data()

13. **Write pgTAP tests** (see "Adding pgTAP Tests" guide below)

## Adding RLS Policies

Reference: standard 5-policy pattern in `schema/010-rls.sql`.

Follow these steps for a new content table with published column:

1. **Enable RLS** in `schema/010-rls.sql`:
   - `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;`

2. **Add anon SELECT policy**:
   - `CREATE POLICY anon_select_{table} ON {table} FOR SELECT TO anon USING (published = true);`

3. **Add authenticated SELECT policy**:
   - `CREATE POLICY authenticated_select_{table} ON {table} FOR SELECT TO authenticated USING ((SELECT can_access_project(project_id)) OR published = true);`

4. **Add admin INSERT policy**:
   - `CREATE POLICY admin_insert_{table} ON {table} FOR INSERT TO authenticated WITH CHECK ((SELECT can_access_project(project_id)));`

5. **Add admin UPDATE policy**:
   - `CREATE POLICY admin_update_{table} ON {table} FOR UPDATE TO authenticated USING ((SELECT can_access_project(project_id))) WITH CHECK ((SELECT can_access_project(project_id)));`

6. **Add admin DELETE policy**:
   - `CREATE POLICY admin_delete_{table} ON {table} FOR DELETE TO authenticated USING ((SELECT can_access_project(project_id)));`

7. **Add column-level restrictions** (only if table has columns that should be admin-only):
   - Add to `schema/013-auth-rls.sql`:
   - `REVOKE UPDATE ON {table} FROM authenticated;`
   - `GRANT UPDATE (col1, col2, ...) ON {table} TO authenticated;`
   - Pattern: follow candidates/organizations pattern in 013-auth-rls.sql

8. **Add self-edit policy** (only if authenticated users should edit their own records):
   - `CREATE POLICY {role}_update_own_{table} ON {table} FOR UPDATE TO authenticated USING (auth_user_id = (SELECT auth.uid())) WITH CHECK (auth_user_id = (SELECT auth.uid()));`

**Critical rules:**
- ALWAYS use `(SELECT auth.uid())` and `(SELECT auth.jwt())` -- scalar subqueries evaluated once per query, not per row
- ALWAYS specify `TO anon` or `TO authenticated` -- never omit the role target
- SELECT: USING only. INSERT: WITH CHECK only. UPDATE: USING + WITH CHECK. DELETE: USING only.
- Wrap helper function calls in (SELECT ...): `(SELECT can_access_project(project_id))` not bare `can_access_project(project_id)`

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
   - Call `set_test_user('authenticated', test_user_id('admin_a'), test_user_roles('admin_a'));`
   - Assert with `ok()`: `SELECT ok((SELECT count(*) FROM {table} WHERE project_id = test_id('project_a'))::integer >= 1, 'admin can read');`
   - Call `reset_role();` after each test block

5. **Write negative assertion tests** (non-admin CANNOT do things):
   - For silent RLS denial (no error, just no rows affected):
     - `SELECT set_test_user('authenticated', test_user_id('candidate_a'), test_user_roles('candidate_a'));`
     - `SELECT lives_ok($$INSERT INTO {table} (...) VALUES (...)$$, 'insert does not raise');`
     - `SELECT reset_role();`
     - `SELECT is((SELECT count(*) FROM {table} WHERE ...)::integer, expected_count, 'insert had no effect');`
   - For expected error:
     - `SELECT throws_ok($$...$$, '42501', NULL, 'permission denied');`

6. **Write tenant isolation tests**:
   - Set user from Project A, verify they cannot see unpublished Project B data
   - Set user from Project B, verify they cannot modify Project A data
   - Pattern: follow `01-tenant-isolation.test.sql`

7. **Write anon access tests**:
   - `SELECT set_test_user('anon');`
   - Verify can read published records
   - Verify cannot read unpublished records
   - Verify cannot INSERT/UPDATE/DELETE

8. **Add test data** (if not already done in "Adding a New Table" step 12):
   - Add test entities to `create_test_data()` in `00-helpers.test.sql`
   - Add `test_id` mapping if needed

9. **Close transaction**:
   - `SELECT * FROM finish();`
   - `ROLLBACK;`

10. **Update plan count**: Go back to `SELECT plan(N)` and set N to the exact number of test assertions in the file.

**Test user helpers:**
- `set_test_user('authenticated', user_id, user_roles)` -- simulates authenticated user with JWT claims
- `set_test_user('anon')` -- simulates anonymous user
- `reset_role()` -- switches back to postgres superuser for fixture operations
- `test_user_id('name')` -- returns predictable UUID for named test user (admin_a, admin_b, candidate_a, candidate_b, candidate_a2, party_a, super_admin, account_admin_a)
- `test_user_roles('name')` -- returns JWT user_roles claim array for named user
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
