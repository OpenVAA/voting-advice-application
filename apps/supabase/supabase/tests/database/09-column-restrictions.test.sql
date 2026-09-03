-- 09-column-restrictions.test.sql: Column-level REVOKE/GRANT tests
--
-- Verifies that the column-level REVOKE UPDATE / GRANT UPDATE mechanism prevents authenticated users from modifying protected columns:
--   - candidates: published, project_id, auth_user_id, organization_id, is_generated, sort_order, created_at, updated_at
--   - organizations: published, project_id, auth_user_id, is_generated, sort_order, created_at, updated_at
--
-- While postgres/service_role can update all columns (bypass grants).
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)
--             303-column-grants.sql (column-level REVOKE/GRANT)

BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT plan(26);

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

-- The presentation-order column and the two audit timestamps are not self-editable either: ordering is admin-controlled, and a record owner who can rewrite when their row was created or last touched can repudiate their own edit history.

SELECT throws_ok(
  format(
    $$UPDATE candidates SET sort_order = 999 WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  '42501',
  NULL,
  'Candidate cannot update sort_order on own record'
);

SELECT throws_ok(
  format(
    $$UPDATE candidates SET created_at = '2000-01-01T00:00:00Z'::timestamptz WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  '42501',
  NULL,
  'Candidate cannot update created_at on own record'
);

SELECT throws_ok(
  format(
    $$UPDATE candidates SET updated_at = '2000-01-01T00:00:00Z'::timestamptz WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  '42501',
  NULL,
  'Candidate cannot update updated_at on own record'
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
-- Section 3: Organization admin cannot UPDATE protected columns on own organization
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('organization_a'),
  test_user_roles('organization_a')
);

SELECT throws_ok(
  format(
    $$UPDATE organizations SET published = true WHERE id = '%s'$$,
    test_id('org_a')
  ),
  '42501',
  NULL,
  'Organization admin cannot update published on own organization'
);

SELECT throws_ok(
  format(
    $$UPDATE organizations SET project_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid WHERE id = '%s'$$,
    test_id('org_a')
  ),
  '42501',
  NULL,
  'Organization admin cannot update project_id on own organization'
);

SELECT throws_ok(
  format(
    $$UPDATE organizations SET auth_user_id = 'cccccccc-cccc-cccc-cccc-000000000099'::uuid WHERE id = '%s'$$,
    test_id('org_a')
  ),
  '42501',
  NULL,
  'Organization admin cannot update auth_user_id on own organization'
);

SELECT throws_ok(
  format(
    $$UPDATE organizations SET is_generated = true WHERE id = '%s'$$,
    test_id('org_a')
  ),
  '42501',
  NULL,
  'Organization admin cannot update is_generated on own organization'
);

-- The same three columns are closed on this table too: the tamper vector is identical, so proving it only on candidates would leave an equally open surface next door.

SELECT throws_ok(
  format(
    $$UPDATE organizations SET sort_order = 999 WHERE id = '%s'$$,
    test_id('org_a')
  ),
  '42501',
  NULL,
  'Organization admin cannot update sort_order on own organization'
);

SELECT throws_ok(
  format(
    $$UPDATE organizations SET created_at = '2000-01-01T00:00:00Z'::timestamptz WHERE id = '%s'$$,
    test_id('org_a')
  ),
  '42501',
  NULL,
  'Organization admin cannot update created_at on own organization'
);

SELECT throws_ok(
  format(
    $$UPDATE organizations SET updated_at = '2000-01-01T00:00:00Z'::timestamptz WHERE id = '%s'$$,
    test_id('org_a')
  ),
  '42501',
  NULL,
  'Organization admin cannot update updated_at on own organization'
);

-- =====================================================================
-- Section 4: Organization admin CAN UPDATE allowed columns on own organization
-- =====================================================================

SELECT set_test_user(
  'authenticated',
  test_user_id('organization_a'),
  test_user_roles('organization_a')
);

SELECT lives_ok(
  format(
    $$UPDATE organizations SET short_name = '{"en":"New Short"}'::jsonb WHERE id = '%s'$$,
    test_id('org_a')
  ),
  'Organization admin can update short_name on own organization'
);

SELECT lives_ok(
  format(
    $$UPDATE organizations SET info = '{"en":"About us updated"}'::jsonb WHERE id = '%s'$$,
    test_id('org_a')
  ),
  'Organization admin can update info on own organization'
);

-- =====================================================================
-- Section 5: Postgres (admin-equivalent) CAN update protected columns The column-level REVOKE only affects authenticated role. Postgres and service_role bypass it, confirming admin operations work.
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
-- Section 6: A permitted self-edit still works, and the audit timestamp still advances Column privileges are checked against the columns named in the statement, not against what a BEFORE UPDATE trigger assigns, so revoking updated_at does not break self-edit.
-- =====================================================================

-- now() is frozen for the whole transaction, so the fixture row's updated_at already equals what the trigger would write. Backdating it as postgres first is what makes the trigger's write observable rather than a coincidence.
--
-- The trigger MUST be disabled across the backdate. public.update_updated_at() is an unconditional `NEW.updated_at = now()` with no WHEN clause, so a plain `UPDATE ... SET updated_at = 'epoch'` fires the very trigger it is preparing to observe and the backdate never lands - leaving the assertion below comparing now() against 'epoch', which is true no matter what the candidate does. Disabling it makes the pre-state real, which is what gives the assertion the power to fail when the candidate's UPDATE is removed.
SELECT reset_role();

ALTER TABLE candidates DISABLE TRIGGER set_updated_at;
UPDATE candidates SET updated_at = 'epoch'::timestamptz WHERE id = test_id('candidate_a');
ALTER TABLE candidates ENABLE TRIGGER set_updated_at;

-- The backdate landed. If this fails, the assertion at the end of the section is vacuous again.
SELECT is(
  (SELECT updated_at FROM candidates WHERE id = test_id('candidate_a')),
  'epoch'::timestamptz,
  'the backdate landed, so the pre-state the trigger has to advance from is observable (guards the assertion below against silently becoming now() > epoch)'
);

SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT lives_ok(
  format(
    $$UPDATE candidates SET short_name = '{"en":"Trigger Control"}'::jsonb WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  'Candidate can still update a permitted column while holding no privilege on updated_at'
);

SELECT reset_role();

SELECT ok(
  (SELECT updated_at FROM candidates WHERE id = test_id('candidate_a')) > 'epoch'::timestamptz,
  'The set_updated_at trigger advanced updated_at although the caller cannot name that column'
);

-- =====================================================================
-- Section 7: The surviving authenticated UPDATE privilege set, read from the catalogue A count catches both failure directions at once: a column silently left granted, and a column accidentally revoked alongside the intended ones. Membership lists do not, because they also churn on harmless reordering.
-- =====================================================================

SELECT reset_role();

SELECT is(
  (SELECT count(*)::integer
   FROM information_schema.column_privileges
   WHERE grantee = 'authenticated'
     AND privilege_type = 'UPDATE'
     AND table_schema = 'public'
     AND table_name = 'candidates'),
  10,
  'authenticated holds UPDATE on exactly 10 columns of candidates (14 originally, less name, less sort_order, created_at and updated_at)'
);

SELECT is(
  (SELECT count(*)::integer
   FROM information_schema.column_privileges
   WHERE grantee = 'authenticated'
     AND privilege_type = 'UPDATE'
     AND table_schema = 'public'
     AND table_name = 'organizations'),
  8,
  'authenticated holds UPDATE on exactly 8 columns of organizations (11 originally, less sort_order, created_at and updated_at)'
);

-- =====================================================================
-- Cleanup
-- =====================================================================

SELECT reset_role();

SELECT * FROM finish();
ROLLBACK;
