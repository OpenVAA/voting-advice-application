-- 24-legacy-removal.test.sql: the second authority mechanism is gone, read from the catalogue
--
-- 162-15 deletes five objects — the role table, the two enums only it and the role predicate's signature used, and the two shims K1 opened a window for — plus the transitional backfill 162-06 installed beside them and the two *_legacy_claim bodies 162-05 installed before that. This file is the committed assertion that they are absent, and it is the only one: every other file in the estate asserts what the SURVIVING mechanism does, and a phase that removes a mechanism without asserting its absence has recorded an intention rather than a fact.
--
-- EVERY STRUCTURAL ASSERTION HERE READS THE CATALOGUE — pg_class, pg_type, pg_proc, pg_policies, information_schema, has_schema_privilege, has_table_privilege — and none of them reads a file. That is the property the textual sweep in this plan's commit does not have and cannot have: a source comment naming a retired object can neither satisfy nor invalidate an assertion over pg_proc, and a grep for zero is unsatisfiable in a repository whose retirement records have to name what they retired.
--
-- THE FUNCTION ABSENCES ARE ASSERTED AT ANY SIGNATURE, deliberately. CREATE OR REPLACE FUNCTION with changed parameter types creates an OVERLOAD rather than replacing, so a name can come back in a spelling nobody anticipated; a hasnt_function pinned to one argument list would be green against exactly that. The same reasoning 10-schema-migrations.test.sql now records for the has_role overload assertion it strengthened.
--
-- THE TWO BICONDITIONALS THIS PHASE INSTALLED ARE REPLACED HERE AND IN 14-grants-migration.test.sql, one per side (162-15 task 2 Q2 = A). 162-05's said the two *_legacy_claim bodies exist if and only if the hook emits no grants key; 162-06's said the backfill exists if and only if the role table does. Both would have both sides false after this commit, and a biconditional with both sides false IS SATISFIED BY BOTH SIDES COMING BACK TOGETHER — which is the resurrection they were installed to prevent. Two unconditional absence assertions catch either half returning alone AND both returning together, so the replacement detects strictly more than the thing replaced.
--
-- 162-06's biconditional was OBSERVED RED BEFORE IT WAS RETIRED, against an intermediate tree in which public.user_roles was gone and public.backfill_grants_from_user_roles was not, captured by its own description string. The capture, not the green run that followed, is its retirement record.
--
-- pgTAP SHIPS ITS OWN has_role(). It asserts that a DATABASE ROLE exists and returns text, and under this estate's `search_path = public, extensions` it shadows the predicate this phase retired, so an unqualified one-argument call fails with "function ok(text, unknown) does not exist" rather than as a failed assertion. Every absence assertion below is written over pg_proc against a schema-qualified name for that reason: an assertion that should fail because the function is GONE must not instead fail because pgTAP's own shadowed it.
--
-- THE DECLARED ASSERTION COUNT BELOW IS EXPLICIT and deliberately so: a pgTAP file that asserts nothing exits 0 under no_plan, which is exactly the vacuous pass a removal test must not be able to produce. The declaration below is the only occurrence of that call in this file.
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
  plan (23);

SELECT
  create_test_data ();

-- =====================================================================
-- Section 1: the five retired objects are absent from the catalogue (1-5)
-- =====================================================================
SELECT
  reset_role ();

SELECT
  hasnt_table (
    'public',
    'user_roles',
    'public.user_roles does not exist — the second authority table K1 opened a shim window over, and B1(a) the claim that the drop is what makes the policy count honest'
  );

SELECT
  hasnt_type (
    'public',
    'user_role_type',
    'public.user_role_type does not exist — the role vocabulary that table and the role predicate''s signature both named'
  );

SELECT
  hasnt_type (
    'public',
    'role_scope_type',
    'public.role_scope_type does not exist — the scope vocabulary beside it'
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
        AND p.proname = 'has_role'
    ),
    0,
    'no public.has_role exists at any signature — the role-identity shim, gone with the two enums its argument list named'
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
        AND p.proname = 'can_access_project'
    ),
    0,
    'no public.can_access_project exists at any signature — the project-access shim 76 policy call sites once delegated to'
  );

-- =====================================================================
-- Section 2: the three transitional bodies, each asserted alone (6-8)
--
-- The per-side replacement for the two biconditionals. 162-05's two *_legacy_claim bodies are 6 and 7; 162-06's backfill is 8. Each is a separate assertion so a single half returning reddens on its own, which is the case a biconditional with both sides false cannot see.
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
    'no public.has_role_legacy_claim exists at any signature — 162-05''s transitional fallback, deleted by 162-06'
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
    'nor public.can_access_project_legacy_claim, asserted separately so either half resurrecting alone reddens'
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
        AND p.proname = 'backfill_grants_from_user_roles'
    ),
    0,
    'no public.backfill_grants_from_user_roles exists at any signature — 162-06''s transitional migration function, whose expiry biconditional was observed RED against an intermediate tree before it was retired'
  );

-- =====================================================================
-- Section 3: no column anywhere is of a retired type (9)
--
-- Broader than the column assertion this replaces, which named user_roles.scope_type. A type cannot be dropped while a column is of it, so this is redundant with section 1 today — and it is the assertion that would catch a resurrection that declared the type and then used it somewhere this file does not name.
-- =====================================================================
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        information_schema.columns c
      WHERE
        c.udt_name IN ('user_role_type', 'role_scope_type')
    ),
    0,
    'no column in any schema is of a retired role or role-scope type'
  );

-- =====================================================================
-- Section 4: the access-token hook keeps its reach, and the public roles keep none (10-13)
--
-- THIS IS THE ONE FAILURE IN THIS PLAN THAT NO POLICY TEST WOULD CATCH. `GRANT USAGE ON SCHEMA public TO supabase_auth_admin` was declared exactly once in the schema and it was inside the block 162-15 deleted; 162-03 saw that coming and repeated it inside the grant-map block, recording it as threat T-162-03-05. Without the repetition every token is issued carrying no authority at all — an empty permission set, which presents as a wall of denials rather than as an error. Asserted from the applied database rather than from the file, after the deletion.
--
-- The two public roles are asserted in the same breath and for the opposite reason: a new table in the public schema is exposed through PostgREST by default, and these rows say who may do what to whom across every account and project in the instance. The retired block carried its own blanket revoke; deleting a neighbour must not have taken the grant map's.
-- =====================================================================
SELECT
  ok (
    has_schema_privilege('supabase_auth_admin', 'public', 'USAGE'),
    'the access-token hook''s role still holds USAGE on schema public — the one statement of the deleted block that had to survive it (T-162-03-05)'
  );

SELECT
  ok (
    has_table_privilege('supabase_auth_admin', 'public.grants', 'SELECT'),
    'and can still read the grant map, so custom_access_token_hook still has something to project'
  );

SELECT
  ok (
    NOT has_table_privilege('authenticated', 'public.grants', 'SELECT'),
    'authenticated cannot read the grant map'
  );

-- 162-REVIEW IN-01: the hook's role READS the grant map and writes nothing, and the hook itself is callable by the auth server alone.
SELECT
  ok (
    NOT has_table_privilege('supabase_auth_admin', 'public.grants', 'INSERT')
    AND NOT has_table_privilege('supabase_auth_admin', 'public.grants', 'UPDATE')
    AND NOT has_table_privilege('supabase_auth_admin', 'public.grants', 'DELETE'),
    'IN-01: supabase_auth_admin holds no write privilege on the grant map'
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
    'IN-01: custom_access_token_hook is executable by supabase_auth_admin and by neither API role'
  );

SELECT
  ok (
    NOT has_table_privilege('anon', 'public.grants', 'SELECT'),
    'nor can anon — the revoke beside the deleted block''s revoke is still there'
  );

-- =====================================================================
-- Section 5: the policy estate moved by exactly the two policies the retired table owned (14-16)
--
-- The two names are asserted absent individually rather than as a count, because a count is satisfied by losing one policy and gaining another. The third assertion is the non-vacuity: the estate is still large, so the two absences above are not two absences inside an empty catalogue.
-- =====================================================================
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_policies
      WHERE
        policyname = 'auth_admin_read_user_roles'
    ),
    0,
    'the policy auth_admin_read_user_roles is gone, by name'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_policies
      WHERE
        policyname = 'service_role_manage_user_roles'
    ),
    0,
    'and so is service_role_manage_user_roles — the retired table''s other policy, named rather than counted'
  );

SELECT
  cmp_ok (
    (
      SELECT
        count(*)
      FROM
        pg_policies
      WHERE
        schemaname IN ('public', 'storage')
    ),
    '>=',
    100::bigint,
    'and the surviving policy estate is still large, so the two absences above are not two absences inside an empty catalogue'
  );

-- =====================================================================
-- Section 6: no policy predicate anywhere names a retired predicate (17-18)
--
-- pg_get_expr renders predicates UNQUALIFIED, so a surviving call would appear as the bare name. Waves 3 through 5 converted all 88 call sites and 162-15 measured both counts at zero before deleting anything; these two are the committed form of that measurement, so a policy reintroducing either name reddens rather than failing at query time.
-- =====================================================================
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_policies
      WHERE
        schemaname IN ('public', 'storage')
        AND COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%can_access_project%'
    ),
    0,
    'no policy in public or storage names can_access_project in its USING or WITH CHECK expression'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_policies
      WHERE
        schemaname IN ('public', 'storage')
        AND COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%has_role%'
    ),
    0,
    'nor has_role — the two shim names asserted separately, since a conversion can stall on one and finish the other'
  );

-- =====================================================================
-- Section 7: a token of the retired claim shape still confers nothing (19-21)
--
-- KEPT AND STRENGTHENED, not retired with its subject. 13-shim-parity.test.sql carried this grid and 162-15 deleted that file once every other class in it had this plan as its subject's executioner; this one did not, and it matters MORE now than it did then rather than less. Tokens of the retired shape can still be minted by hand after the table backing them is gone, and a session issued before the hook changed carries one until it refreshes. The property that such a token adds nothing has to survive the removal of the thing that once backed it.
--
-- It is an EQUALITY with the view of an authenticated caller carrying an explicitly empty grants array, rather than an assertion about zero rows: several policies admit the rows of an open project to any authenticated caller, so a zero assertion would be false for a reason that has nothing to do with authority. The third assertion is the non-vacuity — two columns of empty digests agree perfectly and measure nothing.
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
  digest_noauth text
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
    -- Pass 1: a token of the RETIRED shape. Its payload is the identity's real authority, spelled under the key the phase retired, which is the strongest form of the question: not "does an empty retired token confer nothing" but "does a retired token carrying this identity's whole authority confer nothing".
    PERFORM set_test_retired_claim(i.uid, test_user_grants(i.nm));
    SELECT array_agg(d.tbl ORDER BY d.tbl), array_agg(d.digest ORDER BY d.tbl)
      INTO v_tbls, v_digs
      FROM test_rls_digest() d;
    PERFORM reset_role();
    INSERT INTO retired_grid (ident, tbl, digest_retired)
    SELECT i.nm, u.t, u.g FROM unnest(v_tbls, v_digs) AS u (t, g);

    -- Pass 2: the SAME identity carrying an explicitly empty grants array — no authority at all, same sub.
    PERFORM set_test_user('authenticated', i.uid, '[]'::jsonb);
    PERFORM set_config(
      'request.jwt.claims',
      jsonb_set(current_setting('request.jwt.claims')::jsonb, '{grants}', '[]'::jsonb)::text,
      true
    );
    SELECT array_agg(d.tbl ORDER BY d.tbl), array_agg(d.digest ORDER BY d.tbl)
      INTO v_tbls, v_digs
      FROM test_rls_digest() d;
    PERFORM reset_role();
    UPDATE retired_grid g
    SET digest_noauth = u.g
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
    SELECT ident, tbl FROM retired_grid WHERE digest_retired IS DISTINCT FROM digest_noauth
    $q$,
    'a token of the retired claim shape shows every identity exactly the rows a caller with no authority claim sees: it confers nothing, and now there is no table behind the shape at all'
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
        digest_noauth <> ''
        AND digest_noauth <> 'DENIED'
    ),
    '>',
    0::bigint,
    'and at least one table is non-empty for the no-authority caller, so the comparison above is not two columns of nothing'
  );

SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
