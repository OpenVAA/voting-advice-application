-- 24-access-token-hook-reach.test.sql: the access-token hook's privileges, and what a token of the retired claim shape confers
--
-- Two questions about authority, both read from the applied database. Section 1 asserts the privileges of the access-token hook's role and of the two API roles on the grant map and on the hook itself. Section 2 asserts that a token of the retired claim shape shows every identity exactly the rows its grants in public.grants admit.
--
-- THE DECLARED ASSERTION COUNT BELOW IS EXPLICIT and deliberately so: a pgTAP file that asserts nothing exits 0 under no_plan. The declaration below is the only occurrence of that call in this file.
--
-- Depends on: 00-helpers.test.sql (create_test_data, set_test_user, set_test_retired_claim,
--             test_rls_digest, test_id, test_user_id, test_user_grants, reset_role)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in the same session
DROP TABLE IF EXISTS __tcache__;

DROP TABLE IF EXISTS retired_grid;

SELECT
  plan (10);

SELECT
  create_test_data ();

SELECT
  reset_role ();

-- =====================================================================
-- Section 1: the access-token hook keeps its reach, and the public roles keep none (1-6)
--
-- NO POLICY TEST WOULD CATCH THE FIRST OF THESE. `GRANT USAGE ON SCHEMA public TO supabase_auth_admin` is declared once in the schema, in the grant-map block of 300-auth-tables.sql. Without it every token is issued carrying no authority at all — an empty permission set, which presents as a wall of denials rather than as an error. It is asserted from the applied database rather than from the file.
--
-- The two public roles are asserted in the same breath and for the opposite reason: a new table in the public schema is exposed through PostgREST by default, and these rows say who may do what to whom across every account and project in the instance.
-- =====================================================================
SELECT
  ok (
    has_schema_privilege('supabase_auth_admin', 'public', 'USAGE'),
    'the access-token hook''s role holds USAGE on schema public'
  );

SELECT
  ok (
    has_table_privilege('supabase_auth_admin', 'public.grants', 'SELECT'),
    'and can read the grant map, so custom_access_token_hook has something to project'
  );

SELECT
  ok (
    NOT has_table_privilege('authenticated', 'public.grants', 'SELECT'),
    'authenticated cannot read the grant map'
  );

-- The hook's role READS the grant map and writes nothing, and the hook itself is callable by the auth server alone.
SELECT
  ok (
    NOT has_table_privilege('supabase_auth_admin', 'public.grants', 'INSERT')
    AND NOT has_table_privilege('supabase_auth_admin', 'public.grants', 'UPDATE')
    AND NOT has_table_privilege('supabase_auth_admin', 'public.grants', 'DELETE'),
    'supabase_auth_admin holds no write privilege on the grant map'
  );

SELECT
  ok (
    has_function_privilege(
      'supabase_auth_admin',
      'public.custom_access_token_hook(jsonb)',
      'EXECUTE'
    )
    AND NOT has_function_privilege(
      'anon',
      'public.custom_access_token_hook(jsonb)',
      'EXECUTE'
    )
    AND NOT has_function_privilege(
      'authenticated',
      'public.custom_access_token_hook(jsonb)',
      'EXECUTE'
    ),
    'custom_access_token_hook is executable by supabase_auth_admin and by neither API role'
  );

SELECT
  ok (
    NOT has_table_privilege('anon', 'public.grants', 'SELECT'),
    'nor can anon'
  );

-- =====================================================================
-- Section 2: a token of the retired claim shape adds nothing beyond the grant table (7-10)
--
-- Tokens of the retired claim shape can still be minted by hand, and a session issued by an older hook carries one until it refreshes. Row-level security reads the caller's rows of public.grants and no claim, so such a token must show each identity exactly what its rows in the table admit: no more, because the retired entry is not read, and no less, because the absent `grants` claim is not read either.
--
-- The retired token of every identity carries a global admin entry, an authority no identity but super_admin holds in the table. A row-level-security path that read the retired key, alone or beside the table, would therefore widen the view of every other identity, and of `no_grant` above all, and the equality below would fail.
--
-- It is an EQUALITY with the view of the same identity under a token whose `grants` claim is projected from the table, rather than an assertion about a row count: several policies admit the rows of an open project to any authenticated caller, so a count would move for reasons that have nothing to do with authority. The third assertion is the non-vacuity — two columns of empty digests agree perfectly and measure nothing; the fourth shows that the global admin entry names an authority the digest can see, because a real global admin grant shows more than no grant does.
--
-- The digest helper is SECURITY INVOKER, which is the single most load-bearing property of this instrument: with owner rights it would read past row-level security, every identity would digest identically, every comparison would pass, and the grid would measure nothing while reporting success.
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
    'cccccccc-cccc-cccc-cccc-0000000000e1',
    '00000000-0000-0000-0000-000000000000',
    'no_grant_at_all@test.com',
    crypt ('testpass', gen_salt ('bf')),
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

SELECT
  test_seed_fixture_grants ();

CREATE TEMP TABLE retired_grid (
  ident text NOT NULL,
  tbl text NOT NULL,
  digest_retired text,
  digest_table text
);

DO $$
DECLARE
  i record;
  v_tbls text[];
  v_digs text[];
BEGIN
  FOR i IN
    SELECT * FROM (
      VALUES
        (1, 'super_admin',     test_user_id('super_admin')),
        (2, 'account_admin_a', test_user_id('account_admin_a')),
        (3, 'admin_a',         test_user_id('admin_a')),
        (4, 'admin_b',         test_user_id('admin_b')),
        (5, 'organization_a',  test_user_id('organization_a')),
        (6, 'candidate_a',     test_user_id('candidate_a')),
        (7, 'candidate_a2',    test_user_id('candidate_a2')),
        (8, 'candidate_b',     test_user_id('candidate_b')),
        (9, 'no_grant',        'cccccccc-cccc-cccc-cccc-0000000000e1'::uuid)
    ) v (ord, nm, uid)
    ORDER BY v.ord
  LOOP
    -- Pass 1: a token of the RETIRED shape whose payload is a global admin entry, for every identity: authority the table grants none of them but super_admin, so reading the retired key would show.
    PERFORM set_test_retired_claim(
      i.uid,
      '[{"scope": "global", "target_type": null, "target_id": null, "role": "admin"}]'::jsonb
    );
    SELECT array_agg(d.tbl ORDER BY d.tbl), array_agg(d.digest ORDER BY d.tbl)
      INTO v_tbls, v_digs
      FROM test_rls_digest() d;
    PERFORM reset_role();
    INSERT INTO retired_grid (ident, tbl, digest_retired)
    SELECT i.nm, u.t, u.g FROM unnest(v_tbls, v_digs) AS u (t, g);

    -- Pass 2: the SAME identity under a token whose grants claim is projected from its rows of the table, same sub.
    PERFORM set_test_user('authenticated', i.uid, '[]'::jsonb);
    SELECT array_agg(d.tbl ORDER BY d.tbl), array_agg(d.digest ORDER BY d.tbl)
      INTO v_tbls, v_digs
      FROM test_rls_digest() d;
    PERFORM reset_role();
    UPDATE retired_grid g
    SET digest_table = u.g
    FROM unnest(v_tbls, v_digs) AS u (t, g)
    WHERE g.ident = i.nm AND g.tbl = u.t;
  END LOOP;
  PERFORM reset_role();
END
$$;

SELECT
  cmp_ok (
    (
      SELECT
        count(*)
      FROM
        retired_grid
    ),
    '>=',
    171::bigint,
    'the grid covers nine identities across every catalogue-derived row-level-security table'
  );

SELECT
  is_empty (
    $q$
    SELECT ident, tbl FROM retired_grid WHERE digest_retired IS DISTINCT FROM digest_table
    $q$,
    'RVK: a token of the retired claim shape shows every identity exactly the rows its grants in the table admit: the retired entry adds nothing beyond the table'
  );

-- Non-vacuity. Two columns of empty digests agree perfectly and measure nothing; the anon-readable rows of the open project are what make at least one cell non-empty.
SELECT
  cmp_ok (
    (
      SELECT
        count(*)
      FROM
        retired_grid
      WHERE
        digest_table <> ''
        AND digest_table <> 'DENIED'
    ),
    '>',
    0::bigint,
    'and at least one table is non-empty under the table-projected token, so the comparison above is not two columns of nothing'
  );

-- Discrimination. The retired payload grants global admin; if a real global admin grant showed no more than no grant at all, a path that read the retired key would leave every digest as it is and the equality above could not fail.
SELECT
  cmp_ok (
    (
      SELECT
        count(*)
      FROM
        retired_grid a
        JOIN retired_grid n ON n.tbl = a.tbl
      WHERE
        a.ident = 'super_admin'
        AND n.ident = 'no_grant'
        AND a.digest_table IS DISTINCT FROM n.digest_table
    ),
    '>',
    0::bigint,
    'and a global admin grant shows more than no grant on at least one table, so the retired token''s global admin entry would widen a view that read it'
  );

SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
