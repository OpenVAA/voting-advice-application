-- 09-column-restrictions.test.sql: Column-level REVOKE/GRANT tests
--
-- Verifies that the column-level REVOKE UPDATE / GRANT UPDATE mechanism
-- prevents authenticated users from modifying protected columns:
--   - candidates: published, project_id, auth_user_id, organization_id, is_generated
--   - organizations: published, project_id, auth_user_id, is_generated
--
-- While postgres/service_role can update all columns (bypass grants).
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)
--             013-auth-rls.sql (column-level REVOKE/GRANT)

BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT plan(15);

-- Create test fixture data
SELECT create_test_data();

-- =====================================================================
-- Section 1: Candidate cannot UPDATE protected columns on own record
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT throws_ok(
  format(
    $$UPDATE candidates SET published = true WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  '42501',
  NULL,
  'Candidate cannot update published on own record'
);

SELECT throws_ok(
  format(
    $$UPDATE candidates SET project_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  '42501',
  NULL,
  'Candidate cannot update project_id on own record'
);

SELECT throws_ok(
  format(
    $$UPDATE candidates SET auth_user_id = 'cccccccc-cccc-cccc-cccc-000000000099'::uuid WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  '42501',
  NULL,
  'Candidate cannot update auth_user_id on own record'
);

SELECT throws_ok(
  format(
    $$UPDATE candidates SET organization_id = '%s' WHERE id = '%s'$$,
    test_id('org_b'),
    test_id('candidate_a')
  ),
  '42501',
  NULL,
  'Candidate cannot update organization_id on own record'
);

SELECT throws_ok(
  format(
    $$UPDATE candidates SET is_generated = true WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  '42501',
  NULL,
  'Candidate cannot update is_generated on own record'
);

-- =====================================================================
-- Section 2: Candidate CAN UPDATE allowed columns on own record
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT lives_ok(
  format(
    $$UPDATE candidates SET first_name = 'NewAlice' WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  'Candidate can update first_name on own record'
);

SELECT lives_ok(
  format(
    $$UPDATE candidates SET last_name = 'NewAlpha' WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  'Candidate can update last_name on own record'
);

SELECT lives_ok(
  format(
    $$UPDATE candidates SET info = '{"en":"Updated bio"}'::jsonb WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  'Candidate can update info on own record'
);

-- =====================================================================
-- Section 3: Party admin cannot UPDATE protected columns on own organization
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('party_a'),
  test_user_roles('party_a')
);

SELECT throws_ok(
  format(
    $$UPDATE organizations SET published = true WHERE id = '%s'$$,
    test_id('org_a')
  ),
  '42501',
  NULL,
  'Party admin cannot update published on own organization'
);

SELECT throws_ok(
  format(
    $$UPDATE organizations SET project_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid WHERE id = '%s'$$,
    test_id('org_a')
  ),
  '42501',
  NULL,
  'Party admin cannot update project_id on own organization'
);

SELECT throws_ok(
  format(
    $$UPDATE organizations SET auth_user_id = 'cccccccc-cccc-cccc-cccc-000000000099'::uuid WHERE id = '%s'$$,
    test_id('org_a')
  ),
  '42501',
  NULL,
  'Party admin cannot update auth_user_id on own organization'
);

SELECT throws_ok(
  format(
    $$UPDATE organizations SET is_generated = true WHERE id = '%s'$$,
    test_id('org_a')
  ),
  '42501',
  NULL,
  'Party admin cannot update is_generated on own organization'
);

-- =====================================================================
-- Section 4: Party admin CAN UPDATE allowed columns on own organization
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('party_a'),
  test_user_roles('party_a')
);

SELECT lives_ok(
  format(
    $$UPDATE organizations SET short_name = '{"en":"New Short"}'::jsonb WHERE id = '%s'$$,
    test_id('org_a')
  ),
  'Party admin can update short_name on own organization'
);

SELECT lives_ok(
  format(
    $$UPDATE organizations SET info = '{"en":"About us updated"}'::jsonb WHERE id = '%s'$$,
    test_id('org_a')
  ),
  'Party admin can update info on own organization'
);

-- =====================================================================
-- Section 5: Postgres (admin-equivalent) CAN update protected columns
-- The column-level REVOKE only affects authenticated role. Postgres and
-- service_role bypass it, confirming admin operations work.
-- =====================================================================

SELECT reset_role();

SELECT lives_ok(
  format(
    $$UPDATE candidates SET published = true WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  'postgres can update published on candidates (bypasses column grants)'
);

-- =====================================================================
-- Cleanup
-- =====================================================================

SELECT reset_role();

SELECT * FROM finish();
ROLLBACK;
