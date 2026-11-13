-- 34-feedback-project-guard.test.sql: a feedback row must name its project when inserted
--
-- Both feedback INSERT policies are `WITH CHECK (true)`, so the policies admit a row with no project. The `enforce_feedback_project` trigger refuses such a row for every caller with SQLSTATE 23502, which leaves the foreign key's `ON DELETE SET NULL` as the only way a row can lose its project. That matters because `admin_select_feedback` and `admin_delete_feedback` expose rows with a NULL project to the global-scope admin: without the trigger, any visitor could place a row there.
--
-- The service-role caller bypasses row-level security, so its refusal shows that the trigger, not a policy, enforces the rule.
--
-- Feedback inserts set `request.headers` first, with a distinct forwarded IP per insert site, so `check_feedback_rate_limit` never decides an assertion.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_user_grants).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (8);

SELECT
  create_test_data ();

-- =====================================================================
-- 1. The trigger exists on the table
-- =====================================================================
SELECT
  has_trigger (
    'public',
    'feedback',
    'enforce_feedback_project',
    'public.feedback carries the enforce_feedback_project trigger'
  );

-- =====================================================================
-- 2. An insert without a project is refused, whoever the caller is
-- =====================================================================
SELECT
  set_test_user ('anon');

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"203.0.113.41"}',
    true
  );

SELECT
  throws_ok (
    $$INSERT INTO feedback (rating, description) VALUES (5, 'No project named')$$,
    '23502',
    'feedback.project_id must name a project',
    'an anon insert that omits project_id is refused with not_null_violation'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"203.0.113.42"}',
    true
  );

SELECT
  throws_ok (
    $$INSERT INTO feedback (project_id, rating, description) VALUES (NULL, 1, 'Explicit null project')$$,
    '23502',
    'feedback.project_id must name a project',
    'an authenticated insert with project_id NULL is refused with not_null_violation'
  );

SELECT
  reset_role ();

SELECT
  set_config('role', 'service_role', true);

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"203.0.113.43"}',
    true
  );

SELECT
  throws_ok (
    $$INSERT INTO feedback (rating, description) VALUES (3, 'Service role, no project')$$,
    '23502',
    'feedback.project_id must name a project',
    'a service-role insert without a project is refused too: the rule does not depend on row-level security'
  );

-- =====================================================================
-- 3. A project-scoped insert succeeds, and deleting the project orphans it
-- =====================================================================
SELECT
  reset_role ();

INSERT INTO
  projects (id, account_id, name, open_for_voters)
VALUES
  (
    'e3400000-0000-0000-0000-000000000001',
    test_id ('account_a'),
    'Feedback Guard Project',
    true
  );

SELECT
  set_test_user ('anon');

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"203.0.113.44"}',
    true
  );

SELECT
  lives_ok (
    $$INSERT INTO feedback (id, project_id, rating, description) VALUES ('e3400000-0000-0000-0000-000000000002', 'e3400000-0000-0000-0000-000000000001', 4, 'Scoped to a project')$$,
    'an anon insert that names a project succeeds'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        project_id
      FROM
        feedback
      WHERE
        id = 'e3400000-0000-0000-0000-000000000002'
    ),
    'e3400000-0000-0000-0000-000000000001'::uuid,
    'the inserted row names its project'
  );

DELETE FROM projects
WHERE
  id = 'e3400000-0000-0000-0000-000000000001';

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        feedback
      WHERE
        id = 'e3400000-0000-0000-0000-000000000002'
    )::integer,
    1,
    'the row survives the deletion of its project: the trigger does not fire on the foreign key''s update'
  );

SELECT
  ok (
    (
      SELECT
        project_id IS NULL
      FROM
        feedback
      WHERE
        id = 'e3400000-0000-0000-0000-000000000002'
    ),
    'and it now carries a NULL project_id, the one path to an orphaned row'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
