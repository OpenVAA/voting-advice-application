-- 17-project-structure-authority.test.sql: the authority grid for the account tier, the project row and the project-scoped structure
--
-- 162-09 routes 25 policies across seven tables onto `user_can`. Bulk conversion is where this wave's hazard lives, and it is not the hazard a read test looks for: A CONVERTED PREDICATE THAT IS WRONG IN THE PERMISSIVE DIRECTION BREAKS NOTHING, REDDENS NOTHING AND SHIPS. A grid of "the caller who may, may" cannot tell "correctly allowed" from "should have been denied".
--
-- So the unit of work here is not a converted predicate, it is a converted predicate PLUS THE CALLER WHO MUST BE REFUSED BY IT, and the two callers of each pair differ in EXACTLY ONE PERMISSION:
--   candidate_a           holds project.read_structure          and NOT project.edit_structure a project-scope editor holds project.edit_structure          and NOT project.edit_project_settings admin_a (project admin) holds project.edit_project_settings  and NOT account.manage_projects A policy converted to the wrong permission reddens on the may-not half, which is the half a visibility test cannot supply.
--
-- ROADMAP criterion 2 is finished in this file, in both of the two sentences it is written in and each asserted twice. STRUCTURALLY, read from pg_policies on the applied database: the `projects` SELECT and UPDATE quals are unequal, both reach user_can, the SELECT names the read permission and NOT the project-settings one, and the UPDATE names the project-settings one and NOT the read one. 162-04 asserted only that the two strings differ, which stays true even when both are converted onto the same verb — the collapse the criterion exists to catch. BEHAVIOURALLY: candidate_a reads the project's elections and cannot edit them.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_user_grants).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (87);

SELECT
  create_test_data ();

-- =====================================================================
-- Fixture: the two identities create_test_data() does not carry
--
-- A PROJECT-SCOPE EDITOR is the one caller that separates project.edit_structure from project.edit_project_settings, and the shared fixture has none. It is created HERE rather than there because 162-06 asserts create_test_data() produces exactly eight grant rows and that a second backfill inserts none, and three sibling plans are editing that file concurrently; this identity rolls back with this transaction. 162-17 owns consolidating it.
--
-- A GRANT-LESS IDENTITY is what makes the public disjunct measurable: it is the caller for whom the authority term is false by construction, so anything it sees it sees through the public term alone.
--
-- Both ids sit outside the `cccccccc-cccc-cccc-cccc-00000000000N` series test_user_id() returns, so neither can collide with a fixture identity.
-- =====================================================================
SELECT
  reset_role ();

INSERT INTO
  auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    aud,
    role,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at
  )
VALUES
  (
    'cccccccc-cccc-cccc-cccc-0000000000a1',
    '00000000-0000-0000-0000-000000000000',
    'project_editor_a@test.com',
    crypt ('testpass', gen_salt ('bf')),
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000000a2',
    '00000000-0000-0000-0000-000000000000',
    'grantless@test.com',
    crypt ('testpass', gen_salt ('bf')),
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-0000000000a1',
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  );

-- A second constituency group in project A, so a join-table INSERT has a parent pair that is not already joined (the join table's primary key is the pair itself).
INSERT INTO
  constituency_groups (id, project_id, name)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-0000000000c1',
    test_id ('project_a'),
    '{"en":"CG A2"}'::jsonb
  );

-- The eight fixture identities hold no grant rows until the backfill runs, and set_test_user fires it when handed a non-empty role array. One call is enough for all eight.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

-- =====================================================================
-- Section 1: criterion 2's behavioural sentence — a candidate reads the project's elections and cannot edit them
-- =====================================================================
SELECT
  reset_role ();

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
        elections
      WHERE
        id = test_id ('election_a')
    )::integer,
    1,
    'candidate_a CAN read the project elections it holds project.read_structure over'
  );

UPDATE elections
SET
  name = '{"en":"CandidateEdit"}'::jsonb
WHERE
  id = test_id ('election_a');

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
    'candidate_a CANNOT edit the same election it may read — it holds project.read_structure and not project.edit_structure'
  );

-- =====================================================================
-- Section 2: the project editor — may edit the structure, may not edit the project
--
-- Tests 3 and 5 are the same caller across two objects, differing in exactly one permission literal. That is criterion 2's structural sentence asserted behaviourally.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000a1',
    '[]'::jsonb
  );

UPDATE elections
SET
  name = '{"en":"EditorEdit"}'::jsonb
WHERE
  id = test_id ('election_a');

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
    'EditorEdit',
    'a project-scope editor CAN edit the project elections — it holds project.edit_structure'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000a1',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        projects
      WHERE
        id = test_id ('project_a')
    )::integer,
    1,
    'a project-scope editor CAN read the project row — project.read_structure'
  );

UPDATE projects
SET
  name = 'EditorRenamed'
WHERE
  id = test_id ('project_a');

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        name
      FROM
        projects
      WHERE
        id = test_id ('project_a')
    ),
    'Project A',
    'a project-scope editor CANNOT update the project row — it holds project.edit_structure and not project.edit_project_settings'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

UPDATE projects
SET
  name = 'AdminRenamed'
WHERE
  id = test_id ('project_a');

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        name
      FROM
        projects
      WHERE
        id = test_id ('project_a')
    ),
    'AdminRenamed',
    'admin_a CAN update the project row — it holds project.edit_project_settings'
  );

-- =====================================================================
-- Section 3: the tenancy boundary still holds after the conversion
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    test_user_grants ('admin_b')
  );

UPDATE elections
SET
  name = '{"en":"BHijack"}'::jsonb
WHERE
  id = test_id ('election_a');

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
    'EditorEdit',
    'admin_b CANNOT edit project A elections — its grant does not reach project A'
  );

-- =====================================================================
-- Section 4: the two terms of the read disjunction, each measured ALONE
--
-- The public term with the authority term false: a caller holding no grant at all. The authority term with the public term false: admin_b on project B, which is not open for voters.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000a2',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        elections
      WHERE
        project_id = test_id ('project_a')
    )::integer,
    1,
    'a caller holding NO grant at all reads project A elections through the PUBLIC term alone — project A is open for voters'
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
    'that same grant-less caller reads NO project B election — project B is not open for voters and the authority term is false'
  );

SELECT
  reset_role ();

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
    'admin_b reads project B elections through the AUTHORITY term alone — project B is closed and the public term is false'
  );

-- =====================================================================
-- Section 5: anon parity — a logged-in caller never sees less than a logged-out one
--
-- The sorted multiset of ids is compared as a string, which is set-equality in BOTH directions with equal cardinality in one assertion, and the length floor is what stops two empties agreeing. Carried across the role switch in a transaction-local GUC, because a temp table would need privileges the anon role does not hold.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_test_user ('anon');

SELECT
  set_config(
    't17.anon_elections',
    (
      SELECT
        COALESCE(
          string_agg(
            id::text,
            ','
            ORDER BY
              id
          ),
          ''
        )
      FROM
        elections
    ),
    true
  );

SELECT
  set_config(
    't17.anon_ecg',
    (
      SELECT
        COALESCE(
          string_agg(
            election_id::text || '/' || constituency_group_id::text,
            ','
            ORDER BY
              election_id,
              constituency_group_id
          ),
          ''
        )
      FROM
        election_constituency_groups
    ),
    true
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000a2',
    '[]'::jsonb
  );

SELECT
  set_config(
    't17.auth_elections',
    (
      SELECT
        COALESCE(
          string_agg(
            id::text,
            ','
            ORDER BY
              id
          ),
          ''
        )
      FROM
        elections
    ),
    true
  );

SELECT
  set_config(
    't17.auth_ecg',
    (
      SELECT
        COALESCE(
          string_agg(
            election_id::text || '/' || constituency_group_id::text,
            ','
            ORDER BY
              election_id,
              constituency_group_id
          ),
          ''
        )
      FROM
        election_constituency_groups
    ),
    true
  );

SELECT
  reset_role ();

SELECT
  ok (
    current_setting('t17.auth_elections') = current_setting('t17.anon_elections')
    AND length(current_setting('t17.anon_elections')) > 0,
    'elections: an authenticated caller holding no grant sees exactly what an anonymous caller sees, and the shared row set is not empty'
  );

SELECT
  ok (
    current_setting('t17.auth_ecg') = current_setting('t17.anon_ecg')
    AND length(current_setting('t17.anon_ecg')) > 0,
    'election_constituency_groups: an authenticated caller holding no grant sees exactly what an anonymous caller sees, and the shared row set is not empty'
  );

-- =====================================================================
-- Section 6: the join-table write, through the hardened hop
--
-- The absent-parent case is asserted with errcode 42501 specifically. The foreign key would refuse the same row for a different reason, and a bare throws_ok would pass on the wrong mechanism.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000a1',
    '[]'::jsonb
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO election_constituency_groups (election_id, constituency_group_id) VALUES ('%s', '%s')$$,
      test_id ('election_a'),
      'eeeeeeee-eeee-eeee-eeee-0000000000c1'
    ),
    'a project-scope editor CAN insert a join row naming project A''s election — the hop resolves to project A and it holds project.edit_structure'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO election_constituency_groups (election_id, constituency_group_id) VALUES ('%s', '%s')$$,
      '00000000-0000-0000-0000-0000000000fe',
      'eeeeeeee-eeee-eeee-eeee-0000000000c1'
    ),
    '42501',
    NULL,
    'a join row naming an election present in NO row is refused by the permission predicate — the hop returns NULL and user_can denies a NULL target at project scope'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    test_user_grants ('admin_b')
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO election_constituency_groups (election_id, constituency_group_id) VALUES ('%s', '%s')$$,
      test_id ('election_a'),
      'eeeeeeee-eeee-eeee-eeee-0000000000c1'
    ),
    '42501',
    NULL,
    'admin_b CANNOT insert a join row naming project A''s election — the hop resolves to project A and its grant does not reach it'
  );

-- =====================================================================
-- Section 7: criterion 2, structurally — read from pg_policies on the applied database
--
-- THIS IS THE TEST THE ROADMAP ASKS FOR: it fails if the two predicates ever collapse back onto one. 162-04's existing assertion that the two STRINGS differ stays green when both are converted onto the same verb, which is exactly the failure this one catches.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  ok (
    (
      SELECT
        qual
      FROM
        pg_policies
      WHERE
        tablename = 'projects'
        AND policyname = 'authenticated_select_projects'
    ) IS DISTINCT FROM (
      SELECT
        qual
      FROM
        pg_policies
      WHERE
        tablename = 'projects'
        AND policyname = 'admin_update_projects'
    )
    AND (
      SELECT
        qual LIKE '%user_can%'
        AND qual LIKE '%project.read_structure%'
        AND qual NOT LIKE '%project.edit_project_settings%'
      FROM
        pg_policies
      WHERE
        tablename = 'projects'
        AND policyname = 'authenticated_select_projects'
    )
    AND (
      SELECT
        qual LIKE '%user_can%'
        AND qual LIKE '%project.edit_project_settings%'
        AND qual NOT LIKE '%project.read_structure%'
      FROM
        pg_policies
      WHERE
        tablename = 'projects'
        AND policyname = 'admin_update_projects'
    ),
    'the projects read and write predicates name DIFFERENT permission literals, neither naming the other''s — this reddens if the two ever collapse back into one predicate'
  );

SELECT
  ok (
    (
      SELECT
        qual LIKE '%project.read_structure%'
        AND qual LIKE '%project_open_for_voters%'
        AND qual NOT LIKE '%can_access_project%'
        AND qual NOT LIKE '%published%'
      FROM
        pg_policies
      WHERE
        tablename = 'elections'
        AND policyname = 'authenticated_select_elections'
    )
    AND (
      SELECT
        bool_and(
          COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%project.edit_structure%'
          AND COALESCE(qual, '') || COALESCE(with_check, '') NOT LIKE '%project.read_structure%'
        )
      FROM
        pg_policies
      WHERE
        tablename = 'elections'
        AND policyname = 'admin_update_elections'
    ),
    'elections: the SELECT predicate names the read permission and the UPDATE predicate names the structure-edit permission and not the read one'
  );

-- =====================================================================
-- Section 8: the hop helper is hardened exactly as entity_project_id is
-- =====================================================================
SELECT
  ok (
    (
      SELECT
        p.prosecdef
        AND EXISTS (
          SELECT
            1
          FROM
            unnest(p.proconfig) c
          WHERE
            c LIKE 'search_path=%'
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'private'
        AND p.proname = 'election_project_id'
    ),
    'election_project_id is SECURITY DEFINER with a pinned search_path — a mutable search path on a function that reads a table the caller may not read is a privilege-escalation primitive'
  );

-- =====================================================================
-- Section 9: the write verb across the structure tables — eight more policies, eight pairs
--
-- Every pair below is the project-scope EDITOR against candidate_a, and the two differ in exactly one permission: the editor holds project.edit_structure, candidate_a holds project.read_structure and not it. A policy converted to the read verb passes the "may" half and reddens only here.
--
-- t17_affected exists because an UPDATE or DELETE refused by a USING clause affects zero rows SILENTLY rather than raising, so the may-not half cannot be written as throws_ok. It is SECURITY INVOKER, so the dynamic statement runs as the caller and row-level security applies; it lives in this transaction and rolls back with it.
-- =====================================================================
SELECT
  reset_role ();

CREATE OR REPLACE FUNCTION t17_affected (p_sql text) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  n integer;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

INSERT INTO
  constituencies (id, project_id, name)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-0000000000d9',
    test_id ('project_a'),
    '{"en":"Constituency A9"}'::jsonb
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000a1',
    '[]'::jsonb
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO elections (id, project_id, name) VALUES ('%s', '%s', '{"en":"E1"}')$$,
      'eeeeeeee-eeee-eeee-eeee-0000000000e1',
      test_id ('project_a')
    ),
    'a project-scope editor CAN insert an election into project A'
  );

SELECT
  is (
    t17_affected (
      format(
        $$DELETE FROM elections WHERE id = '%s'$$,
        'eeeeeeee-eeee-eeee-eeee-0000000000e1'
      )
    ),
    1,
    'a project-scope editor CAN delete a project A election'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO constituency_groups (id, project_id, name) VALUES ('%s', '%s', '{"en":"C2"}')$$,
      'eeeeeeee-eeee-eeee-eeee-0000000000c2',
      test_id ('project_a')
    ),
    'a project-scope editor CAN insert a constituency group into project A'
  );

SELECT
  is (
    t17_affected (
      format(
        $$UPDATE constituency_groups SET name = '{"en":"CG A edited"}' WHERE id = '%s'$$,
        test_id ('constituency_group_a')
      )
    ),
    1,
    'a project-scope editor CAN update a project A constituency group'
  );

SELECT
  is (
    t17_affected (
      format(
        $$DELETE FROM constituency_groups WHERE id = '%s'$$,
        'eeeeeeee-eeee-eeee-eeee-0000000000c2'
      )
    ),
    1,
    'a project-scope editor CAN delete a project A constituency group'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO constituencies (id, project_id, name) VALUES ('%s', '%s', '{"en":"D1"}')$$,
      'eeeeeeee-eeee-eeee-eeee-0000000000d1',
      test_id ('project_a')
    ),
    'a project-scope editor CAN insert a constituency into project A'
  );

SELECT
  is (
    t17_affected (
      format(
        $$UPDATE constituencies SET name = '{"en":"Constituency A edited"}' WHERE id = '%s'$$,
        test_id ('constituency_a')
      )
    ),
    1,
    'a project-scope editor CAN update a project A constituency'
  );

SELECT
  is (
    t17_affected (
      format(
        $$DELETE FROM constituencies WHERE id = '%s'$$,
        'eeeeeeee-eeee-eeee-eeee-0000000000d1'
      )
    ),
    1,
    'a project-scope editor CAN delete a project A constituency'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO elections (id, project_id, name) VALUES ('%s', '%s', '{"en":"E2"}')$$,
      'eeeeeeee-eeee-eeee-eeee-0000000000e2',
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'candidate_a CANNOT insert an election into the project it may read'
  );

SELECT
  is (
    t17_affected (
      format(
        $$DELETE FROM elections WHERE id = '%s'$$,
        test_id ('election_a')
      )
    ),
    0,
    'candidate_a CANNOT delete a project A election'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO constituency_groups (id, project_id, name) VALUES ('%s', '%s', '{"en":"C3"}')$$,
      'eeeeeeee-eeee-eeee-eeee-0000000000c3',
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'candidate_a CANNOT insert a constituency group into the project it may read'
  );

SELECT
  is (
    t17_affected (
      format(
        $$UPDATE constituency_groups SET name = '{"en":"Hijack"}' WHERE id = '%s'$$,
        test_id ('constituency_group_a')
      )
    ),
    0,
    'candidate_a CANNOT update a project A constituency group'
  );

SELECT
  is (
    t17_affected (
      format(
        $$DELETE FROM constituency_groups WHERE id = '%s'$$,
        test_id ('constituency_group_a')
      )
    ),
    0,
    'candidate_a CANNOT delete a project A constituency group'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO constituencies (id, project_id, name) VALUES ('%s', '%s', '{"en":"D2"}')$$,
      'eeeeeeee-eeee-eeee-eeee-0000000000d2',
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'candidate_a CANNOT insert a constituency into the project it may read'
  );

SELECT
  is (
    t17_affected (
      format(
        $$UPDATE constituencies SET name = '{"en":"Hijack"}' WHERE id = '%s'$$,
        test_id ('constituency_a')
      )
    ),
    0,
    'candidate_a CANNOT update a project A constituency'
  );

SELECT
  is (
    t17_affected (
      format(
        $$DELETE FROM constituencies WHERE id = '%s'$$,
        test_id ('constituency_a')
      )
    ),
    0,
    'candidate_a CANNOT delete a project A constituency'
  );

-- =====================================================================
-- Section 10: the two remaining structure reads
-- =====================================================================
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituency_groups
      WHERE
        id = test_id ('constituency_group_a')
    )::integer,
    1,
    'candidate_a CAN read a project A constituency group — project.read_structure'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituencies
      WHERE
        id = test_id ('constituency_a')
    )::integer,
    1,
    'candidate_a CAN read a project A constituency — project.read_structure'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000a2',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituency_groups
      WHERE
        id = test_id ('constituency_group_b')
    )::integer,
    0,
    'a caller holding NO grant CANNOT read a project B constituency group — project B is not open for voters'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituencies
      WHERE
        id = test_id ('constituency_b')
    )::integer,
    0,
    'a caller holding NO grant CANNOT read a project B constituency — project B is not open for voters'
  );

-- =====================================================================
-- Section 11: each term of the two remaining disjunctions, measured ALONE
-- =====================================================================
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituency_groups
      WHERE
        id = test_id ('constituency_group_a')
    )::integer,
    1,
    'a grant-less caller reads a project A constituency group through the PUBLIC term alone'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituencies
      WHERE
        id = test_id ('constituency_a')
    )::integer,
    1,
    'a grant-less caller reads a project A constituency through the PUBLIC term alone'
  );

SELECT
  reset_role ();

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
        constituency_groups
      WHERE
        id = test_id ('constituency_group_b')
    )::integer,
    1,
    'admin_b reads a project B constituency group through the AUTHORITY term alone — project B is closed'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituencies
      WHERE
        id = test_id ('constituency_b')
    )::integer,
    1,
    'admin_b reads a project B constituency through the AUTHORITY term alone — project B is closed'
  );

-- =====================================================================
-- Section 12: the constituency_group_constituencies delegation, behaviourally
--
-- The parent group is the ONLY thing distinguishing these rows, and the delegation inherits BOTH of the parent's terms rather than only its authority one. So a grant-less caller sees project A's join row (the parent is open for voters) and none of project B's (the parent is closed and it holds no grant), and admin_b sees project B's through its authority over the parent. MEASURED, not predicted: this file first asserted that admin_b sees NONE of project A's join rows, and that was wrong about the code rather than the other way round — project A is open, so its groups are readable by every authenticated caller and its join rows follow them.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000a2',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituency_group_constituencies
      WHERE
        constituency_group_id = test_id ('constituency_group_a')
    )::integer,
    1,
    'a grant-less caller sees project A''s constituency_group_constituencies row — its parent group is open for voters'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        constituency_group_constituencies
      WHERE
        constituency_group_id = test_id ('constituency_group_b')
    )::integer,
    0,
    'that same grant-less caller sees NONE of project B''s constituency_group_constituencies rows — its parent group is invisible to it'
  );

SELECT
  reset_role ();

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
        constituency_group_constituencies
      WHERE
        constituency_group_id = test_id ('constituency_group_b')
    )::integer,
    1,
    'admin_b sees its OWN project B constituency_group_constituencies row — it reaches the parent group through the authority term'
  );

-- =====================================================================
-- Section 13: the constituency_group_constituencies write, through the second hop
-- =====================================================================
SELECT
  throws_ok (
    format(
      $$INSERT INTO constituency_group_constituencies (constituency_group_id, constituency_id) VALUES ('%s', '%s')$$,
      'eeeeeeee-eeee-eeee-eeee-0000000000c1',
      'eeeeeeee-eeee-eeee-eeee-0000000000d9'
    ),
    '42501',
    NULL,
    'admin_b CANNOT insert a constituency_group_constituencies row naming a project A group — the hop resolves to project A'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000a1',
    '[]'::jsonb
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO constituency_group_constituencies (constituency_group_id, constituency_id) VALUES ('%s', '%s')$$,
      test_id ('constituency_group_a'),
      'eeeeeeee-eeee-eeee-eeee-0000000000d9'
    ),
    'a project-scope editor CAN insert a constituency_group_constituencies row naming a project A group'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO constituency_group_constituencies (constituency_group_id, constituency_id) VALUES ('%s', '%s')$$,
      '00000000-0000-0000-0000-0000000000fd',
      'eeeeeeee-eeee-eeee-eeee-0000000000d9'
    ),
    '42501',
    NULL,
    'a constituency_group_constituencies row naming a group present in NO row is refused by the permission predicate — the hop returns NULL and user_can denies a NULL target'
  );

-- =====================================================================
-- Section 14: the election_constituency_groups delete, through the first hop
-- =====================================================================
SELECT
  is (
    t17_affected (
      format(
        $$DELETE FROM election_constituency_groups WHERE election_id = '%s' AND constituency_group_id = '%s'$$,
        test_id ('election_a'),
        'eeeeeeee-eeee-eeee-eeee-0000000000c1'
      )
    ),
    1,
    'a project-scope editor CAN delete an election_constituency_groups row of project A'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    test_user_grants ('admin_b')
  );

SELECT
  is (
    t17_affected (
      format(
        $$DELETE FROM election_constituency_groups WHERE election_id = '%s' AND constituency_group_id = '%s'$$,
        test_id ('election_a'),
        test_id ('constituency_group_a')
      )
    ),
    0,
    'admin_b CANNOT delete an election_constituency_groups row of project A — the hop resolves to project A'
  );

-- =====================================================================
-- Section 15: anon parity on the three remaining tables
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_test_user ('anon');

SELECT
  set_config(
    't17.anon_cg',
    (
      SELECT
        COALESCE(
          string_agg(
            id::text,
            ','
            ORDER BY
              id
          ),
          ''
        )
      FROM
        constituency_groups
    ),
    true
  );

SELECT
  set_config(
    't17.anon_con',
    (
      SELECT
        COALESCE(
          string_agg(
            id::text,
            ','
            ORDER BY
              id
          ),
          ''
        )
      FROM
        constituencies
    ),
    true
  );

SELECT
  set_config(
    't17.anon_cgc',
    (
      SELECT
        COALESCE(
          string_agg(
            constituency_group_id::text || '/' || constituency_id::text,
            ','
            ORDER BY
              constituency_group_id,
              constituency_id
          ),
          ''
        )
      FROM
        constituency_group_constituencies
    ),
    true
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000a2',
    '[]'::jsonb
  );

SELECT
  set_config(
    't17.auth_cg',
    (
      SELECT
        COALESCE(
          string_agg(
            id::text,
            ','
            ORDER BY
              id
          ),
          ''
        )
      FROM
        constituency_groups
    ),
    true
  );

SELECT
  set_config(
    't17.auth_con',
    (
      SELECT
        COALESCE(
          string_agg(
            id::text,
            ','
            ORDER BY
              id
          ),
          ''
        )
      FROM
        constituencies
    ),
    true
  );

SELECT
  set_config(
    't17.auth_cgc',
    (
      SELECT
        COALESCE(
          string_agg(
            constituency_group_id::text || '/' || constituency_id::text,
            ','
            ORDER BY
              constituency_group_id,
              constituency_id
          ),
          ''
        )
      FROM
        constituency_group_constituencies
    ),
    true
  );

SELECT
  reset_role ();

SELECT
  ok (
    current_setting('t17.auth_cg') = current_setting('t17.anon_cg')
    AND length(current_setting('t17.anon_cg')) > 0,
    'constituency_groups: an authenticated caller holding no grant sees exactly what an anonymous caller sees, and the shared row set is not empty'
  );

SELECT
  ok (
    current_setting('t17.auth_con') = current_setting('t17.anon_con')
    AND length(current_setting('t17.anon_con')) > 0,
    'constituencies: an authenticated caller holding no grant sees exactly what an anonymous caller sees, and the shared row set is not empty'
  );

SELECT
  ok (
    current_setting('t17.auth_cgc') = current_setting('t17.anon_cgc')
    AND length(current_setting('t17.anon_cgc')) > 0,
    'constituency_group_constituencies: an authenticated caller holding no grant sees exactly what an anonymous caller sees, and the shared row set is not empty'
  );

-- =====================================================================
-- Section 16: the read-versus-write rule, as a RULE rather than as three instances
-- =====================================================================
SELECT
  ok (
    (
      SELECT
        qual LIKE '%project.read_structure%'
        AND qual LIKE '%project_open_for_voters%'
        AND qual NOT LIKE '%can_access_project%'
        AND qual NOT LIKE '%published%'
      FROM
        pg_policies
      WHERE
        tablename = 'constituency_groups'
        AND policyname = 'authenticated_select_constituency_groups'
    )
    AND (
      SELECT
        bool_and(
          COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%project.edit_structure%'
          AND COALESCE(qual, '') || COALESCE(with_check, '') NOT LIKE '%project.read_structure%'
        )
      FROM
        pg_policies
      WHERE
        tablename = 'constituency_groups'
        AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
    ),
    'constituency_groups: the SELECT predicate names the read permission and all three write predicates name the structure-edit permission and not the read one'
  );

SELECT
  ok (
    (
      SELECT
        qual LIKE '%project.read_structure%'
        AND qual LIKE '%project_open_for_voters%'
        AND qual NOT LIKE '%can_access_project%'
        AND qual NOT LIKE '%published%'
      FROM
        pg_policies
      WHERE
        tablename = 'constituencies'
        AND policyname = 'authenticated_select_constituencies'
    )
    AND (
      SELECT
        bool_and(
          COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%project.edit_structure%'
          AND COALESCE(qual, '') || COALESCE(with_check, '') NOT LIKE '%project.read_structure%'
        )
      FROM
        pg_policies
      WHERE
        tablename = 'constituencies'
        AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
    ),
    'constituencies: the SELECT predicate names the read permission and all three write predicates name the structure-edit permission and not the read one'
  );

-- =====================================================================
-- Section 17: the second hop helper, hardened and denying on no row
-- =====================================================================
SELECT
  ok (
    (
      SELECT
        p.prosecdef
        AND EXISTS (
          SELECT
            1
          FROM
            unnest(p.proconfig) c
          WHERE
            c LIKE 'search_path=%'
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'private'
        AND p.proname = 'constituency_group_project_id'
    ),
    'constituency_group_project_id is SECURITY DEFINER with a pinned search_path'
  );

SELECT
  ok (
    private.constituency_group_project_id ('00000000-0000-0000-0000-0000000000fd'::uuid) IS NULL
    AND private.election_project_id ('00000000-0000-0000-0000-0000000000fe'::uuid) IS NULL,
    'both hop helpers return NULL for an id present in no row — the deny-on-no-row posture entity_project_id already carries'
  );

-- =====================================================================
-- Section 18: the root admin reaches the whole account tier
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('super_admin'),
    test_user_grants ('super_admin')
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        accounts
      WHERE
        id IN (test_id ('account_a'), test_id ('account_b'))
    )::integer,
    2,
    'super_admin SELECTs both accounts — its own tenant''s and the other''s'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO accounts (id, name) VALUES ('%s', 'T17 Account')$$,
      'eeeeeeee-eeee-eeee-eeee-0000000000a0'
    ),
    'super_admin CAN insert an account — asked at global scope with a NULL target'
  );

SELECT
  is (
    t17_affected (
      format(
        $$UPDATE accounts SET name = 'Account A edited' WHERE id = '%s'$$,
        test_id ('account_a')
      )
    ),
    1,
    'super_admin CAN update an account'
  );

SELECT
  is (
    t17_affected (
      format(
        $$DELETE FROM accounts WHERE id = '%s'$$,
        'eeeeeeee-eeee-eeee-eeee-0000000000a0'
      )
    ),
    1,
    'super_admin CAN delete an account'
  );

-- =====================================================================
-- Section 19: the account admin — the WIDENING and the NARROWING, on the side that gained
--
-- P-1 ratified (A) on 2026-09-16. admin_update_accounts widens from the root admin alone to the root admin plus that account's own admin; admin_delete_projects narrows from every holder of project access to the account tier. Neither is covered by any assertion in the estate today, which is why each is asserted here in both directions rather than absorbed into the diff.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('account_admin_a'),
    test_user_grants ('account_admin_a')
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        accounts
      WHERE
        id = test_id ('account_a')
    )::integer,
    1,
    'account_admin_a SELECTs its own account'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        accounts
      WHERE
        id = test_id ('account_b')
    )::integer,
    0,
    'account_admin_a CANNOT see the other account — the tenancy boundary at account scope'
  );

SELECT
  is (
    t17_affected (
      format(
        $$UPDATE accounts SET name = 'AA edited' WHERE id = '%s'$$,
        test_id ('account_a')
      )
    ),
    1,
    'WIDENING, gaining side: account_admin_a CAN update its own account row, where only the root admin could'
  );

SELECT
  is (
    t17_affected (
      format(
        $$UPDATE accounts SET name = 'Hijack' WHERE id = '%s'$$,
        test_id ('account_b')
      )
    ),
    0,
    'account_admin_a CANNOT update the other account — the widening is scoped to its own'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO projects (id, account_id, name) VALUES ('%s', '%s', 'T17 Project')$$,
      'eeeeeeee-eeee-eeee-eeee-0000000000b1',
      test_id ('account_a')
    ),
    'account_admin_a CAN insert a project in its own account — account.manage_projects'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO projects (id, account_id, name) VALUES (gen_random_uuid(), '%s', 'T17 Sneak')$$,
      test_id ('account_b')
    ),
    '42501',
    NULL,
    'account_admin_a CANNOT insert a project in the other account'
  );

SELECT
  is (
    t17_affected (
      format(
        $$DELETE FROM projects WHERE id = '%s'$$,
        'eeeeeeee-eeee-eeee-eeee-0000000000b1'
      )
    ),
    1,
    'NARROWING, gaining side: account_admin_a CAN delete a project in its account — account.manage_projects'
  );

-- =====================================================================
-- Section 20: the project admin — the THIRD population change, and the narrowing's losing side
--
-- THE THIRD POPULATION CHANGE. The S-3 NOTE's second clause, "or its projects", means a project admin now reads the row of the account its project belongs to. It was found because it reddened 04-admin-crud.test.sql's `project_admin cannot SELECT accounts`; the executor halted on it and the operator sanctioned it on 2026-09-17. What widens is bounded and is stated so it is not rediscovered: an accounts row is id, name, created_at, updated_at, so what this caller gains is the account's NAME, and it already administers one of that account's projects.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        accounts
    )::integer = 1
    AND (
      SELECT
        id
      FROM
        accounts
    ) = test_id ('account_a'),
    'THIRD POPULATION CHANGE: a project admin SELECTs exactly its own account and no other, through a grant on a project of that account'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        accounts
      WHERE
        id = test_id ('account_b')
    )::integer,
    0,
    'the paired negative: a project admin of project A CANNOT see account B'
  );

SELECT
  is (
    t17_affected (
      format(
        $$UPDATE accounts SET name = 'PA hijack' WHERE id = '%s'$$,
        test_id ('account_a')
      )
    ),
    0,
    'a project admin CANNOT update the account row it may now read — on accounts, read and write name different things'
  );

SELECT
  throws_ok (
    $$INSERT INTO accounts (id, name) VALUES (gen_random_uuid(), 'PA Account')$$,
    '42501',
    NULL,
    'a project admin CANNOT insert an account'
  );

SELECT
  is (
    t17_affected (
      format(
        $$DELETE FROM accounts WHERE id = '%s'$$,
        test_id ('account_a')
      )
    ),
    0,
    'a project admin CANNOT delete an account'
  );

SELECT
  is (
    t17_affected (
      format(
        $$DELETE FROM projects WHERE id = '%s'$$,
        test_id ('project_a')
      )
    ),
    0,
    'NARROWING, losing side: a project admin CANNOT delete its own project — deletion moved to the account tier'
  );

SELECT
  is (
    t17_affected (
      format(
        $$UPDATE projects SET name = 'PA renamed' WHERE id = '%s'$$,
        test_id ('project_a')
      )
    ),
    1,
    'and that SAME project admin may still UPDATE that project — the pair differs in one permission and not in the caller''s general authority'
  );

-- =====================================================================
-- Section 21: a caller holding no grant at all may none of the six
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000a2',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        accounts
    )::integer,
    0,
    'a grant-less caller sees NO account — there is no public term on this table'
  );

SELECT
  throws_ok (
    $$INSERT INTO accounts (id, name) VALUES (gen_random_uuid(), 'Nobody Account')$$,
    '42501',
    NULL,
    'a grant-less caller CANNOT insert an account'
  );

SELECT
  is (
    t17_affected (
      format(
        $$UPDATE accounts SET name = 'Nobody' WHERE id = '%s'$$,
        test_id ('account_a')
      )
    ),
    0,
    'a grant-less caller CANNOT update an account'
  );

SELECT
  is (
    t17_affected (
      format(
        $$DELETE FROM accounts WHERE id = '%s'$$,
        test_id ('account_a')
      )
    ),
    0,
    'a grant-less caller CANNOT delete an account'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO projects (id, account_id, name) VALUES (gen_random_uuid(), '%s', 'Nobody Project')$$,
      test_id ('account_a')
    ),
    '42501',
    NULL,
    'a grant-less caller CANNOT insert a project'
  );

SELECT
  is (
    t17_affected (
      format(
        $$DELETE FROM projects WHERE id = '%s'$$,
        test_id ('project_a')
      )
    ),
    0,
    'a grant-less caller CANNOT delete a project'
  );

-- =====================================================================
-- Section 22: the account tier, structurally
-- =====================================================================
SELECT
  reset_role ();

SELECT
  ok (
    (
      SELECT
        qual
      FROM
        pg_policies
      WHERE
        tablename = 'accounts'
        AND cmd = 'SELECT'
    ) IS DISTINCT FROM (
      SELECT
        qual
      FROM
        pg_policies
      WHERE
        tablename = 'accounts'
        AND cmd = 'UPDATE'
    )
    AND (
      SELECT
        qual LIKE '%user_has_account_grant%'
        AND qual NOT LIKE '%account.edit_settings%'
      FROM
        pg_policies
      WHERE
        tablename = 'accounts'
        AND cmd = 'SELECT'
    )
    AND (
      SELECT
        qual LIKE '%account.edit_settings%'
        AND qual NOT LIKE '%user_has_account_grant%'
      FROM
        pg_policies
      WHERE
        tablename = 'accounts'
        AND cmd = 'UPDATE'
    ),
    'accounts: the read predicate names GRANT EXISTENCE and the write predicate names account.edit_settings, so the two name different things and the criterion-2 exemption this table was to receive is WITHDRAWN'
  );

SELECT
  ok (
    (
      SELECT
        with_check LIKE '%global%'
        AND with_check LIKE '%NULL::uuid%'
      FROM
        pg_policies
      WHERE
        tablename = 'accounts'
        AND cmd = 'INSERT'
    )
    AND (
      SELECT
        qual LIKE '%global%'
        AND qual LIKE '%NULL::uuid%'
      FROM
        pg_policies
      WHERE
        tablename = 'accounts'
        AND cmd = 'DELETE'
    ),
    'the accounts insert and delete ask at GLOBAL scope with a NULL target — an account-scope ask on an insert would be answered by a grant on an id no account uses yet, and grants.target_id has no foreign key to accounts'
  );

SELECT
  ok (
    (
      SELECT
        with_check LIKE '%account.manage_projects%'
      FROM
        pg_policies
      WHERE
        tablename = 'projects'
        AND cmd = 'INSERT'
    )
    AND (
      SELECT
        qual LIKE '%account.manage_projects%'
      FROM
        pg_policies
      WHERE
        tablename = 'projects'
        AND cmd = 'DELETE'
    )
    AND (
      SELECT
        qual LIKE '%project.edit_project_settings%'
      FROM
        pg_policies
      WHERE
        tablename = 'projects'
        AND cmd = 'UPDATE'
    ),
    'projects: creation and deletion are account-tier verbs and settings editing is a project-tier one'
  );

-- =====================================================================
-- Section 23: the seven tables as a whole — absence, and routing completeness
-- =====================================================================
-- ⚠ THE NON-VACUITY CONTROL WAS RE-EXPRESSED BY 162-12, AND THE REASON IS THAT THE PHASE SUCCEEDED.
-- 162-09 proved this scoped scan non-vacuous by asserting that `can_access_project` STILL STOOD in some policy elsewhere in `public` -- a fine control while other tables were unconverted. 162-12 converted the last one: `authenticated_select_nominations` was the FINAL policy in the whole schema naming that shim, MEASURED at zero afterwards, so the old control became unsatisfiable by construction and would have reddened this assertion for the best possible reason.
--
-- The replacement makes the SAME claim -- this scan is scoped rather than vacuous -- against a control that cannot expire: the scanned population itself is non-empty (31 policies on the seven tables). The description string keeps its claim and only the clause naming the control changes.
--
-- HANDOFF TO 162-15: the legacy shim now has ZERO policy callers anywhere in `public`. Its deletion is no longer blocked by any policy on any table.
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN (
          'accounts',
          'projects',
          'elections',
          'constituency_groups',
          'constituencies',
          'constituency_group_constituencies',
          'election_constituency_groups'
        )
        AND (
          COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%can_access_project%'
          OR COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%has_role%'
          OR COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%is_candidate_self%'
          OR COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%published%'
          OR btrim(COALESCE(qual, '')) = 'true'
        )
    ) = 0
    AND (
      SELECT
        count(*)
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN (
          'accounts',
          'projects',
          'elections',
          'constituency_groups',
          'constituencies',
          'constituency_group_constituencies',
          'election_constituency_groups'
        )
    ) > 0,
    'no policy on the seven tables re-derives a rule user_can answers or carries an ungated predicate, and the scanned population is non-empty — which is what proves this scan is scoped rather than vacuous'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          tablename || '.' || policyname,
          ','
          ORDER BY
            tablename,
            policyname
        )
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN (
          'accounts',
          'projects',
          'elections',
          'constituency_groups',
          'constituencies',
          'constituency_group_constituencies',
          'election_constituency_groups'
        )
        AND NOT ('anon' = ANY (roles))
        AND COALESCE(qual, '') || COALESCE(with_check, '') NOT LIKE '%user_can%'
    ),
    'accounts.authenticated_select_accounts,constituency_group_constituencies.authenticated_select_constituency_group_constituencies,election_constituency_groups.authenticated_select_election_constituency_groups',
    'every non-anon policy on the seven tables routes its authority decision through user_can except exactly three, and the three are NAMED rather than counted: the account read, which asks about grant existence, and the two join-table delegations'
  );

-- =====================================================================
-- Section 24: the account-read predicate is hardened like every other definer function here
-- =====================================================================
SELECT
  ok (
    (
      SELECT
        p.prosecdef
        AND EXISTS (
          SELECT
            1
          FROM
            unnest(p.proconfig) c
          WHERE
            c LIKE 'search_path=%'
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'user_has_account_grant'
    ),
    'user_has_account_grant is SECURITY DEFINER with a pinned search_path — its project disjunct reads public.projects, which has row-level security enabled'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
