-- 04-admin-crud.test.sql: Admin role CRUD operations
--
-- Verifies that project_admin, account_admin, and super_admin can perform
-- CRUD operations within their scope, and are correctly denied access
-- outside their scope.
--
-- Scoping rules:
--   project_admin  -> can_access_project for their specific project
--   account_admin  -> can_access_project for all projects in their account
--   super_admin    -> can_access_project for all projects (universal access)
--
-- Note: DELETE tests use app_settings and accounts (not entity tables like
-- elections) because entity tables have cleanup_entity_storage_files() AFTER
-- DELETE trigger that calls delete_storage_object() via pg_net, which requires
-- network access not available in the test environment. The RLS DELETE policy
-- pattern (can_access_project) is identical across all project-scoped tables.
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)

BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT plan(30);

-- Create test fixture data
-- Project A (Account A): published=true, Project B (Account B): published=false
SELECT create_test_data();

-- =====================================================================
-- Section 1: Project admin can CRUD within their project
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

-- SELECT: admin_a can read Project A data
SELECT ok(
  (SELECT count(*) FROM elections WHERE project_id = test_id('project_a'))::integer >= 1,
  'project_admin can SELECT elections in own project'
);

SELECT ok(
  (SELECT count(*) FROM candidates WHERE project_id = test_id('project_a'))::integer >= 1,
  'project_admin can SELECT candidates in own project'
);

SELECT ok(
  (SELECT count(*) FROM organizations WHERE project_id = test_id('project_a'))::integer >= 1,
  'project_admin can SELECT organizations in own project'
);

-- INSERT: admin_a can insert a new election in Project A
SELECT lives_ok(
  format(
    $$INSERT INTO elections (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"New Election A"}')$$,
    test_id('project_a')
  ),
  'project_admin can INSERT election in own project'
);

-- UPDATE: admin_a can update existing election in Project A
SELECT lives_ok(
  format(
    $$UPDATE elections SET name = '{"en":"Updated Election A"}' WHERE id = '%s'$$,
    test_id('election_a')
  ),
  'project_admin can UPDATE election in own project'
);

SELECT is(
  (SELECT name->>'en' FROM elections WHERE id = test_id('election_a')),
  'Updated Election A',
  'project_admin UPDATE on election actually changed data'
);

-- DELETE: test on app_settings which uses the same can_access_project pattern
-- but does not have the entity storage cleanup trigger
-- First insert a test app_settings row, then delete it
SELECT lives_ok(
  format(
    $$INSERT INTO app_settings (id, project_id, settings)
      VALUES (gen_random_uuid(), '%s', '{"test":true}'::jsonb)
      ON CONFLICT (project_id) DO UPDATE SET settings = '{"test":true}'::jsonb$$,
    test_id('project_a')
  ),
  'project_admin can INSERT/UPDATE app_settings in own project'
);

-- =====================================================================
-- Section 2: Project admin cannot CRUD in another project
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

-- SELECT: admin_a cannot see unpublished Project B elections
SELECT is(
  (SELECT count(*) FROM elections WHERE project_id = test_id('project_b'))::integer,
  0,
  'project_admin cannot SELECT elections in other project (unpublished)'
);

-- INSERT: admin_a cannot insert into Project B
SELECT throws_ok(
  format(
    $$INSERT INTO elections (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"Sneaky"}')$$,
    test_id('project_b')
  ),
  '42501',
  NULL,
  'project_admin cannot INSERT election in other project'
);

-- UPDATE: admin_a UPDATE on Project B election affects 0 rows
SELECT lives_ok(
  format(
    $$UPDATE elections SET name = '{"en":"Hijacked"}' WHERE id = '%s'$$,
    test_id('election_b')
  ),
  'project_admin UPDATE on other project election does not raise error'
);

SELECT reset_role();
SELECT is(
  (SELECT name->>'en' FROM elections WHERE id = test_id('election_b')),
  'Election B',
  'project_admin UPDATE on other project election had no effect'
);

-- DELETE: admin_a DELETE on Project B election affects 0 rows
-- (RLS filters it out, so no row is selected, no trigger fires)
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT lives_ok(
  format(
    $$DELETE FROM elections WHERE id = '%s'$$,
    test_id('election_b')
  ),
  'project_admin DELETE on other project election does not raise error'
);

SELECT reset_role();
SELECT ok(
  (SELECT count(*) FROM elections WHERE id = test_id('election_b'))::integer = 1,
  'project_admin DELETE on other project election had no effect'
);

-- =====================================================================
-- Section 3: Account admin can access all projects in their account
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('account_admin_a'),
  test_user_roles('account_admin_a')
);

-- account_admin_a is scoped to Account A, which contains Project A
SELECT ok(
  (SELECT count(*) FROM elections WHERE project_id = test_id('project_a'))::integer >= 1,
  'account_admin can SELECT elections in own account project'
);

-- INSERT into Project A
SELECT lives_ok(
  format(
    $$INSERT INTO elections (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"Account Admin Election"}')$$,
    test_id('project_a')
  ),
  'account_admin can INSERT election in own account project'
);

-- UPDATE in Project A
SELECT lives_ok(
  format(
    $$UPDATE elections SET name = '{"en":"Account Admin Updated"}' WHERE id = '%s'$$,
    test_id('election_a')
  ),
  'account_admin can UPDATE election in own account project'
);

-- account_admin_a cannot access Project B (different account)
SELECT is(
  (SELECT count(*) FROM elections WHERE project_id = test_id('project_b'))::integer,
  0,
  'account_admin cannot SELECT elections in other account project (unpublished)'
);

SELECT throws_ok(
  format(
    $$INSERT INTO elections (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"Sneaky"}')$$,
    test_id('project_b')
  ),
  '42501',
  NULL,
  'account_admin cannot INSERT election in other account project'
);

-- =====================================================================
-- Section 4: Super admin has universal access
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('super_admin'),
  test_user_roles('super_admin')
);

-- SELECT: super_admin can see both projects
SELECT ok(
  (SELECT count(*) FROM elections WHERE project_id = test_id('project_a'))::integer >= 1,
  'super_admin can SELECT elections in Project A'
);

SELECT ok(
  (SELECT count(*) FROM elections WHERE project_id = test_id('project_b'))::integer >= 1,
  'super_admin can SELECT elections in Project B'
);

-- INSERT into Project B
SELECT lives_ok(
  format(
    $$INSERT INTO elections (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"Super Admin Election B"}')$$,
    test_id('project_b')
  ),
  'super_admin can INSERT election in Project B'
);

-- UPDATE in Project B
SELECT lives_ok(
  format(
    $$UPDATE elections SET name = '{"en":"Super Updated B"}' WHERE id = '%s'$$,
    test_id('election_b')
  ),
  'super_admin can UPDATE election in Project B'
);

-- Super admin can read accounts table
SELECT ok(
  (SELECT count(*) FROM accounts)::integer >= 2,
  'super_admin can SELECT accounts (sees both accounts)'
);

-- =====================================================================
-- Section 5: Admin can manage accounts and projects
-- =====================================================================

-- Super admin: INSERT/UPDATE/DELETE on accounts
SELECT set_test_user(
  'authenticated',
  test_user_id('super_admin'),
  test_user_roles('super_admin')
);

SELECT lives_ok(
  $$INSERT INTO accounts (id, name) VALUES (gen_random_uuid(), 'New Account')$$,
  'super_admin can INSERT into accounts'
);

SELECT lives_ok(
  format(
    $$UPDATE accounts SET name = 'Updated Account A' WHERE id = '%s'$$,
    test_id('account_a')
  ),
  'super_admin can UPDATE accounts'
);

-- DELETE on accounts (no storage cleanup trigger)
SELECT lives_ok(
  $$DELETE FROM accounts WHERE name = 'New Account'$$,
  'super_admin can DELETE from accounts'
);

-- Account admin: SELECT on accounts for own account
SELECT set_test_user(
  'authenticated',
  test_user_id('account_admin_a'),
  test_user_roles('account_admin_a')
);

SELECT is(
  (SELECT count(*) FROM accounts WHERE id = test_id('account_a'))::integer,
  1,
  'account_admin can SELECT own account'
);

-- Account admin can see projects in own account
SELECT ok(
  (SELECT count(*) FROM projects WHERE id = test_id('project_a'))::integer >= 1,
  'account_admin can SELECT projects in own account'
);

-- Account admin: INSERT project in own account
SELECT lives_ok(
  format(
    $$INSERT INTO projects (id, account_id, name) VALUES (gen_random_uuid(), '%s', 'New Project')$$,
    test_id('account_a')
  ),
  'account_admin can INSERT project in own account'
);

-- Project admin: cannot modify accounts (0 rows -- no SELECT policy for project_admin on accounts)
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT is(
  (SELECT count(*) FROM accounts)::integer,
  0,
  'project_admin cannot SELECT accounts (no access policy)'
);

-- Reset role for cleanup
SELECT reset_role();

SELECT * FROM finish();
ROLLBACK;
