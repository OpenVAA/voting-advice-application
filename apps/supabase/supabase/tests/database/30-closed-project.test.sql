-- 30-closed-project.test.sql: a project that is not open for voters, measured where the estate had gaps
--
-- WHAT IS ALREADY PINNED, AND IS NOT REPEATED HERE. 16-anon-visibility.test.sql Section 5 pairs every project-scoped structure table (app_settings, elections, questions and the rest) across the open project A and the closed project B for the anon caller, so anon's direct table reads of a closed project are covered. This file adds nothing to that file or to 25-matrix-conformance.test.sql, whose failing assertion numbers are recorded positionally by 162-17's G8A/G8B guard replay.
--
-- THE GAPS THIS FILE CLOSES (162.1 D-21 as amended after research, D-16, D-17). First, the two RPCs the voter app calls, get_nominations and get_questions: both are SECURITY INVOKER, so a closed project is decided by the tables' RLS underneath them, and nothing asserted what they return to anon for a project that is not open. Second, the EXECUTE right on project_open_for_voters that the frontend adapter has depended on since 162.1-07 to tell a closed project from an open project with no settings row. Third, the grant-holder reads that make the closed-project preview possible (D-17) and let candidates work before a project opens (D-16).
--
-- WHY EVERY ZERO BELOW IS NON-VACUOUS. The RPC zeroes are measured as a before/after pair on the SAME project: project A is read while open (the control, at least one nomination and a non-empty question list), then closed inside this transaction and read again, so the closure is the only variable. Project B is deliberately NOT opened here, unlike 07-rpc-security.test.sql Section 9. The no-grant caller's zeroes on project B sit beside a project admin's and an entity editor's non-zero counts of the same rows, so the rows exist and only the grant separates the callers.
--
-- Depends on: 00-helpers.test.sql (create_test_data, test_id, test_user_id, test_user_grants, set_test_user, reset_role, test_seed_fixture_grants); schema/301-auth-functions.sql (project_open_for_voters and its explicit GRANT); schema/503-entity-rpcs.sql (get_nominations); schema/505-question-rpcs.sql (get_questions).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (20);

SELECT
  create_test_data ();

SELECT
  test_seed_fixture_grants ();

-- =====================================================================
-- Section 1: the EXECUTE right the frontend adapter depends on
-- =====================================================================
-- The adapter calls project_open_for_voters over PostgREST when it reads zero app_settings rows, as anon on the voter app and as authenticated on the candidate and admin apps. A missing EXECUTE right would turn the closed-project branch into a permission error.
SELECT
  ok (
    has_function_privilege(
      'anon',
      'public.project_open_for_voters(uuid)',
      'EXECUTE'
    ),
    'anon can EXECUTE project_open_for_voters'
  );

SELECT
  ok (
    has_function_privilege(
      'authenticated',
      'public.project_open_for_voters(uuid)',
      'EXECUTE'
    ),
    'authenticated can EXECUTE project_open_for_voters'
  );

-- =====================================================================
-- Section 2: what project_open_for_voters answers to anon
-- =====================================================================
-- A closed project and a nonexistent one answer the same false, so the function is no existence oracle.
SELECT
  set_test_user ('anon');

SELECT
  is (
    project_open_for_voters (test_id ('project_a')),
    true,
    'project_open_for_voters answers true to anon for the open project A'
  );

SELECT
  is (
    project_open_for_voters (test_id ('project_b')),
    false,
    'project_open_for_voters answers false to anon for the closed project B'
  );

SELECT
  is (
    project_open_for_voters ('0badc0de-0000-4000-8000-000000000030'::uuid),
    false,
    'project_open_for_voters answers false to anon for a project that does not exist -- the same answer as a closed one'
  );

-- =====================================================================
-- Section 3: the voter RPCs on project A while it is OPEN (the controls)
-- =====================================================================
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        get_nominations (p_project_id => test_id ('project_a'))
    )::integer >= 1,
    'control: get_nominations returns rows to anon for project A while it is open'
  );

SELECT
  ok (
    jsonb_array_length(
      get_questions (p_project_id => test_id ('project_a')) -> 'questions'
    ) >= 1,
    'control: get_questions returns a non-empty questions array to anon for project A while it is open'
  );

SELECT
  ok (
    jsonb_array_length(
      get_questions (p_project_id => test_id ('project_a')) -> 'categories'
    ) >= 1,
    'control: get_questions returns a non-empty categories array to anon for project A while it is open'
  );

-- =====================================================================
-- Section 4: the same RPCs on the same project once it is CLOSED
-- =====================================================================
-- The closure is performed as postgres; nothing else about project A changes, so a zero here is the project-open conjunct and nothing else.
SELECT
  reset_role ();

UPDATE projects
SET
  open_for_voters = false
WHERE
  id = test_id ('project_a');

SELECT
  set_test_user ('anon');

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        get_nominations (p_project_id => test_id ('project_a'))
    )::integer,
    0,
    'get_nominations returns no rows to anon once project A is closed'
  );

SELECT
  is (
    jsonb_array_length(
      get_questions (p_project_id => test_id ('project_a')) -> 'questions'
    ),
    0,
    'get_questions returns an empty questions array to anon once project A is closed'
  );

SELECT
  is (
    jsonb_array_length(
      get_questions (p_project_id => test_id ('project_a')) -> 'categories'
    ),
    0,
    'get_questions returns an empty categories array to anon once project A is closed'
  );

-- =====================================================================
-- Section 5: grant holders read the closed project B (D-17, D-16)
-- =====================================================================
-- The preview is decided by what RLS returns to the caller, never by a client-side role check: a project admin and an entity editor each read the closed project's settings, elections and questions, and a signed-in caller with no grants reads none of them.
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    test_user_grants ('admin_b')
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        app_settings
      WHERE
        project_id = test_id ('project_b')
    )::integer >= 1,
    'admin_b reads the app_settings of the closed project B'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        project_id = test_id ('project_b')
    )::integer >= 1,
    'admin_b reads the elections of the closed project B'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        questions
      WHERE
        project_id = test_id ('project_b')
    )::integer >= 1,
    'admin_b reads the questions of the closed project B'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_b'),
    test_user_grants ('candidate_b')
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        app_settings
      WHERE
        project_id = test_id ('project_b')
    )::integer >= 1,
    'candidate_b, an entity editor, reads the app_settings of the closed project B (D-16: candidates work before a project opens)'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        project_id = test_id ('project_b')
    )::integer >= 1,
    'candidate_b, an entity editor, reads the elections of the closed project B'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        questions
      WHERE
        project_id = test_id ('project_b')
    )::integer >= 1,
    'candidate_b, an entity editor, reads the questions of the closed project B'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000e1',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        app_settings
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'a signed-in caller with no grants reads no app_settings of the closed project B'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'a signed-in caller with no grants reads no elections of the closed project B'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        questions
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'a signed-in caller with no grants reads no questions of the closed project B'
  );

SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
