-- 36-entity-identity.test.sql: the caller's own entity is read from the grant table
--
-- `get_candidate_user_data` answers "which entity am I" from the caller's own `(entity, <type>, <id>, editor)` rows in `public.grants`, in the one project the caller names. This file pins that answer for zero, one and two such grants, across two projects, for a project admin and an entity-admin grant holder (both resolve to nothing), for anon, and in both the candidate and the organization arm. Two editor grants of the asked type in one project raise P0001 with the hint ERR_ENTITY_IDENTITY_AMBIGUOUS, and the answer comes from the table rather than the caller's token. The catalog section pins where the lookup lives: a SECURITY DEFINER helper in `private` with an empty search_path, called by an INVOKER RPC.
--
-- Every impersonation passes an empty grant array, so each claim is projected from the rows this file writes and nothing else is seeded.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_seed_identity_grants).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (13);

SELECT
  create_test_data ();

-- =====================================================================
-- Fixture, local to this transaction
-- =====================================================================
-- Five auth users: U1 (...36a1) edits C1 in project A and C4 in project B; U2 (...36a2) holds only an admin-role entity grant on C1; U3 (...36a3) edits org_a; U4 (...36a4) edits org_a and O2, both in project A; U5 (...36a5) starts with no grant.
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
    'cccccccc-cccc-cccc-cccc-0000000036a1',
    '00000000-0000-0000-0000-000000000000',
    'identity_u1@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000036a2',
    '00000000-0000-0000-0000-000000000000',
    'identity_u2@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000036a3',
    '00000000-0000-0000-0000-000000000000',
    'identity_u3@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000036a4',
    '00000000-0000-0000-0000-000000000000',
    'identity_u4@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000036a5',
    '00000000-0000-0000-0000-000000000000',
    'identity_u5@test.com',
    crypt ('testpass', gen_salt ('bf')),
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

-- C1 and C2 in project A, C4 in project B.
INSERT INTO
  candidates (id, project_id, first_name, last_name)
VALUES
  (
    '36363636-3636-3636-3636-0000000000c1',
    test_id ('project_a'),
    'Una',
    'One'
  ),
  (
    '36363636-3636-3636-3636-0000000000c2',
    test_id ('project_a'),
    'Una',
    'Two'
  ),
  (
    '36363636-3636-3636-3636-0000000000c4',
    test_id ('project_b'),
    'Una',
    'Four'
  );

-- O2 in project A.
INSERT INTO
  organizations (id, project_id, name)
VALUES
  (
    '36363636-3636-3636-3636-0000000000a2',
    test_id ('project_a'),
    '{"en":"Org A2"}'::jsonb
  );

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-0000000036a1',
    'entity',
    'candidate',
    '36363636-3636-3636-3636-0000000000c1',
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000036a1',
    'entity',
    'candidate',
    '36363636-3636-3636-3636-0000000000c4',
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000036a2',
    'entity',
    'candidate',
    '36363636-3636-3636-3636-0000000000c1',
    'admin'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000036a3',
    'entity',
    'organization',
    test_id ('org_a'),
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000036a4',
    'entity',
    'organization',
    test_id ('org_a'),
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000036a4',
    'entity',
    'organization',
    '36363636-3636-3636-3636-0000000000a2',
    'editor'
  );

SELECT
  test_seed_identity_grants ('admin_a');

-- Returns the HINT of the error a statement raises, or NULL when it raises nothing.
CREATE FUNCTION pg_temp.hint_of (p_sql text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_hint text;
BEGIN
  EXECUTE p_sql;
  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_hint = PG_EXCEPTION_HINT;
    RETURN v_hint;
END;
$$;

-- =====================================================================
-- Who the caller is
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036a1',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        string_agg(id::text, ',')
      FROM
        public.get_candidate_user_data (test_id ('project_a'))
    ),
    '36363636-3636-3636-3636-0000000000c1',
    'one candidate-editor grant in project A resolves to exactly that candidate'
  );

SELECT
  is (
    (
      SELECT
        string_agg(id::text, ',')
      FROM
        public.get_candidate_user_data (test_id ('project_b'))
    ),
    '36363636-3636-3636-3636-0000000000c4',
    'asked for project B, the same caller resolves to its project B candidate'
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
  is (
    (
      SELECT
        count(*)
      FROM
        public.get_candidate_user_data (test_id ('project_a'))
    ),
    0::bigint,
    'a project admin resolves to no candidate'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036a2',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        public.get_candidate_user_data (test_id ('project_a'))
    ),
    0::bigint,
    'an admin-role entity grant on a candidate resolves to no candidate'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036a3',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        string_agg(id::text, ',')
      FROM
        public.get_candidate_user_data (test_id ('project_a'), 'organization')
    ),
    test_id ('org_a')::text,
    'an organization-editor grant resolves to that organization in the organization arm'
  );

SELECT
  reset_role ();

SELECT
  set_test_user ('anon');

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        public.get_candidate_user_data (test_id ('project_a'))
    ),
    0::bigint,
    'anon resolves to no candidate'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036a4',
    '[]'::jsonb
  );

SELECT
  throws_ok (
    format(
      $$SELECT * FROM public.get_candidate_user_data(%L, 'organization')$$,
      test_id ('project_a')
    ),
    'P0001',
    'the caller holds an editor grant on more than one organization in this project',
    'two organization-editor grants in one project raise'
  );

SELECT
  reset_role ();

-- The claim is built while U1 holds one candidate-editor grant in project A; the second grant is written afterwards and the claim is not rebuilt.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036a1',
    '[]'::jsonb
  );

SELECT
  reset_role ();

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-0000000036a1',
    'entity',
    'candidate',
    '36363636-3636-3636-3636-0000000000c2',
    'editor'
  );

SELECT
  set_config('role', 'authenticated', true);

SELECT
  throws_ok (
    format(
      $$SELECT * FROM public.get_candidate_user_data(%L)$$,
      test_id ('project_a')
    ),
    'P0001',
    'the caller holds an editor grant on more than one candidate in this project',
    'a second candidate-editor grant in the table raises even though the token predates it'
  );

SELECT
  is (
    pg_temp.hint_of (
      format(
        $$SELECT * FROM public.get_candidate_user_data(%L)$$,
        test_id ('project_a')
      )
    ),
    'ERR_ENTITY_IDENTITY_AMBIGUOUS',
    'the ambiguity error carries the hint ERR_ENTITY_IDENTITY_AMBIGUOUS'
  );

SELECT
  reset_role ();

-- =====================================================================
-- Catalog
-- =====================================================================
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'caller_entity_ids'
    ),
    0::bigint,
    'caller_entity_ids is not a public function, so PostgREST does not publish it'
  );

SELECT
  ok (
    COALESCE(
      (
        SELECT
          p.prosecdef
          AND 'search_path=""' = ANY (p.proconfig)
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE
          n.nspname = 'private'
          AND p.proname = 'caller_entity_ids'
      ),
      false
    ),
    'private.caller_entity_ids is SECURITY DEFINER with an empty search_path'
  );

SELECT
  ok (
    COALESCE(
      (
        SELECT
          NOT p.prosecdef
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE
          n.nspname = 'public'
          AND p.proname = 'get_candidate_user_data'
      ),
      false
    ),
    'get_candidate_user_data runs with the caller''s rights'
  );

SELECT
  ok (
    EXISTS (
      SELECT
        1
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        CROSS JOIN LATERAL aclexplode(p.proacl) AS a
      WHERE
        n.nspname = 'private'
        AND p.proname = 'caller_entity_ids'
        AND a.grantee = 'authenticated'::regrole
        AND a.privilege_type = 'EXECUTE'
    ),
    'authenticated holds the private schema''s stated EXECUTE grant on private.caller_entity_ids'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
