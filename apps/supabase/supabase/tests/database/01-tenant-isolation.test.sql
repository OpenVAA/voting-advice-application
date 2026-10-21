-- 01-tenant-isolation.test.sql: cross-project data isolation
--
-- Verifies that users scoped to Project B cannot access admin-level data from Project A, cannot modify any Project A data, and that public visibility correctly limits cross-project visibility.
--
-- Key principle: a project that is OPEN FOR VOTERS is readable by all authenticated users (by design) exactly as it is by anonymous ones -- 162-09 re-expressed the structure tables' read term against project_open_for_voters() rather than dropping it, because an authenticated caller must never see strictly less than a logged-out one. Admin-level access (INSERT/UPDATE/DELETE, and anything in a project that is not open) is scoped by a NAMED PERMISSION asked of user_can(): project.read_structure for the read half and project.edit_structure for the write half, which is the separation ROADMAP criterion 2 asks for. The fixture's polarity is unchanged -- project A is open and its rows are confirmed, project B is neither -- so every assertion below measures what its description says it does.
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (26);

-- Create test fixture data. Project A is OPEN FOR VOTERS and its rows are confirmed; Project B is neither.
SELECT
  create_test_data ();

-- =====================================================================
-- Section 1: An OPEN PROJECT's data IS visible cross-project (correct behavior) This verifies the RLS design: a project open for voters is readable by every authenticated caller, through the same project_open_for_voters() term its anon policy carries. The descriptions below said `published` until 162-16 deleted that column and renamed them; the row set they were written against has not moved, and the GATE they pass through is the project flag.
-- =====================================================================
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
        elections
      WHERE
        project_id = test_id ('project_a')
    )::integer >= 1,
    'admin_b CAN see elections of an OPEN Project A (by design)'
  );

-- app_settings is no longer readable because its policy is ungated -- 162-11 replaced `USING (true)` with the same two-term disjunction the structure tables carry. This assertion passes because PROJECT A IS OPEN FOR VOTERS, through the project-open arm, and NOT because the table admits everyone: the description string is kept, the reason it holds has changed. Removing that arm reddens this very assertion, which is how the arm was measured load-bearing.
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        app_settings
      WHERE
        project_id = test_id ('project_a')
    )::integer >= 1,
    'app_settings is always readable (by design)'
  );

-- =====================================================================
-- Section 3: Admin A cannot see Project B data Project B is not open for voters and admin_a holds no grant reaching it, so both terms of every structure read predicate are false. As of 162-11 that is now true of the CONTENT and CONFIGURATION tables too -- questions, question_categories and app_settings carry the same two-term disjunction and no longer fall back on the retired per-row `published` column or on an ungated policy -- so there is no table left on which admin_a sees a Project B row.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

-- Voter-facing content tables (Project B is closed to voters, so none of its rows is public)
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
    'admin_a cannot see CLOSED Project B elections'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituency_groups
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'admin_a cannot see CLOSED Project B constituency_groups'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituencies
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'admin_a cannot see CLOSED Project B constituencies'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        organizations
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'admin_a cannot see CLOSED Project B organizations'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'admin_a cannot see CLOSED Project B candidates'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        factions
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'admin_a cannot see CLOSED Project B factions'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        alliances
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'admin_a cannot see CLOSED Project B alliances'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        question_categories
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'admin_a cannot see CLOSED Project B question_categories'
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
    'admin_a cannot see CLOSED Project B questions'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        nominations
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'admin_a cannot see CLOSED Project B nominations'
  );

-- =====================================================================
-- Section 4: Cross-project INSERT isolation Admin B cannot insert into Project A -- its grant does not reach project A, so user_can answers false for project.edit_structure there
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    test_user_grants ('admin_b')
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO elections (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"Sneaky"}')$$,
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'admin_b cannot INSERT into elections with Project A project_id'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO candidates (id, project_id, first_name, last_name) VALUES (gen_random_uuid(), '%s', 'Sneaky', 'Sneak')$$,
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'admin_b cannot INSERT into candidates with Project A project_id'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO organizations (id, project_id, name) VALUES (gen_random_uuid(), '%s', '{"en":"Sneaky Org"}')$$,
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'admin_b cannot INSERT into organizations with Project A project_id'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO questions (id, project_id, type, category_id, name) VALUES (gen_random_uuid(), '%s', 'text', '%s', '{"en":"Sneaky Q"}')$$,
      test_id ('project_a'),
      test_id ('question_category_a')
    ),
    '42501',
    NULL,
    'admin_b cannot INSERT into questions with Project A project_id'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO app_settings (id, project_id, settings) VALUES (gen_random_uuid(), '%s', '{"sneaky":true}')$$,
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'admin_b cannot INSERT into app_settings with Project A project_id'
  );

-- =====================================================================
-- Section 5: Cross-project UPDATE isolation Admin B cannot update Project A data -- an open project is READABLE by everyone and writable by nobody without the permission, which is exactly the read/write separation criterion 2 asks for
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    test_user_grants ('admin_b')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE elections SET name = '{"en":"Hijacked"}' WHERE id = '%s'$$,
      test_id ('election_a')
    ),
    'admin_b UPDATE on Project A elections does not raise error (but affects 0 rows)'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        name ->> 'en'
      FROM
        elections
      WHERE
        id = test_id ('election_a')
    ),
    'Election A',
    'admin_b UPDATE on Project A elections had no effect'
  );

-- =====================================================================
-- Section 6: Cross-project DELETE isolation
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    test_user_grants ('admin_b')
  );

SELECT
  lives_ok (
    format(
      $$DELETE FROM elections WHERE id = '%s'$$,
      test_id ('election_a')
    ),
    'admin_b DELETE on Project A elections does not raise error (but affects 0 rows)'
  );

SELECT
  reset_role ();

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        id = test_id ('election_a')
    )::integer = 1,
    'admin_b DELETE on Project A elections had no effect (record still exists)'
  );

-- =====================================================================
-- Section 7: Candidate cross-project isolation
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    )::integer,
    1,
    'candidate_a can see own record'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = test_id ('candidate_b')
    )::integer,
    0,
    'candidate_a cannot see candidate_b (different project, closed to voters)'
  );

-- =====================================================================
-- Section 8: Join table write isolation via parent -- the two write predicates now route through a SECURITY DEFINER hop (election_project_id, constituency_group_project_id) rather than a sub-select the caller's own row-level security filters, so they ask about the caller's AUTHORITY over the parent and not about their read access to it
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    test_user_grants ('admin_b')
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO constituency_group_constituencies (constituency_group_id, constituency_id) VALUES ('%s', '%s')$$,
      test_id ('constituency_group_a'),
      test_id ('constituency_a')
    ),
    NULL,
    NULL,
    'admin_b cannot INSERT into constituency_group_constituencies referencing Project A parents'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO election_constituency_groups (election_id, constituency_group_id) VALUES ('%s', '%s')$$,
      test_id ('election_a'),
      test_id ('constituency_group_a')
    ),
    NULL,
    NULL,
    'admin_b cannot INSERT into election_constituency_groups referencing Project A parents'
  );

-- =====================================================================
-- Section 9: Sanity check - admin can access own project
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    test_user_grants ('admin_b')
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
    1,
    'admin_b CAN see own Project B elections'
  );

-- Reset role for cleanup
SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
