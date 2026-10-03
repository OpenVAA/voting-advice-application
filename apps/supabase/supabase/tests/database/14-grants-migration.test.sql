-- 14-grants-migration.test.sql: the grants claim is the projection of public.grants
--
-- custom_access_token_hook projects public.grants into the token's `grants` claim, and a mismatch fails silently in both directions. A claim emitted under a wrong key denies EVERYONE, and reads as an empty permission set rather than as an error. A projection that misses a class of identity denies exactly that class, while every test written around the other classes stays green. So this file pins the emitted claim as SET-EQUAL to test_grants_claim, the fixture's projection helper; pins the fixture's two-source agreement assertion firing on a disagreement; pins the seeded identities holding their grant rows; and pins a grant being deleted with its target.
--
-- THE DECLARED ASSERTION COUNT BELOW IS EXPLICIT and deliberately so: a pgTAP file that asserts nothing exits 0 under no_plan, which is exactly the vacuous pass a permission test must not be able to produce. The declaration below is the only occurrence of that call in this file — a mention of it in prose above would shadow the real declaration for the gate that greps the first occurrence and read as zero.
--
-- Depends on: 00-helpers.test.sql (create_test_data, set_test_user, test_grants_claim, test_seed_fixture_grants, test_id, test_user_id, test_user_grants, reset_role).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in the same session
DROP TABLE IF EXISTS __tcache__;

DROP TABLE IF EXISTS mig_backfill_image;

DROP TABLE IF EXISTS mig_oracle_image;

SELECT
  plan (21);

SELECT
  create_test_data ();

-- =====================================================================
-- Extra fixture, local to this transaction
--
-- One auth user holding no grant row at all: the grant-less identity the claim-shape assertions need, and the identity section 7's agreement assertion is asked about.
-- =====================================================================
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
    'cccccccc-cccc-cccc-cccc-0000000000d1',
    '00000000-0000-0000-0000-000000000000',
    'grantless_d1@test.com',
    crypt ('testpass', gen_salt ('bf')),
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

-- The eight fixture identities' authority rows. Without them the hook has nothing to project and section 3's non-vacuity assertion reddens.
SELECT
  test_seed_fixture_grants ();

-- =====================================================================
-- Section 1: the entity role level (1)
--
-- grant_role_type has two members, admin and editor, and every entity user type maps to editor, so the fixture holds no entity-scope grant of any other role. That an entity grant's target type and target agree is carried by grants_entity_scope_target_type_check, asserted from the catalogue in 10-schema-migrations.test.sql.
-- =====================================================================
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        public.grants
      WHERE
        scope = 'entity'
        AND role <> 'editor'
    ),
    0::bigint,
    'no entity-scope grant carries a role other than editor'
  );

-- =====================================================================
-- Section 2: the hook emits the grants claim, and only it (2-3)
-- =====================================================================
SELECT
  ok (
    (
      SELECT
        public.custom_access_token_hook (
          jsonb_build_object(
            'user_id',
            test_user_id ('admin_a')::text,
            'claims',
            '{}'::jsonb
          )
        ) -> 'claims'
    ) ? 'grants',
    'custom_access_token_hook emits a grants claim'
  );

SELECT
  ok (
    NOT (
      (
        SELECT
          public.custom_access_token_hook (
            jsonb_build_object(
              'user_id',
              test_user_id ('admin_a')::text,
              'claims',
              '{}'::jsonb
            )
          ) -> 'claims'
      ) ? 'user_roles'
    ),
    'and emits no user_roles key beside it: one vocabulary reaches the database, not two'
  );

-- =====================================================================
-- Section 3: the emitted array IS the projection, in both directions (4-7)
--
-- A divergence across this boundary is a silent TOTAL DENIAL rather than an error. Asserted as a SET in both directions with equal cardinality rather than as string equality: jsonb_agg defines no element order and a reordering that means nothing must not redden.
-- =====================================================================
SELECT
  is_empty (
    $q$
    SELECT jsonb_array_elements(public.custom_access_token_hook(jsonb_build_object('user_id', test_user_id('admin_a')::text, 'claims', '{}'::jsonb)) -> 'claims' -> 'grants')
    EXCEPT
    SELECT jsonb_array_elements(public.test_grants_claim(test_user_id('admin_a')))
    $q$,
    'every entry the hook emits for a project admin is an entry test_grants_claim produces'
  );

SELECT
  is_empty (
    $q$
    SELECT jsonb_array_elements(public.test_grants_claim(test_user_id('admin_a')))
    EXCEPT
    SELECT jsonb_array_elements(public.custom_access_token_hook(jsonb_build_object('user_id', test_user_id('admin_a')::text, 'claims', '{}'::jsonb)) -> 'claims' -> 'grants')
    $q$,
    'and every entry test_grants_claim produces is an entry the hook emits'
  );

SELECT
  is (
    (
      SELECT
        jsonb_array_length(
          public.custom_access_token_hook (
            jsonb_build_object(
              'user_id',
              test_user_id ('admin_a')::text,
              'claims',
              '{}'::jsonb
            )
          ) -> 'claims' -> 'grants'
        )
    ),
    (
      SELECT
        jsonb_array_length(
          public.test_grants_claim (test_user_id ('admin_a'))
        )
    ),
    'with equal cardinality, so a duplicated entry on one side cannot pass two empty differences'
  );

SELECT
  cmp_ok (
    (
      SELECT
        jsonb_array_length(
          public.custom_access_token_hook (
            jsonb_build_object(
              'user_id',
              test_user_id ('admin_a')::text,
              'claims',
              '{}'::jsonb
            )
          ) -> 'claims' -> 'grants'
        )
    ),
    '>=',
    1,
    'and the emitted array is non-empty for an identity that holds a grant, so the equalities above are not two empty sets agreeing'
  );

-- =====================================================================
-- Section 4: an identity holding NO grant gets an empty array (8-10)
--
-- Three different states, and they carry three assertions: a missing key, a null, and an empty array are not the same thing, and only the third is what a grant-less identity should receive.
-- =====================================================================
SELECT
  ok (
    (
      SELECT
        public.custom_access_token_hook (
          jsonb_build_object(
            'user_id',
            'cccccccc-cccc-cccc-cccc-0000000000d1',
            'claims',
            '{}'::jsonb
          )
        ) -> 'claims'
    ) ? 'grants',
    'a grant-less identity still receives the grants key rather than no key at all'
  );

SELECT
  is (
    (
      SELECT
        jsonb_typeof(
          public.custom_access_token_hook (
            jsonb_build_object(
              'user_id',
              'cccccccc-cccc-cccc-cccc-0000000000d1',
              'claims',
              '{}'::jsonb
            )
          ) -> 'claims' -> 'grants'
        )
    ),
    'array',
    'and the value is an array rather than a null'
  );

SELECT
  is (
    (
      SELECT
        jsonb_array_length(
          public.custom_access_token_hook (
            jsonb_build_object(
              'user_id',
              'cccccccc-cccc-cccc-cccc-0000000000d1',
              'claims',
              '{}'::jsonb
            )
          ) -> 'claims' -> 'grants'
        )
    ),
    0,
    'and it is empty, which is also what test_grants_claim answers for that identity'
  );

-- =====================================================================
-- Section 5: no claim-reading fallback exists, asserted per name (11-12)
--
-- Each name is asserted absent on its own and at ANY signature, so either one appearing reddens, alone or together with the other. That the hook emits a `grants` key is asserted in section 2 above.
-- =====================================================================
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'has_role_legacy_claim'
    ),
    0,
    'has_role_legacy_claim does not exist at any signature (asserted alone, so it cannot appear under cover of the other name)'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'can_access_project_legacy_claim'
    ),
    0,
    'and can_access_project_legacy_claim does not exist at any signature either'
  );

-- =====================================================================
-- Section 6: the whole path, end to end (13-14)
--
-- A row in public.grants, projected by the same projection the hook performs into the session claim by set_test_user, read by user_can, consulted by a real policy. authenticated_select_projects is a bare user_can call with no other path, which is why it is the one asked here.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
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
    ),
    1::bigint,
    'a project admin reads their own project row: grant row -> hook projection -> session claim -> user_can -> a real policy'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000d1',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        projects
    ),
    0::bigint,
    'and a grant-less identity reads none of them, so the assertion above is the policy answering and not the table being readable'
  );

SELECT
  reset_role ();

-- =====================================================================
-- Section 7: the fixture's two-source agreement assertion (15)
--
-- set_test_user's third parameter is an assertion as well as an input: a non-empty array is compared, as a set, with the table's projection of that identity, and any disagreement between the fixture's written-down authority map and the table raises -- an arm that has drifted, an arm granting what the table does not, a row the table carries that no call site claimed.
--
-- The identity below holds no grant row at all, so the array it is handed is maximally in disagreement with the table's empty projection.
-- =====================================================================
SELECT
  throws_like (
    $q$SELECT set_test_user('authenticated', 'cccccccc-cccc-cccc-cccc-0000000000d1'::uuid, '[{"scope": "global", "target_type": null, "target_id": null, "role": "admin"}]'::jsonb)$q$,
    '%was handed a grant array that is not set-equal to that identity%s rows in public.grants%',
    'a grant array for an identity that holds no grant rows disagrees with the table and raises a named exception'
  );

-- =====================================================================
-- Section 8: seed parity -- the reset stack a developer meets first (16-18)
--
-- The fixture is not the only thing anyone runs. seed.sql's two grant rows are committed data that this transaction sits on top of, so they are the real image of the real reset path, and the requirement that a `yarn db:reset` stack is not blank is assertable right here rather than only by a shell command outside the estate.
-- =====================================================================
SELECT
  is (
    (
      SELECT
        string_agg(
          g.scope::text || '/' || COALESCE(g.target_type::text, '-') || '/' || COALESCE(g.target_id::text, '-') || '/' || g.role::text,
          ','
        )
      FROM
        public.grants g
      WHERE
        g.user_id = '00000000-0000-0000-0000-000000000010'
    ),
    'project/-/00000000-0000-0000-0000-000000000001/admin',
    'the seeded admin holds exactly one grant, a project-scope admin grant on the seeded project'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          g.scope::text || '/' || COALESCE(g.target_type::text, '-') || '/' || COALESCE(g.target_id::text, '-') || '/' || g.role::text,
          ','
        )
      FROM
        public.grants g
      WHERE
        g.user_id = '00000000-0000-0000-0000-000000000011'
    ),
    'entity/candidate/00000000-0000-0000-0000-000000000020/editor',
    'and the seeded candidate holds exactly one entity grant on its own candidate row'
  );

-- The array is the seeded admin's ACTUAL grant row, not a token non-empty value: the two-source agreement assertion compares it as a set against the table's projection of that identity, so a placeholder would raise.
SELECT
  set_test_user (
    'authenticated',
    '00000000-0000-0000-0000-000000000010',
    '[{"scope": "project", "target_type": null, "target_id": "00000000-0000-0000-0000-000000000001", "role": "admin"}]'::jsonb
  );

SELECT
  ok (
    user_can (
      'project',
      '00000000-0000-0000-0000-000000000001',
      'project.edit_project_settings'
    ),
    'and a session carrying the emitted claim for the seeded admin may edit the seeded project settings: the reset stack is not blank'
  );

SELECT
  reset_role ();

SELECT
  reset_role ();

-- =====================================================================
-- Section 9: a grant does not outlive its target (19-21)
--
-- `grants.target_id` has no foreign key, so without the cleanup_grants_on_delete triggers a deleted candidate's or project's grants would stay behind, projected into every token and ready to re-attach to a recreated row. The set_test_user call below writes the fixture's grant rows (candidate_a's entity grant, admin_a's project grant) again, a no-op when they are already there, and is undone at once.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  reset_role ();

SELECT
  ok (
    EXISTS (
      SELECT
        1
      FROM
        grants
      WHERE
        scope = 'entity'
        AND target_id = test_id ('candidate_a')
    )
    AND EXISTS (
      SELECT
        1
      FROM
        grants
      WHERE
        scope = 'project'
        AND target_id = test_id ('project_a')
    ),
    'control: the fixture holds an entity grant on candidate_a and a project grant on project_a before any delete'
  );

DELETE FROM nominations
WHERE
  candidate_id = test_id ('candidate_a');

DELETE FROM candidates
WHERE
  id = test_id ('candidate_a');

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        grants
      WHERE
        scope = 'entity'
        AND target_id = test_id ('candidate_a')
    ),
    0,
    'deleting a candidate deletes the entity grants that targeted it'
  );

DELETE FROM projects
WHERE
  id = test_id ('project_a');

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        grants
      WHERE
        scope = 'project'
        AND target_id = test_id ('project_a')
    ),
    0,
    'deleting a project deletes the project grants that targeted it'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
