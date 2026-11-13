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
  plan (86);

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
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000036b1',
    '00000000-0000-0000-0000-000000000000',
    'identity_p1@test.com',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000036b2',
    '00000000-0000-0000-0000-000000000000',
    'identity_p2@test.com',
    NULL,
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000036b3',
    '00000000-0000-0000-0000-000000000000',
    'identity_p3@test.com',
    '$2a$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz0123456',
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
    '36363636-3636-3636-3636-0000000000c3',
    test_id ('project_a'),
    'Una',
    'Three'
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
  ),
  (
    '36363636-3636-3636-3636-0000000000c1',
    test_id ('project_b'),
    '{"en":"Org B sharing an id"}'::jsonb
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
    'cccccccc-cccc-cccc-cccc-0000000036a1',
    'entity',
    'candidate',
    '36363636-3636-3636-3636-0000000000c2',
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000036a1',
    'entity',
    'organization',
    '36363636-3636-3636-3636-0000000000a2',
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000036a1',
    'entity',
    'candidate',
    '36363636-3636-3636-3636-0000000000c3',
    'admin'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000036a1',
    'entity',
    'faction',
    test_id ('faction_a'),
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

-- The entities public.get_user_entities lists for the caller in one project, as `type:id` pairs in the order listed.
CREATE FUNCTION pg_temp.listed (p_project_id uuid) RETURNS text LANGUAGE sql AS $$
  SELECT COALESCE(string_agg(format('%s:%s', e.entry ->> 'entity_type', e.entry ->> 'id'), ',' ORDER BY e.ord), '')
  FROM jsonb_array_elements(public.get_user_entities(p_project_id) -> 'entities') WITH ORDINALITY AS e (entry, ord);
$$;

-- How many rows public.get_entity_user_data returns to the caller for one entity.
CREATE FUNCTION pg_temp.read_count (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS bigint LANGUAGE sql AS $$
  SELECT count(*) FROM public.get_entity_user_data(p_project_id, p_entity_type, p_entity_id);
$$;

-- The sorted keys of the first listed entry of one type.
CREATE FUNCTION pg_temp.entry_keys (p_project_id uuid, p_entity_type text) RETURNS text[] LANGUAGE sql AS $$
  SELECT ARRAY(
    SELECT jsonb_object_keys(e.entry) ORDER BY 1
  )
  FROM jsonb_array_elements(public.get_user_entities(p_project_id) -> 'entities') WITH ORDINALITY AS e (entry, ord)
  WHERE e.entry ->> 'entity_type' = p_entity_type
  ORDER BY e.ord
  LIMIT 1;
$$;

-- The sorted top-level keys of what public.get_user_entities answers the caller.
CREATE FUNCTION pg_temp.answer_keys (p_project_id uuid) RETURNS text[] LANGUAGE sql AS $$
  SELECT ARRAY(SELECT jsonb_object_keys(public.get_user_entities(p_project_id)) ORDER BY 1);
$$;

-- =====================================================================
-- The list
-- =====================================================================
-- U5 holds no grant. The answer is still one row holding one object, whose `entities` is an empty array.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036a5',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        public.get_user_entities (test_id ('project_a'))
    ),
    1::bigint,
    'a caller with no grant gets exactly one row from the list'
  );

SELECT
  is (
    jsonb_typeof(public.get_user_entities (test_id ('project_a'))),
    'object',
    'that row is one jsonb object'
  );

SELECT
  is (
    jsonb_typeof(
      public.get_user_entities (test_id ('project_a')) -> 'entities'
    ),
    'array',
    'its entities member is a jsonb array'
  );

SELECT
  is (
    jsonb_array_length(
      public.get_user_entities (test_id ('project_a')) -> 'entities'
    ),
    0,
    'and that array is empty'
  );

SELECT
  reset_role ();

-- U3 holds one grant, on org_a.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036a3',
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.listed (test_id ('project_a')),
    'organization:' || test_id ('org_a')::text,
    'one editor grant gives one entry'
  );

SELECT
  is (
    pg_temp.entry_keys (test_id ('project_a'), 'organization'),
    ARRAY[
      'color',
      'confirmed',
      'entity_type',
      'id',
      'image',
      'name',
      'short_name'
    ],
    'an organization entry carries exactly the card keys of an organization'
  );

SELECT
  reset_role ();

-- U1 holds editor grants on C1, C2 and O2 in project A and on C4 in project B, an admin-role grant on C3 and an editor grant on faction_a.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036a1',
    '[]'::jsonb
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.get_user_entities(%L)$$,
      test_id ('project_a')
    ),
    'two candidate-editor grants in one project raise nothing'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        jsonb_array_elements(
          public.get_user_entities (test_id ('project_a')) -> 'entities'
        ) AS e (entry)
      WHERE
        e.entry ->> 'entity_type' = 'candidate'
    ),
    2::bigint,
    'two candidate-editor grants in one project give two candidate entries'
  );

SELECT
  is (
    pg_temp.listed (test_id ('project_a')),
    'candidate:36363636-3636-3636-3636-0000000000c1,candidate:36363636-3636-3636-3636-0000000000c2,organization:36363636-3636-3636-3636-0000000000a2',
    'candidates and an organization are listed together, candidates first and each type by id'
  );

SELECT
  is (
    pg_temp.entry_keys (test_id ('project_a'), 'candidate'),
    ARRAY[
      'color',
      'confirmed',
      'entity_type',
      'first_name',
      'id',
      'image',
      'last_name',
      'short_name'
    ],
    'a candidate entry carries exactly the card keys of a candidate'
  );

SELECT
  is (
    position(
      '36363636-3636-3636-3636-0000000000c4' IN pg_temp.listed (test_id ('project_a'))
    ),
    0,
    'the candidate the caller edits in project B is absent from the list of project A'
  );

SELECT
  is (
    pg_temp.listed (test_id ('project_b')),
    'candidate:36363636-3636-3636-3636-0000000000c4',
    'and it is the list of project B'
  );

SELECT
  is (
    position(
      '36363636-3636-3636-3636-0000000000c3' IN pg_temp.listed (test_id ('project_a'))
    ),
    0,
    'the candidate of an admin-role entity grant is not listed'
  );

SELECT
  ok (
    position(
      test_id ('faction_a')::text IN pg_temp.listed (test_id ('project_a'))
    ) = 0
    AND position(
      'faction' IN pg_temp.listed (test_id ('project_a'))
    ) = 0,
    'the faction of a faction-editor grant is not listed'
  );

-- =====================================================================
-- The one-entity read
-- =====================================================================
-- Still U1. Every refusal is asserted twice: the call raises nothing, and it returns no row.
SELECT
  is (
    (
      SELECT
        string_agg(first_name || ' ' || last_name, '|')
      FROM
        public.get_entity_user_data (
          test_id ('project_a'),
          'candidate',
          '36363636-3636-3636-3636-0000000000c1'
        )
    ),
    'Una One',
    'the caller''s own candidate is one row carrying its person names'
  );

SELECT
  is (
    (
      SELECT
        jsonb_agg(name)
      FROM
        public.get_entity_user_data (
          test_id ('project_a'),
          'organization',
          '36363636-3636-3636-3636-0000000000a2'
        )
    ),
    '[{"en":"Org A2"}]'::jsonb,
    'the caller''s own organization is one row carrying its name'
  );

SELECT
  is (
    pg_temp.read_count (
      test_id ('project_b'),
      'candidate',
      '36363636-3636-3636-3636-0000000000c4'
    ),
    1::bigint,
    'asked under project B, the same caller reads its project B candidate'
  );

SELECT
  lives_ok (
    format(
      $$SELECT * FROM public.get_entity_user_data(%L, 'candidate', %L)$$,
      test_id ('project_a'),
      test_id ('candidate_a')
    ),
    'reading a candidate the caller holds no grant on raises nothing'
  );

SELECT
  is (
    pg_temp.read_count (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a')
    ),
    0::bigint,
    'a candidate the caller holds no grant on returns no row, publicly visible though it is'
  );

SELECT
  lives_ok (
    format(
      $$SELECT * FROM public.get_entity_user_data(%L, 'candidate', '36363636-3636-3636-3636-0000000000c3')$$,
      test_id ('project_a')
    ),
    'reading the candidate of an admin-role entity grant raises nothing'
  );

SELECT
  is (
    pg_temp.read_count (
      test_id ('project_a'),
      'candidate',
      '36363636-3636-3636-3636-0000000000c3'
    ),
    0::bigint,
    'the candidate of an admin-role entity grant returns no row'
  );

SELECT
  lives_ok (
    format(
      $$SELECT * FROM public.get_entity_user_data(%L, 'organization', '36363636-3636-3636-3636-0000000000c1')$$,
      test_id ('project_a')
    ),
    'a type that does not match the id raises nothing'
  );

SELECT
  is (
    pg_temp.read_count (
      test_id ('project_a'),
      'organization',
      '36363636-3636-3636-3636-0000000000c1'
    ),
    0::bigint,
    'the caller''s candidate id asked as an organization returns no row'
  );

SELECT
  lives_ok (
    format(
      $$SELECT * FROM public.get_entity_user_data(%L, 'organization', '36363636-3636-3636-3636-0000000000c1')$$,
      test_id ('project_b')
    ),
    'reading the organization that shares the id of a candidate the caller edits raises nothing'
  );

SELECT
  is (
    pg_temp.read_count (
      test_id ('project_b'),
      'organization',
      '36363636-3636-3636-3636-0000000000c1'
    ),
    0::bigint,
    'an editor grant on a candidate does not read the organization of another project that shares its id'
  );

SELECT
  lives_ok (
    format(
      $$SELECT * FROM public.get_entity_user_data(%L, 'candidate', '36363636-3636-3636-3636-0000000000c4')$$,
      test_id ('project_a')
    ),
    'reading another project''s candidate under this project raises nothing'
  );

SELECT
  is (
    pg_temp.read_count (
      test_id ('project_a'),
      'candidate',
      '36363636-3636-3636-3636-0000000000c4'
    ),
    0::bigint,
    'the candidate the caller edits in project B, asked under project A, returns no row'
  );

SELECT
  lives_ok (
    format(
      $$SELECT * FROM public.get_entity_user_data(%L, 'candidate', '36363636-3636-3636-3636-00000000dead')$$,
      test_id ('project_a')
    ),
    'reading an id that does not exist raises nothing'
  );

SELECT
  is (
    pg_temp.read_count (
      test_id ('project_a'),
      'candidate',
      '36363636-3636-3636-3636-00000000dead'
    ),
    0::bigint,
    'an id that does not exist returns no row'
  );

SELECT
  lives_ok (
    format(
      $$SELECT * FROM public.get_entity_user_data(%L, 'faction', %L)$$,
      test_id ('project_a'),
      test_id ('faction_a')
    ),
    'reading a faction the caller edits raises nothing'
  );

SELECT
  is (
    pg_temp.read_count (
      test_id ('project_a'),
      'faction',
      test_id ('faction_a')
    ),
    0::bigint,
    'a faction the caller edits returns no row: the read serves candidates and organizations only'
  );

-- Agreement. The three entries of project A are established above, so the comparison is not between two zeros.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        jsonb_array_elements(
          public.get_user_entities (test_id ('project_a')) -> 'entities'
        ) AS e (entry)
      WHERE
        pg_temp.read_count (
          test_id ('project_a'),
          (e.entry ->> 'entity_type')::public.entity_type,
          (e.entry ->> 'id')::uuid
        ) = 1
    ),
    jsonb_array_length(
      public.get_user_entities (test_id ('project_a')) -> 'entities'
    )::bigint,
    'every listed entity is one the one-entity read returns exactly one row for'
  );

SELECT
  reset_role ();

-- =====================================================================
-- Callers that hold authority without being an entity
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.listed (test_id ('project_a')),
    '',
    'a project admin is listed with nothing'
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
    pg_temp.listed (test_id ('project_a')),
    '',
    'the holder of an admin-role entity grant alone is listed with nothing'
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
  is (
    pg_temp.listed (test_id ('project_a')),
    'organization:36363636-3636-3636-3636-0000000000a2,organization:' || test_id ('org_a')::text,
    'two organization-editor grants in one project list both organizations'
  );

SELECT
  reset_role ();

-- =====================================================================
-- A token older than a grant, and a token that outlives one
-- =====================================================================
-- The helper and row-level security both read the grant table, never the token's grants claim, so a grant counts from the moment it is written and stops counting the moment it is deleted, whatever the token carries. The token is built while U5 holds no grant; the editor grant on C3 is written afterwards and the token is not rebuilt.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036a5',
    '[]'::jsonb
  );

SELECT
  reset_role ();

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-0000000036a5',
    'entity',
    'candidate',
    '36363636-3636-3636-3636-0000000000c3',
    'editor'
  );

SELECT
  set_config('role', 'authenticated', true);

SELECT
  is (
    pg_temp.listed (test_id ('project_a')),
    'candidate:36363636-3636-3636-3636-0000000000c3',
    'RVK: an editor grant written after the token was issued is listed at once'
  );

SELECT
  lives_ok (
    format(
      $$SELECT * FROM public.get_entity_user_data(%L, 'candidate', '36363636-3636-3636-3636-0000000000c3')$$,
      test_id ('project_a')
    ),
    'reading the entity of a grant the token predates raises nothing'
  );

SELECT
  is (
    pg_temp.read_count (
      test_id ('project_a'),
      'candidate',
      '36363636-3636-3636-3636-0000000000c3'
    ),
    1::bigint,
    'RVK: and that entity is read at once, although the token predates the grant'
  );

SELECT
  reset_role ();

-- The token is rebuilt, so that it carries the grant, before the grant is deleted below.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036a5',
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.listed (test_id ('project_a')),
    'candidate:36363636-3636-3636-3636-0000000000c3',
    'once the token is rebuilt the same grant is listed'
  );

SELECT
  is (
    pg_temp.read_count (
      test_id ('project_a'),
      'candidate',
      '36363636-3636-3636-3636-0000000000c3'
    ),
    1::bigint,
    'and its entity is readable'
  );

SELECT
  reset_role ();

-- The other direction: the grant is deleted while the token built above still carries it, and the same token reads and writes next.
DELETE FROM grants
WHERE
  user_id = 'cccccccc-cccc-cccc-cccc-0000000036a5'
  AND target_id = '36363636-3636-3636-3636-0000000000c3'
  AND role = 'editor';

SELECT
  set_config('role', 'authenticated', true);

SELECT
  is (
    pg_temp.listed (test_id ('project_a')),
    '',
    'a grant removed from the table is not listed although the token still carries it'
  );

SELECT
  lives_ok (
    format(
      $$SELECT * FROM public.get_entity_user_data(%L, 'candidate', '36363636-3636-3636-3636-0000000000c3')$$,
      test_id ('project_a')
    ),
    'reading the entity of a removed grant raises nothing'
  );

SELECT
  is (
    pg_temp.read_count (
      test_id ('project_a'),
      'candidate',
      '36363636-3636-3636-3636-0000000000c3'
    ),
    0::bigint,
    'and that entity returns no row although the token still carries the grant'
  );

-- A direct read of the row and a write of it, with the token that still carries the grant: row-level security asks the table, so both are refused at once.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        public.candidates
      WHERE
        id = '36363636-3636-3636-3636-0000000000c3'
    ),
    0::bigint,
    'RVK: the token that outlives the grant reads no row of the candidate directly'
  );

SELECT
  throws_ok (
    $$SELECT public.upsert_answers('candidate', '36363636-3636-3636-3636-0000000000c3', '{}'::jsonb)$$,
    'P0001',
    'Entity not found or access denied: 36363636-3636-3636-3636-0000000000c3',
    'RVK: and writing the candidate with the same token is refused'
  );

SELECT
  reset_role ();

-- A publicly visible entity whose grant the token predates: it is listed and read, as every authenticated caller reads its row, and its editor writes it at once, because the write's row-level security asks the table as well. candidate_a is confirmed, nominated and in the open project, and nobody edits it here.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036a5',
    '[]'::jsonb
  );

SELECT
  reset_role ();

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-0000000036a5',
    'entity',
    'candidate',
    test_id ('candidate_a'),
    'editor'
  );

SELECT
  set_config('role', 'authenticated', true);

SELECT
  is (
    pg_temp.listed (test_id ('project_a')),
    'candidate:' || test_id ('candidate_a')::text,
    'an editor grant the token predates is listed at once when its candidate is publicly visible'
  );

SELECT
  is (
    pg_temp.read_count (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a')
    ),
    1::bigint,
    'and that candidate is readable, so the list and the read still agree'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.upsert_answers('candidate', %L, '{}'::jsonb)$$,
      test_id ('candidate_a')
    ),
    'RVK: and writing it with the token that predates the grant lives'
  );

SELECT
  reset_role ();

DELETE FROM grants
WHERE
  user_id = 'cccccccc-cccc-cccc-cccc-0000000036a5'
  AND target_id = test_id ('candidate_a');

-- =====================================================================
-- The caller's password fact
-- =====================================================================
-- U3 edits org_a and holds a hash.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036a3',
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.answer_keys (test_id ('project_a')),
    ARRAY['entities', 'password_set', 'pending_email_taken'],
    'PWD: the answer of a caller that edits an entity has exactly the top-level keys entities, password_set and pending_email_taken'
  );

SELECT
  reset_role ();

-- P3 holds a hash, P1 an empty string and P2 a null. Each is read as that account, one after the other, and P3 once more at the end.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036b3',
    '[]'::jsonb
  );

SELECT
  is (
    public.get_user_entities (test_id ('project_a')) -> 'password_set',
    'true'::jsonb,
    'PWD: password_set is true for a caller whose encrypted_password holds a hash'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036b1',
    '[]'::jsonb
  );

SELECT
  is (
    public.get_user_entities (test_id ('project_a')) -> 'password_set',
    'false'::jsonb,
    'PWD: password_set is false for a caller whose encrypted_password is the empty string'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036b2',
    '[]'::jsonb
  );

SELECT
  is (
    public.get_user_entities (test_id ('project_a')) -> 'password_set',
    'false'::jsonb,
    'PWD: password_set is false for a caller whose encrypted_password is null'
  );

-- Still P2, which edits nothing.
SELECT
  is (
    pg_temp.answer_keys (test_id ('project_a')),
    ARRAY['entities', 'password_set', 'pending_email_taken'],
    'PWD: the answer of a caller that edits none has exactly the same three top-level keys'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        public.get_user_entities (test_id ('project_a'))
    ),
    1::bigint,
    'PWD: a caller with no entity still gets exactly one row'
  );

SELECT
  is (
    public.get_user_entities (test_id ('project_a')),
    '{"entities": [], "password_set": false, "pending_email_taken": false}'::jsonb,
    'PWD: and that row is one object holding an empty entities array and the caller''s password_set and pending_email_taken'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036b3',
    '[]'::jsonb
  );

SELECT
  is (
    public.get_user_entities (test_id ('project_a')) -> 'password_set',
    'true'::jsonb,
    'PWD: accounts read one after the other each get their own password_set, so the account with a hash reads true again after two that read false'
  );

SELECT
  reset_role ();

-- No caller at all: the anon impersonation clears the claims, and the role is then put back to postgres, which may execute the function.
SELECT
  set_test_user ('anon');

SELECT
  reset_role ();

SELECT
  is (
    public.get_user_entities (test_id ('project_a')) -> 'password_set',
    'null'::jsonb,
    'PWD: password_set is a JSON null, neither true nor false, where no caller is signed in'
  );

-- =====================================================================
-- The caller's pending address
-- =====================================================================
-- `pending_email_taken` says whether the address the caller's own account is changing to (auth.users.email_change) is already another account's address, compared trimmed and lower-cased. U3 edits org_a; P1, P2 and P3 edit nothing, and their addresses are identity_p1@test.com, identity_p2@test.com and identity_p3@test.com. Pending addresses are set by the fixture role.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036a3',
    '[]'::jsonb
  );

SELECT
  is (
    public.get_user_entities (test_id ('project_a')) ? 'pending_email_taken',
    true,
    'PET: the answer of a caller that edits an entity carries pending_email_taken'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036b2',
    '[]'::jsonb
  );

SELECT
  is (
    public.get_user_entities (test_id ('project_a')) ? 'pending_email_taken',
    true,
    'PET: and so does the answer of a caller that edits nothing'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036b3',
    '[]'::jsonb
  );

SELECT
  is (
    public.get_user_entities (test_id ('project_a')) -> 'pending_email_taken',
    'false'::jsonb,
    'PET: pending_email_taken is false for a caller with no pending address'
  );

SELECT
  reset_role ();

UPDATE auth.users
SET
  email_change = '  IDENTITY_P3@Test.Com '
WHERE
  id = 'cccccccc-cccc-cccc-cccc-0000000036b1';

UPDATE auth.users
SET
  email_change = 'pet.nobody@test.example'
WHERE
  id = 'cccccccc-cccc-cccc-cccc-0000000036b2';

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036b1',
    '[]'::jsonb
  );

SELECT
  is (
    public.get_user_entities (test_id ('project_a')) -> 'pending_email_taken',
    'true'::jsonb,
    'PET: pending_email_taken is true when the caller''s pending address, in another case and with spaces around it, is another account''s address'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036b2',
    '[]'::jsonb
  );

SELECT
  is (
    public.get_user_entities (test_id ('project_a')) -> 'pending_email_taken',
    'false'::jsonb,
    'PET: pending_email_taken is false when the caller''s pending address is no account''s address'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036b3',
    '[]'::jsonb
  );

SELECT
  is (
    public.get_user_entities (test_id ('project_a')) -> 'pending_email_taken',
    'false'::jsonb,
    'PET: pending_email_taken is false for a caller whose own address is another caller''s pending address: it speaks of the caller''s own pending address only'
  );

SELECT
  reset_role ();

UPDATE auth.users
SET
  email_change = ' Identity_P2@test.com'
WHERE
  id = 'cccccccc-cccc-cccc-cccc-0000000036b2';

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000036b2',
    '[]'::jsonb
  );

SELECT
  is (
    public.get_user_entities (test_id ('project_a')) -> 'pending_email_taken',
    'false'::jsonb,
    'PET: pending_email_taken is false when the caller''s pending address is its own address: only another account''s counts'
  );

SELECT
  reset_role ();

-- No caller at all, as in the password section.
SELECT
  set_test_user ('anon');

SELECT
  reset_role ();

SELECT
  is (
    public.get_user_entities (test_id ('project_a')) -> 'pending_email_taken',
    'false'::jsonb,
    'PET: pending_email_taken is false where no caller is signed in'
  );

UPDATE auth.users
SET
  email_change = ''
WHERE
  id IN (
    'cccccccc-cccc-cccc-cccc-0000000036b1',
    'cccccccc-cccc-cccc-cccc-0000000036b2'
  );

-- =====================================================================
-- anon
-- =====================================================================
SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    format(
      $$SELECT public.get_user_entities(%L)$$,
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'anon is refused get_user_entities by privilege'
  );

SELECT
  throws_ok (
    format(
      $$SELECT * FROM public.get_entity_user_data(%L, 'candidate', '36363636-3636-3636-3636-0000000000c1')$$,
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'anon is refused get_entity_user_data by privilege'
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
          AND p.proname = 'get_user_entities'
      ),
      false
    ),
    'get_user_entities runs with the caller''s rights'
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
          AND p.proname = 'get_entity_user_data'
      ),
      false
    ),
    'get_entity_user_data runs with the caller''s rights'
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

-- The password fact. Each assertion reads pg_proc, so a function that is absent answers NULL and fails its comparison.
SELECT
  is (
    (
      SELECT
        string_agg(
          p.pronargs::text,
          ','
          ORDER BY
            p.oid
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'private'
        AND p.proname = 'caller_password_set'
    ),
    '0',
    'PWD: private.caller_password_set has one signature and takes no argument, so it can name no account but the caller''s'
  );

SELECT
  ok (
    COALESCE(
      (
        SELECT
          p.prosecdef
          AND p.proconfig::text = '{"search_path=\"\""}'
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE
          n.nspname = 'private'
          AND p.proname = 'caller_password_set'
      ),
      false
    ),
    'PWD: private.caller_password_set is SECURITY DEFINER with an empty search_path and no other setting'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          r.rolname || ' ' || has_function_privilege(r.rolname, p.oid, 'EXECUTE')::text,
          ', '
          ORDER BY
            r.rolname
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        CROSS JOIN (
          VALUES
            ('anon'),
            ('authenticated'),
            ('service_role')
        ) AS r (rolname)
      WHERE
        n.nspname = 'private'
        AND p.proname = 'caller_password_set'
    ),
    'anon false, authenticated true, service_role false',
    'PWD: private.caller_password_set is executable by authenticated and by neither anon nor service_role'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          pg_get_function_identity_arguments(p.oid) || ' -> ' || p.prorettype::regtype::text || ' ' || p.provolatile::text || ' ' || p.prosecdef::text || ' ' || p.proconfig::text,
          ', '
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'private'
        AND p.proname = 'caller_pending_email_taken'
    ),
    ' -> boolean s true {"search_path=\"\""}',
    'PET: private.caller_pending_email_taken has one signature, takes no argument, answers boolean and is STABLE and SECURITY DEFINER with an empty search_path'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          r.rolname || ' ' || has_function_privilege(r.rolname, p.oid, 'EXECUTE')::text,
          ', '
          ORDER BY
            r.rolname
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        CROSS JOIN (
          VALUES
            ('anon'),
            ('authenticated'),
            ('service_role')
        ) AS r (rolname)
      WHERE
        n.nspname = 'private'
        AND p.proname = 'caller_pending_email_taken'
    ),
    'anon false, authenticated true, service_role false',
    'PET: private.caller_pending_email_taken is executable by authenticated and by neither anon nor service_role'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          r.rolname || ' ' || has_function_privilege(r.rolname, p.oid, 'EXECUTE')::text,
          ', '
          ORDER BY
            r.rolname
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        CROSS JOIN (
          VALUES
            ('anon'),
            ('authenticated'),
            ('service_role')
        ) AS r (rolname)
      WHERE
        n.nspname = 'private'
        AND p.proname = 'user_password_set'
        AND p.proargtypes::text = 'uuid'::regtype::oid::text
    ),
    'anon false, authenticated false, service_role false',
    'PWD: private.user_password_set (uuid), which takes an account''s id, is executable by none of anon, authenticated and service_role'
  );

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
        AND p.proname IN ('caller_password_set', 'user_password_set')
    ),
    0::bigint,
    'PWD: neither caller_password_set nor user_password_set is a public function, so PostgREST publishes neither'
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
