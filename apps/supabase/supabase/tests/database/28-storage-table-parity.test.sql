-- 28-storage-table-parity.test.sql: every storage policy decides through exactly one of two mechanisms, and storage agrees with the entity tables per identity, verb and entity type
--
-- Section 1 asserts the partition: each policy on storage.objects reaches either the authority mechanism (`user_can`) or the visibility mechanism (`storage_path_is_public`), with both counts asserted, the visibility-only member named and the count reaching neither zero. Section 2 asserts that for eight grant-bearing identities, both verbs and all four entity types, the storage layer allows exactly what the entity tables allow. Section 3 asserts that read and write are decided separately, at entity and at project scope.
--
-- The anonymous public read is the one policy that cannot route through `user_can`: an anonymous caller carries no `grants` claim, which `user_can` denies, so an authority-routed public read would make every public asset unfetchable.
--
-- Reach is transitive: no storage policy names `user_can` in its own `pg_policies` expression. The fourteen authority policies call `public.storage_path_can(grant_scope_type, text, text, text, storage_verb)`, which calls `user_can`, and `anon_select_public_assets` calls `public.storage_path_is_public`, so reach is computed as a recursive closure over `pg_proc.prosrc` rather than as a text match on the policy expression.
--
-- Neither half of any pair is an authority-predicate call. A pair whose two halves call the same function asserts that the function equals itself and cannot detect storage and tables disagreeing, so both halves are real operations whose row counts or affected-row counts are read.
--
-- The grid runs against a closed project because the authenticated entity SELECT policies carry a public disjunct: with the project open, the table half of a pair would be true for every confirmed, nominated entity whatever the caller's authority. Section 3 reopens the project, because its entity-scope identity reads another entity's asset through the visibility path.
--
-- Depends on: 00-helpers.test.sql (create_test_data, test_id, test_user_id, set_test_user,
--             test_seed_fixture_grants, reset_role)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (21);

SELECT
  create_test_data ();

SELECT
  test_seed_fixture_grants ();

-- =====================================================================
-- Section 1: the two-mechanism partition, DERIVED with transitive reach
-- =====================================================================
CREATE TEMP VIEW m17_storage_reach AS
WITH RECURSIVE
  fn AS (
    SELECT DISTINCT
      p.proname::text AS name,
      p.prosrc AS src
    FROM
      pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE
      n.nspname = 'public'
      AND p.prokind = 'f'
  ),
  edge AS (
    SELECT
      a.name AS caller,
      b.name AS callee
    FROM
      fn a
      JOIN fn b ON a.name <> b.name
      AND a.src LIKE '%' || b.name || '(%'
  ),
  closure (root, reached) AS (
    SELECT
      name,
      name
    FROM
      fn
    UNION
    SELECT
      c.root,
      e.callee
    FROM
      closure c
      JOIN edge e ON e.caller = c.reached
  ),
  pol AS (
    SELECT
      policyname,
      cmd,
      COALESCE(qual, '') || ' ' || COALESCE(with_check, '') AS expr
    FROM
      pg_policies
    WHERE
      schemaname = 'storage'
  )
SELECT
  p.policyname,
  p.cmd,
  EXISTS (
    SELECT
      1
    FROM
      fn f
      JOIN closure c ON c.root = f.name
    WHERE
      p.expr LIKE '%' || f.name || '(%'
      AND c.reached = 'user_can'
  ) AS reaches_authority,
  EXISTS (
    SELECT
      1
    FROM
      fn f
      JOIN closure c ON c.root = f.name
    WHERE
      p.expr LIKE '%' || f.name || '(%'
      AND c.reached IN (
        'storage_path_is_public',
        'project_open_for_voters',
        'entity_has_confirmed_nomination'
      )
  ) AS reaches_visibility
FROM
  pol p;

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        m17_storage_reach
    ),
    15,
    'storage partition: the estate carries exactly 15 storage policies'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        m17_storage_reach
      WHERE
        reaches_authority
    ),
    14,
    'storage partition: 14 policies reach the AUTHORITY mechanism (user_can, transitively through storage_path_can)'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        m17_storage_reach
      WHERE
        reaches_visibility
        AND NOT reaches_authority
    ),
    1,
    'storage partition: exactly 1 policy reaches a VISIBILITY helper and not the authority mechanism'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          policyname,
          ','
          ORDER BY
            policyname
        )
      FROM
        m17_storage_reach
      WHERE
        reaches_visibility
        AND NOT reaches_authority
    ),
    'anon_select_public_assets',
    'storage partition: the visibility-only member is NAMED, so a policy silently moving between the two mechanisms reddens even while the totals hold'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        m17_storage_reach
      WHERE
        NOT reaches_authority
        AND NOT reaches_visibility
    ),
    0,
    'storage partition: NO storage policy makes its decision through neither mechanism, so none carries a parallel authority rule of its own'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        m17_storage_reach
    ),
    (
      (
        SELECT
          count(*)::integer
        FROM
          m17_storage_reach
        WHERE
          reaches_authority
      ) + (
        SELECT
          count(*)::integer
        FROM
          m17_storage_reach
        WHERE
          reaches_visibility
          AND NOT reaches_authority
      ) + (
        SELECT
          count(*)::integer
        FROM
          m17_storage_reach
        WHERE
          NOT reaches_authority
          AND NOT reaches_visibility
      )
    ),
    'storage partition: the total equals the sum of the three counts, so the partition is one'
  );

-- =====================================================================
-- Fixture: the extra identities, the closed project, and the paired objects
-- =====================================================================
UPDATE projects
SET
  open_for_voters = false
WHERE
  id = test_id ('project_a');

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
    'cccccccc-cccc-cccc-cccc-0000000000b1',
    '00000000-0000-0000-0000-000000000000',
    'm17s_project_editor@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000000b2',
    '00000000-0000-0000-0000-000000000000',
    'm17s_faction_editor@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000000b3',
    '00000000-0000-0000-0000-000000000000',
    'm17s_alliance_editor@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000000b4',
    '00000000-0000-0000-0000-000000000000',
    'm17s_candidate_editor@test.com',
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
    'cccccccc-cccc-cccc-cccc-0000000000b5',
    '00000000-0000-0000-0000-000000000000',
    'm17s_organization_editor@test.com',
    crypt ('testpass', gen_salt ('bf')),
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

-- Four fresh, un-nominated entities, one per type, and their four entity editors.
--
-- The fixture's own candidate_a and faction_a are nominated under org_a, so a nomination hierarchy relates them to the organization editor. These entities have no nomination, so each pair measures the entity grants alone.
INSERT INTO
  public.candidates (id, project_id, first_name, last_name, confirmed)
VALUES
  (
    'eeeeeeee-3333-0000-0000-000000000001',
    test_id ('project_a'),
    'Pair',
    'Candidate',
    false
  );

INSERT INTO
  public.organizations (id, project_id, confirmed)
VALUES
  (
    'eeeeeeee-3333-0000-0000-000000000002',
    test_id ('project_a'),
    false
  );

INSERT INTO
  public.factions (id, project_id, organization_id, confirmed)
VALUES
  (
    'eeeeeeee-3333-0000-0000-000000000003',
    test_id ('project_a'),
    'eeeeeeee-3333-0000-0000-000000000002',
    false
  );

INSERT INTO
  public.alliances (id, project_id, confirmed)
VALUES
  (
    'eeeeeeee-3333-0000-0000-000000000004',
    test_id ('project_a'),
    false
  );

INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-0000000000b1',
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000000b2',
    'entity',
    'faction',
    'eeeeeeee-3333-0000-0000-000000000003',
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000000b3',
    'entity',
    'alliance',
    'eeeeeeee-3333-0000-0000-000000000004',
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000000b4',
    'entity',
    'candidate',
    'eeeeeeee-3333-0000-0000-000000000001',
    'editor'
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000000b5',
    'entity',
    'organization',
    'eeeeeeee-3333-0000-0000-000000000002',
    'editor'
  );

-- One PRIVATE-bucket object per entity type, at the path shape `storage_path_can` reads: <project>/<type segment>/<entity id>/<file>. The private bucket carries NO visibility disjunct at all, by design, so the storage half of every pair below is the authority decision and nothing else.
INSERT INTO
  storage.objects (id, bucket_id, name, owner)
VALUES
  (
    gen_random_uuid(),
    'private-assets',
    test_id ('project_a')::text || '/candidates/eeeeeeee-3333-0000-0000-000000000001/pair.bin',
    NULL
  ),
  (
    gen_random_uuid(),
    'private-assets',
    test_id ('project_a')::text || '/organizations/eeeeeeee-3333-0000-0000-000000000002/pair.bin',
    NULL
  ),
  (
    gen_random_uuid(),
    'private-assets',
    test_id ('project_a')::text || '/factions/eeeeeeee-3333-0000-0000-000000000003/pair.bin',
    NULL
  ),
  (
    gen_random_uuid(),
    'private-assets',
    test_id ('project_a')::text || '/alliances/eeeeeeee-3333-0000-0000-000000000004/pair.bin',
    NULL
  );

-- The write half's instrument. SECURITY INVOKER, so row-level security and the column grants apply to the impersonated session exactly as they would to the application; a denial that is a PRIVILEGE error returns -1 rather than 0, so "filtered to zero rows" can never be confused with "permission denied".
CREATE FUNCTION pg_temp.m17_affected (p_sql text) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  n integer;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
EXCEPTION
  WHEN insufficient_privilege THEN RETURN -1;
  WHEN others THEN RETURN -2;
END;
$$;

-- =====================================================================
-- Section 2: the pairing grid -- 8 identities x 2 verbs x 4 entity types
-- =====================================================================
CREATE TEMP TABLE m17_pair (ident text, layer text, cell text, val boolean) ON
COMMIT
DROP;

DO $$
DECLARE
  v_uid uuid; v_tbl text; v_ent text; v_cnt integer; v_aff integer;
  idents text[][] := ARRAY[
    ARRAY['1', 'cccccccc-cccc-cccc-cccc-000000000006'],
    ARRAY['2', 'cccccccc-cccc-cccc-cccc-000000000007'],
    ARRAY['3', 'cccccccc-cccc-cccc-cccc-000000000001'],
    ARRAY['4', 'cccccccc-cccc-cccc-cccc-0000000000b1'],
    ARRAY['5', 'cccccccc-cccc-cccc-cccc-0000000000b4'],
    ARRAY['6', 'cccccccc-cccc-cccc-cccc-0000000000b5'],
    ARRAY['7', 'cccccccc-cccc-cccc-cccc-0000000000b2'],
    ARRAY['8', 'cccccccc-cccc-cccc-cccc-0000000000b3']];
  tbls text[][] := ARRAY[
    ARRAY['candidates', 'eeeeeeee-3333-0000-0000-000000000001'],
    ARRAY['organizations', 'eeeeeeee-3333-0000-0000-000000000002'],
    ARRAY['factions', 'eeeeeeee-3333-0000-0000-000000000003'],
    ARRAY['alliances', 'eeeeeeee-3333-0000-0000-000000000004']];
  i int; j int; v_path text;
BEGIN
  FOR i IN 1..array_length(idents, 1) LOOP
    v_uid := idents[i][2]::uuid;
    FOR j IN 1..array_length(tbls, 1) LOOP
      v_tbl := tbls[j][1];
      v_ent := tbls[j][2];
      PERFORM set_test_user('authenticated', v_uid, '[]'::jsonb);
      v_path := public.test_id('project_a')::text || '/' || v_tbl || '/' || v_ent || '/pair.bin';

      -- table, read
      EXECUTE format('SELECT count(*)::integer FROM public.%I WHERE id = %L', v_tbl, v_ent) INTO v_cnt;
      PERFORM set_config('role', 'postgres', true);
      INSERT INTO m17_pair VALUES (idents[i][1], 'table', v_tbl || '/read', v_cnt > 0);
      PERFORM set_config('role', 'authenticated', true);

      -- storage, read
      EXECUTE format(
        'SELECT count(*)::integer FROM storage.objects WHERE bucket_id = %L AND name = %L',
        'private-assets', v_path
      ) INTO v_cnt;
      PERFORM set_config('role', 'postgres', true);
      INSERT INTO m17_pair VALUES (idents[i][1], 'storage', v_tbl || '/read', v_cnt > 0);
      PERFORM set_config('role', 'authenticated', true);

      -- table, write
      v_aff := pg_temp.m17_affected(format(
        'UPDATE public.%I SET info = info WHERE id = %L', v_tbl, v_ent));
      PERFORM set_config('role', 'postgres', true);
      INSERT INTO m17_pair VALUES (idents[i][1], 'table', v_tbl || '/write', v_aff > 0);
      PERFORM set_config('role', 'authenticated', true);

      -- storage, write
      v_aff := pg_temp.m17_affected(format(
        'UPDATE storage.objects SET updated_at = now() WHERE bucket_id = %L AND name = %L',
        'private-assets', v_path));
      PERFORM set_config('role', 'postgres', true);
      INSERT INTO m17_pair VALUES (idents[i][1], 'storage', v_tbl || '/write', v_aff > 0);
      PERFORM set_config('role', 'authenticated', true);
    END LOOP;
  END LOOP;
  PERFORM set_config('role', 'postgres', true);
END $$;

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '1'
        AND layer = 'table'
    ),
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '1'
        AND layer = 'storage'
    ),
    'table and storage agree for RootAdmin, across both verbs and all four entity types'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '2'
        AND layer = 'table'
    ),
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '2'
        AND layer = 'storage'
    ),
    'table and storage agree for AccountAdmin, across both verbs and all four entity types'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '3'
        AND layer = 'table'
    ),
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '3'
        AND layer = 'storage'
    ),
    'table and storage agree for ProjectAdmin, across both verbs and all four entity types'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '4'
        AND layer = 'table'
    ),
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '4'
        AND layer = 'storage'
    ),
    'table and storage agree for ProjectEditor, across both verbs and all four entity types'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '5'
        AND layer = 'table'
    ),
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '5'
        AND layer = 'storage'
    ),
    'table and storage agree for Candidate, across both verbs and all four entity types'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '6'
        AND layer = 'table'
    ),
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '6'
        AND layer = 'storage'
    ),
    'table and storage agree for OrganizationEditor, across both verbs and all four entity types'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '7'
        AND layer = 'table'
    ),
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '7'
        AND layer = 'storage'
    ),
    'table and storage agree for FactionEditor, across both verbs and all four entity types'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '8'
        AND layer = 'table'
    ),
    (
      SELECT
        string_agg(
          CASE
            WHEN val THEN 'T'
            ELSE 'f'
          END,
          ''
          ORDER BY
            cell
        )
      FROM
        m17_pair
      WHERE
        ident = '8'
        AND layer = 'storage'
    ),
    'table and storage agree for AllianceEditor, across both verbs and all four entity types'
  );

-- NON-VACUITY. A grid in which every cell is false on both sides would pass all eight assertions above while measuring nothing at all. Both layers must carry at least one allow and at least one deny.
SELECT
  cmp_ok (
    (
      SELECT
        count(*)::integer
      FROM
        m17_pair
      WHERE
        layer = 'storage'
        AND val
    ),
    '>',
    0,
    'non-vacuity: the storage layer allows at least one cell of the grid'
  );

SELECT
  cmp_ok (
    (
      SELECT
        count(*)::integer
      FROM
        m17_pair
      WHERE
        layer = 'storage'
        AND NOT val
    ),
    '>',
    0,
    'non-vacuity: the storage layer denies at least one cell of the grid'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        m17_pair
    ),
    128,
    'the grid is 8 identities x 4 entity types x 2 verbs x 2 layers = 128 measured cells'
  );

-- =====================================================================
-- Section 3: the two read-but-not-write identities, at two different scopes
-- =====================================================================
-- A policy that accepts the verb argument and then discards it passes any grid that exercises only one verb, and passes the eight assertions above whenever read and write happen to agree. These four assertions fail when the verb is discarded; each names the role and the permission it exercises.
--
-- The project is reopened here because the entity-scope identity reads another entity's publicly visible asset through the visibility path and is refused a write to it, which no permission admits.
SELECT
  reset_role ();

UPDATE projects
SET
  open_for_voters = true
WHERE
  id = test_id ('project_a');

INSERT INTO
  storage.objects (id, bucket_id, name, owner)
VALUES
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/organizations/' || test_id ('org_a')::text || '/sep.png',
    NULL
  ),
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/elections/' || test_id ('election_a')::text || '/sep.png',
    NULL
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
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
        AND name = public.test_id ('project_a')::text || '/organizations/' || public.test_id ('org_a')::text || '/sep.png'
    ),
    1,
    'SEPARABILITY entity scope (Candidate, entity.read_answers = own): the grantee READS another entity''s publicly visible asset'
  );

SELECT
  throws_ok (
    $$INSERT INTO storage.objects (id, bucket_id, name)
      VALUES (gen_random_uuid(), 'public-assets',
              public.test_id('project_a')::text || '/organizations/' || public.test_id('org_a')::text || '/sep2.png')$$,
    '42501',
    NULL,
    'SEPARABILITY entity scope (Candidate, entity.edit_answers = own): and is REFUSED a write to that SAME object, in the SAME transaction'
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
        AND name = public.test_id ('project_a')::text || '/elections/' || public.test_id ('election_a')::text || '/sep.png'
    ),
    1,
    'SEPARABILITY project scope (Candidate, project.read_structure = granted): the entity grantee READS an election asset'
  );

SELECT
  throws_ok (
    $$INSERT INTO storage.objects (id, bucket_id, name)
      VALUES (gen_random_uuid(), 'public-assets',
              public.test_id('project_a')::text || '/elections/' || public.test_id('election_a')::text || '/sep2.png')$$,
    '42501',
    NULL,
    'SEPARABILITY project scope (Candidate, project.edit_structure withheld): and is REFUSED a write to that SAME object, in the SAME transaction'
  );

SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
