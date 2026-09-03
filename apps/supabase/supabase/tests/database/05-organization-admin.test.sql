-- 05-organization-admin.test.sql: Organization admin scope tests
--
-- Verifies that an organization admin (role=organization, scope_type=organization, scope_id=org_id) can read and update their own organization, see their organization's candidates, but cannot insert/delete organizations, modify candidates, or access admin-only tables.
--
-- Organization admin access patterns (from 302-rls.sql):
--   organizations SELECT (authenticated_select_organizations): can_access_project(project_id) OR auth_user_id = auth.uid() OR has_role('organization','organization',id) OR published = true organizations UPDATE (organization_update_own_organizations): auth_user_id = auth.uid() OR has_role('organization','organization',id) organizations INSERT/DELETE (admin_insert_organizations, admin_delete_organizations): can_access_project (admin-only, not organization) candidates SELECT (authenticated_select_candidates): can_access_project(project_id) OR auth_user_id = auth.uid() OR has_role('organization','organization',organization_id) OR published = true candidates UPDATE: only candidate self-update (candidate_update_own) or admin (no organization UPDATE)
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
-- Section 1: Organization admin can read own organization
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('organization_a'),
  test_user_roles('organization_a')
);

-- organization_a has role=organization, scope_type=organization, scope_id=org_a organizations SELECT policy: has_role('organization','organization',id) matches org_a
SELECT is(
  (SELECT count(*) FROM organizations WHERE id = test_id('org_a'))::integer,
  1,
  'organization_admin can SELECT own organization'
);

-- Organization admin can also see published organizations (published = true in RLS) org_a is published, so verify it appears
SELECT ok(
  (SELECT count(*) FROM organizations WHERE published = true)::integer >= 1,
  'organization_admin can see published organizations'
);

-- =====================================================================
-- Section 2: Organization admin can update own organization (allowed columns)
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('organization_a'),
  test_user_roles('organization_a')
);

-- Column-level GRANT on organizations allows: name, short_name, info, color, image, subtype, custom_data, answers (sort_order, created_at and updated_at were revoked in phase 156 criterion 7 - see 303-column-grants.sql, and 09-column-restrictions.test.sql which asserts the surviving count).
SELECT lives_ok(
  format(
    $$UPDATE organizations SET short_name = '{"en":"Updated"}'::jsonb WHERE id = '%s'$$,
    test_id('org_a')
  ),
  'organization_admin can UPDATE short_name on own organization'
);

-- Verify the update took effect
SELECT is(
  (SELECT short_name->>'en' FROM organizations WHERE id = test_id('org_a')),
  'Updated',
  'organization_admin UPDATE on own organization actually changed data'
);

-- =====================================================================
-- Section 3: Organization admin cannot update other organizations
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('organization_a'),
  test_user_roles('organization_a')
);

-- org_b is in Project B (unpublished) and has no auth_user_id link to organization_a UPDATE should affect 0 rows
SELECT lives_ok(
  format(
    $$UPDATE organizations SET short_name = '{"en":"Hacked"}'::jsonb WHERE id = '%s'$$,
    test_id('org_b')
  ),
  'organization_admin UPDATE on other org does not raise error'
);

SELECT reset_role();
SELECT is(
  (SELECT short_name FROM organizations WHERE id = test_id('org_b')),
  NULL,
  'organization_admin UPDATE on other org had no effect (short_name still NULL)'
);

-- =====================================================================
-- Section 4: Organization admin cannot INSERT or DELETE organizations
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('organization_a'),
  test_user_roles('organization_a')
);

-- INSERT: organizations INSERT policy requires can_access_project (admin-only) organization_a does not have project_admin/account_admin/super_admin role
SELECT throws_ok(
  format(
    $$INSERT INTO organizations (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"Organization Admin Created Org"}')$$,
    test_id('project_a')
  ),
  '42501',
  NULL,
  'organization_admin cannot INSERT organizations (admin-only INSERT policy)'
);

-- DELETE: organizations DELETE policy requires can_access_project (admin-only) Even though organization_a can see org_a, DELETE affects 0 rows (no DELETE policy for organization)
SELECT lives_ok(
  format(
    $$DELETE FROM organizations WHERE id = '%s'$$,
    test_id('org_a')
  ),
  'organization_admin DELETE on own org does not raise error'
);

SELECT reset_role();
SELECT ok(
  (SELECT count(*) FROM organizations WHERE id = test_id('org_a'))::integer = 1,
  'organization_admin DELETE on own org had no effect (record still exists)'
);

-- =====================================================================
-- Section 5: Organization admin can see their organization's candidates
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('organization_a'),
  test_user_roles('organization_a')
);

-- candidates SELECT policy: has_role('organization','organization',organization_id) org_a candidates: candidate_a and candidate_a2 (both in org_a)
SELECT ok(
  (SELECT count(*) FROM candidates WHERE organization_id = test_id('org_a'))::integer >= 1,
  'organization_admin can see candidates in own organization'
);

-- Verify can see specific candidates
SELECT is(
  (SELECT count(*) FROM candidates WHERE organization_id = test_id('org_a'))::integer,
  2,
  'organization_admin sees both candidates in own organization (candidate_a and candidate_a2)'
);

-- =====================================================================
-- Section 6: Organization admin cannot modify candidates
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('organization_a'),
  test_user_roles('organization_a')
);

-- candidates UPDATE: only candidate_update_own (auth_user_id match) and admin_update organization role has no UPDATE policy on candidates
SELECT lives_ok(
  format(
    $$UPDATE candidates SET first_name = 'Hacked' WHERE organization_id = '%s'$$,
    test_id('org_a')
  ),
  'organization_admin UPDATE on own org candidates does not raise error'
);

SELECT reset_role();
SELECT is(
  (SELECT first_name FROM candidates WHERE id = test_id('candidate_a')),
  'Alice',
  'organization_admin UPDATE on candidates had no effect (first_name unchanged)'
);

-- =====================================================================
-- Section 7: Organization admin cannot access admin-only tables
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('organization_a'),
  test_user_roles('organization_a')
);

-- accounts: requires has_role(account_admin) or has_role(super_admin)
SELECT is(
  (SELECT count(*) FROM accounts)::integer,
  0,
  'organization_admin cannot SELECT accounts (admin-only)'
);

-- Reset role for cleanup
SELECT reset_role();

SELECT * FROM finish();
ROLLBACK;
