-- 33-entity-type-collision.test.sql: one entity id shared across two entity tables, across projects and within one
--
-- The four entity tables have independent primary keys, and a project admin chooses the `id` of an entity it inserts, so a candidate in project B can carry the same UUID as project A's organization. Entity-scope authority must therefore resolve an id only together with its entity type. This file builds that collision and asserts that every reach rule of `user_can` keeps the two entities apart: the project arms, the entity-grant equality, the global arm, the child-nominee branch, the typed hops `private.entity_project_id` and `private.is_child_nominee`, an entity UPDATE policy, `get_entity_basic_data` and `upsert_answers`. A second collision inside project A, where the project filter cannot separate the two entities, covers `private.entity_has_confirmed_nomination`, `private.nomination_exists_in_contest` and the anon entity SELECT policy.
--
-- Every allow assertion is paired with the deny assertion for the other type of the same id, so a predicate that answers true for both, or false for both, fails here.
--
-- The collision rows, one extra auth user and its entity grant are created inside this transaction rather than in create_test_data (), so no other file's fixture moves.
--
-- Depends on: 00-helpers.test.sql (create_test_data, set_test_user, reset_role, test_id, test_user_id, test_user_grants).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (48);

SELECT
  create_test_data ();

-- =====================================================================
-- Extra fixture, local to this transaction
-- =====================================================================
-- The holder of an entity grant on the colliding candidate. Its grant row is written here as postgres, and its sessions pass an empty grant array so the claim is projected from public.grants alone.
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
    'cccccccc-cccc-cccc-cccc-000000003301',
    '00000000-0000-0000-0000-000000000000',
    'colliding_candidate_editor@test.com',
    crypt ('testpass', gen_salt ('bf')),
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

-- =====================================================================
-- 1. The collision: project B's admin inserts a candidate reusing org_a's id
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
      $$INSERT INTO public.candidates (id, project_id, first_name, last_name) VALUES (%L, %L, 'Colliding', 'Candidate')$$,
      test_id ('org_a'),
      test_id ('project_b')
    ),
    'project B''s admin can insert a candidate in project B whose id is project A''s organization id'
  );

SELECT
  reset_role ();

-- A candidate in project B that shares faction_a's id, for the child-nominee assertions. faction_a is nominated under nomination_org_a; this candidate has no nomination at all.
INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
VALUES
  (
    test_id ('faction_a'),
    test_id ('project_b'),
    'Faction-id',
    'Candidate'
  );

INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-000000003301',
    'entity',
    'candidate',
    test_id ('org_a'),
    'editor'
  );

-- =====================================================================
-- 2. The typed project hop
-- =====================================================================
SELECT
  is (
    private.entity_project_id ('organization', test_id ('org_a')),
    test_id ('project_a'),
    'entity_project_id resolves the shared id as an organization to project A'
  );

SELECT
  is (
    private.entity_project_id ('candidate', test_id ('org_a')),
    test_id ('project_b'),
    'entity_project_id resolves the shared id as a candidate to project B'
  );

SELECT
  is (
    private.entity_project_id ('faction', test_id ('org_a')),
    NULL::uuid,
    'entity_project_id is NULL for an id that is in no table of the named type'
  );

SELECT
  is (
    private.entity_project_id (NULL, test_id ('org_a')),
    NULL::uuid,
    'entity_project_id is NULL when the type is NULL'
  );

-- =====================================================================
-- 3. Project arms: each project's admin reaches only its own entity
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    test_user_grants ('admin_b')
  );

SELECT
  is (
    user_can (
      'entity',
      test_id ('org_a'),
      'entity.edit_answers',
      'organization'
    ),
    false,
    'project B''s admin cannot edit the answers of project A''s organization through the shared id'
  );

SELECT
  is (
    user_can (
      'entity',
      test_id ('org_a'),
      'entity.edit_answers',
      'candidate'
    ),
    true,
    'project B''s admin can edit the answers of its own candidate that carries the shared id'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  is (
    user_can (
      'entity',
      test_id ('org_a'),
      'entity.edit_answers',
      'organization'
    ),
    true,
    'project A''s admin can edit the answers of its own organization'
  );

SELECT
  is (
    user_can (
      'entity',
      test_id ('org_a'),
      'entity.edit_answers',
      'candidate'
    ),
    false,
    'project A''s admin cannot edit the answers of project B''s candidate that carries the shared id'
  );

-- =====================================================================
-- 4. Entity-grant equality is type-qualified
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  is (
    user_can (
      'entity',
      test_id ('org_a'),
      'entity.edit_answers',
      'organization'
    ),
    true,
    'an entity grant on the organization reaches the organization'
  );

SELECT
  is (
    user_can (
      'entity',
      test_id ('org_a'),
      'entity.edit_answers',
      'candidate'
    ),
    false,
    'an entity grant on the organization does not reach the candidate that shares its id'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000003301',
    '[]'::jsonb
  );

SELECT
  is (
    user_can (
      'entity',
      test_id ('org_a'),
      'entity.edit_answers',
      'candidate'
    ),
    true,
    'an entity grant on the candidate reaches the candidate'
  );

SELECT
  is (
    user_can (
      'entity',
      test_id ('org_a'),
      'entity.edit_answers',
      'organization'
    ),
    false,
    'an entity grant on the candidate does not reach the organization that shares its id'
  );

-- =====================================================================
-- 5. A NULL entity type denies for every caller
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('super_admin'),
    test_user_grants ('super_admin')
  );

SELECT
  is (
    user_can (
      'entity',
      test_id ('org_a'),
      'entity.edit_answers',
      'organization'
    ),
    true,
    'the global admin reaches the organization when the type is named'
  );

SELECT
  is (
    user_can (
      'entity',
      test_id ('org_a'),
      'entity.edit_answers'
    ),
    false,
    'the global admin is denied at entity scope when no type is given'
  );

SELECT
  is (
    user_can (
      'entity',
      test_id ('org_a'),
      'entity.edit_answers',
      NULL
    ),
    false,
    'the global admin is denied at entity scope when the type is an explicit NULL'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  is (
    user_can (
      'entity',
      test_id ('org_a'),
      'entity.edit_answers'
    ),
    false,
    'project A''s admin is denied at entity scope when no type is given'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  is (
    user_can (
      'entity',
      test_id ('org_a'),
      'entity.edit_answers'
    ),
    false,
    'the organization''s own entity grantee is denied at entity scope when no type is given'
  );

SELECT
  is (
    user_can (
      'project',
      test_id ('project_a'),
      'project.read_structure'
    ),
    true,
    'a project-scope question needs no type: the entity grantee still reads its project''s structure'
  );

-- =====================================================================
-- 6. The child-nominee branch matches the child by type
-- =====================================================================
SELECT
  is (
    user_can (
      'entity',
      test_id ('faction_a'),
      'nomination.read',
      'faction'
    ),
    true,
    'the organization''s grantee reads the nominations of the faction nominated under it'
  );

SELECT
  is (
    user_can (
      'entity',
      test_id ('faction_a'),
      'nomination.read',
      'candidate'
    ),
    false,
    'the organization''s grantee cannot read the nominations of a candidate that only shares the faction''s id'
  );

SELECT
  reset_role ();

SELECT
  is (
    private.is_child_nominee (
      'organization',
      test_id ('org_a'),
      'faction',
      test_id ('faction_a')
    ),
    true,
    'is_child_nominee finds the faction nominated under the organization'
  );

SELECT
  is (
    private.is_child_nominee (
      'organization',
      test_id ('org_a'),
      'candidate',
      test_id ('faction_a')
    ),
    false,
    'is_child_nominee does not match a child of another type that shares the id'
  );

-- =====================================================================
-- 7. Row-level security: the entity UPDATE policy
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
      $$UPDATE public.organizations SET custom_data = '{"written_by": "admin_b"}'::jsonb WHERE id = %L$$,
      test_id ('org_a')
    ),
    'project B''s admin UPDATE of project A''s organization by the shared id raises no error'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        custom_data
      FROM
        public.organizations
      WHERE
        id = test_id ('org_a')
    ) IS DISTINCT FROM '{"written_by": "admin_b"}'::jsonb,
    true,
    'project B''s admin UPDATE of project A''s organization changed nothing'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    test_user_grants ('admin_b')
  );

SELECT
  lives_ok (
    format(
      $$UPDATE public.candidates SET custom_data = '{"written_by": "admin_b"}'::jsonb WHERE id = %L$$,
      test_id ('org_a')
    ),
    'project B''s admin UPDATE of its own candidate that carries the shared id raises no error'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        custom_data
      FROM
        public.candidates
      WHERE
        id = test_id ('org_a')
    ),
    '{"written_by": "admin_b"}'::jsonb,
    'project B''s admin UPDATE of its own candidate that carries the shared id is applied'
  );

-- =====================================================================
-- 8. get_entity_basic_data probes only the named table
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_b'),
    test_user_grants ('admin_b')
  );

SELECT
  is (
    public.get_entity_basic_data ('organization', test_id ('org_a')),
    NULL::jsonb,
    'project B''s admin gets no basic data for project A''s organization through the shared id'
  );

SELECT
  is (
    public.get_entity_basic_data ('candidate', test_id ('org_a')) ->> 'entity_type',
    'candidate',
    'project B''s admin gets its own candidate''s basic data for the shared id named as a candidate'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  is (
    public.get_entity_basic_data ('organization', test_id ('org_a')) ->> 'entity_type',
    'organization',
    'project A''s admin gets its own organization''s basic data for the shared id named as an organization'
  );

SELECT
  reset_role ();

-- =====================================================================
-- 9. upsert_answers writes only the table its entity type names
-- =====================================================================
-- Known starting answers on both rows. The answer validator accepts only questions of the row's own project, so the candidate (project B) answers question_b and the organization (project A) answers question_a.
UPDATE public.organizations
SET
  answers = jsonb_build_object(
    test_id ('question_a')::text,
    '{"value": 1}'::jsonb
  )
WHERE
  id = test_id ('org_a');

UPDATE public.candidates
SET
  answers = '{}'::jsonb
WHERE
  id = test_id ('org_a');

-- The candidate's own editor writes the candidate's answers.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-000000003301',
    '[]'::jsonb
  );

SELECT
  is (
    public.upsert_answers (
      'candidate',
      test_id ('org_a'),
      jsonb_build_object(
        test_id ('question_b')::text,
        '{"value": 1}'::jsonb
      ),
      false
    ),
    jsonb_build_object(
      test_id ('question_b')::text,
      '{"value": 1}'::jsonb
    ),
    'the candidate''s editor writes the candidate''s answers through the shared id named as a candidate'
  );

-- The same editor naming the organization reaches no row it may update.
SELECT
  throws_ok (
    format(
      $$SELECT public.upsert_answers ('organization', %L, jsonb_build_object(%L, '{"value": 2}'::jsonb), false)$$,
      test_id ('org_a'),
      test_id ('question_a')::text
    ),
    'P0001',
    format(
      'Entity not found or access denied: %s',
      test_id ('org_a')
    ),
    'the candidate''s editor cannot write the organization''s answers through the shared id named as an organization'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        answers
      FROM
        public.candidates
      WHERE
        id = test_id ('org_a')
    ),
    jsonb_build_object(
      test_id ('question_b')::text,
      '{"value": 1}'::jsonb
    ),
    'the candidate''s answers hold the candidate write'
  );

SELECT
  is (
    (
      SELECT
        answers
      FROM
        public.organizations
      WHERE
        id = test_id ('org_a')
    ),
    jsonb_build_object(
      test_id ('question_a')::text,
      '{"value": 1}'::jsonb
    ),
    'the organization''s answers are untouched by the candidate write and by the refused organization write'
  );

-- The global admin may edit both rows, so only the type decides which one a write reaches.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('super_admin'),
    test_user_grants ('super_admin')
  );

SELECT
  is (
    public.upsert_answers (
      'organization',
      test_id ('org_a'),
      jsonb_build_object(
        test_id ('question_a')::text,
        '{"value": 2}'::jsonb
      ),
      false
    ),
    jsonb_build_object(
      test_id ('question_a')::text,
      '{"value": 2}'::jsonb
    ),
    'the global admin''s merge write named as an organization reaches the organization'
  );

SELECT
  is (
    public.upsert_answers (
      'candidate',
      test_id ('org_a'),
      jsonb_build_object(
        test_id ('question_b')::text,
        '{"value": 2}'::jsonb
      ),
      true
    ),
    jsonb_build_object(
      test_id ('question_b')::text,
      '{"value": 2}'::jsonb
    ),
    'the global admin''s overwrite named as a candidate reaches the candidate'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        answers
      FROM
        public.organizations
      WHERE
        id = test_id ('org_a')
    ),
    jsonb_build_object(
      test_id ('question_a')::text,
      '{"value": 2}'::jsonb
    ),
    'the organization holds the organization write and is untouched by the candidate overwrite'
  );

SELECT
  is (
    (
      SELECT
        answers
      FROM
        public.candidates
      WHERE
        id = test_id ('org_a')
    ),
    jsonb_build_object(
      test_id ('question_b')::text,
      '{"value": 2}'::jsonb
    ),
    'the candidate holds the candidate overwrite and is untouched by the organization write'
  );

-- A type whose table has no answers column, or no type at all, raises before any table is written.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('super_admin'),
    test_user_grants ('super_admin')
  );

SELECT
  throws_ok (
    format(
      $$SELECT public.upsert_answers ('faction', %L, '{}'::jsonb, false)$$,
      test_id ('faction_a')
    ),
    'P0001',
    'Entity type faction has no answers',
    'upsert_answers raises for a faction, which carries no answers'
  );

SELECT
  throws_ok (
    format(
      $$SELECT public.upsert_answers ('alliance', %L, '{}'::jsonb, false)$$,
      test_id ('org_a')
    ),
    'P0001',
    'Entity type alliance has no answers',
    'upsert_answers raises for an alliance, which carries no answers'
  );

SELECT
  throws_ok (
    format(
      $$SELECT public.upsert_answers (NULL, %L, '{}'::jsonb, false)$$,
      test_id ('org_a')
    ),
    'P0001',
    'Entity type <NULL> has no answers',
    'upsert_answers raises when no entity type is given'
  );

-- The faction's id is shared by a candidate in project B, so the faction refusal is not a missing-row outcome.
SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        answers
      FROM
        public.candidates
      WHERE
        id = test_id ('faction_a')
    ),
    '{}'::jsonb,
    'the candidate sharing the faction''s id is untouched by the refused faction write'
  );

-- =====================================================================
-- 10. A same-project collision: the nomination helpers match by type
-- =====================================================================
-- Project A's candidate reusing alliance_a's id. It is confirmed, has accepted the terms of use and has no nomination, while alliance_a holds the confirmed nomination_alliance_a. The project filter cannot separate the two, so only the entity_type conjunct of the nomination helpers does.
INSERT INTO
  public.candidates (
    id,
    project_id,
    first_name,
    last_name,
    terms_of_use_accepted,
    confirmed
  )
VALUES
  (
    test_id ('alliance_a'),
    test_id ('project_a'),
    'Alliance-id',
    'Candidate',
    now() - interval '1 day',
    true
  );

SELECT
  is (
    private.entity_has_confirmed_nomination (
      'alliance',
      test_id ('alliance_a'),
      test_id ('project_a')
    ),
    true,
    'entity_has_confirmed_nomination finds the alliance''s confirmed nomination'
  );

SELECT
  is (
    private.entity_has_confirmed_nomination (
      'candidate',
      test_id ('alliance_a'),
      test_id ('project_a')
    ),
    false,
    'entity_has_confirmed_nomination does not credit the alliance''s nomination to a candidate of the same project that shares its id'
  );

SELECT
  is (
    private.nomination_exists_in_contest (
      'alliance',
      test_id ('alliance_a'),
      test_id ('election_a'),
      test_id ('constituency_a'),
      1
    ),
    true,
    'nomination_exists_in_contest finds the alliance nominated at its contest'
  );

SELECT
  is (
    private.nomination_exists_in_contest (
      'candidate',
      test_id ('alliance_a'),
      test_id ('election_a'),
      test_id ('constituency_a'),
      1
    ),
    false,
    'nomination_exists_in_contest does not match a candidate of the same project that shares the alliance''s id'
  );

SELECT
  set_test_user ('anon');

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        public.alliances
      WHERE
        id = test_id ('alliance_a')
    )::integer,
    1,
    'anon sees the nominated alliance'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        public.candidates
      WHERE
        id = test_id ('alliance_a')
    )::integer,
    0,
    'anon does not see the unnominated candidate that shares the alliance''s id'
  );

SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
