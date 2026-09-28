-- 03-anon-read.test.sql: anonymous read access and write denial
--
-- Verifies that the anon role can SELECT the publicly visible records of voter-facing tables, sees 0 rows for data section 3.4 does not make public, cannot read admin-only tables, and is completely blocked from INSERT/UPDATE/DELETE on all tables.
--
-- Also verifies that grants and storage_config are inaccessible to anon (REVOKE ALL, not just RLS -- even SELECT raises 42501).
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

-- The plan count includes the 3 terms-of-use visibility assertions (ToU NULL / past now() / future now()) at the end of Section 1.
SELECT
  plan (59);

-- Create test fixture data. Project A is OPEN FOR VOTERS and its rows are confirmed; Project B is neither.
SELECT
  create_test_data ();

-- =====================================================================
-- Section 1: Anon can SELECT the publicly visible records of voter-facing tables
-- =====================================================================
SELECT
  set_test_user ('anon');

-- Content tables: anon sees the rows section 3.4 makes public. Project A is open for voters and its rows are confirmed, so count >= 1; project B is neither, so the paired negative assertion counts zero.
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        elections
    )::integer >= 1,
    'anon can SELECT publicly visible elections'
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
    'anon cannot see elections of a project that is not open for voters'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        constituency_groups
    )::integer >= 1,
    'anon can SELECT publicly visible constituency_groups'
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
    'anon cannot see constituency_groups of a project that is not open for voters'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        constituencies
    )::integer >= 1,
    'anon can SELECT publicly visible constituencies'
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
    'anon cannot see constituencies of a project that is not open for voters'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        organizations
    )::integer >= 1,
    'anon can SELECT publicly visible organizations'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        organizations
      WHERE
        confirmed = false
    )::integer,
    0,
    'anon cannot see unconfirmed organizations'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        candidates
    )::integer >= 1,
    'anon can SELECT publicly visible candidates'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        confirmed = false
    )::integer,
    0,
    'anon cannot see unconfirmed candidates'
  );

-- =====================================================================
-- terms_of_use_accepted gating (migration 00002) Insert two ephemeral candidates to exercise the NULL + future-now() branches of the new anon_select_candidates policy:
--   - candidate_no_terms:     confirmed + nominated, ToU=NULL          → invisible
--   - candidate_future_terms: confirmed + nominated, ToU=now()+1 day   → invisible
-- candidate_a (confirmed + nominated, ToU=now()) covers the past-now() branch → visible. Asserts the terms-of-use conjunct of section 3.4.
-- =====================================================================
SELECT
  reset_role ();

INSERT INTO
  candidates (
    id,
    project_id,
    auth_user_id,
    first_name,
    last_name,
    terms_of_use_accepted,
    confirmed
  )
VALUES
  (
    'cccccccc-cccc-cccc-cccc-00000000001a'::uuid,
    test_id ('project_a'),
    NULL,
    'NoTerms',
    'Anon',
    NULL,
    true
  ),
  (
    'cccccccc-cccc-cccc-cccc-00000000001b'::uuid,
    test_id ('project_a'),
    NULL,
    'FutureTerms',
    'Anon',
    now() + interval '1 day',
    true
  );

-- Both controls are `confirmed` and both are given a confirmed nomination, so that TERMS OF USE remains the ONLY conjunct separating them from a visible candidate. 162-08 made anon visibility an all-of rule; without these two rows each control would be invisible for THREE reasons and the two assertions below would no longer isolate the conjunct their description strings name -- an assertion that holds for the wrong reason is how a negative control stops measuring without anyone noticing.
INSERT INTO
  nominations (
    id,
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round,
    confirmed
  )
VALUES
  (
    'cccccccc-cccc-cccc-cccc-00000000002a'::uuid,
    test_id ('project_a'),
    'cccccccc-cccc-cccc-cccc-00000000001a'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    true
  ),
  (
    'cccccccc-cccc-cccc-cccc-00000000002b'::uuid,
    test_id ('project_a'),
    'cccccccc-cccc-cccc-cccc-00000000001b'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    false
  );

SELECT
  set_test_user ('anon');

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        first_name = 'NoTerms'
        AND last_name = 'Anon'
    )::integer,
    0,
    'anon cannot SELECT an otherwise-visible candidate with terms_of_use_accepted = NULL (260524-l1t / D7)'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        first_name = 'FutureTerms'
        AND last_name = 'Anon'
    )::integer,
    0,
    'anon cannot SELECT an otherwise-visible candidate with terms_of_use_accepted in the future (260524-l1t / D7)'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        first_name = 'Alice'
        AND last_name = 'Alpha'
    )::integer = 1,
    'anon CAN SELECT a candidate with terms_of_use_accepted in the past (candidate_a, 260524-l1t / D7)'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        factions
    )::integer >= 1,
    'anon can SELECT publicly visible factions'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        factions
      WHERE
        confirmed = false
    )::integer,
    0,
    'anon cannot see unconfirmed factions'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        alliances
    )::integer >= 1,
    'anon can SELECT publicly visible alliances'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        alliances
      WHERE
        confirmed = false
    )::integer,
    0,
    'anon cannot see unconfirmed alliances'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        question_categories
    )::integer >= 1,
    'anon can SELECT publicly visible question_categories'
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
    'anon cannot see question_categories of a project that is not open for voters'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        questions
    )::integer >= 1,
    'anon can SELECT publicly visible questions'
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
    'anon cannot see questions of a project that is not open for voters'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        nominations
    )::integer >= 1,
    'anon can SELECT publicly visible nominations'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        nominations
      WHERE
        confirmed = false
    )::integer,
    0,
    'anon cannot see unconfirmed nominations'
  );

-- =====================================================================
-- Section 2: Anon can read the two join tables and app_settings -- gated, as of 162-08, on the project being open for voters
-- =====================================================================
SELECT
  set_test_user ('anon');

-- app_settings: gated on `project_open_for_voters (project_id)` as of 162-08. It was `USING (true)`; section 3.4 of the implementation brief lists settings FIRST among what an anon reader may see WHEN the project is open, and an ungated anon policy alongside twelve gated ones is a second visibility mechanism. Project A is open for voters, so the count below is at least one.
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        app_settings
    )::integer >= 1,
    'anon can SELECT app_settings for a project that is open for voters'
  );

-- Join tables: each delegates to `anon_select_constituency_groups` as of 162-08, so a join row is visible exactly when its constituency group is. Neither carries a project_id of its own, so the gate is reached by composition rather than restated.
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        constituency_group_constituencies
    )::integer >= 1,
    'anon can SELECT constituency_group_constituencies whose constituency group is anon-visible'
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        election_constituency_groups
    )::integer >= 1,
    'anon can SELECT election_constituency_groups whose constituency group is anon-visible'
  );

-- =====================================================================
-- Section 3: Anon cannot read admin-only tables
-- =====================================================================
SELECT
  set_test_user ('anon');

-- accounts: no anon policy
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        accounts
    )::integer,
    0,
    'anon cannot see accounts (no anon policy)'
  );

-- projects: no anon policy
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        projects
    )::integer,
    0,
    'anon cannot see projects (no anon policy)'
  );

-- =====================================================================
-- Section 4: Anon cannot access the authority map or storage_config These have REVOKE ALL FROM anon -- even SELECT raises 42501
--
-- 162-15 RE-EXPRESSED THE FIRST OF THESE IN PLACE, keeping its section, its shape and its PINNED SQLSTATE. The property is that the authority map -- the rows saying who may do what to whom across every account and project in the instance -- is unreadable by the public roles, and a new table in the public schema is exposed through PostgREST by default. That property has a new SUBJECT, public.grants, rather than no subject. The pin is what makes it worth re-expressing rather than deleting: once the retired relation was gone the same statement raised 42P01 instead, so the assertion reddened rather than staying green for the wrong reason, which is how a removed subject is supposed to behave.
-- =====================================================================
SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    'SELECT count(*) FROM grants',
    '42501',
    NULL,
    'anon cannot SELECT grants (REVOKE ALL)'
  );

SELECT
  throws_ok (
    'SELECT count(*) FROM storage_config',
    '42501',
    NULL,
    'anon cannot SELECT storage_config (REVOKE ALL)'
  );

-- =====================================================================
-- Section 5: Anon INSERT denial on all content tables INSERT as anon fails with 42501 (new row violates RLS / no policy)
-- =====================================================================
SELECT
  set_test_user ('anon');

-- accounts: no anon INSERT policy
SELECT
  throws_ok (
    format(
      'INSERT INTO accounts (id, name) VALUES (gen_random_uuid(), ''Test'')'
    ),
    '42501',
    NULL,
    'anon cannot INSERT into accounts'
  );

-- projects: no anon INSERT policy
SELECT
  throws_ok (
    format(
      'INSERT INTO projects (id, account_id, name) VALUES (gen_random_uuid(), ''%s'', ''Test'')',
      test_id ('account_a')
    ),
    '42501',
    NULL,
    'anon cannot INSERT into projects'
  );

-- elections
SELECT
  throws_ok (
    format(
      'INSERT INTO elections (id, project_id, name) VALUES (gen_random_uuid(), ''%s'', ''{"en":"Test"}''::jsonb)',
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'anon cannot INSERT into elections'
  );

-- constituency_groups
SELECT
  throws_ok (
    format(
      'INSERT INTO constituency_groups (id, project_id, name) VALUES (gen_random_uuid(), ''%s'', ''{"en":"Test"}''::jsonb)',
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'anon cannot INSERT into constituency_groups'
  );

-- constituencies
SELECT
  throws_ok (
    format(
      'INSERT INTO constituencies (id, project_id, name) VALUES (gen_random_uuid(), ''%s'', ''{"en":"Test"}''::jsonb)',
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'anon cannot INSERT into constituencies'
  );

-- organizations
SELECT
  throws_ok (
    format(
      'INSERT INTO organizations (id, project_id, name) VALUES (gen_random_uuid(), ''%s'', ''{"en":"Test"}''::jsonb)',
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'anon cannot INSERT into organizations'
  );

-- candidates
SELECT
  throws_ok (
    format(
      'INSERT INTO candidates (id, project_id, first_name, last_name) VALUES (gen_random_uuid(), ''%s'', ''Test'', ''User'')',
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'anon cannot INSERT into candidates'
  );

-- factions. The statement names an organization since 162-07b made that column NOT NULL, so the 42501 below is unambiguously the privilege denial this assertion is about: a statement that would otherwise be VALID is rejected, rather than one that could never have run.
SELECT
  throws_ok (
    format(
      'INSERT INTO factions (id, project_id, organization_id, name) VALUES (gen_random_uuid(), ''%s'', ''%s'', ''{"en":"Test"}''::jsonb)',
      test_id ('project_a'),
      test_id ('org_a')
    ),
    '42501',
    NULL,
    'anon cannot INSERT into factions'
  );

-- alliances
SELECT
  throws_ok (
    format(
      'INSERT INTO alliances (id, project_id, name) VALUES (gen_random_uuid(), ''%s'', ''{"en":"Test"}''::jsonb)',
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'anon cannot INSERT into alliances'
  );

-- question_categories
SELECT
  throws_ok (
    format(
      'INSERT INTO question_categories (id, project_id, name) VALUES (gen_random_uuid(), ''%s'', ''{"en":"Test"}''::jsonb)',
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'anon cannot INSERT into question_categories'
  );

-- questions
SELECT
  throws_ok (
    format(
      'INSERT INTO questions (id, project_id, type, category_id, name) VALUES (gen_random_uuid(), ''%s'', ''text'', ''%s'', ''{"en":"Test"}''::jsonb)',
      test_id ('project_a'),
      test_id ('question_category_a')
    ),
    '42501',
    NULL,
    'anon cannot INSERT into questions'
  );

-- nominations -- tricky because of validate_nomination trigger, but RLS should block first
SELECT
  throws_ok (
    format(
      'INSERT INTO nominations (id, project_id, organization_id, election_id, constituency_id, election_round) VALUES (gen_random_uuid(), ''%s'', ''%s'', ''%s'', ''%s'', 1)',
      test_id ('project_a'),
      test_id ('org_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '42501',
    NULL,
    'anon cannot INSERT into nominations'
  );

-- app_settings
SELECT
  throws_ok (
    format(
      'INSERT INTO app_settings (id, project_id, settings) VALUES (gen_random_uuid(), ''%s'', ''{}''::jsonb)',
      test_id ('project_a')
    ),
    NULL,
    NULL,
    'anon cannot INSERT into app_settings'
  );

-- constituency_group_constituencies (join table)
SELECT
  throws_ok (
    format(
      'INSERT INTO constituency_group_constituencies (constituency_group_id, constituency_id) VALUES (''%s'', ''%s'')',
      test_id ('constituency_group_a'),
      test_id ('constituency_a')
    ),
    NULL,
    NULL,
    'anon cannot INSERT into constituency_group_constituencies'
  );

-- election_constituency_groups (join table)
SELECT
  throws_ok (
    format(
      'INSERT INTO election_constituency_groups (election_id, constituency_group_id) VALUES (''%s'', ''%s'')',
      test_id ('election_a'),
      test_id ('constituency_group_a')
    ),
    NULL,
    NULL,
    'anon cannot INSERT into election_constituency_groups'
  );

-- =====================================================================
-- Section 6: Anon UPDATE denial on all content tables UPDATE as anon affects 0 rows (RLS WHERE clause filters everything out) We test by attempting UPDATE, then verifying data unchanged
-- =====================================================================
SELECT
  set_test_user ('anon');

-- elections: UPDATE should affect 0 rows (anon has no UPDATE policy)
SELECT
  lives_ok (
    format(
      'UPDATE elections SET name = ''{"en":"Hacked"}''::jsonb WHERE id = ''%s''',
      test_id ('election_a')
    ),
    'anon UPDATE on elections does not raise error'
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
    'anon UPDATE on elections had no effect'
  );

SELECT
  set_test_user ('anon');

SELECT
  lives_ok (
    format(
      'UPDATE organizations SET name = ''{"en":"Hacked"}''::jsonb WHERE id = ''%s''',
      test_id ('org_a')
    ),
    'anon UPDATE on organizations does not raise error'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        name ->> 'en'
      FROM
        organizations
      WHERE
        id = test_id ('org_a')
    ),
    'Org A',
    'anon UPDATE on organizations had no effect'
  );

SELECT
  set_test_user ('anon');

SELECT
  lives_ok (
    format(
      'UPDATE candidates SET first_name = ''Hacked'' WHERE id = ''%s''',
      test_id ('candidate_a')
    ),
    'anon UPDATE on candidates does not raise error'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        first_name
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    ),
    'Alice',
    'anon UPDATE on candidates had no effect'
  );

SELECT
  set_test_user ('anon');

SELECT
  lives_ok (
    format(
      'UPDATE app_settings SET settings = ''{"hacked":true}''::jsonb WHERE id = ''%s''',
      test_id ('app_settings_a')
    ),
    'anon UPDATE on app_settings does not raise error'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        settings ->> 'theme'
      FROM
        app_settings
      WHERE
        id = test_id ('app_settings_a')
    ),
    'light',
    'anon UPDATE on app_settings had no effect'
  );

-- =====================================================================
-- Section 7: Anon DELETE denial on all content tables DELETE as anon affects 0 rows (RLS WHERE clause filters everything out)
-- =====================================================================
SELECT
  set_test_user ('anon');

SELECT
  lives_ok (
    format(
      'DELETE FROM elections WHERE id = ''%s''',
      test_id ('election_a')
    ),
    'anon DELETE on elections does not raise error'
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
    'anon DELETE on elections had no effect (record still exists)'
  );

SELECT
  set_test_user ('anon');

SELECT
  lives_ok (
    format(
      'DELETE FROM candidates WHERE id = ''%s''',
      test_id ('candidate_a')
    ),
    'anon DELETE on candidates does not raise error'
  );

SELECT
  reset_role ();

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    )::integer = 1,
    'anon DELETE on candidates had no effect (record still exists)'
  );

SELECT
  set_test_user ('anon');

SELECT
  lives_ok (
    format(
      'DELETE FROM app_settings WHERE id = ''%s''',
      test_id ('app_settings_a')
    ),
    'anon DELETE on app_settings does not raise error'
  );

SELECT
  reset_role ();

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        app_settings
      WHERE
        id = test_id ('app_settings_a')
    )::integer = 1,
    'anon DELETE on app_settings had no effect (record still exists)'
  );

-- Reset role for cleanup
SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
