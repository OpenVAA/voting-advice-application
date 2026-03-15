-- 01-tenant-isolation.test.sql: QUAL-01 cross-project data isolation
--
-- Verifies that users scoped to Project B cannot access admin-level data
-- from Project A, cannot modify any Project A data, and that the published
-- visibility mechanism correctly limits cross-project visibility.
--
-- Key principle: published data is visible to all authenticated users (by design),
-- but admin-level access (INSERT/UPDATE/DELETE, unpublished data) is strictly
-- scoped to users with can_access_project() for that project.
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)

BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT plan(26);

-- Create test fixture data
-- Project A: published=true, Project B: published=false
SELECT create_test_data();

-- =====================================================================
-- Section 1: Published data IS visible cross-project (correct behavior)
-- This verifies the RLS design: published data is public for authenticated users
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('admin_b'),
  test_user_roles('admin_b')
);

SELECT ok(
  (SELECT count(*) FROM elections WHERE project_id = test_id('project_a') AND published = true)::integer >= 1,
  'admin_b CAN see published elections from Project A (by design)'
);

-- app_settings is always readable (USING true)
SELECT ok(
  (SELECT count(*) FROM app_settings WHERE project_id = test_id('project_a'))::integer >= 1,
  'app_settings is always readable (by design)'
);

-- =====================================================================
-- Section 3: Admin A cannot see unpublished Project B data
-- All Project B data is unpublished, so admin_a should not see any of it
-- unless it has a published=true policy OR the table is always readable
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

-- Tables with published column (Project B data is unpublished=false)
SELECT is(
  (SELECT count(*) FROM elections WHERE project_id = test_id('project_b'))::integer,
  0,
  'admin_a cannot see unpublished Project B elections'
);

SELECT is(
  (SELECT count(*) FROM constituency_groups WHERE project_id = test_id('project_b'))::integer,
  0,
  'admin_a cannot see unpublished Project B constituency_groups'
);

SELECT is(
  (SELECT count(*) FROM constituencies WHERE project_id = test_id('project_b'))::integer,
  0,
  'admin_a cannot see unpublished Project B constituencies'
);

SELECT is(
  (SELECT count(*) FROM organizations WHERE project_id = test_id('project_b'))::integer,
  0,
  'admin_a cannot see unpublished Project B organizations'
);

SELECT is(
  (SELECT count(*) FROM candidates WHERE project_id = test_id('project_b'))::integer,
  0,
  'admin_a cannot see unpublished Project B candidates'
);

SELECT is(
  (SELECT count(*) FROM factions WHERE project_id = test_id('project_b'))::integer,
  0,
  'admin_a cannot see unpublished Project B factions'
);

SELECT is(
  (SELECT count(*) FROM alliances WHERE project_id = test_id('project_b'))::integer,
  0,
  'admin_a cannot see unpublished Project B alliances'
);

SELECT is(
  (SELECT count(*) FROM question_categories WHERE project_id = test_id('project_b'))::integer,
  0,
  'admin_a cannot see unpublished Project B question_categories'
);

SELECT is(
  (SELECT count(*) FROM questions WHERE project_id = test_id('project_b'))::integer,
  0,
  'admin_a cannot see unpublished Project B questions'
);

SELECT is(
  (SELECT count(*) FROM nominations WHERE project_id = test_id('project_b'))::integer,
  0,
  'admin_a cannot see unpublished Project B nominations'
);

-- =====================================================================
-- Section 4: Cross-project INSERT isolation
-- Admin B cannot insert into Project A
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('admin_b'),
  test_user_roles('admin_b')
);

SELECT throws_ok(
  format(
    $$INSERT INTO elections (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"Sneaky"}')$$,
    test_id('project_a')
  ),
  '42501',
  NULL,
  'admin_b cannot INSERT into elections with Project A project_id'
);

SELECT throws_ok(
  format(
    $$INSERT INTO candidates (id, project_id, first_name, last_name) VALUES (gen_random_uuid(), '%s', 'Sneaky', 'Sneak')$$,
    test_id('project_a')
  ),
  '42501',
  NULL,
  'admin_b cannot INSERT into candidates with Project A project_id'
);

SELECT throws_ok(
  format(
    $$INSERT INTO organizations (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"Sneaky Org"}')$$,
    test_id('project_a')
  ),
  '42501',
  NULL,
  'admin_b cannot INSERT into organizations with Project A project_id'
);

SELECT throws_ok(
  format(
    $$INSERT INTO questions (id, project_id, type, category_id, name) VALUES (gen_random_uuid(), '%s', 'text', '%s', '{"en":"Sneaky Q"}')$$,
    test_id('project_a'),
    test_id('question_category_a')
  ),
  '42501',
  NULL,
  'admin_b cannot INSERT into questions with Project A project_id'
);

SELECT throws_ok(
  format(
    $$INSERT INTO app_settings (id, project_id, settings) VALUES (gen_random_uuid(), '%s', '{"sneaky":true}')$$,
    test_id('project_a')
  ),
  '42501',
  NULL,
  'admin_b cannot INSERT into app_settings with Project A project_id'
);

-- =====================================================================
-- Section 5: Cross-project UPDATE isolation
-- Admin B cannot update Project A data (even published data)
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('admin_b'),
  test_user_roles('admin_b')
);

SELECT lives_ok(
  format(
    $$UPDATE elections SET name = '{"en":"Hijacked"}' WHERE id = '%s'$$,
    test_id('election_a')
  ),
  'admin_b UPDATE on Project A elections does not raise error (but affects 0 rows)'
);

SELECT reset_role();
SELECT is(
  (SELECT name->>'en' FROM elections WHERE id = test_id('election_a')),
  'Election A',
  'admin_b UPDATE on Project A elections had no effect'
);

-- =====================================================================
-- Section 6: Cross-project DELETE isolation
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('admin_b'),
  test_user_roles('admin_b')
);

SELECT lives_ok(
  format(
    $$DELETE FROM elections WHERE id = '%s'$$,
    test_id('election_a')
  ),
  'admin_b DELETE on Project A elections does not raise error (but affects 0 rows)'
);

SELECT reset_role();
SELECT ok(
  (SELECT count(*) FROM elections WHERE id = test_id('election_a'))::integer = 1,
  'admin_b DELETE on Project A elections had no effect (record still exists)'
);

-- =====================================================================
-- Section 7: Candidate cross-project isolation
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT is(
  (SELECT count(*) FROM candidates WHERE id = test_id('candidate_a'))::integer,
  1,
  'candidate_a can see own record'
);

SELECT is(
  (SELECT count(*) FROM candidates WHERE id = test_id('candidate_b'))::integer,
  0,
  'candidate_a cannot see candidate_b (different project, unpublished)'
);

-- =====================================================================
-- Section 8: Join table write isolation via parent
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('admin_b'),
  test_user_roles('admin_b')
);

SELECT throws_ok(
  format(
    $$INSERT INTO constituency_group_constituencies (constituency_group_id, constituency_id) VALUES ('%s', '%s')$$,
    test_id('constituency_group_a'),
    test_id('constituency_a')
  ),
  NULL,
  NULL,
  'admin_b cannot INSERT into constituency_group_constituencies referencing Project A parents'
);

SELECT throws_ok(
  format(
    $$INSERT INTO election_constituency_groups (election_id, constituency_group_id) VALUES ('%s', '%s')$$,
    test_id('election_a'),
    test_id('constituency_group_a')
  ),
  NULL,
  NULL,
  'admin_b cannot INSERT into election_constituency_groups referencing Project A parents'
);

-- =====================================================================
-- Section 9: Sanity check - admin can access own project
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('admin_b'),
  test_user_roles('admin_b')
);

SELECT is(
  (SELECT count(*) FROM elections WHERE project_id = test_id('project_b'))::integer,
  1,
  'admin_b CAN see own Project B elections'
);

-- Reset role for cleanup
SELECT reset_role();

SELECT * FROM finish();
ROLLBACK;
