-- 04-admin-crud.test.sql: Admin role CRUD operations
--
-- Verifies that project_admin, account_admin, and super_admin can perform CRUD operations within their scope, and are correctly denied access outside their scope.
--
-- Scoping rules:
--   a project-scope admin grant -> its own project; an account-scope admin grant -> every project in that account; a global admin grant -> every project. The reach rule is user_can's, and the predicate every converted policy delegates to.
--
-- Note: DELETE tests use app_settings and accounts, not entity tables like elections. The original reason, that an entity delete's cleanup_entity_storage_files() AFTER DELETE trigger calls delete_storage_object() via pg_net and so needs network access, never held: pg_net only ENQUEUES a request inside the test transaction and sends it after COMMIT, and this file's ROLLBACK discards it (31-storage-cleanup.test.sql asserts exactly those enqueued rows). The tests keep app_settings and accounts because they are what the assertions below were written against.
--
-- THE DELETE PREDICATE IS NO LONGER IDENTICAL ACROSS PROJECT-SCOPED TABLES, and that is the point of phase 162 rather than a regression. This header used to claim one `can_access_project` pattern covered them all; as of 162-11 the delete predicates on these tables name four DIFFERENT permissions -- `project.edit_structure` on the structure tables, `project.edit_questions` on questions, question_categories and admin_jobs, `project.edit_app_settings` on app_settings, `feedback.manage` on feedback, `account.manage_projects` on projects. A delete test on one table therefore says nothing about the next, and the per-table paired assertions live in 17-project-structure-authority.test.sql, 18-entity-policies.test.sql and 22-content-policies.test.sql.
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (30);

-- Create test fixture data. Project A (Account A) is OPEN FOR VOTERS and its rows are confirmed; Project B (Account B) is neither.
SELECT
  create_test_data ();

-- =====================================================================
-- Section 1: Project admin can CRUD within their project
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

-- SELECT: admin_a can read Project A data
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        project_id = test_id ('project_a')
    )::integer >= 1,
    'project_admin can SELECT elections in own project'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        project_id = test_id ('project_a')
    )::integer >= 1,
    'project_admin can SELECT candidates in own project'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        organizations
      WHERE
        project_id = test_id ('project_a')
    )::integer >= 1,
    'project_admin can SELECT organizations in own project'
  );

-- INSERT: admin_a can insert a new election in Project A
SELECT
  lives_ok (
    format(
      $$INSERT INTO elections (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"New Election A"}')$$,
      test_id ('project_a')
    ),
    'project_admin can INSERT election in own project'
  );

-- UPDATE: admin_a can update existing election in Project A
SELECT
  lives_ok (
    format(
      $$UPDATE elections SET name = '{"en":"Updated Election A"}' WHERE id = '%s'$$,
      test_id ('election_a')
    ),
    'project_admin can UPDATE election in own project'
  );

SELECT
  is (
    (
      SELECT
        name ->> 'en'
      FROM
        elections
      WHERE
        id = test_id ('election_a')
    ),
    'Updated Election A',
    'project_admin UPDATE on election actually changed data'
  );

-- DELETE: test on app_settings which uses the same project-admin authority pattern but does not have the entity storage cleanup trigger First insert a test app_settings row, then delete it
SELECT
  lives_ok (
    format(
      $$INSERT INTO app_settings (id, project_id, settings)
      VALUES (gen_random_uuid(), '%s', '{"test":true}'::jsonb)
      ON CONFLICT (project_id) DO UPDATE SET settings = '{"test":true}'::jsonb$$,
      test_id ('project_a')
    ),
    'project_admin can INSERT/UPDATE app_settings in own project'
  );

-- =====================================================================
-- Section 2: Project admin cannot CRUD in another project
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

-- SELECT: admin_a cannot see unpublished Project B elections
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'project_admin cannot SELECT elections in other project (closed to voters)'
  );

-- INSERT: admin_a cannot insert into Project B
SELECT
  throws_ok (
    format(
      $$INSERT INTO elections (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"Sneaky"}')$$,
      test_id ('project_b')
    ),
    '42501',
    NULL,
    'project_admin cannot INSERT election in other project'
  );

-- UPDATE: admin_a UPDATE on Project B election affects 0 rows
SELECT
  lives_ok (
    format(
      $$UPDATE elections SET name = '{"en":"Hijacked"}' WHERE id = '%s'$$,
      test_id ('election_b')
    ),
    'project_admin UPDATE on other project election does not raise error'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        name ->> 'en'
      FROM
        elections
      WHERE
        id = test_id ('election_b')
    ),
    'Election B',
    'project_admin UPDATE on other project election had no effect'
  );

-- DELETE: admin_a DELETE on Project B election affects 0 rows (RLS filters it out, so no row is selected, no trigger fires)
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$DELETE FROM elections WHERE id = '%s'$$,
      test_id ('election_b')
    ),
    'project_admin DELETE on other project election does not raise error'
  );

SELECT
  reset_role ();

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        id = test_id ('election_b')
    )::integer = 1,
    'project_admin DELETE on other project election had no effect'
  );

-- =====================================================================
-- Section 3: Account admin can access all projects in their account
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('account_admin_a'),
    test_user_grants ('account_admin_a')
  );

-- account_admin_a is scoped to Account A, which contains Project A
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        project_id = test_id ('project_a')
    )::integer >= 1,
    'account_admin can SELECT elections in own account project'
  );

-- INSERT into Project A
SELECT
  lives_ok (
    format(
      $$INSERT INTO elections (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"Account Admin Election"}')$$,
      test_id ('project_a')
    ),
    'account_admin can INSERT election in own account project'
  );

-- UPDATE in Project A
SELECT
  lives_ok (
    format(
      $$UPDATE elections SET name = '{"en":"Account Admin Updated"}' WHERE id = '%s'$$,
      test_id ('election_a')
    ),
    'account_admin can UPDATE election in own account project'
  );

-- account_admin_a cannot access Project B (different account)
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'account_admin cannot SELECT elections in other account project (closed to voters)'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO elections (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"Sneaky"}')$$,
      test_id ('project_b')
    ),
    '42501',
    NULL,
    'account_admin cannot INSERT election in other account project'
  );

-- =====================================================================
-- Section 4: Super admin has universal access
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('super_admin'),
    test_user_grants ('super_admin')
  );

-- SELECT: super_admin can see both projects
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        project_id = test_id ('project_a')
    )::integer >= 1,
    'super_admin can SELECT elections in Project A'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        project_id = test_id ('project_b')
    )::integer >= 1,
    'super_admin can SELECT elections in Project B'
  );

-- INSERT into Project B
SELECT
  lives_ok (
    format(
      $$INSERT INTO elections (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"Super Admin Election B"}')$$,
      test_id ('project_b')
    ),
    'super_admin can INSERT election in Project B'
  );

-- UPDATE in Project B
SELECT
  lives_ok (
    format(
      $$UPDATE elections SET name = '{"en":"Super Updated B"}' WHERE id = '%s'$$,
      test_id ('election_b')
    ),
    'super_admin can UPDATE election in Project B'
  );

-- Super admin can read accounts table
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        accounts
    )::integer >= 2,
    'super_admin can SELECT accounts (sees both accounts)'
  );

-- =====================================================================
-- Section 5: Admin can manage accounts and projects
-- =====================================================================
-- Super admin: INSERT/UPDATE/DELETE on accounts
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('super_admin'),
    test_user_grants ('super_admin')
  );

SELECT
  lives_ok (
    $$INSERT INTO accounts (id, name) VALUES (gen_random_uuid(), 'New Account')$$,
    'super_admin can INSERT into accounts'
  );

SELECT
  lives_ok (
    format(
      $$UPDATE accounts SET name = 'Updated Account A' WHERE id = '%s'$$,
      test_id ('account_a')
    ),
    'super_admin can UPDATE accounts'
  );

-- DELETE on accounts (no storage cleanup trigger)
SELECT
  lives_ok (
    $$DELETE FROM accounts WHERE name = 'New Account'$$,
    'super_admin can DELETE from accounts'
  );

-- Account admin: SELECT on accounts for own account
--
-- The projects assertion further down reads through authenticated_select_projects, which 162-04 converted to a single user_can call. 162-04 wrote a grant row here by hand to keep that assertion meaning what it meant before the conversion; 162-06 removed it, because set_test_user now derives every identity's claim from public.grants and the backfill produces that exact row from this identity's role row. Re-inserting it would violate grants_user_scope_target_role_key and error the file. The assertion keeps its meaning: the claim still arrives, through the production projection rather than beside it.
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('account_admin_a'),
    test_user_grants ('account_admin_a')
  );

SELECT
  set_test_grants (test_user_id ('account_admin_a'));

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        accounts
      WHERE
        id = test_id ('account_a')
    )::integer,
    1,
    'account_admin can SELECT own account'
  );

-- Account admin can see projects in own account
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        projects
      WHERE
        id = test_id ('project_a')
    )::integer >= 1,
    'account_admin can SELECT projects in own account'
  );

-- Account admin: INSERT project in own account
SELECT
  lives_ok (
    format(
      $$INSERT INTO projects (id, account_id, name) VALUES (gen_random_uuid(), '%s', 'New Project')$$,
      test_id ('account_a')
    ),
    'account_admin can INSERT project in own account'
  );

-- Project admin: reads EXACTLY its own account, and no other
--
-- THE ONE ASSERTION IN THIS ESTATE 162-09 IS SANCTIONED TO REWRITE, and only this one. It asserted `count(*) FROM accounts = 0` because the legacy predicate was has_role('account_admin','account',id), which a project admin matched no branch of. 162-CHECKPOINT-DECISIONS.md section 1's NOTE under S-3 rules "account read = any role on account OR ITS PROJECTS", and admin_a holds a grant on project_a, whose account_id is account_a -- so under the ruling it necessarily reads that row. The executor halted on this rather than flipping the expectation, and the operator sanctioned the rewrite on 2026-09-17.
--
-- It is INVERTED rather than flipped, and is strictly stronger than what it asserted before: not "sees one account" -- which would pass if the cross-account boundary broke and it saw one of two for the wrong reason -- but "sees exactly one AND that one is its own". The boundary is proven, not assumed.
-- 17-project-structure-authority.test.sql carries the paired negative against account_b by name.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        accounts
    )::integer = 1
    AND (
      SELECT
        id
      FROM
        accounts
    ) = test_id ('account_a'),
    'project_admin SELECTs exactly its own account (grant on a project of that account)'
  );

-- Reset role for cleanup
SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
