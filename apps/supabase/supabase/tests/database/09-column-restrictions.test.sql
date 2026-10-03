-- 09-column-restrictions.test.sql: Column-level REVOKE/GRANT tests
--
-- Verifies that the column-level REVOKE UPDATE / GRANT UPDATE mechanism prevents authenticated users from modifying protected columns:
-- - candidates: external_id, project_id, id, sort_order, created_at, updated_at
-- - organizations: external_id, project_id, id, sort_order, created_at, updated_at
-- - projects: account_id
--
-- postgres and service_role bypass the column grants and can update every column.
--
-- The confirmation column is granted on all four entity tables and guarded by a trigger instead: rule 1 of `enforce_entity_immutability()` refuses any change to it by an authenticated caller who does not hold `entity.confirm` on the row. A column grant cannot tell a candidate from a project administrator of the same role, so the check lives in the trigger, and each confirmation assertion is paired with an SQLSTATE assertion showing that the statement reached it.
--
-- The name columns are granted too, and their freeze once confirmed is the trigger's rule 2. Section 2 unconfirms and re-confirms its own row so that its two grant assertions measure the grant.
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.), 303-column-grants.sql (column-level REVOKE/GRANT) and 011-validation-functions.sql (enforce_entity_immutability).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (32);

-- Create test fixture data
SELECT
  create_test_data ();

-- =====================================================================
-- Section 1: Candidate cannot UPDATE protected columns on own record
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

-- `external_id` is the per-project idempotency key `bulk_import` upserts on, so an entity user able to rewrite it could take over another row's import identity.
SELECT
  throws_ok (
    format(
      $$UPDATE candidates SET external_id = 'hijacked-by-candidate' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    '42501',
    NULL,
    'Candidate cannot update external_id on own record'
  );

-- An entity user cannot confirm themselves. Confirmation is a condition of public visibility, so a self-settable flag would let an identity publish itself without an identity check.
--
-- The refusal is rule 1 of `enforce_entity_immutability()`, so the pair below asserts both the rule's message and its SQLSTATE, which proves the statement reached the trigger instead of failing at the privilege layer.
--
-- The value written is the opposite of the row's. Rule 1 compares old to new with `IS DISTINCT FROM`, so writing `true` to the confirmed fixture row is a permitted no-op; turning the flag off is also the dangerous direction, since an entity user who can unconfirm can unfreeze their own name.
SELECT
  throws_like (
    format(
      $$UPDATE candidates SET confirmed = false WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'Entity confirmation requires the entity.confirm permission:%',
    'Candidate cannot update confirmed on own record'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE candidates SET confirmed = false WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'P0001',
    NULL,
    'Candidate cannot update confirmed on own record -- and the refusal is the trigger''s raised exception, not the privilege layer''s 42501, so the column is inside the UPDATE grant'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE candidates SET project_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    '42501',
    NULL,
    'Candidate cannot update project_id on own record'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE candidates SET id = 'dddddddd-dddd-dddd-dddd-000000000099'::uuid WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    '42501',
    NULL,
    'Candidate cannot update id on own record'
  );

-- The presentation-order column and the two audit timestamps are not self-editable either: ordering is admin-controlled, and a record owner who can rewrite when their row was created or last touched can repudiate their own edit history.
SELECT
  throws_ok (
    format(
      $$UPDATE candidates SET sort_order = 999 WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    '42501',
    NULL,
    'Candidate cannot update sort_order on own record'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE candidates SET created_at = '2000-01-01T00:00:00Z'::timestamptz WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    '42501',
    NULL,
    'Candidate cannot update created_at on own record'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE candidates SET updated_at = '2000-01-01T00:00:00Z'::timestamptz WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    '42501',
    NULL,
    'Candidate cannot update updated_at on own record'
  );

-- =====================================================================
-- Section 2: Candidate CAN UPDATE allowed columns on own record
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

-- The two name columns stay in the grant, because freezing a name on an unconfirmed entity would make sign-up impossible; the freeze once confirmed is rule 2 of `enforce_entity_immutability()`.
--
-- The fixture's `candidate_a` is confirmed, so the section unconfirms it as postgres first and the two assertions measure the column grant rather than the trigger. The third assertion restores the confirmation and observes that the same statement is refused.
SELECT
  reset_role ();

UPDATE candidates
SET
  confirmed = false
WHERE
  id = test_id ('candidate_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET first_name = 'NewAlice' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'Candidate can update first_name on own record'
  );

SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET last_name = 'NewAlpha' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'Candidate can update last_name on own record'
  );

SELECT
  reset_role ();

UPDATE candidates
SET
  confirmed = true
WHERE
  id = test_id ('candidate_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_like (
    format(
      $$UPDATE candidates SET first_name = 'NewAliceAgain' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'Entity name is immutable once confirmed:%',
    'Candidate can update first_name on own record -- but only while the record is unconfirmed; the identical statement on the confirmed row is refused by name'
  );

SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET info = '{"en":"Updated bio"}'::jsonb WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'Candidate can update info on own record'
  );

-- =====================================================================
-- Section 3: Organization admin cannot UPDATE protected columns on own organization
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  throws_ok (
    format(
      $$UPDATE organizations SET external_id = 'hijacked-by-org-admin' WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    '42501',
    NULL,
    'Organization admin cannot update external_id on own organization'
  );

-- The confirmation column's twin on this table: the tamper vector is identical, so proving it only on candidates would leave an equally open surface next door.
--
-- As on candidates, the refusal is rule 1 of `enforce_entity_immutability()`. The value written is `false`, the opposite of the row's, because a write of the stored value is a no-op the trigger permits.
SELECT
  throws_like (
    format(
      $$UPDATE organizations SET confirmed = false WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    'Entity confirmation requires the entity.confirm permission:%',
    'Organization admin cannot update confirmed on own organization'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE organizations SET confirmed = false WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    'P0001',
    NULL,
    'Organization admin cannot update confirmed on own organization -- and the refusal is the trigger''s raised exception, not the privilege layer''s 42501, so the column is inside the UPDATE grant here too'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE organizations SET project_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    '42501',
    NULL,
    'Organization admin cannot update project_id on own organization'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE organizations SET id = 'dddddddd-dddd-dddd-dddd-000000000099'::uuid WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    '42501',
    NULL,
    'Organization admin cannot update id on own organization'
  );

-- The same three columns are closed on this table too: the tamper vector is identical, so proving it only on candidates would leave an equally open surface next door.
SELECT
  throws_ok (
    format(
      $$UPDATE organizations SET sort_order = 999 WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    '42501',
    NULL,
    'Organization admin cannot update sort_order on own organization'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE organizations SET created_at = '2000-01-01T00:00:00Z'::timestamptz WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    '42501',
    NULL,
    'Organization admin cannot update created_at on own organization'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE organizations SET updated_at = '2000-01-01T00:00:00Z'::timestamptz WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    '42501',
    NULL,
    'Organization admin cannot update updated_at on own organization'
  );

-- =====================================================================
-- Section 4: Organization admin CAN UPDATE allowed columns on own organization
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE organizations SET short_name = '{"en":"New Short"}'::jsonb WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    'Organization admin can update short_name on own organization'
  );

SELECT
  lives_ok (
    format(
      $$UPDATE organizations SET info = '{"en":"About us updated"}'::jsonb WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    'Organization admin can update info on own organization'
  );

-- =====================================================================
-- Section 5: Postgres (admin-equivalent) CAN update protected columns
--
-- The column-level REVOKE only affects the authenticated role. Postgres and service_role bypass it, so admin operations still work.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET external_id = 'set-by-postgres' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'postgres can update external_id on candidates (bypasses column grants)'
  );

-- =====================================================================
-- Section 6: A permitted self-edit still works, and the audit timestamp still advances
--
-- Column privileges are checked against the columns named in the statement, not against what a BEFORE UPDATE trigger assigns, so revoking updated_at does not break self-edit.
-- =====================================================================
-- now() is frozen for the whole transaction, so the fixture row's updated_at already equals what the trigger would write. Backdating it as postgres first is what makes the trigger's write observable rather than a coincidence.
--
-- The trigger MUST be disabled across the backdate. public.update_updated_at() is an unconditional `NEW.updated_at = now()` with no WHEN clause, so a plain `UPDATE ... SET updated_at = 'epoch'` fires the very trigger it is preparing to observe and the backdate never lands - leaving the assertion below comparing now() against 'epoch', which is true no matter what the candidate does. Disabling it makes the pre-state real, which is what gives the assertion the power to fail when the candidate's UPDATE is removed.
SELECT
  reset_role ();

ALTER TABLE candidates DISABLE TRIGGER set_updated_at;

UPDATE candidates
SET
  updated_at = 'epoch'::timestamptz
WHERE
  id = test_id ('candidate_a');

ALTER TABLE candidates ENABLE TRIGGER set_updated_at;

-- The backdate landed. If this fails, the assertion at the end of the section is vacuous again.
SELECT
  is (
    (
      SELECT
        updated_at
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    ),
    'epoch'::timestamptz,
    'the backdate landed, so the pre-state the trigger has to advance from is observable (guards the assertion below against silently becoming now() > epoch)'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET short_name = '{"en":"Trigger Control"}'::jsonb WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'Candidate can still update a permitted column while holding no privilege on updated_at'
  );

SELECT
  reset_role ();

SELECT
  ok (
    (
      SELECT
        updated_at
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    ) > 'epoch'::timestamptz,
    'The set_updated_at trigger advanced updated_at although the caller cannot name that column'
  );

-- =====================================================================
-- Section 7: The authenticated UPDATE privilege set, read from the catalogue
--
-- A count catches both failure directions at once: a column silently left granted, and a column accidentally revoked alongside the intended ones. Both counts include `confirmed`, which is granted and guarded by `enforce_entity_immutability()`.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        information_schema.column_privileges
      WHERE
        grantee = 'authenticated'
        AND privilege_type = 'UPDATE'
        AND table_schema = 'public'
        AND table_name = 'candidates'
    ),
    11,
    'authenticated holds UPDATE on exactly 11 columns of candidates'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        information_schema.column_privileges
      WHERE
        grantee = 'authenticated'
        AND privilege_type = 'UPDATE'
        AND table_schema = 'public'
        AND table_name = 'organizations'
    ),
    9,
    'authenticated holds UPDATE on exactly 9 columns of organizations'
  );

-- =====================================================================
-- Section 8: projects.account_id is not writable by any authenticated caller
--
-- The projects UPDATE policy asks `project.edit_project_settings` of the row's id, which a rewrite of `account_id` leaves unchanged, so only the column grant stops a project admin from moving its project into another account. The control shows the same caller still writes a settings column, so the refusals come from the column grant and not from a closed policy.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE projects SET lock_nominations = true WHERE id = '%s'$$,
      test_id ('project_a')
    ),
    'control: a project admin can still update a settings column of its own project'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE projects SET account_id = '%s' WHERE id = '%s'$$,
      test_id ('account_b'),
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'a project admin cannot move its project into another account'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('account_admin_a'),
    test_user_grants ('account_admin_a')
  );

SELECT
  throws_ok (
    format(
      $$UPDATE projects SET account_id = '%s' WHERE id = '%s'$$,
      test_id ('account_b'),
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'an account admin cannot move one of its projects into another account either'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        account_id
      FROM
        projects
      WHERE
        id = test_id ('project_a')
    ),
    test_id ('account_a'),
    'project A still belongs to account A after both attempts'
  );

-- =====================================================================
-- Cleanup
-- =====================================================================
SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
