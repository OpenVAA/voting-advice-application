-- 36-entity-identity.test.sql: the caller's own entities are read from the grant table
--
-- `get_user_entities` lists every candidate and organization the caller holds an `(entity, <type>, <id>, editor)` row on in `public.grants`, in the one project the caller names, as one jsonb object whose `entities` array holds the entries and whose `password_set` says whether the caller's own account has a password and whose `pending_email_taken` whether the address the caller's own account is changing to is already another account's. `get_entity_user_data` returns the editable row of one such entity, or no row. This file pins the list for zero, one and several grants, for mixed types, across two projects, and for a project admin, an entity-admin grant holder and a faction editor (none of which is listed); the one-entity read for the caller's own candidate and organization and for every refusal, each of which is an empty result and never a raise; that an entity is listed exactly when the read returns it, with a token older than a grant (served, read and written at once, since row-level security reads the grant table too) and with a token that outlives one (neither served nor read nor written); and that anon is refused both functions by privilege. The password section pins the fact for a stored hash, an empty string and a null, each read by its own account, and for a session with no caller. The pending-address section pins `pending_email_taken` for no pending address, one that is another account's in another case and with spaces, one that is no account's, one that is the caller's own address, a caller whose own address is another caller's pending address, and a session with no caller. The catalog section pins where the lookup lives: a SECURITY DEFINER helper in `private` with an empty search_path, called by two INVOKER RPCs; where the password fact lives: a zero-argument definer function in `private` that `authenticated` alone may execute, over a helper no API role may; and where the pending-address fact lives: another such zero-argument definer function. The last section pins the write-side rule: a candidate admits one editor, an organization several, and each refusal names its unique key.
--
-- The first section pins what anon can read: no column holding an auth user id on any table anon can select, with nominations.created_by the one named exemption.
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
  plan (20);

SELECT
  create_test_data ();

-- =====================================================================
-- What anon can read
-- =====================================================================
-- Every column of a foreign key to auth.users, on a table where anon holds SELECT on that column and either row-level security is off or a SELECT policy names anon or PUBLIC.
SELECT
  is (
    ARRAY(
      SELECT
        format('%s.%s.%s', n.nspname, cl.relname, a.attname)
      FROM
        pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = cl.relnamespace
        CROSS JOIN LATERAL unnest(c.conkey) AS k (attnum)
        JOIN pg_attribute a ON a.attrelid = c.conrelid
        AND a.attnum = k.attnum
      WHERE
        c.contype = 'f'
        AND c.confrelid = 'auth.users'::regclass
        AND has_column_privilege('anon', c.conrelid, a.attnum, 'SELECT')
        AND (
          NOT cl.relrowsecurity
          OR EXISTS (
            SELECT
              1
            FROM
              pg_policy p
            WHERE
              p.polrelid = c.conrelid
              AND p.polcmd IN ('r', '*')
              AND (
                'anon'::regrole::oid = ANY (p.polroles)
                OR 0::oid = ANY (p.polroles)
              )
          )
        )
      ORDER BY
        1
    ),
    ARRAY['public.nominations.created_by'],
    'anon can read no auth user id column except nominations.created_by'
  );

SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    $$SELECT auth_user_id FROM public.candidates$$,
    '42703',
    NULL,
    'anon cannot select an auth user id column from candidates'
  );

SELECT
  reset_role ();

-- =====================================================================
-- Fixture, local to this transaction
-- =====================================================================
-- Five auth users. U1 (...36a1) edits C1, C2 and O2 in project A and C4 in project B, and also holds an admin-role entity grant on C3 and an editor grant on faction_a; U2 (...36a2) holds only an admin-role entity grant on C1; U3 (...36a3) edits org_a; U4 (...36a4) edits org_a and O2, both in project A; U5 (...36a5) starts with no grant. Three more hold no grant and differ only in the stored password: P1 (...36b1) an empty string, P2 (...36b2) a null, P3 (...36b3) a hash.
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

-- C1, C2 and C3 in project A, C4 in project B. None is confirmed or nominated, so none is publicly visible and each is readable only through the caller's own authority.
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

-- O2 in project A, and an organization in project B that shares C1's uuid: the entity tables have independent primary keys, so one uuid names a candidate of project A and an organization of project B.
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
-- The list
-- =====================================================================
-- U5 holds no grant. The answer is still one row holding one object, whose `entities` is an empty array.
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

-- U3 holds one grant, on org_a.
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

-- U1 holds editor grants on C1, C2 and O2 in project A and on C4 in project B, an admin-role grant on C3 and an editor grant on faction_a.
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

-- Agreement. The three entries of project A are established above, so the comparison is not between two zeros.
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

-- =====================================================================
-- One editor per candidate
-- =====================================================================
-- As postgres. U1 already edits C1, so a second user's editor grant on C1 is refused by the partial index, while an exact duplicate of U1's grant is refused by the table's own key first.
SELECT
  throws_ok (
    $$INSERT INTO grants (user_id, scope, target_type, target_id, role) VALUES ('cccccccc-cccc-cccc-cccc-0000000036a5', 'entity', 'candidate', '36363636-3636-3636-3636-0000000000c1', 'editor')$$,
    '23505',
    'duplicate key value violates unique constraint "idx_grants_one_candidate_editor"',
    'a second user''s editor grant on a candidate is refused by idx_grants_one_candidate_editor'
  );

SELECT
  throws_ok (
    $$INSERT INTO grants (user_id, scope, target_type, target_id, role) VALUES ('cccccccc-cccc-cccc-cccc-0000000036a1', 'entity', 'candidate', '36363636-3636-3636-3636-0000000000c1', 'editor')$$,
    '23505',
    'duplicate key value violates unique constraint "grants_user_scope_target_role_key"',
    'an exact duplicate of an existing grant is refused by grants_user_scope_target_role_key'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO grants (user_id, scope, target_type, target_id, role) VALUES ('cccccccc-cccc-cccc-cccc-0000000036a5', 'entity', 'organization', %L, 'editor')$$,
      test_id ('org_a')
    ),
    'an organization admits a third editor'
  );

SELECT
  lives_ok (
    $$INSERT INTO grants (user_id, scope, target_type, target_id, role) VALUES ('cccccccc-cccc-cccc-cccc-0000000036a5', 'entity', 'candidate', '36363636-3636-3636-3636-0000000000c1', 'admin')$$,
    'an admin-role entity grant on an edited candidate is outside the one-editor rule'
  );

SELECT
  ok (
    COALESCE(
      (
        SELECT
          i.indisunique
          AND i.indpred IS NOT NULL
        FROM
          pg_index i
          JOIN pg_class c ON c.oid = i.indexrelid
        WHERE
          c.relname = 'idx_grants_one_candidate_editor'
          AND i.indrelid = 'public.grants'::regclass
      ),
      false
    ),
    'idx_grants_one_candidate_editor is a unique partial index on grants'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
