-- 09-column-restrictions.test.sql: Column-level REVOKE/GRANT tests
--
-- Verifies that the column-level REVOKE UPDATE / GRANT UPDATE mechanism prevents authenticated users from modifying protected columns:
--   - candidates: external_id, project_id, auth_user_id, is_generated, sort_order, created_at, updated_at
--   - organizations: external_id, project_id, auth_user_id, is_generated, sort_order, created_at, updated_at
--
-- While postgres/service_role can update all columns (bypass grants).
--
-- ⚠ THE CONFIRMATION COLUMN IS NO LONGER ONE OF THE PROTECTED ONES IN THIS FILE'S SENSE, AND THE PROTECTION WAS NOT DROPPED -- IT MOVED. As of 162-13 it is ALLOWED BY GRANT on all four entity tables and REFUSED BY TRIGGER: `enforce_entity_immutability()`'s rule 1 refuses any change to it, in either direction, by an authenticated caller who does not hold `entity.confirm` on the row. The grant had to give way because a single global REVOKE/GRANT pair against one role cannot distinguish two callers of that role, so the bar it provided also refused the project administrator the phase declares may confirm -- measured as a live 42501 while `user_can` answered true for that same caller. The two confirmation assertions below therefore observe a named trigger refusal rather than a 42501, and each is paired with an assertion on the SQLSTATE so that the statement is shown to REACH the trigger.
--
-- ⚠ THE NAME COLUMNS ARE STILL GRANTED, and their conditional freeze is likewise the trigger's. Section 2 below unconfirms and re-confirms its own row so that its two grant assertions keep measuring the grant.
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)
--             303-column-grants.sql (column-level REVOKE/GRANT) 011-validation-functions.sql (enforce_entity_immutability)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (34);

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

-- ⚠ RE-POINTED BY 162-16, AND THE MECHANISM UNDER TEST IS UNCHANGED. This assertion's subject used to be the per-row publication column, which 162-16 deletes from the schema entirely; an assertion naming a column that does not exist raises 42703 undefined-column rather than the 42501 insufficient-privilege it asserts, so it would fail for a reason that has nothing to do with the protection it was written to prove. The subject is DERIVED rather than guessed: `external_id` is in the un-granted authenticated-UPDATE set on this table and on `organizations`, it is NOT the confirmation column (162-13 moved that one INTO the allow-list, so an assertion re-pointed at it would observe a success where its description says a refusal), and it is the only member of the un-granted set this file did not already assert. It is also a real tamper vector: `external_id` is the per-project idempotency key `bulk_import` upserts on, so an entity user able to rewrite it could take over another row's import identity. The allow-list mechanism keeps a negative control on both covered tables, which is the property this assertion exists for.
-- An entity user cannot confirm themselves. 162-08 makes the column a term of public read, so a self-settable one would let an identity publish itself without an identity check.
--
-- ⚠ RE-EXPRESSED BY 162-13, AND THE MEASURED CLAIM IS UNCHANGED WHILE THE MECHANISM BEHIND IT MOVED. This assertion observed a 42501 that followed from the confirmation column sitting OUTSIDE the allow-list. 162-13 puts it INTO the allow-list on all four entity tables, because a single global grant pair against one role cannot say "a candidate may not but an administrator may" -- and the bar it retires also refused the project administrator who holds `entity.confirm`, MEASURED as a live 42501 while `user_can` answered true for the same caller. The protection now lives in `enforce_entity_immutability()`'s rule 1. The description string is unchanged because the claim is unchanged; what changed is that the refusal is now named rather than anonymous, and the pair below asserts BOTH halves of it: the message identifies the rule, and the SQLSTATE proves the statement reached the trigger instead of dying at the privilege layer.
--
-- THE VALUE WRITTEN IS THE OPPOSITE OF THE ROW'S, and it has to be. Rule 1 compares old to new with `IS DISTINCT FROM`, so writing `true` to a row that is already confirmed is a no-op the trigger correctly permits -- MEASURED: this assertion reported "no exception thrown" while the protection was working exactly as specified. The fixture confirms `candidate_a`, so the change that is really a change is the one that turns the flag OFF; that is also the dangerous direction, since an entity user who can unconfirm can unfreeze their own name.
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
    'Candidate cannot update confirmed on own record -- and the refusal is the trigger''s raised exception, not the privilege layer''s 42501, so the allow-list change really landed'
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
      $$UPDATE candidates SET auth_user_id = 'cccccccc-cccc-cccc-cccc-000000000099'::uuid WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    '42501',
    NULL,
    'Candidate cannot update auth_user_id on own record'
  );

-- RETIRED by 162-07b, and this note is the retirement reason rather than a placeholder. The assertion that stood here asserted that a candidate cannot UPDATE its own `organization_id`. That column no longer exists on `public.candidates`, so the statement it ran is now a 42703 undefined-column error rather than the 42501 insufficient-privilege error it asserted -- it would fail for a reason that has nothing to do with the protection it was written to prove. This is NOT a weakened assertion: it is an assertion whose SUBJECT was removed. The protection itself did not lapse, because the column-grant model here is an allow-list and a column that does not exist is outside every grant by construction. The candidate-to-organization association now lives on `nominations.parent_nomination_id`, whose write protection is 162-12's to assert.
SELECT
  throws_ok (
    format(
      $$UPDATE candidates SET is_generated = true WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    '42501',
    NULL,
    'Candidate cannot update is_generated on own record'
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

-- ⚠ THE TWO NAME COLUMNS ARE STILL IN THE GRANT, AND THAT IS THE POINT 162-13 HAD TO PRESERVE. Removing them would freeze a name on an UNCONFIRMED entity and make the sign-up flow impossible, which section 11.2 forbids -- so the column grant still permits them and the CONDITION lives in `enforce_entity_immutability()`'s rule 2 instead.
--
-- The fixture's `candidate_a` is confirmed, so the grant alone is no longer enough to make these two statements succeed. The row is unconfirmed as the owner for the length of this section, which is what leaves these two assertions measuring the thing they were written to measure -- the COLUMN GRANT -- rather than the trigger's condition; the third assertion below then restores the confirmation and observes that the very same statement is refused, which is strictly more than the two alone ever said.
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
-- ⚠ RE-EXPRESSED BY 162-13 EXACTLY AS ITS CANDIDATES TWIN ABOVE, and for the same reason: the column entered this table's UPDATE allow-list too, so the refusal is now `enforce_entity_immutability()`'s rule 1 rather than a privilege error. The value written is `false` -- the opposite of this row's -- because rule 1 compares old to new with `IS DISTINCT FROM` and a write of the value already stored is a no-op the trigger correctly permits. That is also the dangerous direction: an entity user who can unconfirm can unfreeze their own name.
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
    'Organization admin cannot update confirmed on own organization -- and the refusal is the trigger''s raised exception, not the privilege layer''s 42501, so the allow-list change really landed here too'
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
      $$UPDATE organizations SET auth_user_id = 'cccccccc-cccc-cccc-cccc-000000000099'::uuid WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    '42501',
    NULL,
    'Organization admin cannot update auth_user_id on own organization'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE organizations SET is_generated = true WHERE id = '%s'$$,
      test_id ('org_a')
    ),
    '42501',
    NULL,
    'Organization admin cannot update is_generated on own organization'
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
-- Section 5: Postgres (admin-equivalent) CAN update protected columns The column-level REVOKE only affects authenticated role. Postgres and service_role bypass it, confirming admin operations work.
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
-- Section 6: A permitted self-edit still works, and the audit timestamp still advances Column privileges are checked against the columns named in the statement, not against what a BEFORE UPDATE trigger assigns, so revoking updated_at does not break self-edit.
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
-- Section 7: The surviving authenticated UPDATE privilege set, read from the catalogue A count catches both failure directions at once: a column silently left granted, and a column accidentally revoked alongside the intended ones. Membership lists do not, because they also churn on harmless reordering.
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
    'authenticated holds UPDATE on exactly 10 columns of candidates (14 originally, less name, less sort_order, created_at and updated_at), plus the confirmation column 162-13 moved into the allow-list and handed to enforce_entity_immutability -- 11'
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
    'authenticated holds UPDATE on exactly 8 columns of organizations (11 originally, less sort_order, created_at and updated_at), plus the confirmation column 162-13 moved into the allow-list and handed to enforce_entity_immutability -- 9'
  );

-- =====================================================================
-- CR-04: projects.account_id is not writable by any authenticated caller
--
-- 162-REVIEW CR-04 reproduced a project admin running `UPDATE projects SET account_id = <other account>` and succeeding: the UPDATE policy asks `project.edit_project_settings` of the row's id, which the rewrite leaves unchanged. The control shows the same caller still writes a settings column, so the refusals are the column grant and not a closed policy.
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
    'CR-04 control: a project admin can still update a settings column of its own project'
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
    'CR-04: a project admin cannot move its project into another account'
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
    'CR-04: an account admin cannot move one of its projects into another account either'
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
    'CR-04: project A still belongs to account A after both attempts'
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
