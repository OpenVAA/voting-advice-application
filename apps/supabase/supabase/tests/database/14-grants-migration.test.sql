-- 14-grants-migration.test.sql: the claim switch, and the migration that has to be complete before it
--
-- 162-06 retires the claim key every real token carried and makes custom_access_token_hook project public.grants instead. The failure mode is silent in both directions and loud in neither. A claim emitted under a wrong key denies EVERYONE, and reads as an empty permission set rather than as an error. A backfill that misses a class of identity denies exactly that class, while every test written around the other classes stays green. So the evidence here is built the other way round: the emitted claim is asserted SET-EQUAL to test_grants_claim, the projection helper 162-04 installed for exactly this comparison, The backfill-image half of this file's original evidence -- the mapping compared in both directions against 162-05's independently written oracle, its completeness, its idempotency, and the auth_user_id population this repository contains no natural example of -- was RETIRED BY 162-15 together with both of its subjects, which that plan deleted.
--
-- THE DECLARED ASSERTION COUNT BELOW IS EXPLICIT and deliberately so: a pgTAP file that asserts nothing exits 0 under no_plan, which is exactly the vacuous pass a permission test must not be able to produce. The declaration below is the only occurrence of that call in this file — a mention of it in prose above would shadow the real declaration for the gate that greps the first occurrence and read as zero.
--
-- pgTAP SHIPS ITS OWN has_role(). It asserts that a DATABASE ROLE exists and returns text, and with the estate's search_path it shadows ours, so an unqualified one-argument call fails with "function ok(text, unknown) does not exist" rather than as a failed assertion. Every reference to our predicate here is schema-qualified for that reason.
--
-- Depends on: 00-helpers.test.sql (create_test_data, set_test_user, test_grants_claim,
--             test_id, test_user_id, test_user_grants, reset_role)
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
-- One auth user holding no role row at all: the grant-less identity the claim-shape assertions need, and the identity the set_test_user tripwire is asked about.
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

-- The eight fixture identities' authority rows. 162-15 REPLACED THE CALL THAT USED TO DO THIS: until that plan the backfill was invoked here, in the section that compared its image against 162-05's oracle, and every later section rode on the rows it left behind. Both the backfill and the oracle read the retired role table and both are gone; this is the same seeding through the map that replaced them, and without it the hook has nothing to project and section 6's non-vacuity assertion reddens.
SELECT
  test_seed_fixture_grants ();

-- =====================================================================
-- Section 3: the entity role level (9)
--
-- B6's accepted mapping table spells the entity role with a third level. D-02 amended the vocabulary to two, section 3.1 maps every entity user type to `editor`, and grant_role_type declares no third member -- so the word that table used does not exist.
--
-- 162-15 RETIRED THE SECOND ASSERTION OF THIS SECTION WITH ITS SUBJECT. It joined public.grants to public.user_roles to assert that every entity grant pointed at the entity class its ROLE ROW named; there are no role rows and no such table. Its property -- that the discriminator and the target agree -- now has no second source to agree with, and is carried instead by grants_entity_scope_target_type_check, asserted from the catalogue in 10-schema-migrations.test.sql.
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
-- Section 5: the hook emits the grants claim, and only it (13-14)
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
    'and emits no retired claim key beside it: one vocabulary reaches the database, not two'
  );

-- =====================================================================
-- Section 6: the emitted array IS the projection, in both directions (15-18)
--
-- 162-04 built test_grants_claim for exactly this comparison and recorded that a divergence across this boundary is a silent TOTAL DENIAL rather than an error. Asserted as a SET in both directions with equal cardinality rather than as string equality: jsonb_agg defines no element order and a reordering that means nothing must not redden.
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
-- Section 7: an identity holding NO grant gets an empty array (19-21)
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
-- Section 8: RETIRED BY 162-15, five assertions, class by class
--
-- 22 asserted that neither transitional fallback function survives in pg_proc. SUCCESSOR: 24-legacy-removal.test.sql section 2, which asserts each of the two names SEPARATELY rather than as one count of zero over both -- a count is satisfied by one returning while the other stays away only if the count is read as a sum, and the per-name form removes that reading entirely.
-- 23 and 24 asserted that neither shim's body named a deleted function. REASON: their subject is the two shim bodies, which 162-15 deleted. A prosrc predicate over a function that does not exist answers NULL, not true.
-- 25 and 26 pinned each shim's exact argument string, because a change there would break the one-argument call sites at query time rather than at deploy time. REASON: their subject is gone, and 25's pinned string names both retired enums, so it could not survive them in any form. SUCCESSOR for the property that no such predicate returns: 24-legacy-removal.test.sql section 1 assertions 4 and 5, which assert each shim absent at ANY signature -- strictly stronger than pinning one signature, which a resurrection in a different spelling would satisfy.
-- =====================================================================
-- =====================================================================
-- Section 9: 162-05's transitional fallback is absent, asserted per side (27-28)
--
-- 162-05 WROTE THIS AS A BICONDITIONAL and 162-15 REPLACED IT WITH TWO UNCONDITIONAL ABSENCE ASSERTIONS, ONE PER NAME (task 2 Q2 = A). The biconditional said: the two transitional functions exist IF AND ONLY IF the hook emits no grants key. 162-06 made both sides false, and from that commit onward it could not fail for any reachable reason -- a biconditional with both sides false is SATISFIED BY BOTH SIDES COMING BACK TOGETHER, which is precisely the resurrection it was installed to prevent.
--
-- The replacement is strictly stronger: each name is asserted absent on its own, so either half returning alone reddens, and so does both halves returning together. It is asserted at ANY signature rather than at the one the deleted bodies happened to carry.
--
-- Its other side is not dropped: that the hook emits a `grants` key is asserted unconditionally in section 5 above, where it is the subject rather than a term in a conditional.
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
    'has_role_legacy_claim does not exist at any signature (the retired-claim fallback 162-05 installed and 162-06 deleted; asserted alone so its half cannot return under cover of the other)'
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
-- Section 10: the whole path, end to end (29-30)
--
-- A row in public.grants, projected by the same projection the hook performs into the session claim by set_test_user, read by user_can, consulted by a real policy. authenticated_select_projects is the policy 162-04 converted to a bare user_can call with no legacy path, which is why it is the one asked here.
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
-- Section 11: the fixture's two-source agreement assertion (31)
--
-- set_test_user's third parameter cannot be removed — an argument-list change is an overload and every call site would bind ambiguously — so it is given work instead. 162-15 REPLACED THE TRIPWIRE THIS SECTION USED TO ASSERT WITH SOMETHING STRICTLY STRONGER, and kept the case the tripwire caught as the case asserted here. The tripwire fired on one condition: a non-empty array for an identity that ends up holding NO grant rows. The agreement assertion fires on that condition AND on every other disagreement between the fixture's written-down authority map and the table — an arm that has drifted, an arm granting what the table does not, a row the table carries that no call site claimed.
--
-- The identity below holds no grant row at all, so the array it is handed is maximally in disagreement with the table's empty projection, which is the tripwire's own case asserted through the stronger predicate. The array is grant-shaped rather than role-shaped because the retired vocabulary it used to be spelled in is gone.
-- =====================================================================
SELECT
  throws_like (
    $q$SELECT set_test_user('authenticated', 'cccccccc-cccc-cccc-cccc-0000000000d1'::uuid, '[{"scope": "global", "target_type": null, "target_id": null, "role": "admin"}]'::jsonb)$q$,
    '%was handed a grant array that is not set-equal to that identity%s rows in public.grants%',
    'a grant array for an identity that holds no grant rows disagrees with the table and raises a named exception'
  );

-- =====================================================================
-- Section 14: seed parity — the reset stack a developer meets first (47-49)
--
-- The fixture is not the only thing anyone runs. seed.sql's two role rows are committed data that this transaction sits on top of, so their grants are the real image of the real reset path, and D-19's requirement — that a `yarn db:reset` stack is not blank — is assertable right here rather than only by a shell command outside the estate.
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

-- The array is the seeded admin's ACTUAL grant row, not a token non-empty value: under 162-15's two-source agreement assertion it is compared as a set against the table's projection of that identity, so a placeholder would raise. seed.sql writes this row directly from 162-15 onward.
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
-- IN-02: a grant does not outlive its target
--
-- `grants.target_id` has no foreign key, so without a delete trigger a deleted candidate's or project's grants stayed behind, projected into every token and ready to re-attach to a recreated row. create_test_data() seeds the fixture's grants (candidate_a's entity grant, admin_a's project grant) through set_test_user, which is called first for that write alone.
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
    'IN-02 control: the fixture holds an entity grant on candidate_a and a project grant on project_a before any delete'
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
    'IN-02: deleting a candidate deletes the entity grants that targeted it'
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
    'IN-02: deleting a project deletes the project grants that targeted it'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
