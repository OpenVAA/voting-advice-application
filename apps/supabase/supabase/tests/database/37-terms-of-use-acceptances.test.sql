-- 37-terms-of-use-acceptances.test.sql: the access model of public.terms_of_use_acceptances, cell by cell
--
-- A row says that one user has accepted the terms of use of one project. This file asserts what the catalogue declares for the table, what a signed-in user can and cannot do to it, what another user and an anonymous caller see of it, that an acceptance for one project is not an acceptance for another, that a row goes with its user, that what an anonymous caller can read of a candidate does not depend on anyone having accepted, and that no policy, function or column of the schema names terms of use.
--
-- EVERY STRUCTURAL ASSERTION READS THE CATALOGUE, never the text of a schema file.
--
-- A refusal here is a privilege refusal, SQLSTATE 42501, and not a silent no-op: `authenticated` holds INSERT on `project_id` alone and neither UPDATE nor DELETE, and `anon` holds nothing, so the statement is refused before any policy is consulted.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_user_grants), 304-terms-of-use-acceptances.sql (the table, its index, its policies and its privileges), 100-tenancy.sql (projects), and for Section 6 302-rls.sql (anon_select_candidates), 400-storage.sql (anon_select_public_assets, storage_path_is_public) and 503-entity-rpcs.sql (get_nominations).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (49);

-- Create test fixture data
SELECT
  create_test_data ();

-- =====================================================================
-- Section 1: what the catalogue declares
-- =====================================================================
SELECT
  has_table (
    'public',
    'terms_of_use_acceptances',
    'terms_of_use_acceptances table exists'
  );

SELECT
  col_is_pk (
    'public',
    'terms_of_use_acceptances',
    ARRAY['user_id', 'project_id'],
    'the primary key is (user_id, project_id): one acceptance per user and project'
  );

SELECT
  is (
    (
      SELECT
        string_agg(c.confdeltype::text, ',')
      FROM
        pg_constraint c
      WHERE
        c.conrelid = 'public.terms_of_use_acceptances'::regclass
        AND c.contype = 'f'
        AND c.confrelid = 'auth.users'::regclass
    ),
    'c',
    'the one foreign key to auth.users is ON DELETE CASCADE'
  );

SELECT
  is (
    (
      SELECT
        string_agg(c.confdeltype::text, ',')
      FROM
        pg_constraint c
      WHERE
        c.conrelid = 'public.terms_of_use_acceptances'::regclass
        AND c.contype = 'f'
        AND c.confrelid = 'public.projects'::regclass
    ),
    'c',
    'the one foreign key to projects is ON DELETE CASCADE'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_constraint c
      WHERE
        c.conrelid = 'public.terms_of_use_acceptances'::regclass
        AND c.contype = 'f'
    ),
    2,
    'the table has exactly those two foreign keys'
  );

-- Columns as `name not-null default`, in declaration order. The two defaults are what let a caller who may state `project_id` alone produce a whole row.
SELECT
  is (
    (
      SELECT
        string_agg(
          format(
            '%s %s %s',
            a.attname,
            a.attnotnull,
            COALESCE(pg_get_expr(d.adbin, d.adrelid), '-')
          ),
          ' | '
          ORDER BY
            a.attnum
        )
      FROM
        pg_attribute a
        LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid
        AND d.adnum = a.attnum
      WHERE
        a.attrelid = 'public.terms_of_use_acceptances'::regclass
        AND a.attnum > 0
        AND NOT a.attisdropped
    ),
    'user_id t auth.uid() | project_id t - | accepted_at t now()',
    'three NOT NULL columns: user_id defaulting to the caller, project_id with no default, accepted_at defaulting to the server clock'
  );

SELECT
  is (
    (
      SELECT
        relrowsecurity
      FROM
        pg_class
      WHERE
        oid = 'public.terms_of_use_acceptances'::regclass
    ),
    true,
    'row-level security is enabled on terms_of_use_acceptances'
  );

-- Name, command and roles of every policy on the table. A third policy, or one naming anon or PUBLIC, changes the string.
SELECT
  is (
    (
      SELECT
        string_agg(
          format('%s %s %s', policyname, cmd, roles),
          ' | '
          ORDER BY
            policyname
        )
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename = 'terms_of_use_acceptances'
    ),
    'authenticated_insert_terms_of_use_acceptances INSERT {authenticated} | authenticated_select_terms_of_use_acceptances SELECT {authenticated}',
    'the table has exactly two policies, one SELECT and one INSERT, both TO authenticated and neither naming anon or PUBLIC'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          COALESCE(qual, with_check),
          ' | '
          ORDER BY
            policyname
        )
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename = 'terms_of_use_acceptances'
    ),
    '(user_id = ( SELECT auth.uid() AS uid)) | (user_id = ( SELECT auth.uid() AS uid))',
    'both policies ask only whether the row is the caller''s own: the INSERT policy in WITH CHECK, the SELECT policy in USING'
  );

SELECT
  is (
    has_table_privilege(
      'anon',
      'public.terms_of_use_acceptances',
      'SELECT'
    ),
    false,
    'anon holds no SELECT on terms_of_use_acceptances'
  );

SELECT
  is (
    has_any_column_privilege(
      'anon',
      'public.terms_of_use_acceptances',
      'SELECT, INSERT, UPDATE'
    )
    OR has_table_privilege(
      'anon',
      'public.terms_of_use_acceptances',
      'DELETE'
    ),
    false,
    'anon holds nothing on terms_of_use_acceptances: no privilege on the table and none on any column'
  );

SELECT
  is (
    has_table_privilege(
      'authenticated',
      'public.terms_of_use_acceptances',
      'SELECT'
    ),
    true,
    'authenticated holds SELECT on terms_of_use_acceptances'
  );

SELECT
  is (
    has_column_privilege(
      'authenticated',
      'public.terms_of_use_acceptances',
      'project_id',
      'INSERT'
    ),
    true,
    'authenticated holds INSERT on project_id'
  );

SELECT
  is (
    has_column_privilege(
      'authenticated',
      'public.terms_of_use_acceptances',
      'user_id',
      'INSERT'
    ),
    false,
    'authenticated holds no INSERT on user_id, so a caller cannot state who accepts'
  );

SELECT
  is (
    has_column_privilege(
      'authenticated',
      'public.terms_of_use_acceptances',
      'accepted_at',
      'INSERT'
    ),
    false,
    'authenticated holds no INSERT on accepted_at, so a caller cannot state when'
  );

SELECT
  is (
    has_any_column_privilege(
      'authenticated',
      'public.terms_of_use_acceptances',
      'UPDATE'
    ),
    false,
    'authenticated holds no UPDATE on terms_of_use_acceptances, on the table or on any column'
  );

SELECT
  is (
    has_table_privilege(
      'authenticated',
      'public.terms_of_use_acceptances',
      'DELETE'
    ),
    false,
    'authenticated holds no DELETE on terms_of_use_acceptances'
  );

SELECT
  is (
    has_table_privilege(
      'service_role',
      'public.terms_of_use_acceptances',
      'SELECT'
    )
    AND has_table_privilege(
      'service_role',
      'public.terms_of_use_acceptances',
      'INSERT'
    )
    AND has_table_privilege(
      'service_role',
      'public.terms_of_use_acceptances',
      'DELETE'
    ),
    true,
    'service_role keeps SELECT, INSERT and DELETE on terms_of_use_acceptances'
  );

-- =====================================================================
-- Section 2: a signed-in user records their own acceptance, and nothing else
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO terms_of_use_acceptances (project_id) VALUES ('%s')$$,
      test_id ('project_a')
    ),
    'a signed-in user records their own acceptance by stating the project alone'
  );

SELECT
  is (
    (
      SELECT
        user_id
      FROM
        terms_of_use_acceptances
      WHERE
        project_id = test_id ('project_a')
    ),
    test_user_id ('candidate_a'),
    'the database set user_id to the caller'
  );

-- now() is the transaction's start time, and this whole file is one transaction.
SELECT
  is (
    (
      SELECT
        accepted_at
      FROM
        terms_of_use_acceptances
      WHERE
        project_id = test_id ('project_a')
    ),
    now(),
    'the database stamped accepted_at from its own clock'
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO terms_of_use_acceptances (project_id) VALUES ('%s') ON CONFLICT DO NOTHING$$,
      test_id ('project_a')
    ),
    'accepting again with ON CONFLICT DO NOTHING is not an error'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        terms_of_use_acceptances
    ),
    1,
    'accepting again leaves one row, not two'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO terms_of_use_acceptances (project_id) VALUES ('%s')$$,
      test_id ('project_a')
    ),
    '23505',
    NULL,
    'a repeated plain insert is a unique violation, never a second row'
  );

-- The DO UPDATE form of an upsert needs the UPDATE privilege, which the caller does not hold.
SELECT
  throws_ok (
    format(
      $$INSERT INTO terms_of_use_acceptances (project_id) VALUES ('%s') ON CONFLICT (user_id, project_id) DO UPDATE SET project_id = EXCLUDED.project_id$$,
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'an upsert in the DO UPDATE form is refused'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO terms_of_use_acceptances (user_id, project_id) VALUES ('%s', '%s')$$,
      test_user_id ('candidate_b'),
      test_id ('project_b')
    ),
    '42501',
    NULL,
    'an insert stating another user''s user_id is refused'
  );

-- Stating the column at all is what is refused, so the caller's own id fares no better: the refusal comes from the column privilege, before the policy is consulted.
SELECT
  throws_ok (
    format(
      $$INSERT INTO terms_of_use_acceptances (user_id, project_id) VALUES ('%s', '%s')$$,
      test_user_id ('candidate_a'),
      test_id ('project_b')
    ),
    '42501',
    NULL,
    'an insert stating the caller''s own user_id is refused too'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO terms_of_use_acceptances (project_id, accepted_at) VALUES ('%s', '2000-01-01T00:00:00Z')$$,
      test_id ('project_b')
    ),
    '42501',
    NULL,
    'an insert stating accepted_at is refused'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE terms_of_use_acceptances SET accepted_at = '2000-01-01T00:00:00Z' WHERE project_id = '%s'$$,
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'a user cannot UPDATE their own acceptance'
  );

SELECT
  throws_ok (
    format(
      $$DELETE FROM terms_of_use_acceptances WHERE project_id = '%s'$$,
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'a user cannot DELETE their own acceptance'
  );

-- =====================================================================
-- Section 3: another user and an anonymous caller
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_b'),
    test_user_grants ('candidate_b')
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        terms_of_use_acceptances
    ),
    0,
    'another user reads none of candidate_a''s rows'
  );

-- candidate_b's own row, for the same project, so that the two reads below each have a row they must not return.
SELECT
  lives_ok (
    format(
      $$INSERT INTO terms_of_use_acceptances (project_id) VALUES ('%s')$$,
      test_id ('project_a')
    ),
    'a second user records their own acceptance for the same project'
  );

SELECT
  is (
    (
      SELECT
        string_agg(user_id::text, ',')
      FROM
        terms_of_use_acceptances
    ),
    test_user_id ('candidate_b')::text,
    'the second user reads exactly their own row'
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
        string_agg(user_id::text, ',')
      FROM
        terms_of_use_acceptances
    ),
    test_user_id ('candidate_a')::text,
    'the first user still reads exactly their own row while the table holds two'
  );

SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    $$SELECT count(*) FROM terms_of_use_acceptances$$,
    '42501',
    NULL,
    'anon cannot SELECT from terms_of_use_acceptances'
  );

SELECT
  throws_ok (
    format(
      $$INSERT INTO terms_of_use_acceptances (project_id) VALUES ('%s')$$,
      test_id ('project_a')
    ),
    '42501',
    NULL,
    'anon cannot INSERT into terms_of_use_acceptances'
  );

-- =====================================================================
-- Section 4: an acceptance belongs to one project
-- =====================================================================
SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        string_agg(
          project_id::text,
          ','
          ORDER BY
            project_id
        )
      FROM
        terms_of_use_acceptances
      WHERE
        user_id = test_user_id ('candidate_a')
    ),
    test_id ('project_a')::text,
    'an acceptance for one project is not an acceptance for another: candidate_a has a row for project A and no row for project B'
  );

-- candidate_a holds no grant in project B, and project B is not open. The INSERT policy asks who and not which project, and the row unlocks nothing.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  lives_ok (
    format(
      $$INSERT INTO terms_of_use_acceptances (project_id) VALUES ('%s')$$,
      test_id ('project_b')
    ),
    'the same user accepts for a second project with a second insert'
  );

SELECT
  throws_ok (
    $$INSERT INTO terms_of_use_acceptances (project_id) VALUES ('00000000-0000-0000-0000-00000000dead')$$,
    '23503',
    NULL,
    'an acceptance for a project that does not exist is refused by the foreign key'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        string_agg(
          project_id::text,
          ','
          ORDER BY
            project_id
        )
      FROM
        terms_of_use_acceptances
      WHERE
        user_id = test_user_id ('candidate_a')
    ),
    test_id ('project_a')::text || ',' || test_id ('project_b')::text,
    'candidate_a now has two rows with two distinct project ids, one per project'
  );

-- =====================================================================
-- Section 5: a row goes with its user
-- =====================================================================
-- The cascade from projects is asserted from the catalogue in Section 1; the fixture's projects stay.
DELETE FROM auth.users
WHERE
  id = test_user_id ('candidate_b');

SELECT
  is (
    (
      SELECT
        string_agg(DISTINCT user_id::text, ',')
      FROM
        terms_of_use_acceptances
    ),
    test_user_id ('candidate_a')::text,
    'deleting an auth user removes that user''s acceptance and leaves the other user''s rows'
  );

-- =====================================================================
-- Section 6: what voters can read does not depend on acceptance
-- =====================================================================
-- Candidate A is confirmed and carries a confirmed nomination in project A, which is open for voters. Its editor is candidate_a, who holds acceptance rows from the sections above. Those rows are deleted here, so the three reads below are made while nobody has accepted anything, and the first assertion states that premise instead of assuming it.
DELETE FROM terms_of_use_acceptances;

INSERT INTO
  storage.objects (id, bucket_id, name)
VALUES
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/candidates/' || test_id ('candidate_a')::text || '/66666666-6666-6666-6666-666666666666.jpg'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        terms_of_use_acceptances
    ),
    0,
    'nobody has accepted anything: the acceptance table holds no row for any user or project'
  );

SELECT
  set_test_user ('anon');

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    ),
    1,
    'with nobody having accepted anything, anon reads the row of a confirmed candidate that has a confirmed nomination in an open project'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        storage.objects
      WHERE
        bucket_id = 'public-assets'
        AND name = test_id ('project_a')::text || '/candidates/' || test_id ('candidate_a')::text || '/66666666-6666-6666-6666-666666666666.jpg'
    ),
    1,
    'with nobody having accepted anything, anon reads that candidate''s file in public-assets'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        get_nominations (test_id ('project_a'))
      WHERE
        id = test_id ('nomination_cand_a')
        AND entity_id = test_id ('candidate_a')
    ),
    1,
    'with nobody having accepted anything, get_nominations returns that candidate''s nomination to anon, entity side included'
  );

SELECT
  reset_role ();

-- =====================================================================
-- Section 7: nothing in the schema asks about terms of use
-- =====================================================================
-- Three censuses over the applied catalogue, and a fourth assertion that each of them had text to search. A census passes when it finds nothing, and on failure pgTAP prints what it found: the policies, functions or columns, by name.
--
-- The text searched for is `terms_of_use`, matched literally and without regard to case. It is also how the name of this file's own table begins, so a policy or a function that reads `terms_of_use_acceptances` is reported too. That is intended: such a policy or function makes something depend on acceptance, which is what these censuses exist to surface.
SELECT
  is (
    (
      SELECT
        string_agg(
          format('%s.%s.%s', schemaname, tablename, policyname),
          ','
          ORDER BY
            schemaname,
            tablename,
            policyname
        )
      FROM
        pg_policies
      WHERE
        schemaname IN ('public', 'storage')
        AND (
          COALESCE(qual, '') ILIKE '%terms\_of\_use%'
          OR COALESCE(with_check, '') ILIKE '%terms\_of\_use%'
        )
    ),
    NULL::text,
    'census: no policy in public or storage names terms of use in its USING or WITH CHECK expression, so no row and no stored file is readable or writable on condition of acceptance'
  );

-- pg_get_functiondef raises on an aggregate, so an aggregate contributes no text. The `test_*` helpers 00-helpers.test.sql installs are not part of the schema.
SELECT
  is (
    (
      SELECT
        string_agg(
          format('%s.%s', n.nspname, p.proname),
          ','
          ORDER BY
            n.nspname,
            p.proname
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname IN ('public', 'private')
        AND p.proname NOT LIKE 'test\_%'
        AND (
          CASE
            WHEN p.prokind = 'a' THEN ''
            ELSE pg_get_functiondef(p.oid)
          END
        ) ILIKE '%terms\_of\_use%'
    ),
    NULL::text,
    'census: no function in public or private names terms of use in its definition. A function that has a reason to read terms_of_use_acceptances is admitted on purpose: exempt it here by name with the reason beside it, or narrow the searched text to the name the retired candidates column had'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          format('%s.%s', table_name, column_name),
          ','
          ORDER BY
            table_name,
            column_name
        )
      FROM
        information_schema.columns
      WHERE
        table_schema = 'public'
        AND column_name ILIKE '%terms\_of\_use%'
    ),
    NULL::text,
    'census: no column of a table or view in public names terms of use: acceptance is a row of terms_of_use_acceptances and not a field of an entity'
  );

-- What each census read: policies with an expression in public and in storage, functions with a definition in public and in private, columns in public.
SELECT
  is (
    format(
      '%s %s %s %s %s',
      (
        SELECT
          count(*) FILTER (
            WHERE
              COALESCE(qual, '') || COALESCE(with_check, '') <> ''
          ) > 0
        FROM
          pg_policies
        WHERE
          schemaname = 'public'
      ),
      (
        SELECT
          count(*) FILTER (
            WHERE
              COALESCE(qual, '') || COALESCE(with_check, '') <> ''
          ) > 0
        FROM
          pg_policies
        WHERE
          schemaname = 'storage'
      ),
      (
        SELECT
          count(*) FILTER (
            WHERE
              p.prokind <> 'a'
              AND p.proname NOT LIKE 'test\_%'
          ) > 0
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE
          n.nspname = 'public'
      ),
      (
        SELECT
          count(*) FILTER (
            WHERE
              p.prokind <> 'a'
              AND p.proname NOT LIKE 'test\_%'
          ) > 0
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE
          n.nspname = 'private'
      ),
      (
        SELECT
          count(*) > 0
        FROM
          information_schema.columns
        WHERE
          table_schema = 'public'
      )
    ),
    't t t t t',
    'census: every population the three censuses above searched is non-empty (policies in public, policies in storage, functions in public, functions in private, columns in public), so a clean answer does not come from an empty instrument'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
