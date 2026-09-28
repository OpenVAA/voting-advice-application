-- 22-content-policies.test.sql: the authority grid for the content, configuration, feedback and job tables
--
-- This file asserts the seventeen `user_can` policies on `questions`, `question_categories`, `app_settings`, `feedback` and `admin_jobs`, and the two ungated `feedback` INSERT policies. No E2E spec reaches `admin_jobs` or `feedback` under row-level security (the only `admin_jobs` caller is a service-role teardown client, and nothing reads or deletes `feedback`), so for those two tables this file is the whole evidence. Every `user_can` policy carries a pair: one caller who may and one who may not, differing in exactly the permission under test.
--
-- The settings permission is split along the line "does a policy read this value": `project.edit_project_settings` governs `projects` and is admin-only, `project.edit_app_settings` governs `app_settings` and a project EDITOR holds it too. The two are granted to the same roles everywhere except the project editor, so the split is observable only against an identity holding one and not the other. None of the eight identities of `create_test_data ()` does: they are two project admins, three candidates, one organization, one account admin and one super admin.
--
-- That separating identity is an `auth.users` row plus one `grants` row, inserted as `postgres` inside this transaction and rolled back with it, so `create_test_data ()` and every other suite's fixture stay unchanged. `17-project-structure-authority.test.sql` creates the same kind of identity for the same reason.
--
-- One pair cannot be separated by any identity: `feedback.read` and `feedback.manage` are granted to exactly the same four roles, so no behavioural assertion distinguishes the SELECT policy's literal from the DELETE policy's. That separation is asserted structurally, from `pg_policies` on the applied database (section 13).
--
-- Synthetic rows use an `efefefef-`-prefixed id range that no fixture, seed or sibling test file uses, following `11-question-rpcs.test.sql`: an assertion that deletes must never remove a row a later assertion reads.
--
-- Feedback inserts set `request.headers` first. `check_feedback_rate_limit` allows five submissions per five-minute window per forwarded client IP, and every insert in one pgTAP transaction shares the same window, so a distinct IP per insert site keeps these assertions measuring authority rather than the rate limiter.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_user_grants).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (68);

SELECT
  create_test_data ();

-- =====================================================================
-- Section 0: a feedback row survives the deletion of its project
--
-- `feedback.project_id` is nullable with `ON DELETE SET NULL`, so deleting a project keeps its feedback. The two go together: a SET NULL action cannot write into a `NOT NULL` column, and the project delete would raise instead.
--
-- The first assertion is the non-vacuity floor: a retention assertion whose row never existed passes from an empty instrument. The orphan's reachability (readable and deletable by the global-scope admin and by nobody else) is asserted in section 12.
-- =====================================================================
SELECT
  reset_role ();

INSERT INTO
  projects (id, account_id, name, open_for_voters)
VALUES
  (
    'efefefef-efef-efef-efef-000000000001',
    test_id ('account_a'),
    'Orphan Project',
    false
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"203.0.113.11"}',
    true
  );

INSERT INTO
  feedback (id, project_id, rating, description)
VALUES
  (
    'efefefef-efef-efef-efef-000000000002',
    'efefefef-efef-efef-efef-000000000001',
    4,
    'Retained past its project'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        feedback
      WHERE
        id = 'efefefef-efef-efef-efef-000000000002'
    )::integer,
    1,
    'the feedback row exists before its project is deleted'
  );

DELETE FROM projects
WHERE
  id = 'efefefef-efef-efef-efef-000000000001';

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        feedback
      WHERE
        id = 'efefefef-efef-efef-efef-000000000002'
    )::integer,
    1,
    'the feedback row SURVIVES the deletion of its project (ON DELETE SET NULL, not CASCADE)'
  );

SELECT
  ok (
    (
      SELECT
        project_id IS NULL
      FROM
        feedback
      WHERE
        id = 'efefefef-efef-efef-efef-000000000002'
    ),
    'and the surviving row carries a NULL project_id'
  );

-- =====================================================================
-- Section 1: the separating identity, created in this transaction
--
-- One `auth.users` row at a uuid outside the `cccccccc-cccc-cccc-cccc-00000000000N` series `test_user_id ()` returns, and one `public.grants` row with project scope, a NULL target type, project A as the target and the EDITOR role. Both roll back with this transaction.
--
-- `t22_affected` exists because an UPDATE or DELETE refused by a USING clause affects zero rows SILENTLY rather than raising, so the may-not half cannot be written as `throws_ok`. It is SECURITY INVOKER (the default), so the dynamic statement runs as the caller and row-level security applies.
--
-- The `set_test_user` call for `admin_a` writes the grants of all eight fixture identities; one call is enough. The editor is impersonated with an EMPTY grant array, which skips that write and the fixture-agreement check: its one grant row is inserted directly in this section, and the session claim is projected from it.
-- =====================================================================
SELECT
  reset_role ();

CREATE OR REPLACE FUNCTION t22_affected (p_sql text) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  n integer;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

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
    'cccccccc-cccc-cccc-cccc-0000000000e1',
    '00000000-0000-0000-0000-000000000000',
    'content_editor_a@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000000e1',
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

-- =====================================================================
-- Section 2: the settings split at the function level -- two permissions, one identity
--
-- Asked of the authority predicate directly, so the pair states the matrix fact the policies below are written against, independently of any policy. `grant_role_permissions('project','editor',NULL)` carries `project.edit_app_settings` and NOT `project.edit_project_settings`; that is the whole of the split, and in this file only this identity can observe it.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000e1',
    '[]'::jsonb
  );

SELECT
  ok (
    (
      SELECT
        user_can (
          'project',
          test_id ('project_a'),
          'project.edit_app_settings'
        )
    ),
    'a project EDITOR holds project.edit_app_settings on its own project'
  );

SELECT
  ok (
    NOT (
      SELECT
        user_can (
          'project',
          test_id ('project_a'),
          'project.edit_project_settings'
        )
    ),
    'and the SAME caller does NOT hold project.edit_project_settings on it'
  );

-- =====================================================================
-- Section 3: the settings split behaviourally -- four cells across two tables, plus the entity grantee
--
-- The editor's denied `projects` update means "the permission" only because the admin's update of the SAME row succeeds. Without that control it would equally well mean "a table nobody can write".
-- =====================================================================
SELECT
  is (
    t22_affected (
      format(
        $$UPDATE app_settings SET settings = '{"theme":"editor"}' WHERE project_id = '%s'$$,
        test_id ('project_a')
      )
    ),
    1,
    'a project editor CAN update its own project''s app_settings row'
  );

SELECT
  is (
    t22_affected (
      format(
        $$UPDATE app_settings SET settings = '{"theme":"hijack"}' WHERE project_id = '%s'$$,
        test_id ('project_b')
      )
    ),
    0,
    'a project editor CANNOT update another project''s app_settings row (tenancy)'
  );

SELECT
  is (
    t22_affected (
      format(
        $$UPDATE projects SET name = 'PA renamed by editor' WHERE id = '%s'$$,
        test_id ('project_a')
      )
    ),
    0,
    'a project editor CANNOT update its own project''s projects row -- the settings split across two tables'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  is (
    t22_affected (
      format(
        $$UPDATE app_settings SET settings = '{"theme":"admin"}' WHERE project_id = '%s'$$,
        test_id ('project_a')
      )
    ),
    1,
    'a project ADMIN can update that same app_settings row'
  );

SELECT
  is (
    t22_affected (
      format(
        $$UPDATE projects SET name = 'PA renamed by admin' WHERE id = '%s'$$,
        test_id ('project_a')
      )
    ),
    1,
    'and that same admin CAN update the projects row the editor could not -- the control that makes the editor''s denial the permission rather than an unwritable table'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  is (
    t22_affected (
      format(
        $$UPDATE app_settings SET settings = '{"theme":"candidate"}' WHERE project_id = '%s'$$,
        test_id ('project_a')
      )
    ),
    0,
    'candidate_a, an entity grantee of the SAME project, CANNOT update its app_settings row'
  );

-- =====================================================================
-- Section 4: the settings split structurally, across the two tables
--
-- Read from `pg_policies` on the applied database, whose expressions carry no comments, so neither assertion can be satisfied or defeated by prose. `strpos` rather than LIKE: `_` is a single-character wildcard in LIKE and every permission literal in this enum is full of them.
--
-- Each policy alone names one literal; only the pair shows that the editor's permission reaches `app_settings` and not `projects`.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  ok (
    strpos(
      (
        SELECT
          qual
        FROM
          pg_policies
        WHERE
          schemaname = 'public'
          AND tablename = 'app_settings'
          AND policyname = 'admin_update_app_settings'
      ),
      'project.edit_app_settings'
    ) > 0
    AND strpos(
      (
        SELECT
          qual
        FROM
          pg_policies
        WHERE
          schemaname = 'public'
          AND tablename = 'app_settings'
          AND policyname = 'admin_update_app_settings'
      ),
      'project.edit_project_settings'
    ) = 0,
    'the app_settings UPDATE policy names project.edit_app_settings and NOT project.edit_project_settings'
  );

SELECT
  ok (
    strpos(
      (
        SELECT
          qual
        FROM
          pg_policies
        WHERE
          schemaname = 'public'
          AND tablename = 'projects'
          AND policyname = 'admin_update_projects'
      ),
      'project.edit_project_settings'
    ) > 0
    AND strpos(
      (
        SELECT
          qual
        FROM
          pg_policies
        WHERE
          schemaname = 'public'
          AND tablename = 'projects'
          AND policyname = 'admin_update_projects'
      ),
      'project.edit_app_settings'
    ) = 0,
    'the projects UPDATE policy names project.edit_project_settings and NOT project.edit_app_settings'
  );

-- =====================================================================
-- Section 5: the read grid -- two axes, three tables, fifteen cells
--
-- The axes are DOES THE CALLER HOLD A GRANT IN THE PROJECT and IS THE PROJECT OPEN FOR VOTERS, and the predicate under test is a two-term disjunction of two DIFFERENT questions: `user_can ('project', project_id, 'project.read_structure')` answers the matrix one, `project_open_for_voters (project_id)` answers the row-state one.
--
-- Cell 4 is the direction a project-open-only predicate fails: a project that is NOT open for voters is still fully readable to its own grantees. Cell 3 is the direction an authority-only predicate fails: an authenticated caller holding no grant in an OPEN project must see it, or a logged-in caller sees strictly less than a logged-out one and `_getAppSettings` -- which reads this table with `.single()` -- THROWS rather than rendering empty.
--
-- Each arm is load-bearing on its own: without the project-open term cell 3 fails on all three tables, and without the authority call cell 4 does.
--
-- Cell 2 is `candidate_a`, an ENTITY grantee, which passes through `user_can`'s project-read branch -- an entity grant answers yes to `project.read_structure` at PROJECT scope for its own project -- rather than through any per-row flag.
-- =====================================================================
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
        questions
      WHERE
        project_id = test_id ('project_a')
    )::integer,
    1,
    'cell 1 / questions: a PROJECT grantee of project A sees project A''s question'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        question_categories
      WHERE
        project_id = test_id ('project_a')
    )::integer,
    1,
    'cell 1 / question_categories: a PROJECT grantee of project A sees project A''s category'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        app_settings
      WHERE
        project_id = test_id ('project_a')
    )::integer,
    1,
    'cell 1 / app_settings: a PROJECT grantee of project A sees project A''s settings row'
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
    'cell 5 / questions: a caller holding a grant in project A only does NOT see CLOSED project B''s question'
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
    'cell 5 / question_categories: a caller holding a grant in project A only does NOT see CLOSED project B''s category'
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
    'cell 5 / app_settings: a caller holding a grant in project A only does NOT see CLOSED project B''s settings row'
  );

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
        questions
      WHERE
        project_id = test_id ('project_a')
    )::integer,
    1,
    'cell 2 / questions: an ENTITY grantee of project A sees its question, through the project-read branch'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        question_categories
      WHERE
        project_id = test_id ('project_a')
    )::integer,
    1,
    'cell 2 / question_categories: an ENTITY grantee of project A sees its category, through the project-read branch'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        app_settings
      WHERE
        project_id = test_id ('project_a')
    )::integer,
    1,
    'cell 2 / app_settings: an ENTITY grantee of project A sees its settings row, through the project-read branch'
  );

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
        questions
      WHERE
        project_id = test_id ('project_a')
    )::integer,
    1,
    'cell 3 / questions: a caller holding a grant in project B ONLY sees project A''s question, because project A is OPEN'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        question_categories
      WHERE
        project_id = test_id ('project_a')
    )::integer,
    1,
    'cell 3 / question_categories: a caller holding a grant in project B ONLY sees project A''s category, because project A is OPEN'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        app_settings
      WHERE
        project_id = test_id ('project_a')
    )::integer,
    1,
    'cell 3 / app_settings: a caller holding a grant in project B ONLY sees project A''s settings row, because project A is OPEN -- the cell whose failure makes _getAppSettings throw'
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
    1,
    'cell 4 / questions: that SAME caller sees CLOSED project B''s question, because it holds a grant there'
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
    1,
    'cell 4 / question_categories: that SAME caller sees CLOSED project B''s category, because it holds a grant there'
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
    1,
    'cell 4 / app_settings: that SAME caller sees CLOSED project B''s settings row, because it holds a grant there'
  );

-- =====================================================================
-- Section 6: the three read predicates structurally
--
-- Read from `pg_policies` on the applied database, whose expressions carry no comments, so the negative half cannot be satisfied or defeated by prose. Each names BOTH arms and none of four terms that would re-derive what `user_can` answers: a project-access helper, a role predicate, a bare uid call, or a per-row publication column.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND policyname IN (
          'authenticated_select_questions',
          'authenticated_select_question_categories',
          'authenticated_select_app_settings'
        )
        AND strpos(qual, 'user_can') > 0
        AND strpos(qual, 'project.read_structure') > 0
        AND strpos(qual, 'project_open_for_voters') > 0
    )::integer,
    3,
    'all three authenticated SELECT policies name the authority predicate, the structure-read permission AND the project-open helper'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND policyname IN (
          'authenticated_select_questions',
          'authenticated_select_question_categories',
          'authenticated_select_app_settings'
        )
        AND qual ~ '(can_access_project|has_role|uid\(\)|published)'
    )::integer,
    0,
    'and none of the three re-derives a rule the authority predicate answers, nor reads a per-row publication column'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN (
          'questions',
          'question_categories',
          'app_settings',
          'feedback',
          'admin_jobs'
        )
        AND COALESCE(qual, with_check) ~ 'FROM public\.projects'
    )::integer,
    0,
    'no policy on these five tables re-derives the project-open flag with an inline sub-select over public.projects'
  );

-- =====================================================================
-- Fixture: one unreferenced row per DENY-SIDE delete assertion
--
-- Every delete assertion, allow half AND deny half, gets its own synthetic row, for two reasons.
--
-- Ordering: a delete assertion must never remove a row a later assertion reads, as in `11-question-rpcs.test.sql`.
--
-- The deny half must be refused by the policy and by nothing else. A delete aimed at a referenced category such as `question_category_a` would, under a wide-open predicate, reach `questions_category_id_fkey` and raise, aborting the transaction, so the assertion would pass for the wrong reason. The deny-side category inserted below is referenced by no question, so only the policy can refuse it.
-- =====================================================================
SELECT
  reset_role ();

INSERT INTO
  question_categories (id, project_id, name)
VALUES
  (
    'efefefef-efef-efef-efef-000000000021',
    test_id ('project_a'),
    '{"en":"QC deny target"}'::jsonb
  );

INSERT INTO
  questions (id, project_id, type, category_id, name, choices)
VALUES
  (
    'efefefef-efef-efef-efef-000000000022',
    test_id ('project_a'),
    'singleChoiceOrdinal',
    test_id ('question_category_a'),
    '{"en":"Q deny target"}'::jsonb,
    '[{"id":1,"label":{"en":"Agree"}},{"id":2,"label":{"en":"Disagree"}}]'::jsonb
  );

INSERT INTO
  admin_jobs (
    id,
    project_id,
    job_id,
    job_type,
    author,
    end_status
  )
VALUES
  (
    'efefefef-efef-efef-efef-000000000024',
    test_id ('project_a'),
    'job-deny',
    'QuestionInfoGeneration',
    'operator@test.com',
    'completed'
  ),
  (
    'efefefef-efef-efef-efef-000000000025',
    test_id ('project_a'),
    'job-tenancy',
    'QuestionInfoGeneration',
    'operator@test.com',
    'completed'
  );

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"203.0.113.41"}',
    true
  );

INSERT INTO
  feedback (id, project_id, rating, description)
VALUES
  (
    'efefefef-efef-efef-efef-000000000026',
    test_id ('project_a'),
    3,
    'Tenancy delete target'
  );

-- =====================================================================
-- Section 7: the content and configuration write pairs -- eight policies, eight pairs
--
-- THE DENY IDENTITY IS `candidate_a` AND THE CHOICE IS THE WHOLE POINT. It is an ENTITY grantee of the SAME project as the allow identity, so it holds `project.read_structure` and none of the write verbs: the two callers of each pair differ in the permission and in NOTHING ELSE -- not in the project, not in whether they are authenticated, not in whether they hold a grant at all. A pair whose two callers differ in more than one thing measures the wrong difference.
--
-- INSERT denials RAISE (42501, the WITH CHECK refusing the new row); UPDATE and DELETE denials affect ZERO ROWS SILENTLY, which is why they go through `t22_affected` rather than `throws_ok`.
--
-- The `app_settings` pair is INTERLEAVED rather than grouped, because `app_settings.project_id` is UNIQUE: the deny-side INSERT has to be attempted while project A's row is absent, or a unique violation would answer in place of the policy and the assertion would pass on the wrong mechanism.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000e1',
    '[]'::jsonb
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO question_categories (id, project_id, name) VALUES ('%s', '%s', '{"en":"QC1"}')$$,
      'efefefef-efef-efef-efef-000000000011',
      test_id ('project_a')
    ),
    'a project editor CAN insert a question category into project A'
  );

SELECT
  is (
    t22_affected (
      format(
        $$UPDATE question_categories SET name = '{"en":"QC A edited"}' WHERE id = '%s'$$,
        test_id ('question_category_a')
      )
    ),
    1,
    'a project editor CAN update a project A question category'
  );

SELECT
  is (
    t22_affected (
      format(
        $$DELETE FROM question_categories WHERE id = '%s'$$,
        'efefefef-efef-efef-efef-000000000011'
      )
    ),
    1,
    'a project editor CAN delete a project A question category'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO questions (id, project_id, type, category_id, name, choices) VALUES ('%s', '%s', 'singleChoiceOrdinal', '%s', '{"en":"Q1"}', '[{"id":1,"label":{"en":"Agree"}},{"id":2,"label":{"en":"Disagree"}}]')$$,
      'efefefef-efef-efef-efef-000000000012',
      test_id ('project_a'),
      test_id ('question_category_a')
    ),
    'a project editor CAN insert a question into project A'
  );

SELECT
  is (
    t22_affected (
      format(
        $$UPDATE questions SET name = '{"en":"Q A edited"}' WHERE id = '%s'$$,
        test_id ('question_a')
      )
    ),
    1,
    'a project editor CAN update a project A question'
  );

SELECT
  is (
    t22_affected (
      format(
        $$DELETE FROM questions WHERE id = '%s'$$,
        'efefefef-efef-efef-efef-000000000012'
      )
    ),
    1,
    'a project editor CAN delete a project A question'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO question_categories (id, project_id, name) VALUES ('%s', '%s', '{"en":"QC2"}')$$,
      'efefefef-efef-efef-efef-000000000018',
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'candidate_a CANNOT insert a question category into the project it may read'
  );

SELECT
  is (
    t22_affected (
      format(
        $$UPDATE question_categories SET name = '{"en":"Hijack"}' WHERE id = '%s'$$,
        test_id ('question_category_a')
      )
    ),
    0,
    'candidate_a CANNOT update a project A question category'
  );

SELECT
  is (
    t22_affected (
      format(
        $$DELETE FROM question_categories WHERE id = '%s'$$,
        'efefefef-efef-efef-efef-000000000021'
      )
    ),
    0,
    'candidate_a CANNOT delete a project A question category'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO questions (id, project_id, type, category_id, name, choices) VALUES ('%s', '%s', 'singleChoiceOrdinal', '%s', '{"en":"Q2"}', '[{"id":1,"label":{"en":"Agree"}},{"id":2,"label":{"en":"Disagree"}}]')$$,
      'efefefef-efef-efef-efef-000000000019',
      test_id ('project_a'),
      test_id ('question_category_a')
    ),
    '42501',
    NULL,
    'candidate_a CANNOT insert a question into the project it may read'
  );

SELECT
  is (
    t22_affected (
      format(
        $$UPDATE questions SET name = '{"en":"Hijack"}' WHERE id = '%s'$$,
        test_id ('question_a')
      )
    ),
    0,
    'candidate_a CANNOT update a project A question'
  );

SELECT
  is (
    t22_affected (
      format(
        $$DELETE FROM questions WHERE id = '%s'$$,
        'efefefef-efef-efef-efef-000000000022'
      )
    ),
    0,
    'candidate_a CANNOT delete a project A question'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000e1',
    '[]'::jsonb
  );

SELECT
  is (
    t22_affected (
      format(
        $$DELETE FROM app_settings WHERE project_id = '%s'$$,
        test_id ('project_a')
      )
    ),
    1,
    'a project editor CAN delete project A''s app_settings row'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO app_settings (id, project_id, settings) VALUES ('%s', '%s', '{"theme":"hijack"}')$$,
      'efefefef-efef-efef-efef-00000000001a',
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'candidate_a CANNOT insert an app_settings row for the project it may read (attempted while the row is absent, so the policy answers and not the UNIQUE constraint)'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000e1',
    '[]'::jsonb
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO app_settings (id, project_id, settings) VALUES ('%s', '%s', '{"theme":"editor-restored"}')$$,
      'efefefef-efef-efef-efef-000000000013',
      test_id ('project_a')
    ),
    'a project editor CAN insert project A''s app_settings row'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  is (
    t22_affected (
      format(
        $$DELETE FROM app_settings WHERE project_id = '%s'$$,
        test_id ('project_a')
      )
    ),
    0,
    'candidate_a CANNOT delete project A''s app_settings row'
  );

-- =====================================================================
-- Section 8: `feedback` -- two policies, two pairs
--
-- Nothing in the E2E suite reads or deletes this table, so these four assertions are the whole behavioural evidence for both policies. `feedback.read` and `feedback.manage` are two DIFFERENT permissions granted to exactly the same four roles, so exchanging the two literals reddens none of the assertions below; the structural map in section 13 is what separates them.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"203.0.113.21"}',
    true
  );

INSERT INTO
  feedback (id, project_id, rating, description)
VALUES
  (
    'efefefef-efef-efef-efef-000000000014',
    test_id ('project_a'),
    5,
    'Deletable by the editor'
  ),
  (
    'efefefef-efef-efef-efef-000000000015',
    test_id ('project_a'),
    2,
    'Not deletable by candidate_a'
  );

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
        feedback
      WHERE
        id = test_id ('feedback_a')
    )::integer,
    1,
    'a project editor CAN read project A''s feedback -- feedback.read'
  );

SELECT
  is (
    t22_affected (
      format(
        $$DELETE FROM feedback WHERE id = '%s'$$,
        'efefefef-efef-efef-efef-000000000014'
      )
    ),
    1,
    'a project editor CAN delete a project A feedback row -- feedback.manage'
  );

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
        feedback
    )::integer,
    0,
    'candidate_a, an entity grantee of the SAME project, reads NO feedback at all'
  );

SELECT
  is (
    t22_affected (
      format(
        $$DELETE FROM feedback WHERE id = '%s'$$,
        'efefefef-efef-efef-efef-000000000015'
      )
    ),
    0,
    'and candidate_a CANNOT delete a project A feedback row'
  );

-- =====================================================================
-- Section 9: `admin_jobs` -- three policies, three pairs, THE DISCLOSURE DIRECTION
--
-- This table holds the initiating operator's address in `author` and the LLM job's prompt, response and progress in `input`, `output` and `messages`. Nothing in the E2E suite reaches it under row-level security -- the suite's only caller is a SERVICE-ROLE teardown client -- so a widened policy here is invisible everywhere except in these six assertions.
--
-- All three policies take `project.edit_questions`. The jobs exist to edit questions and both features end in `merge_question_custom_data`, so whoever may write a question's custom data may record and read the job that wrote it. That admits the root, account and project admins and the project editor, and no entity user, so no entity user reads the author address or the prompt. `project.read_structure` would not do for the SELECT: every entity user holds it.
--
-- Read and write are deliberately not split on this table, unlike the other content tables, because the only project-scope read permission is the one that discloses.
-- =====================================================================
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
        admin_jobs
      WHERE
        id = test_id ('admin_job_a')
    )::integer,
    1,
    'a project editor CAN read project A''s admin_jobs row'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO admin_jobs (id, project_id, job_id, job_type, author, end_status) VALUES ('%s', '%s', 'job-e1', 'QuestionInfoGeneration', 'editor@test.com', 'completed')$$,
      'efefefef-efef-efef-efef-000000000016',
      test_id ('project_a')
    ),
    'a project editor CAN insert a project A admin_jobs row'
  );

SELECT
  is (
    t22_affected (
      format(
        $$DELETE FROM admin_jobs WHERE id = '%s'$$,
        'efefefef-efef-efef-efef-000000000016'
      )
    ),
    1,
    'a project editor CAN delete a project A admin_jobs row'
  );

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
        admin_jobs
    )::integer,
    0,
    'candidate_a, an entity grantee of the SAME project, reads NO admin_jobs row -- not the author address, not the prompt, not the response'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO admin_jobs (id, project_id, job_id, job_type, author, end_status) VALUES ('%s', '%s', 'job-c1', 'QuestionInfoGeneration', 'candidate@test.com', 'completed')$$,
      'efefefef-efef-efef-efef-000000000017',
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'candidate_a CANNOT insert an admin_jobs row into the project it may read'
  );

SELECT
  is (
    t22_affected (
      format(
        $$DELETE FROM admin_jobs WHERE id = '%s'$$,
        'efefefef-efef-efef-efef-000000000024'
      )
    ),
    0,
    'candidate_a CANNOT delete a project A admin_jobs row -- the only record of who ran an LLM job over the project''s questions, and there is no UPDATE policy, so deletion is the only way to alter it'
  );

-- =====================================================================
-- Section 10: tenancy, once per table
--
-- `admin_b` is a project ADMIN and holds every verb below -- in project B. Each assertion is therefore a pure reach failure: the permission is held and the target is out of range.
--
-- The `app_settings` cell uses UPDATE where its four neighbours use INSERT or DELETE. A DELETE there could pass on an empty table, because under a wide-open predicate the preceding deny assertion would already have removed the row it aims at. `app_settings.project_id` is UNIQUE, so an INSERT would be answered by the constraint instead of the policy. UPDATE is the one write path on this table that is both non-destructive and unambiguous.
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
      $$INSERT INTO question_categories (id, project_id, name) VALUES ('%s', '%s', '{"en":"QCB"}')$$,
      'efefefef-efef-efef-efef-00000000001b',
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'tenancy / question_categories: a project B admin CANNOT insert into project A'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO questions (id, project_id, type, category_id, name, choices) VALUES ('%s', '%s', 'singleChoiceOrdinal', '%s', '{"en":"QB"}', '[{"id":1,"label":{"en":"Agree"}},{"id":2,"label":{"en":"Disagree"}}]')$$,
      'efefefef-efef-efef-efef-00000000001c',
      test_id ('project_a'),
      test_id ('question_category_a')
    ),
    '42501',
    NULL,
    'tenancy / questions: a project B admin CANNOT insert into project A'
  );

SELECT
  is (
    t22_affected (
      format(
        $$UPDATE app_settings SET settings = '{"theme":"tenancy"}' WHERE project_id = '%s'$$,
        test_id ('project_a')
      )
    ),
    0,
    'tenancy / app_settings: a project B admin CANNOT update project A''s settings row'
  );

SELECT
  is (
    t22_affected (
      format(
        $$DELETE FROM feedback WHERE id = '%s'$$,
        'efefefef-efef-efef-efef-000000000026'
      )
    ),
    0,
    'tenancy / feedback: a project B admin CANNOT delete project A''s feedback'
  );

SELECT
  is (
    t22_affected (
      format(
        $$DELETE FROM admin_jobs WHERE id = '%s'$$,
        'efefefef-efef-efef-efef-000000000025'
      )
    ),
    0,
    'tenancy / admin_jobs: a project B admin CANNOT delete project A''s job record'
  );

-- =====================================================================
-- Section 11: the two ungated feedback INSERT policies
--
-- `anon_insert_feedback` and `authenticated_insert_feedback` are `WITH CHECK (true)`: anon and authenticated callers may insert feedback unconditionally at the policy level, because anonymous voters submit feedback and no permission models a submission. What bounds a submission is the table's rating-or-description CHECK and its per-IP rate-limit trigger, neither of which is a policy. The requirement that a row names its project is enforced at insert time by the `enforce_feedback_project` trigger and asserted in `34-feedback-project-guard.test.sql`.
--
-- Any project id is admitted. Content is never publicly readable, because the read policy is gated, and the third assertion below states that separation directly: a caller may submit and may not read back.
-- =====================================================================
SELECT
  set_test_user ('anon');

SELECT
  set_config(
    'request.headers',
    '{"x-forwarded-for":"203.0.113.31"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (id, project_id, rating, description) VALUES ('%s', '%s', 5, 'From anon')$$,
      'efefefef-efef-efef-efef-00000000001d',
      test_id ('project_a')
    ),
    'an anon caller CAN submit feedback -- the policy is deliberately ungated'
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
    '{"x-forwarded-for":"203.0.113.32"}',
    true
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO feedback (id, project_id, rating, description) VALUES ('%s', '%s', 1, 'From candidate_a')$$,
      'efefefef-efef-efef-efef-00000000001e',
      test_id ('project_a')
    ),
    'and an authenticated caller CAN submit feedback from the candidate app, whatever project it names'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        feedback
    )::integer,
    0,
    'and that same caller reads ZERO feedback rows, its own included -- submitting is ungated, reading is not'
  );

-- =====================================================================
-- Section 12: the orphaned feedback row is reachable by EXACTLY ONE identity
--
-- The row section 0 orphaned carries `project_id IS NULL`. The `feedback` SELECT and DELETE policies gate on `project_id`, so without a second disjunct that row would be readable and deletable by NOBODY. Each predicate therefore admits the GLOBAL-SCOPE admin when the project id is null.
--
-- The global-scope admin is the narrowest identity that keeps the row reachable without a new permission, at the cost of one disjunct in each of the two predicates. The pair below distinguishes "reachable by exactly one identity" from "reachable by nobody", which a single positive assertion cannot.
-- =====================================================================
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
        feedback
      WHERE
        id = 'efefefef-efef-efef-efef-000000000002'
    )::integer,
    0,
    'a PROJECT-scope grantee does NOT see the orphaned feedback row -- its grant names a project and the row names none'
  );

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
        feedback
      WHERE
        id = 'efefefef-efef-efef-efef-000000000002'
    )::integer,
    1,
    'and the GLOBAL-scope admin DOES -- the orphan is reachable by exactly one identity, not by nobody'
  );

-- =====================================================================
-- Section 13: the structural policy-to-permission map over all seventeen `user_can` policies
--
-- The instrument for the distinction no behavioural assertion in this estate can make. `feedback.read` and `feedback.manage` are coextensive across all eight user types of the role x permission matrix (`grant_role_permissions`), so exchanging them between the two `feedback` policies leaves every assertion above green and reddens only this one.
--
-- Derived from `pg_policies` on the applied database and compared element for element against the declared map, so a single wrong mapping reddens and the diff names the policy.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        string_agg(
          policyname || '=' || COALESCE(
            substring(
              COALESCE(qual, with_check)
              from
                '''((feedback|project|entity|nomination|account)\.[a-z_]+)'''
            ),
            'NONE'
          ),
          E'\n'
          ORDER BY
            policyname
        )
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN (
          'questions',
          'question_categories',
          'app_settings',
          'feedback',
          'admin_jobs'
        )
        AND COALESCE(qual, with_check) LIKE '%user_can%'
    ),
    concat_ws(
      E'\n',
      'admin_delete_admin_jobs=project.edit_questions',
      'admin_delete_app_settings=project.edit_app_settings',
      'admin_delete_feedback=feedback.manage',
      'admin_delete_question_categories=project.edit_questions',
      'admin_delete_questions=project.edit_questions',
      'admin_insert_admin_jobs=project.edit_questions',
      'admin_insert_app_settings=project.edit_app_settings',
      'admin_insert_question_categories=project.edit_questions',
      'admin_insert_questions=project.edit_questions',
      'admin_select_admin_jobs=project.edit_questions',
      'admin_select_feedback=feedback.read',
      'admin_update_app_settings=project.edit_app_settings',
      'admin_update_question_categories=project.edit_questions',
      'admin_update_questions=project.edit_questions',
      'authenticated_select_app_settings=project.read_structure',
      'authenticated_select_question_categories=project.read_structure',
      'authenticated_select_questions=project.read_structure'
    ),
    'the derived policy-to-permission map equals the declared one, element for element, over all seventeen user_can policies'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
