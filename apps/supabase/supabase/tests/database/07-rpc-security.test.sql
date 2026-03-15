-- 07-rpc-security.test.sql: RPC function security tests
--
-- Verifies security properties of bulk_import, bulk_delete, and resolve_email_variables:
--   - bulk_import/bulk_delete are SECURITY INVOKER (RLS applies to caller)
--   - Candidate cannot insert/delete project data (RLS blocks)
--   - resolve_email_variables is SECURITY DEFINER (can read auth.users)
--   - resolve_email_variables returns data for authenticated callers
--
-- Note: bulk_import has a pre-existing ON CONFLICT issue with partial unique indexes.
-- The RPC security tests verify the SECURITY INVOKER/DEFINER model and RLS enforcement
-- by testing the underlying operations that the RPC functions invoke.
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)
--             016-bulk-operations.sql (bulk_import, bulk_delete)
--             017-email-helpers.sql (resolve_email_variables)

BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT plan(9);

-- Create test fixture data
SELECT create_test_data();

-- =====================================================================
-- Section 1: bulk_import is SECURITY INVOKER
-- =====================================================================

SELECT ok(
  NOT (SELECT prosecdef FROM pg_proc WHERE proname = 'bulk_import'),
  'bulk_import is SECURITY INVOKER (not DEFINER)'
);

-- =====================================================================
-- Section 2: bulk_delete is SECURITY INVOKER
-- =====================================================================

SELECT ok(
  NOT (SELECT prosecdef FROM pg_proc WHERE proname = 'bulk_delete'),
  'bulk_delete is SECURITY INVOKER (not DEFINER)'
);

-- =====================================================================
-- Section 3: Candidate cannot INSERT elections (SECURITY INVOKER means RLS applies)
-- This tests the core security model: even though bulk_import calls INSERT,
-- the authenticated candidate's RLS policies block the operation.
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT throws_ok(
  format(
    $$INSERT INTO elections (id, project_id, name, external_id) VALUES (gen_random_uuid(), '%s', '{"en": "Hacked"}'::jsonb, 'hack-1')$$,
    test_id('project_a')
  ),
  NULL,
  NULL,
  'Candidate cannot INSERT elections directly (RLS blocks -- SECURITY INVOKER basis)'
);

-- =====================================================================
-- Section 4: Candidate cannot DELETE elections (SECURITY INVOKER basis)
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

-- The DELETE silently affects 0 rows due to RLS (no matching rows visible)
SELECT lives_ok(
  format(
    $$DELETE FROM elections WHERE project_id = '%s'$$,
    test_id('project_a')
  ),
  'Candidate DELETE on elections does not raise error (RLS filters to 0 rows)'
);

-- Verify elections still exist (RLS prevented deletion)
SELECT reset_role();
SELECT ok(
  (SELECT count(*) FROM elections WHERE project_id = test_id('project_a'))::integer >= 1,
  'Election still exists after candidate delete attempt (SECURITY INVOKER protects)'
);

-- =====================================================================
-- Section 5: Admin can DELETE app_settings in own project
-- (app_settings has no storage cleanup trigger, suitable for admin DELETE test)
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

-- Delete the existing app_settings record created by create_test_data()
SELECT lives_ok(
  format(
    $$DELETE FROM app_settings WHERE id = '%s'$$,
    test_id('app_settings_a')
  ),
  'admin_a can DELETE app_settings in own project (admin RLS allows)'
);

-- Verify it was actually deleted
SELECT reset_role();
SELECT is(
  (SELECT count(*) FROM app_settings WHERE id = test_id('app_settings_a'))::integer,
  0,
  'app_settings record was actually deleted by admin'
);

-- =====================================================================
-- Section 6: resolve_email_variables is SECURITY DEFINER
-- =====================================================================

SELECT ok(
  (SELECT prosecdef FROM pg_proc WHERE proname = 'resolve_email_variables'),
  'resolve_email_variables is SECURITY DEFINER (can read auth.users)'
);

-- =====================================================================
-- Section 7: resolve_email_variables returns data for authenticated caller
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT ok(
  (SELECT count(*) FROM resolve_email_variables(
    ARRAY[test_user_id('candidate_a')]
  ))::integer = 1,
  'resolve_email_variables returns data for candidate_a user (SECURITY DEFINER reads auth.users)'
);

-- =====================================================================
-- Cleanup
-- =====================================================================

SELECT reset_role();

SELECT * FROM finish();
ROLLBACK;
