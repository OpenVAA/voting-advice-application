-- 22-content-policies.test.sql: the authority grid for the content, configuration, feedback and job tables
--
-- 162-11 routes the seventeen convertible policies on `questions`, `question_categories`, `app_settings`, `feedback` and `admin_jobs` onto `user_can`. Two of those five tables are reached by NO E2E spec under row-level security at all -- the suite's only `admin_jobs` caller is a SERVICE-ROLE teardown client, which bypasses row-level security entirely, and nothing in the suite reads or deletes `feedback` -- so for those two tables the assertions in this file are the whole evidence. Every converted policy therefore carries a PAIR: one caller who may and one who may not, differing in exactly the permission under test.
--
-- SECTION 11.1 IS WHY THE FILE EXISTS. D-09 splits one settings permission in two along the line "does a policy read this value": `project.edit_project_settings` governs `projects` and is admin-only, `project.edit_app_settings` governs `app_settings` and a project EDITOR holds it too. The two are granted to the same people in every column of section 3.3 except `ProjectEditor`, so a test run as an admin passes whichever literal is written and a test run as a candidate fails whichever literal is written. The split is observable only against an identity holding one and not the other, and `create_test_data ()` has none -- its eight identities are two project admins, three candidates, one organization, one account admin and one super admin, and under D-07 every admin-shaped one of them maps to `role = 'admin'`.
--
-- THE SEPARATING IDENTITY IS MINTED HERE AND NOWHERE ELSE. 162-06's `14-grants-migration.test.sql` asserts reverse completeness -- every `public.grants` row accounted for by a `user_roles` row or an entity `auth_user_id` link -- and `user_role_type` has no project-editor member, so a project-editor grant in `create_test_data ()` would be authority nobody granted. The identity is an `auth.users` row plus one `grants` row inserted as `postgres` inside this transaction, rolled back with it. `00-helpers.test.sql` is not edited. 162-09 minted the same identity in `17-project-structure-authority.test.sql` for the same reason; 162-17 owns consolidating them.
--
-- ONE PAIR CANNOT BE SEPARATED BY ANY IDENTITY, AND THAT IS STATED RATHER THAN HIDDEN. Section 3.3 grants `feedback.read` and `feedback.manage` to exactly the same four roles, so no behavioural assertion in this estate distinguishes the SELECT policy's literal from the DELETE policy's. The separation is asserted STRUCTURALLY, from `pg_policies` on the applied database, and the limit of the behavioural instrument is measured rather than assumed: exchanging the two literals was observed to redden zero behavioural assertions and the structural map alone.
--
-- Synthetic rows use an `efefefef-`-prefixed id range that no fixture, seed or sibling test file uses, following `11-question-rpcs.test.sql`'s stated precedent: an assertion that deletes must never remove a row a later assertion reads.
--
-- FEEDBACK INSERTS SET `request.headers` FIRST, deliberately. `check_feedback_rate_limit` counts five submissions per five-minute window per forwarded client IP, and every insert in one pgTAP transaction shares the same window. A distinct IP per insert site keeps this file's assertions measuring authority rather than the rate limiter.
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
-- Section 0: `feedback.project_id` survives its project (the operator's P-4 NOTE)
--
-- `107-feedback.sql` declared `project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE`, so deleting a project destroyed its feedback. The note asks for `ON DELETE SET NULL`, which cannot fire into a `NOT NULL` column -- the delete would raise rather than orphan the row -- so the nullability is dropped in the same regeneration.
--
-- The first assertion is the non-vacuity floor: a retention assertion whose row never existed passes from an empty instrument. Assertions 2 and 3 were observed RED against the pre-change cascade before the schema was touched.
--
-- The orphan's REACHABILITY -- that a row with a null project id stays readable and deletable by the global-scope admin and by nobody else -- is asserted in section 5, beside the two `feedback` predicates that carry the null disjunct. It cannot be asserted here: until those predicates are written, both surviving policies on this table gate on `project_id` alone and an orphaned row is reachable by nobody.
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
-- Section 1: the separating identity, minted here because it exists nowhere in the tree
--
-- One `auth.users` row at a uuid outside the `cccccccc-cccc-cccc-cccc-00000000000N` series `test_user_id ()` returns, and one `public.grants` row with project scope, a NULL target type, project A as the target and the EDITOR role. Both roll back with this transaction.
--
-- `t22_affected` exists because an UPDATE or DELETE refused by a USING clause affects zero rows SILENTLY rather than raising, so the may-not half cannot be written as `throws_ok`. It is SECURITY INVOKER (the default), so the dynamic statement runs as the caller and row-level security applies.
--
-- The `set_test_user` call for `admin_a` fires the grant backfill for all eight fixture identities; one call is enough. The editor is then impersonated with an EMPTY role array, because that third parameter is a tripwire for a non-empty role array against an identity holding no grant rows -- and this identity holds one, inserted directly.
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
-- Section 2: section 11.1 at the function level -- the two permissions, one identity
--
-- Asked of the authority predicate directly, so the pair states the matrix fact the policies below are written against, independently of any policy. `grant_role_permissions('project','editor',NULL)` carries `project.edit_app_settings` and NOT `project.edit_project_settings`; that is the whole of D-09's split, and this is the only identity in the estate that can see it.
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
    'and the SAME caller does NOT hold project.edit_project_settings on it -- section 11.1'
  );

-- =====================================================================
-- Section 3: section 11.1 behaviourally -- four cells across two tables, plus the entity grantee
--
-- Cell 5 (the editor denied the `projects` row) means "the permission" only because cell 7 shows the SAME row is writable by an admin. Without that control it would equally well mean "a table nobody can write".
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
    'a project editor CANNOT update its own project''s projects row -- section 11.1 across two tables'
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
-- Section 4: section 11.1 structurally, across the two plans that own the two halves
--
-- Read from `pg_policies` on the applied database, whose expressions carry no comments, so neither assertion can be satisfied or defeated by prose. `strpos` rather than LIKE: `_` is a single-character wildcard in LIKE and every permission literal in this enum is full of them.
--
-- 162-09 owns the `projects` half and 162-11 owns the `app_settings` half, so NEITHER plan can assert the split alone. This pair is where two literals become a split.
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
-- The axes are DOES THE CALLER HOLD A GRANT IN THE PROJECT and IS THE PROJECT OPEN FOR VOTERS, and the predicate under test is a two-term disjunction of two DIFFERENT questions: `user_can ('project', project_id, 'project.read_structure')` answers the matrix one, 162-08's `project_open_for_voters (project_id)` answers the row-state one.
--
-- CELL 4 IS ROADMAP CRITERION 5's SECOND CLAUSE and it is the direction a project-open-only predicate fails: a project that is NOT open for voters is still fully readable to its own grantees. Cell 3 is the direction an authority-only predicate fails: an authenticated caller holding no grant in an OPEN project must see it, or a logged-in caller sees strictly less than a logged-out one and `_getAppSettings` -- which reads this table with `.single()` -- THROWS rather than rendering empty.
--
-- Both arms were observed independently load-bearing before the real predicate was accepted: with the disjunct removed, cell 3 reddened on all three tables; with the authority call removed, cell 4 reddened on all three. A disjunct whose two arms are not independently load-bearing is a disjunct with one arm.
--
-- Cell 2 is `candidate_a`, an ENTITY grantee, and it passes through 162-04's project-read branch -- an entity grant answers yes to `project.read_structure` at PROJECT scope for its own project -- rather than through any per-row flag. The retired publication term was gone from these predicates rather than pending removal (D-11b), so 162-16 found nothing left to strip here.
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
    'cell 4 / questions: that SAME caller sees CLOSED project B''s question, because it holds a grant there -- criterion 5''s second clause'
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
    'cell 4 / question_categories: that SAME caller sees CLOSED project B''s category, because it holds a grant there -- criterion 5''s second clause'
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
    'cell 4 / app_settings: that SAME caller sees CLOSED project B''s settings row, because it holds a grant there -- criterion 5''s second clause'
  );

-- =====================================================================
-- Section 6: the three read predicates structurally
--
-- Read from `pg_policies` on the applied database, whose expressions carry no comments, so the negative half cannot be satisfied or defeated by prose. Each names BOTH arms and none of the four things a converted predicate must no longer contain: the legacy project predicate, a role predicate, a bare uid call, or the retired per-row visibility column.
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
    'and none of the three still re-derives a rule the authority predicate answers, nor reads the retired per-row column'
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
    'D-15 / K3: no policy on these five tables re-derives the project-open flag with an inline sub-select over public.projects'
  );

-- =====================================================================
-- Fixture: one unreferenced row per DENY-SIDE delete assertion
--
-- Every delete assertion, allow half AND deny half, gets its own synthetic row. Two reasons, both measured rather than anticipated.
--
-- ORDERING: a delete assertion must never remove a row a later assertion reads -- `11-question-rpcs.test.sql`'s stated precedent, and the estate's rule.
--
-- AND THE DENY HALF MUST BE REFUSED BY THE POLICY AND BY NOTHING ELSE. Pointed at `question_category_a`, candidate_a's delete was observed -- against a planted always-true predicate -- to reach `questions_category_id_fkey` and RAISE, aborting the whole transaction: the assertion passed under the real predicate for the right reason and would have passed under a WIDE-OPEN one for the wrong reason, which is exactly the failure the planted variant exists to expose. `question_category_deny` is referenced by no question, so only the policy can refuse it.
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
-- INSERT denials RAISE (42501, the WITH CHECK refusing the new row); UPDATE and DELETE denials affect ZERO ROWS SILENTLY, which is why they go through `t22_affected` rather than `throws_ok`. Both forms are the estate's existing ones; a third would be a new convention.
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
-- Section 8: `feedback` -- two policies, two pairs, and no E2E spec anywhere behind them
--
-- NOTHING IN THE E2E SUITE READS OR DELETES THIS TABLE, so these four assertions are the whole evidence for both converted policies. `feedback.read` and `feedback.manage` are two DIFFERENT members of section 3.2, granted to exactly the same four roles, so no identity in the matrix separates them; the structural map in section 13 is what makes the distinction real, and exchanging the two literals was measured to redden ZERO of the assertions below.
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
-- Q1 = (a), ratified by the operator on 2026-09-16 (162-CHECKPOINT-DECISIONS.md section 1 item S-4, the one box ticked): all three policies take `project.edit_questions`. The jobs exist to edit questions and both features terminate in `merge_question_custom_data`, so whoever may write a question's custom data may record and read the job that wrote it. Holder set Root / Account / ProjAdmin / ProjEditor and ✗ in all four entity columns -- one project editor wider than today, and NO entity user gains read of the address or the prompt. Option (b) -- `project.read_structure` on the SELECT -- was named as the disclosing one and rejected: that verb is ✓ in all four entity columns.
--
-- READ AND WRITE ARE DELIBERATELY NOT SPLIT ON THIS TABLE, against the pattern the phase installs everywhere else, because the enum's only read-shaped member is the one that discloses. That is recorded here rather than left to look like an oversight; 162-17's matrix-conformance work inherits the mapping.
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
-- The `app_settings` cell uses UPDATE where its four neighbours use INSERT or DELETE, and the reason was measured rather than chosen: a DELETE there was observed to pass from an EMPTY TABLE under a planted always-true predicate, because the preceding deny assertion had already removed the row it was aiming at. `app_settings.project_id` is UNIQUE, so an INSERT would be answered by the constraint instead of the policy. UPDATE is the one write path on this table that is both non-destructive and unambiguous.
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
-- Section 11: the two ungated INSERT policies, asserted as the RULING they are
--
-- Q2 = (a), ratified by the operator on 2026-09-16 (162-CHECKPOINT-DECISIONS.md section 5 item P-4): `anon_insert_feedback` and `authenticated_insert_feedback` stay exactly as they are, `WITH CHECK (true)`. Submitting feedback is not a member of section 3.2 and section 3.2 is canonical, so gating either policy would mean inventing an enum member or borrowing an unrelated one. What bounds a submission is 107-feedback.sql's rating-or-description CHECK and its per-IP rate-limit trigger, neither of which is a policy.
--
-- The unbounded project id both policies admit is ACCEPTED AND RECORDED (threat register T-162-11-09), not silently inherited: content is never publicly readable because the read policy is gated, and the third assertion below is that read/write separation stated directly -- a caller may submit and may not read back.
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
-- The row section 0 orphaned still carries `project_id IS NULL`. Both surviving policies on this table gate on `project_id`, so without a second disjunct that row would be readable and deletable by NOBODY -- retention that produces invisible, undeletable ballast. Each predicate therefore admits the GLOBAL-SCOPE admin when the project id is null.
--
-- THIS IS AN ASSUMPTION, NOT A RULING. The operator's P-4 note asks for retention and does not settle who may then read it; the global-scope admin is the narrowest disposition that keeps the row reachable, introduces no enum member and is one disjunct in each of two predicates. It is recorded under that word in 162-11-SUMMARY.md so it can be overruled in one edit. The pair below is what distinguishes "reachable by exactly one identity" from "reachable by nobody"; a single positive assertion cannot.
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
-- Section 13: the structural policy-to-permission map over all seventeen converted policies
--
-- The instrument for the distinction no behavioural assertion in this estate can make. `feedback.read` and `feedback.manage` are coextensive across all eight user types of section 3.3, so exchanging them between the two `feedback` policies leaves every assertion above green; it reddens this one, and that asymmetry -- measured, not argued -- is what makes the map an instrument rather than a decoration.
--
-- Derived from `pg_policies` on the applied database and compared element for element against the map 162-11 declares, so a single wrong mapping reddens and the diff names the policy.
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
    'the derived policy-to-permission map equals the declared one, element for element, over all seventeen converted policies'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
