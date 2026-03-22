-- 05-party-admin.test.sql: Party admin scope tests
--
-- Verifies that a party admin (role=party, scope_type=party, scope_id=org_id)
-- can read and update their own organization, see their party's candidates,
-- but cannot insert/delete organizations, modify candidates, or access
-- admin-only tables.
--
-- Party admin access patterns (from 010-rls.sql):
--   organizations SELECT: auth_user_id = auth.uid() OR has_role('party','party',id) OR published = true
--   organizations UPDATE: auth_user_id = auth.uid() OR has_role('party','party',id)
--   organizations INSERT/DELETE: can_access_project (admin-only, not party)
--   candidates SELECT: has_role('party','party',organization_id) OR published = true
--   candidates UPDATE: only candidate self-update or admin (no party UPDATE)
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)

BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT plan(14);

-- Create test fixture data
SELECT create_test_data();

-- =====================================================================
-- Section 1: Party admin can read own organization
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('party_a'),
  test_user_roles('party_a')
);

-- party_a has role=party, scope_type=party, scope_id=org_a
-- organizations SELECT policy: has_role('party','party',id) matches org_a
SELECT is(
  (SELECT count(*) FROM organizations WHERE id = test_id('org_a'))::integer,
  1,
  'party_admin can SELECT own organization'
);

-- Party admin can also see published organizations (published = true in RLS)
-- org_a is published, so verify it appears
SELECT ok(
  (SELECT count(*) FROM organizations WHERE published = true)::integer >= 1,
  'party_admin can see published organizations'
);

-- =====================================================================
-- Section 2: Party admin can update own organization (allowed columns)
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('party_a'),
  test_user_roles('party_a')
);

-- Column-level GRANT on organizations allows: name, short_name, info, color,
-- image, sort_order, subtype, custom_data, answers, created_at, updated_at
SELECT lives_ok(
  format(
    $$UPDATE organizations SET short_name = '{"en":"Updated"}'::jsonb WHERE id = '%s'$$,
    test_id('org_a')
  ),
  'party_admin can UPDATE short_name on own organization'
);

-- Verify the update took effect
SELECT is(
  (SELECT short_name->>'en' FROM organizations WHERE id = test_id('org_a')),
  'Updated',
  'party_admin UPDATE on own organization actually changed data'
);

-- =====================================================================
-- Section 3: Party admin cannot update other organizations
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('party_a'),
  test_user_roles('party_a')
);

-- org_b is in Project B (unpublished) and has no auth_user_id link to party_a
-- UPDATE should affect 0 rows
SELECT lives_ok(
  format(
    $$UPDATE organizations SET short_name = '{"en":"Hacked"}'::jsonb WHERE id = '%s'$$,
    test_id('org_b')
  ),
  'party_admin UPDATE on other org does not raise error'
);

SELECT reset_role();
SELECT is(
  (SELECT short_name FROM organizations WHERE id = test_id('org_b')),
  NULL,
  'party_admin UPDATE on other org had no effect (short_name still NULL)'
);

-- =====================================================================
-- Section 4: Party admin cannot INSERT or DELETE organizations
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('party_a'),
  test_user_roles('party_a')
);

-- INSERT: organizations INSERT policy requires can_access_project (admin-only)
-- party_a does not have project_admin/account_admin/super_admin role
SELECT throws_ok(
  format(
    $$INSERT INTO organizations (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"Party Created Org"}')$$,
    test_id('project_a')
  ),
  '42501',
  NULL,
  'party_admin cannot INSERT organizations (admin-only INSERT policy)'
);

-- DELETE: organizations DELETE policy requires can_access_project (admin-only)
-- Even though party_a can see org_a, DELETE affects 0 rows (no DELETE policy for party)
SELECT lives_ok(
  format(
    $$DELETE FROM organizations WHERE id = '%s'$$,
    test_id('org_a')
  ),
  'party_admin DELETE on own org does not raise error'
);

SELECT reset_role();
SELECT ok(
  (SELECT count(*) FROM organizations WHERE id = test_id('org_a'))::integer = 1,
  'party_admin DELETE on own org had no effect (record still exists)'
);

-- =====================================================================
-- Section 5: Party admin can see their party's candidates
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('party_a'),
  test_user_roles('party_a')
);

-- candidates SELECT policy: has_role('party','party',organization_id)
-- org_a candidates: candidate_a and candidate_a2 (both in org_a)
SELECT ok(
  (SELECT count(*) FROM candidates WHERE organization_id = test_id('org_a'))::integer >= 1,
  'party_admin can see candidates in own organization'
);

-- Verify can see specific candidates
SELECT is(
  (SELECT count(*) FROM candidates WHERE organization_id = test_id('org_a'))::integer,
  2,
  'party_admin sees both candidates in own organization (candidate_a and candidate_a2)'
);

-- =====================================================================
-- Section 6: Party admin cannot modify candidates
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('party_a'),
  test_user_roles('party_a')
);

-- candidates UPDATE: only candidate_update_own (auth_user_id match) and admin_update
-- party role has no UPDATE policy on candidates
SELECT lives_ok(
  format(
    $$UPDATE candidates SET first_name = 'Hacked' WHERE organization_id = '%s'$$,
    test_id('org_a')
  ),
  'party_admin UPDATE on own org candidates does not raise error'
);

SELECT reset_role();
SELECT is(
  (SELECT first_name FROM candidates WHERE id = test_id('candidate_a')),
  'Alice',
  'party_admin UPDATE on candidates had no effect (first_name unchanged)'
);

-- =====================================================================
-- Section 7: Party admin cannot access admin-only tables
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('party_a'),
  test_user_roles('party_a')
);

-- accounts: requires has_role(account_admin) or has_role(super_admin)
SELECT is(
  (SELECT count(*) FROM accounts)::integer,
  0,
  'party_admin cannot SELECT accounts (admin-only)'
);

-- Reset role for cleanup
SELECT reset_role();

SELECT * FROM finish();
ROLLBACK;
