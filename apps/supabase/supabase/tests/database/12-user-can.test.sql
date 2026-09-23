-- 12-user-can.test.sql: the user_can permission predicate
--
-- user_can is the single place the role x permission matrix of 162-IMPLEMENTATION-BRIEF.md section 3.3 is written down, and 97 RLS policies are about to delegate their whole authority decision to it. Its failure mode is silent and one-directional: a predicate that answers true when it should answer false breaks nothing, reddens nothing, and ships. So every allow assertion in this file is paired with a deny assertion, and the deny half was observed RED against a deliberately over-permissive user_can before the real body was accepted. That observation is the evidence; the green run below is not.
--
-- The declared assertion count below is explicit and deliberately so: a pgTAP file that asserts nothing exits 0 under no_plan, which is exactly the vacuous pass a permission test must not be able to produce. The declaration below is the only occurrence of that call in this file, deliberately: the gate that reads the declared count greps for the first occurrence, so a mention of it in prose above would shadow the real declaration and read as zero.
--
-- Grant rows are inserted into public.grants inside this transaction, as postgres, and projected into the session JWT by test_grants_claim — the same shape 162-06's access-token hook must reproduce. Nothing outside the transaction is touched and the ROLLBACK at the end removes them.
--
-- The test users are chosen for their ids only. user_can reads no legacy user_roles claim in any branch, and every session below is given an EMPTY user_roles array, so a caller's authority here comes from public.grants and from nowhere else. That is why, for instance, candidate_b carries the AllianceEditor grant: which auth user holds which grant is arbitrary, and saying so here is cheaper than inventing a parallel fixture.
--
-- Five extra auth users and two extra nominations are created inside this transaction rather than in create_test_data(), so no other test file's fixture moves: the eight named users of 00-helpers.test.sql are exactly the eight user types of section 3.1, which leaves none spare for the unmapped grant shapes, the union caller and the grant-less caller.
--
-- Depends on: 00-helpers.test.sql (set_test_user, set_test_grants,
--             test_grants_claim, create_test_data, test_id, test_user_id)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (45);

SELECT
  create_test_data ();

-- =====================================================================
-- Extra fixture, local to this transaction
-- =====================================================================
-- Five auth users the eight-user shared fixture has no room for.
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
    'cccccccc-cccc-cccc-cccc-0000000000f1',
    '00000000-0000-0000-0000-000000000000',
    'unmapped_global_editor@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000000f2',
    '00000000-0000-0000-0000-000000000000',
    'unmapped_account_editor@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000000f3',
    '00000000-0000-0000-0000-000000000000',
    'unmapped_entity_admin@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000000f4',
    '00000000-0000-0000-0000-000000000000',
    'union_caller@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000000f5',
    '00000000-0000-0000-0000-000000000000',
    'no_grants_at_all@test.com',
    crypt ('testpass', gen_salt ('bf')),
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

-- The grandchild chain: org_a's nomination already exists and already parents candidate_a's. A faction nomination under it, and a candidate nomination under THAT, give is_child_nominee a genuine two-hop case to answer false to.
--
-- ⚠ THE FACTION LINK IS THE SHARED FIXTURE'S ROW, NOT A SECOND ONE. This block used to INSERT its own `faction_a` nomination under `nomination_org_a` at (election_a, constituency_a, round 1). 162-08 later added `nomination_faction_a` to `create_test_data ()` at exactly that contest, and the two have been duplicates ever since -- invisibly, because nothing forbade it. 162-12's `nominations_entity_parent_contest_key UNIQUE NULLS NOT DISTINCT` does forbid it, and MEASURED: installing that key turned this file red here. The chain is unchanged in shape and depth -- org_a's nomination parents the faction's, which parents candidate_a2's -- so every assertion below still has its genuine two-hop case, and no description string moves.
INSERT INTO
  nominations (
    id,
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round,
    parent_nomination_id
  )
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000002',
    test_id ('project_a'),
    test_id ('candidate_a2'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    test_id ('nomination_faction_a')
  );

-- =====================================================================
-- Grant fixture: the eight user types of section 3.1, one row each
-- =====================================================================
INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  -- RootAdmin
  (
    test_user_id ('super_admin'),
    'global',
    NULL,
    NULL,
    'admin'
  ),
  -- AccountAdmin
  (
    test_user_id ('account_admin_a'),
    'account',
    NULL,
    test_id ('account_a'),
    'admin'
  ),
  -- ProjectAdmin
  (
    test_user_id ('admin_a'),
    'project',
    NULL,
    test_id ('project_a'),
    'admin'
  ),
  -- ProjectEditor
  (
    test_user_id ('admin_b'),
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  ),
  -- Candidate
  (
    test_user_id ('candidate_a'),
    'entity',
    'candidate',
    test_id ('candidate_a'),
    'editor'
  ),
  -- OrganizationEditor
  (
    test_user_id ('organization_a'),
    'entity',
    'organization',
    test_id ('org_a'),
    'editor'
  ),
  -- FactionEditor
  (
    test_user_id ('candidate_a2'),
    'entity',
    'faction',
    test_id ('faction_a'),
    'editor'
  ),
  -- AllianceEditor
  (
    test_user_id ('candidate_b'),
    'entity',
    'alliance',
    test_id ('alliance_a'),
    'editor'
  ),
  -- Three grant shapes the CHECK constraints admit and section 3.1 does not map
  (
    'cccccccc-cccc-cccc-cccc-0000000000f1',
    'global',
    NULL,
    NULL,
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000000f2',
    'account',
    NULL,
    test_id ('account_a'),
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000000f3',
    'entity',
    'candidate',
    test_id ('candidate_a'),
    'admin'
  ),
  -- The union caller: an entity grant AND a project-editor grant, same project
  (
    'cccccccc-cccc-cccc-cccc-0000000000f4',
    'entity',
    'candidate',
    test_id ('candidate_a'),
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000000f4',
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  );

-- The answer vector, asked over the canonical 23 in enum order. Returning the permissions rather than 23 booleans is deliberate: a single wrong cell then reddens with the permission NAME in the pgTAP diagnostic, which is what makes a failure here readable against the brief's table.
CREATE FUNCTION pg_temp.allowed (p_scope grant_scope_type, p_target_id uuid) RETURNS grant_permission[] LANGUAGE sql STABLE AS $$
  SELECT COALESCE(array_agg(p.v ORDER BY p.n), ARRAY[]::public.grant_permission[])
  FROM unnest(enum_range(NULL::public.grant_permission)) WITH ORDINALITY AS p (v, n)
  WHERE public.user_can(p_scope, p_target_id, p.v);
$$;

-- =====================================================================
-- Section 1: user_can, asked directly (tests 1-5)
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('admin_b'));

SELECT
  ok (
    user_can (
      'project',
      test_id ('project_a'),
      'project.read_structure'
    ),
    'a project editor is allowed project.read_structure on their own project'
  );

SELECT
  ok (
    NOT user_can (
      'project',
      test_id ('project_b'),
      'project.read_structure'
    ),
    'a project editor is denied project.read_structure on another project'
  );

-- The empty edge, resolved rather than surfaced: a caller holding no grant at all is denied. Until 162-06 emits the claim, every real JWT is in this case.
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000f5',
    '[]'::jsonb
  );

SELECT
  set_test_grants ('cccccccc-cccc-cccc-cccc-0000000000f5');

SELECT
  ok (
    NOT user_can (
      'project',
      test_id ('project_a'),
      'project.read_structure'
    ),
    'a caller with no grants at all is denied project.read_structure'
  );

-- No set_test_grants call at all: the claims object carries no `grants` key.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000f5',
    '[]'::jsonb
  );

SELECT
  ok (
    NOT user_can (
      'project',
      test_id ('project_a'),
      'project.read_structure'
    ),
    'a caller whose JWT carries no grants key is denied project.read_structure'
  );

-- Right scope, right target, wrong permission.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('admin_b'));

SELECT
  ok (
    NOT user_can (
      'project',
      test_id ('project_a'),
      'project.edit_project_settings'
    ),
    'a project editor is denied project.edit_project_settings on their own project'
  );

-- =====================================================================
-- Section 2: the same authority read through the converted policy (6-9)
-- =====================================================================
SELECT
  is (
    (
      SELECT
        string_agg(id::text, ',')
      FROM
        projects
    ),
    test_id ('project_a')::text,
    'a project grantee sees exactly their own project row through authenticated_select_projects'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        projects
      WHERE
        id = test_id ('project_b')
    )::integer,
    0,
    'a project grantee sees zero rows for another project'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000f5',
    '[]'::jsonb
  );

SELECT
  set_test_grants ('cccccccc-cccc-cccc-cccc-0000000000f5');

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        projects
    )::integer,
    0,
    'a caller with no grants sees zero project rows'
  );

-- Criterion 2, behaviourally. The project grantee may read the row through the converted SELECT policy and may not write it: at the commit this assertion was written admin_update_projects still gated on the project-access shim, which read a claim this session does not carry. The UPDATE below raises nothing and affects no row.
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('admin_b'));

UPDATE projects
SET
  name = 'Renamed by a caller who may only read'
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
    'a caller who may read the project may not update it'
  );

-- =====================================================================
-- Section 3: criterion 2, structurally (test 10)
-- =====================================================================
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
        qual
      FROM
        pg_policies
      WHERE
        tablename = 'projects'
        AND policyname = 'authenticated_select_projects'
    ) NOT LIKE '%can_access_project%',
    'the projects SELECT and UPDATE policies no longer share a predicate'
  );

-- =====================================================================
-- Section 4: the eight columns of section 3.3, one ordered vector each (11-18)
--
-- Each vector is asked at the scope that user type's grant reaches, against a target that grant reaches. The expected array is transcribed from the brief's table cell by cell, in the canonical enum order of 000-enums.sql.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('super_admin'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('super_admin'));

SELECT
  is (
    pg_temp.allowed ('global', NULL),
    ARRAY[
      'feedback.read',
      'feedback.manage',
      'account.edit_settings',
      'account.manage_projects',
      'account.manage_admins',
      'project.manage_editors',
      'project.edit_project_settings',
      'project.edit_app_settings',
      'project.edit_structure',
      'project.edit_questions',
      'project.read_structure',
      'project.edit_entities',
      'project.edit_nominations',
      'project.read_entities',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.edit_immutable',
      'entity.invite_children',
      'entity.confirm',
      'nomination.edit',
      'nomination.read',
      'nomination.confirm',
      'nomination.create_parent'
    ]::grant_permission[],
    'the 23-permission answer vector for RootAdmin equals the matrix row'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('account_admin_a'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('account_admin_a'));

SELECT
  is (
    pg_temp.allowed ('account', test_id ('account_a')),
    ARRAY[
      'feedback.read',
      'feedback.manage',
      'account.edit_settings',
      'account.manage_projects',
      'account.manage_admins',
      'project.manage_editors',
      'project.edit_project_settings',
      'project.edit_app_settings',
      'project.edit_structure',
      'project.edit_questions',
      'project.read_structure',
      'project.edit_entities',
      'project.edit_nominations',
      'project.read_entities',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.edit_immutable',
      'entity.invite_children',
      'entity.confirm',
      'nomination.edit',
      'nomination.read',
      'nomination.confirm',
      'nomination.create_parent'
    ]::grant_permission[],
    'the 23-permission answer vector for AccountAdmin equals the matrix row'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('admin_a'));

SELECT
  is (
    pg_temp.allowed ('project', test_id ('project_a')),
    ARRAY[
      'feedback.read',
      'feedback.manage',
      'project.manage_editors',
      'project.edit_project_settings',
      'project.edit_app_settings',
      'project.edit_structure',
      'project.edit_questions',
      'project.read_structure',
      'project.edit_entities',
      'project.edit_nominations',
      'project.read_entities',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.edit_immutable',
      'entity.invite_children',
      'entity.confirm',
      'nomination.edit',
      'nomination.read',
      'nomination.confirm',
      'nomination.create_parent'
    ]::grant_permission[],
    'the 23-permission answer vector for ProjectAdmin equals the matrix row'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('admin_b'));

SELECT
  is (
    pg_temp.allowed ('project', test_id ('project_a')),
    ARRAY[
      'feedback.read',
      'feedback.manage',
      'project.edit_app_settings',
      'project.edit_structure',
      'project.edit_questions',
      'project.read_structure',
      'project.edit_entities',
      'project.edit_nominations',
      'project.read_entities',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.edit_immutable',
      'entity.invite_children',
      'entity.confirm',
      'nomination.edit',
      'nomination.read',
      'nomination.create_parent'
    ]::grant_permission[],
    'the 23-permission answer vector for ProjectEditor equals the matrix row'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('candidate_a'));

SELECT
  is (
    pg_temp.allowed ('entity', test_id ('candidate_a')),
    ARRAY[
      'project.read_structure',
      'entity.edit_answers',
      'entity.read_answers',
      'nomination.edit',
      'nomination.read',
      'nomination.create_parent'
    ]::grant_permission[],
    'the 23-permission answer vector for Candidate equals the matrix row'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('organization_a'));

SELECT
  is (
    pg_temp.allowed ('entity', test_id ('org_a')),
    ARRAY[
      'project.read_structure',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.invite_children',
      'nomination.edit',
      'nomination.read'
    ]::grant_permission[],
    'the 23-permission answer vector for OrganizationEditor equals the matrix row'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a2'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('candidate_a2'));

SELECT
  is (
    pg_temp.allowed ('entity', test_id ('faction_a')),
    ARRAY[
      'project.read_structure',
      'entity.edit_answers',
      'entity.read_answers',
      'nomination.edit',
      'nomination.read',
      'nomination.create_parent'
    ]::grant_permission[],
    'the 23-permission answer vector for FactionEditor equals the matrix row'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_b'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('candidate_b'));

SELECT
  is (
    pg_temp.allowed ('entity', test_id ('alliance_a')),
    ARRAY[
      'project.read_structure',
      'entity.edit_answers',
      'entity.read_answers',
      'nomination.edit',
      'nomination.read',
      'nomination.create_parent'
    ]::grant_permission[],
    'the 23-permission answer vector for AllianceEditor equals the matrix row'
  );

-- =====================================================================
-- Section 5: grant shapes outside the eight-row mapping (19-21)
--
-- The CHECK constraints of 300-auth-tables.sql admit these three; section 3.1 does not describe them. Without the matrix function's fall-through arm they would inherit whichever CASE arm they happened to land in.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000f1',
    '[]'::jsonb
  );

SELECT
  set_test_grants ('cccccccc-cccc-cccc-cccc-0000000000f1');

SELECT
  is (
    pg_temp.allowed ('global', NULL),
    ARRAY[]::grant_permission[],
    'a grant shape outside the eight-row mapping carries no permissions: global+editor'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000f2',
    '[]'::jsonb
  );

SELECT
  set_test_grants ('cccccccc-cccc-cccc-cccc-0000000000f2');

SELECT
  is (
    pg_temp.allowed ('account', test_id ('account_a')),
    ARRAY[]::grant_permission[],
    'a grant shape outside the eight-row mapping carries no permissions: account+editor'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000f3',
    '[]'::jsonb
  );

SELECT
  set_test_grants ('cccccccc-cccc-cccc-cccc-0000000000f3');

SELECT
  is (
    pg_temp.allowed ('entity', test_id ('candidate_a')),
    ARRAY[]::grant_permission[],
    'a grant shape outside the eight-row mapping carries no permissions: entity+admin'
  );

-- =====================================================================
-- Section 6: the three fail-open classes (22-26)
-- =====================================================================
-- Deny class 1: no grants at all.
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000f5',
    '[]'::jsonb
  );

SELECT
  set_test_grants ('cccccccc-cccc-cccc-cccc-0000000000f5');

SELECT
  is (
    pg_temp.allowed ('project', test_id ('project_a')),
    ARRAY[]::grant_permission[],
    'an empty grants array denies all 23 permissions at project scope'
  );

SELECT
  is (
    pg_temp.allowed ('entity', test_id ('candidate_a')),
    ARRAY[]::grant_permission[],
    'an empty grants array denies all 23 permissions at entity scope'
  );

-- Deny class 2: the right authority, the wrong tenant.
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('account_admin_a'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('account_admin_a'));

SELECT
  is (
    pg_temp.allowed ('project', test_id ('project_b')),
    ARRAY[]::grant_permission[],
    'an account admin is denied every permission on a project in another account'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('admin_a'));

SELECT
  is (
    pg_temp.allowed ('entity', test_id ('candidate_b')),
    ARRAY[]::grant_permission[],
    'a project admin is denied every permission on an entity of another project'
  );

-- Deny class 3: the right scope and target, the wrong permission. These are the three cells that distinguish ProjectEditor from ProjectAdmin.
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('admin_b'));

SELECT
  ok (
    user_can (
      'project',
      test_id ('project_a'),
      'project.edit_questions'
    )
    AND NOT user_can (
      'project',
      test_id ('project_a'),
      'project.manage_editors'
    )
    AND NOT user_can (
      'project',
      test_id ('project_a'),
      'project.edit_project_settings'
    )
    AND NOT user_can (
      'project',
      test_id ('project_a'),
      'nomination.confirm'
    ),
    'a project editor is denied the three cells that distinguish it from a project admin'
  );

-- =====================================================================
-- Section 7: degenerate input (27-32)
--
-- Asked as the ROOT admin wherever possible: a global grant reaches everything, so it is the caller most likely to answer true for the wrong reason, and a guard that holds for it holds for every weaker grant.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('super_admin'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('super_admin'));

SELECT
  ok (
    NOT user_can ('project', NULL, 'project.read_structure'),
    'a NULL target id denies at project scope'
  );

SELECT
  ok (
    NOT user_can ('entity', NULL, 'entity.edit_answers'),
    'a NULL target id denies at entity scope'
  );

SELECT
  ok (
    user_can ('global', NULL, 'account.manage_admins'),
    'a global admin is still allowed a global-scope permission with a NULL target id'
  );

-- A uuid in no entity table. Asserted for all three grant classes at once, because the branch that could answer true for the wrong reason differs per class: the global branch skips its lookup, the project branch compares a NULL project id, the entity branch compares a NULL target.
SELECT
  ok (
    NOT user_can (
      'entity',
      '99999999-9999-9999-9999-999999999999',
      'entity.edit_answers'
    ),
    'a target id present in no entity table denies'
  );

-- A claim entry whose scope is not a declared literal. Compared as text and skipped rather than cast, because a cast would raise inside a policy predicate in 97 places.
SELECT
  set_config(
    'request.jwt.claims',
    jsonb_set(
      current_setting('request.jwt.claims')::jsonb,
      '{grants}',
      '[{"scope": "galaxy", "target_type": null, "target_id": null, "role": "admin"}]'::jsonb
    )::text,
    true
  );

SELECT
  is (
    pg_temp.allowed ('project', test_id ('project_a')),
    ARRAY[]::grant_permission[],
    'a claim entry with an undeclared scope is ignored'
  );

-- The same garbage entry, this time alongside one valid project-editor grant.
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('admin_b'));

SELECT
  set_config(
    'request.jwt.claims',
    jsonb_set(
      current_setting('request.jwt.claims')::jsonb,
      '{grants}',
      '[{"scope": "galaxy", "target_type": null, "target_id": null, "role": "admin"}]'::jsonb || (
        current_setting('request.jwt.claims')::jsonb -> 'grants'
      )
    )::text,
    true
  );

SELECT
  is (
    pg_temp.allowed ('project', test_id ('project_a')),
    ARRAY[
      'feedback.read',
      'feedback.manage',
      'project.edit_app_settings',
      'project.edit_structure',
      'project.edit_questions',
      'project.read_structure',
      'project.edit_entities',
      'project.edit_nominations',
      'project.read_entities',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.edit_immutable',
      'entity.invite_children',
      'entity.confirm',
      'nomination.edit',
      'nomination.read',
      'nomination.create_parent'
    ]::grant_permission[],
    'a garbage claim entry alongside a valid grant answers as the valid grant alone'
  );

-- =====================================================================
-- Section 8: the adjacency edge, resolved as a union (33-34)
--
-- Two grants bearing on one object combine by union: the first grant satisfying both verb and reach answers yes, and no grant can subtract. The alternative reading — that the more specific grant wins — is rejected explicitly, because section 3.3's `own` qualifiers restrict a grant's own reach, never another grant's.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000f4',
    '[]'::jsonb
  );

SELECT
  set_test_grants ('cccccccc-cccc-cccc-cccc-0000000000f4');

SELECT
  ok (
    user_can (
      'project',
      test_id ('project_a'),
      'project.edit_questions'
    ),
    'two grants union: an entity grantee who is also a project editor is allowed project.edit_questions'
  );

-- The identical claim with its two entries in the reverse order.
SELECT
  set_config(
    'request.jwt.claims',
    jsonb_set(
      current_setting('request.jwt.claims')::jsonb,
      '{grants}',
      (
        SELECT
          jsonb_agg(
            e
            ORDER BY
              ord DESC
          )
        FROM
          jsonb_array_elements(
            current_setting('request.jwt.claims')::jsonb -> 'grants'
          ) WITH ORDINALITY AS t (e, ord)
      )
    )::text,
    true
  );

SELECT
  is (
    pg_temp.allowed ('project', test_id ('project_a')),
    ARRAY[
      'feedback.read',
      'feedback.manage',
      'project.edit_app_settings',
      'project.edit_structure',
      'project.edit_questions',
      'project.read_structure',
      'project.edit_entities',
      'project.edit_nominations',
      'project.read_entities',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.edit_immutable',
      'entity.invite_children',
      'entity.confirm',
      'nomination.edit',
      'nomination.read',
      'nomination.create_parent'
    ]::grant_permission[],
    'the answer vector is identical when the two grants are listed in the reverse order'
  );

-- =====================================================================
-- Section 9: the project-read branch (35-38)
--
-- Section 3.4 row 2, "any auth user can always read their project", written into user_can as one branch naming one permission literal — not as a general upward reach, which would also answer yes to entity.edit_answers asked at account scope.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('candidate_a'));

SELECT
  ok (
    user_can (
      'project',
      test_id ('project_a'),
      'project.read_structure'
    ),
    'an entity grantee is allowed project.read_structure on their own project'
  );

SELECT
  ok (
    NOT user_can (
      'project',
      test_id ('project_a'),
      'project.edit_structure'
    ),
    'an entity grantee is denied project.edit_structure on their own project'
  );

SELECT
  ok (
    NOT user_can (
      'project',
      test_id ('project_b'),
      'project.read_structure'
    ),
    'an entity grantee is denied project.read_structure on another project'
  );

SELECT
  ok (
    NOT user_can (
      'entity',
      test_id ('candidate_a2'),
      'entity.edit_answers'
    ),
    'an entity grantee is denied entity.edit_answers on another entity in the same project'
  );

-- =====================================================================
-- Section 10: is_child_nominee, one hop only (39-43)
--
-- D4(a): the direct parent and nothing further. The grandchild assertion is what keeps a transitive version deferred — a recursive implementation would answer true to it, and 162-CONTEXT.md holds that as a separate decision.
-- =====================================================================
SELECT
  reset_role ();

SELECT
  ok (
    private.is_child_nominee (
      'organization',
      test_id ('org_a'),
      test_id ('candidate_a')
    ),
    'is_child_nominee is true for a candidate nominated under its organization nomination'
  );

SELECT
  ok (
    NOT private.is_child_nominee (
      'organization',
      test_id ('org_b'),
      test_id ('candidate_a')
    ),
    'is_child_nominee is false for a candidate nominated under a different organization'
  );

SELECT
  ok (
    NOT private.is_child_nominee (
      'organization',
      test_id ('org_a'),
      test_id ('candidate_a2')
    ),
    'is_child_nominee is false for a grandchild, asked against the organization'
  );

SELECT
  ok (
    private.is_child_nominee (
      'faction',
      test_id ('faction_a'),
      test_id ('candidate_a2')
    ),
    'is_child_nominee is true for that grandchild, asked against the intervening faction'
  );

SELECT
  ok (
    NOT private.is_child_nominee (
      'alliance',
      test_id ('alliance_a'),
      test_id ('org_a')
    ),
    'is_child_nominee is false for a nomination with no parent'
  );

-- =====================================================================
-- Section 11: the Q2 cell, in the direction the operator ratified (44-45)
--
-- 162-CHECKPOINT-DECISIONS.md section 3 item A-2, answered 2026-09-16: option (D). is_child_nominee gates nomination.read, for any entity grant — NOT entity.read_answers. Section 3.4's third row and 162-USER-RIGHTS.md's Nomination group both say the child hop grants the parent the child's nomination and BASIC data, never the child's answers, so section 3.3's entity.read_answers cells stay literally `own`. These two assertions are the whole difference between the ratified reading and the permissive one.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    '[]'::jsonb
  );

SELECT
  set_test_grants (test_user_id ('organization_a'));

SELECT
  ok (
    user_can (
      'entity',
      test_id ('candidate_a'),
      'nomination.read'
    ),
    'Q2(D): an organization grantee is allowed nomination.read on its child nominee'
  );

SELECT
  ok (
    NOT user_can (
      'entity',
      test_id ('candidate_a'),
      'entity.read_answers'
    ),
    'Q2(D) paired opposite: that grantee is denied entity.read_answers on the same child'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
