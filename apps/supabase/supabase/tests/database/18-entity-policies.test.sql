-- 18-entity-policies.test.sql: the four entity tables answer "may this caller touch this row" in one place
--
-- The grid 162-10 is built around. Everywhere else in the estate a policy asks about a PROJECT; these four tables are where a policy asks whether a row belongs to the caller. Folding that question into `user_can ('entity', id, ...)` has one dangerous failure mode and it is SILENT: fold it too loosely and a candidate edits ANOTHER candidate's record with every pre-existing assertion still green, because a read test cannot tell "correctly permitted" from "should have been denied".
--
-- So the evidence here is not that a candidate can edit their own row. It is a grid in which every table has a caller who MAY and a caller who MAY NOT, differing in exactly one term, with the deny half observed RED against a deliberately over-permissive predicate and the allow half against an over-strict one before the real predicate was accepted. The reddened counts are recorded in 162-10-SUMMARY.md.
--
-- THE DENIAL THAT MATTERS IS THE ONE NOTHING ELSE ASSERTS. 01-tenant-isolation.test.sql proves a caller of project A cannot reach project B's entities. It does NOT prove that an entity grantee of candidate A cannot reach candidate A2 -- the same type, in the same project -- and that is precisely what a predicate mistakenly written at `project` scope would permit while every existing assertion stayed green.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (59);

SELECT
  create_test_data ();

-- =====================================================================
-- Local instrument: an UPDATE whose AFFECTED-ROW COUNT is the measurement
-- =====================================================================
-- `SECURITY INVOKER`, so the caller's own row-level security decides, and `GET DIAGNOSTICS`, so the answer is the number of rows the statement actually touched rather than a value read back through a second policy.
-- A denial under RLS is SILENT -- zero rows, no error -- so a test that only re-read the row would be asking the SELECT policy a question it means to ask the UPDATE policy.
--
-- It updates `subtype`, which is the one column `303-column-grants.sql` grants to `authenticated` on every one of the four entity tables, so the same instrument serves all four and the table is an ARGUMENT rather than four near-identical helpers (D-21).
CREATE OR REPLACE FUNCTION entity_update_rowcount (p_table text, p_id uuid, p_value text) RETURNS integer LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  n integer;
BEGIN
  EXECUTE format('UPDATE public.%I SET subtype = $1 WHERE id = $2', p_table) USING p_value, p_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

-- =====================================================================
-- Extra fixture, local to this transaction
-- =====================================================================
-- A candidate in project A that is NOT publicly visible. Every candidate the shared fixture puts in project A is `confirmed = true` and reached by a confirmed nomination, so a SELECT denial asserted against one of them would pass through the public-visibility terms and measure nothing about the entity predicate. This is the row that discriminates. (162-07b measured exactly this trap in 05-organization-admin.test.sql section 5.)
INSERT INTO
  candidates (id, project_id, first_name, last_name, confirmed)
VALUES
  (
    'eeeeeeee-1010-0000-0000-000000000001'::uuid,
    test_id ('project_a'),
    'Priya',
    'Private',
    false
  );

-- One auth user outside the fixture's eight named identities, so `set_test_user`'s authority write produces nothing for it and its authority comes from the single grant row inserted below and from nowhere else. A fresh identity rather than one of the eight shared ones, because reusing a shared identity would give the caller a second grant and the pair below would then differ in more than the one term under test.
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
    'cccccccc-1010-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'project_admin_tracer@test.com',
    'x',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

-- The grant row is inserted here rather than synthesised into a claim, so the slice really is row -> claim -> policy: `set_test_user` projects public.grants through test_grants_claim exactly as custom_access_token_hook does. It rolls back with this transaction and no fixture outside this file moves.
INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    'cccccccc-1010-0000-0000-000000000001'::uuid,
    'project',
    NULL,
    test_id ('project_a'),
    'admin'
  );

-- =====================================================================
-- Section 1: the candidate self-access rule, both directions (1-6)
-- =====================================================================
-- `candidate_a` holds one grant: (entity, candidate, candidate_a, editor), written from the fixture's authority map in `test_user_grants`. Section 3.3 gives that grant `entity.edit_answers` as `own`, and for an entity grant reach is equality with the granted entity -- so `own` needs no column comparison and no second mechanism.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  is (
    entity_update_rowcount (
      'candidates',
      test_id ('candidate_a'),
      'tracer-own'
    ),
    1,
    'an entity grantee may update their own candidate row'
  );

-- THE SAME TYPE, IN THE SAME PROJECT. This is the pair that 01-tenant-isolation.test.sql does not cover and that a predicate written `user_can ('project', project_id, ...)` would permit while every pre-existing assertion stayed green.
SELECT
  is (
    entity_update_rowcount (
      'candidates',
      test_id ('candidate_a2'),
      'tracer-other'
    ),
    0,
    'an entity grantee may not update another candidate in the same project'
  );

SELECT
  is (
    entity_update_rowcount (
      'candidates',
      test_id ('candidate_b'),
      'tracer-cross-project'
    ),
    0,
    'an entity grantee may not update a candidate in another project'
  );

-- The affected count alone is not the evidence: it is equally consistent with a statement that never ran.
-- Read back as postgres, because the read-back is otherwise filtered by the SELECT policy and would then be asserting two things at once.
SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        subtype
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    ),
    'tracer-own',
    'the granted update actually landed on the row'
  );

SELECT
  ok (
    (
      SELECT
        subtype IS DISTINCT FROM 'tracer-other'
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a2')
    ),
    'that other candidate''s value is unchanged after the denied update'
  );

-- A caller carrying a well-formed token and no grants at all -- the ordinary state of a logged-in voter.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-1010-0000-0000-0000000000ff'::uuid,
    '[]'::jsonb
  );

SELECT
  is (
    entity_update_rowcount (
      'candidates',
      test_id ('candidate_a'),
      'tracer-no-grant'
    ),
    0,
    'a caller with no grants may not update any candidate'
  );

-- =====================================================================
-- Section 2: the positive that makes the denial specific rather than blanket (7)
-- =====================================================================
-- Without this, a predicate that denied EVERY update would satisfy section 1 entirely. The project-scope actor reaches the same row through the admin policy, which this plan's tracer does not touch.
--
-- A project ADMIN rather than a project EDITOR, deliberately: at the commit this assertion was written `admin_update_candidates` was still gated on the project-access shim, which translated to `project.edit_project_settings` -- a permission D-09 denies to ProjEditor. The editor half of this pair lands with that policy's conversion, not here, because an assertion written now would be asserting a policy this task is forbidden to convert.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-1010-0000-0000-000000000001'::uuid,
    '[]'::jsonb
  );

SELECT
  is (
    entity_update_rowcount (
      'candidates',
      test_id ('candidate_a'),
      'tracer-project-scope'
    ),
    1,
    'a project-scope actor may update a candidate in their project'
  );

-- =====================================================================
-- Section 3: the read half of the same-project denial (8-9)
-- =====================================================================
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
        count(*)::integer
      FROM
        candidates
      WHERE
        id = test_id ('candidate_a')
    ),
    1,
    'an entity grantee may select their own candidate row'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        candidates
      WHERE
        id = 'eeeeeeee-1010-0000-0000-000000000001'::uuid
    ),
    0,
    'an entity grantee may not select a non-public candidate in the same project'
  );

-- =====================================================================
-- Section 4: the structural absences, read from the catalogue (10)
-- =====================================================================
-- Read from pg_policies rather than from the file: the file carries column-listing comments that legitimately still name a column 162-16 has not deleted, so a grep of the file cannot express this and a clean grep result would be a pass from the wrong instrument. `pg_get_expr` renders predicates UNQUALIFIED, which is why every pattern below is matched against the unqualified spelling.
SELECT
  reset_role ();

SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename = 'candidates'
        AND cmd = 'UPDATE'
        AND policyname = 'entity_update_own_candidates'
        AND COALESCE(qual, '') LIKE '%user_can%'
        AND COALESCE(with_check, '') LIKE '%user_can%'
        AND COALESCE(qual, '') || COALESCE(with_check, '') NOT LIKE '%can_access_project%'
        AND COALESCE(qual, '') || COALESCE(with_check, '') NOT LIKE '%has_role%'
        AND COALESCE(qual, '') || COALESCE(with_check, '') NOT LIKE '%is_candidate_self%'
        AND COALESCE(qual, '') || COALESCE(with_check, '') NOT LIKE '%uid()%'
        AND COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%''entity''%'
        AND COALESCE(qual, '') || COALESCE(with_check, '') NOT LIKE '%''project''%'
    ) = 1
    AND (
      SELECT
        count(*)
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename = 'candidates'
        AND (
          policyname LIKE 'candidate\_%'
          OR policyname LIKE 'organization\_%'
          OR policyname LIKE 'faction\_%'
          OR policyname LIKE 'alliance\_%'
        )
    ) = 0,
    'the candidate self-update policy calls user_can at entity scope, re-derives nothing, and no policy on candidates carries an entity type in its actor segment'
  );

-- =====================================================================
-- Section 5: the grid, extended to all four tables (11-26)
-- =====================================================================
-- Everything above is the candidate slice, proven end to end. From here the SAME shape is asked of all four tables, and that is the point: if the four predicates really are one expression, one grid answers for all of them and a table that drifted shows up as a single red row naming itself.
--
-- EVERY GRID ROW IS UNPUBLISHED AND UNCONFIRMED, DELIBERATELY. The public disjunct admits a confirmed, nominated entity in an open project to ANY caller, so a grid built on the shared fixture's rows would be measuring the public disjunct while claiming to measure the grant. These rows are invisible to everyone except through a grant, which is the only way the pairs below discriminate.
--
-- EACH PAIR DIFFERS IN EXACTLY ONE TERM and is asserted as one compound value, so a predicate that denied everything and a predicate that allowed everything both fail the same assertion. The term that varies is the PROJECT: both callers are project-scope grantees of equal rank, one in project A and one in project B.
-- "A caller of another project" is a far stronger control than "a caller with no grants", because it is the control that 01-tenant-isolation.test.sql's tenancy claim rests on.
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
SELECT
  ('cccccccc-1010-0000-0000-00000000000' || g)::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'grid_' || g || '@test.com',
  'x',
  'authenticated',
  'authenticated',
  now(),
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
FROM
  generate_series(2, 7) g;

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  -- The project-B twin of the project-A admin inserted above: same rank, other project.
  (
    'cccccccc-1010-0000-0000-000000000002'::uuid,
    'project',
    NULL,
    test_id ('project_b'),
    'admin'
  ),
  -- A project EDITOR in project A. Section 3.3 gives it project.edit_entities and withholds project.edit_project_settings (D-09's split), which is what section 6 below asserts as a pair.
  (
    'cccccccc-1010-0000-0000-000000000003'::uuid,
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  ),
  -- One entity grantee per table, each on that table's own grid row. FactionEditor and AllianceEditor are grant shapes D-07 maps and that NO policy consulted before P-3(a) added the two self-update policies.
  (
    'cccccccc-1010-0000-0000-000000000004'::uuid,
    'entity',
    'faction',
    '10100003-0000-0000-0000-00000000000a'::uuid,
    'editor'
  ),
  (
    'cccccccc-1010-0000-0000-000000000005'::uuid,
    'entity',
    'alliance',
    '10100004-0000-0000-0000-00000000000a'::uuid,
    'editor'
  ),
  (
    'cccccccc-1010-0000-0000-000000000006'::uuid,
    'entity',
    'organization',
    '10100002-0000-0000-0000-00000000000a'::uuid,
    'editor'
  ),
  (
    'cccccccc-1010-0000-0000-000000000007'::uuid,
    'entity',
    'candidate',
    '10100001-0000-0000-0000-00000000000a'::uuid,
    'editor'
  );

-- The grid rows. Per table: one in project A, one in project B, one delete target in project A, and a SIBLING in project A -- the same type, the same project as the grantee's own row, which is the case no pre-existing assertion in this estate covers.
INSERT INTO
  candidates (id, project_id, first_name, last_name)
VALUES
  (
    '10100001-0000-0000-0000-00000000000a'::uuid,
    test_id ('project_a'),
    'Grid',
    'A'
  ),
  (
    '10100001-0000-0000-0000-00000000002a'::uuid,
    test_id ('project_a'),
    'Grid',
    'Sibling'
  ),
  (
    '10100001-0000-0000-0000-00000000000b'::uuid,
    test_id ('project_b'),
    'Grid',
    'B'
  ),
  (
    '10100001-0000-0000-0000-00000000000d'::uuid,
    test_id ('project_a'),
    'Grid',
    'Delete'
  );

INSERT INTO
  organizations (id, project_id)
VALUES
  (
    '10100002-0000-0000-0000-00000000000a'::uuid,
    test_id ('project_a')
  ),
  (
    '10100002-0000-0000-0000-00000000002a'::uuid,
    test_id ('project_a')
  ),
  (
    '10100002-0000-0000-0000-00000000000b'::uuid,
    test_id ('project_b')
  ),
  (
    '10100002-0000-0000-0000-00000000000d'::uuid,
    test_id ('project_a')
  );

INSERT INTO
  factions (id, project_id, organization_id)
VALUES
  (
    '10100003-0000-0000-0000-00000000000a'::uuid,
    test_id ('project_a'),
    test_id ('org_a')
  ),
  (
    '10100003-0000-0000-0000-00000000002a'::uuid,
    test_id ('project_a'),
    test_id ('org_a')
  ),
  (
    '10100003-0000-0000-0000-00000000000b'::uuid,
    test_id ('project_b'),
    test_id ('org_b')
  ),
  (
    '10100003-0000-0000-0000-00000000000d'::uuid,
    test_id ('project_a'),
    test_id ('org_a')
  );

INSERT INTO
  alliances (id, project_id)
VALUES
  (
    '10100004-0000-0000-0000-00000000000a'::uuid,
    test_id ('project_a')
  ),
  (
    '10100004-0000-0000-0000-00000000002a'::uuid,
    test_id ('project_a')
  ),
  (
    '10100004-0000-0000-0000-00000000000b'::uuid,
    test_id ('project_b')
  ),
  (
    '10100004-0000-0000-0000-00000000000d'::uuid,
    test_id ('project_a')
  );

CREATE OR REPLACE FUNCTION entity_select_count (p_table text, p_id uuid) RETURNS integer LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  n integer;
BEGIN
  EXECUTE format('SELECT count(*)::integer FROM public.%I WHERE id = $1', p_table) INTO n USING p_id;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION entity_delete_rowcount (p_table text, p_id uuid) RETURNS integer LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  n integer;
BEGIN
  EXECUTE format('DELETE FROM public.%I WHERE id = $1', p_table) USING p_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

-- An INSERT denied by a WITH CHECK raises 42501 rather than affecting zero rows, so this one is a boolean with the privilege exception caught. Catching only `insufficient_privilege` is deliberate: a NOT NULL or foreign-key violation must still propagate, or a fixture mistake would read as a policy denial.
CREATE OR REPLACE FUNCTION entity_insert_ok (p_table text, p_project_id uuid, p_org_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  CASE p_table
    WHEN 'candidates' THEN
      INSERT INTO public.candidates (project_id, first_name, last_name) VALUES (p_project_id, 'Grid', 'Inserted');
    WHEN 'organizations' THEN
      INSERT INTO public.organizations (project_id) VALUES (p_project_id);
    WHEN 'factions' THEN
      INSERT INTO public.factions (project_id, organization_id) VALUES (p_project_id, p_org_id);
    WHEN 'alliances' THEN
      INSERT INTO public.alliances (project_id) VALUES (p_project_id);
  END CASE;
  RETURN true;
EXCEPTION
  WHEN insufficient_privilege THEN RETURN false;
END;
$$;

-- The visible id SET, not merely its size. "The same number of rows" and "the same rows" are different claims, and only the second one says that authenticated is a SUPERSET of anon rather than a different rule.
CREATE OR REPLACE FUNCTION entity_visible_ids (p_table text) RETURNS text LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  s text;
BEGIN
  EXECUTE format('SELECT COALESCE(string_agg(id::text, '','' ORDER BY id), ''NONE'') FROM public.%I', p_table) INTO s;
  RETURN s;
END;
$$;

-- ---- SELECT: the project-scope grantee of this project, against the equal-rank grantee of the other ----
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-1010-0000-0000-000000000001'::uuid,
    '[]'::jsonb
  );

SELECT
  is (
    entity_select_count (
      'candidates',
      '10100001-0000-0000-0000-00000000000a'
    ) || '/' || entity_select_count (
      'candidates',
      '10100001-0000-0000-0000-00000000000b'
    ),
    '1/0',
    'candidates: a project grantee may select a row in their project and may not select one in another'
  );

SELECT
  is (
    entity_select_count (
      'organizations',
      '10100002-0000-0000-0000-00000000000a'
    ) || '/' || entity_select_count (
      'organizations',
      '10100002-0000-0000-0000-00000000000b'
    ),
    '1/0',
    'organizations: a project grantee may select a row in their project and may not select one in another'
  );

SELECT
  is (
    entity_select_count (
      'factions',
      '10100003-0000-0000-0000-00000000000a'
    ) || '/' || entity_select_count (
      'factions',
      '10100003-0000-0000-0000-00000000000b'
    ),
    '1/0',
    'factions: a project grantee may select a row in their project and may not select one in another'
  );

SELECT
  is (
    entity_select_count (
      'alliances',
      '10100004-0000-0000-0000-00000000000a'
    ) || '/' || entity_select_count (
      'alliances',
      '10100004-0000-0000-0000-00000000000b'
    ),
    '1/0',
    'alliances: a project grantee may select a row in their project and may not select one in another'
  );

-- ---- UPDATE ----
SELECT
  is (
    entity_update_rowcount (
      'candidates',
      '10100001-0000-0000-0000-00000000000a',
      'grid'
    ) || '/' || entity_update_rowcount (
      'candidates',
      '10100001-0000-0000-0000-00000000000b',
      'grid'
    ),
    '1/0',
    'candidates: a project grantee may update a row in their project and may not update one in another'
  );

SELECT
  is (
    entity_update_rowcount (
      'organizations',
      '10100002-0000-0000-0000-00000000000a',
      'grid'
    ) || '/' || entity_update_rowcount (
      'organizations',
      '10100002-0000-0000-0000-00000000000b',
      'grid'
    ),
    '1/0',
    'organizations: a project grantee may update a row in their project and may not update one in another'
  );

SELECT
  is (
    entity_update_rowcount (
      'factions',
      '10100003-0000-0000-0000-00000000000a',
      'grid'
    ) || '/' || entity_update_rowcount (
      'factions',
      '10100003-0000-0000-0000-00000000000b',
      'grid'
    ),
    '1/0',
    'factions: a project grantee may update a row in their project and may not update one in another'
  );

SELECT
  is (
    entity_update_rowcount (
      'alliances',
      '10100004-0000-0000-0000-00000000000a',
      'grid'
    ) || '/' || entity_update_rowcount (
      'alliances',
      '10100004-0000-0000-0000-00000000000b',
      'grid'
    ),
    '1/0',
    'alliances: a project grantee may update a row in their project and may not update one in another'
  );

-- ---- INSERT ----
SELECT
  is (
    entity_insert_ok (
      'candidates',
      test_id ('project_a'),
      test_id ('org_a')
    )::text || '/' || entity_insert_ok (
      'candidates',
      test_id ('project_b'),
      test_id ('org_b')
    )::text,
    'true/false',
    'candidates: a project grantee may insert into their project and may not insert into another'
  );

SELECT
  is (
    entity_insert_ok (
      'organizations',
      test_id ('project_a'),
      test_id ('org_a')
    )::text || '/' || entity_insert_ok (
      'organizations',
      test_id ('project_b'),
      test_id ('org_b')
    )::text,
    'true/false',
    'organizations: a project grantee may insert into their project and may not insert into another'
  );

SELECT
  is (
    entity_insert_ok (
      'factions',
      test_id ('project_a'),
      test_id ('org_a')
    )::text || '/' || entity_insert_ok (
      'factions',
      test_id ('project_b'),
      test_id ('org_b')
    )::text,
    'true/false',
    'factions: a project grantee may insert into their project and may not insert into another'
  );

SELECT
  is (
    entity_insert_ok (
      'alliances',
      test_id ('project_a'),
      test_id ('org_a')
    )::text || '/' || entity_insert_ok (
      'alliances',
      test_id ('project_b'),
      test_id ('org_b')
    )::text,
    'true/false',
    'alliances: a project grantee may insert into their project and may not insert into another'
  );

-- ---- DELETE, against the purpose-built delete targets ----
SELECT
  is (
    entity_delete_rowcount (
      'candidates',
      '10100001-0000-0000-0000-00000000000d'
    ) || '/' || entity_delete_rowcount (
      'candidates',
      '10100001-0000-0000-0000-00000000000b'
    ),
    '1/0',
    'candidates: a project grantee may delete a row in their project and may not delete one in another'
  );

SELECT
  is (
    entity_delete_rowcount (
      'organizations',
      '10100002-0000-0000-0000-00000000000d'
    ) || '/' || entity_delete_rowcount (
      'organizations',
      '10100002-0000-0000-0000-00000000000b'
    ),
    '1/0',
    'organizations: a project grantee may delete a row in their project and may not delete one in another'
  );

SELECT
  is (
    entity_delete_rowcount (
      'factions',
      '10100003-0000-0000-0000-00000000000d'
    ) || '/' || entity_delete_rowcount (
      'factions',
      '10100003-0000-0000-0000-00000000000b'
    ),
    '1/0',
    'factions: a project grantee may delete a row in their project and may not delete one in another'
  );

SELECT
  is (
    entity_delete_rowcount (
      'alliances',
      '10100004-0000-0000-0000-00000000000d'
    ) || '/' || entity_delete_rowcount (
      'alliances',
      '10100004-0000-0000-0000-00000000000b'
    ),
    '1/0',
    'alliances: a project grantee may delete a row in their project and may not delete one in another'
  );

-- =====================================================================
-- Section 6: the entity grantee -- own row against its same-type same-project sibling (27-34)
-- =====================================================================
-- THE ASSERTION THIS WHOLE FILE EXISTS FOR, now asked of all four types. `01-tenant-isolation.test.sql` proves a caller of project A cannot reach project B; nothing in the estate proved that an entity grantee of row A cannot reach row A2 of the SAME TYPE in the SAME PROJECT -- which is exactly what a predicate written `user_can ('project', project_id, ...)` would permit while every other assertion stayed green.
--
-- The second assertion of each pair is section 3.3's two `—` cells stated as behaviour: an entity grantee holds NEITHER project.read_entities NOR project.edit_entities, so its reach ends at its own row. Without it a predicate that added a project disjunct to the entity policies would satisfy the first assertion.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-1010-0000-0000-000000000007'::uuid,
    '[]'::jsonb
  );

SELECT
  is (
    entity_select_count (
      'candidates',
      '10100001-0000-0000-0000-00000000000a'
    ) || '/' || entity_select_count (
      'candidates',
      '10100001-0000-0000-0000-00000000002a'
    ),
    '1/0',
    'candidates: an entity grantee reads its own non-public row and NOT its same-type same-project sibling'
  );

SELECT
  is (
    entity_update_rowcount (
      'candidates',
      '10100001-0000-0000-0000-00000000000a',
      'own'
    ) || '/' || entity_update_rowcount (
      'candidates',
      '10100001-0000-0000-0000-00000000002a',
      'sibling'
    ),
    '1/0',
    'candidates: an entity grantee updates its own row and NOT its same-type same-project sibling'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-1010-0000-0000-000000000006'::uuid,
    '[]'::jsonb
  );

SELECT
  is (
    entity_select_count (
      'organizations',
      '10100002-0000-0000-0000-00000000000a'
    ) || '/' || entity_select_count (
      'organizations',
      '10100002-0000-0000-0000-00000000002a'
    ),
    '1/0',
    'organizations: an entity grantee reads its own non-public row and NOT its same-type same-project sibling'
  );

SELECT
  is (
    entity_update_rowcount (
      'organizations',
      '10100002-0000-0000-0000-00000000000a',
      'own'
    ) || '/' || entity_update_rowcount (
      'organizations',
      '10100002-0000-0000-0000-00000000002a',
      'sibling'
    ),
    '1/0',
    'organizations: an entity grantee updates its own row and NOT its same-type same-project sibling'
  );

-- The two grant shapes that had NO policy to consult before P-3(a). Their beneficiary population in the real system is still zero, so these are the only assertions anywhere that exercise the write path at all.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-1010-0000-0000-000000000004'::uuid,
    '[]'::jsonb
  );

SELECT
  is (
    entity_select_count (
      'factions',
      '10100003-0000-0000-0000-00000000000a'
    ) || '/' || entity_select_count (
      'factions',
      '10100003-0000-0000-0000-00000000002a'
    ),
    '1/0',
    'factions: an entity grantee reads its own non-public row and NOT its same-type same-project sibling'
  );

SELECT
  is (
    entity_update_rowcount (
      'factions',
      '10100003-0000-0000-0000-00000000000a',
      'own'
    ) || '/' || entity_update_rowcount (
      'factions',
      '10100003-0000-0000-0000-00000000002a',
      'sibling'
    ),
    '1/0',
    'factions: an entity grantee updates its own row and NOT its same-type same-project sibling -- the cell P-3(a) made exercisable'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-1010-0000-0000-000000000005'::uuid,
    '[]'::jsonb
  );

SELECT
  is (
    entity_select_count (
      'alliances',
      '10100004-0000-0000-0000-00000000000a'
    ) || '/' || entity_select_count (
      'alliances',
      '10100004-0000-0000-0000-00000000002a'
    ),
    '1/0',
    'alliances: an entity grantee reads its own non-public row and NOT its same-type same-project sibling'
  );

SELECT
  is (
    entity_update_rowcount (
      'alliances',
      '10100004-0000-0000-0000-00000000000a',
      'own'
    ) || '/' || entity_update_rowcount (
      'alliances',
      '10100004-0000-0000-0000-00000000002a',
      'sibling'
    ),
    '1/0',
    'alliances: an entity grantee updates its own row and NOT its same-type same-project sibling -- the cell P-3(a) made exercisable'
  );

-- =====================================================================
-- Section 6b: the UPDATE denial asked against a row the caller CAN SEE (35-38)
-- =====================================================================
-- ⚠ THIS SECTION EXISTS BECAUSE THE NEGATIVE CONTROL CAUGHT THE SECTION ABOVE NOT MEASURING WHAT IT CLAIMED.
-- PostgreSQL applies the SELECT policies as well as the UPDATE policy to an `UPDATE ... WHERE id = $1`, because the WHERE clause READS a column. The sibling rows in section 6 are unpublished and unnominated, so they are invisible to their caller -- and the zero those assertions report is produced by the SELECT policy whether or not the UPDATE predicate is sound. Measured: against a deliberately row-unbound `USING (true)` on all four self-update policies, section 6's four UPDATE denials stayed GREEN.
--
-- So the deny half is re-asked here against rows the caller demonstrably CAN see -- the shared fixture's project-A entities, each confirmed, nominated and therefore anon-visible, which section 9 below independently confirms. Now the SELECT policy admits the row and the UPDATE predicate is the only thing that can refuse it, which is the question these assertions are supposed to ask. Against the same `USING (true)` variant all four redden.
--
-- Keep BOTH sections. Section 6 states that an entity grantee cannot reach its sibling AT ALL; this one states that the UPDATE predicate by itself refuses a visible sibling. Defence in depth is only defence if each layer is measured on its own.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-1010-0000-0000-000000000007'::uuid,
    '[]'::jsonb
  );

SELECT
  is (
    entity_select_count ('candidates', test_id ('candidate_a')) || '/' || entity_update_rowcount (
      'candidates',
      test_id ('candidate_a'),
      'visible-sibling'
    ),
    '1/0',
    'candidates: an entity grantee CAN SEE the public sibling and still cannot update it -- the UPDATE predicate refusing, not the SELECT policy hiding'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-1010-0000-0000-000000000006'::uuid,
    '[]'::jsonb
  );

SELECT
  is (
    entity_select_count ('organizations', test_id ('org_a')) || '/' || entity_update_rowcount (
      'organizations',
      test_id ('org_a'),
      'visible-sibling'
    ),
    '1/0',
    'organizations: an entity grantee CAN SEE the public sibling and still cannot update it'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-1010-0000-0000-000000000004'::uuid,
    '[]'::jsonb
  );

SELECT
  is (
    entity_select_count ('factions', test_id ('faction_a')) || '/' || entity_update_rowcount (
      'factions',
      test_id ('faction_a'),
      'visible-sibling'
    ),
    '1/0',
    'factions: an entity grantee CAN SEE the public sibling and still cannot update it'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-1010-0000-0000-000000000005'::uuid,
    '[]'::jsonb
  );

SELECT
  is (
    entity_select_count ('alliances', test_id ('alliance_a')) || '/' || entity_update_rowcount (
      'alliances',
      test_id ('alliance_a'),
      'visible-sibling'
    ),
    '1/0',
    'alliances: an entity grantee CAN SEE the public sibling and still cannot update it'
  );

-- =====================================================================
-- Section 7: the column bound on the two new write paths (39-40)
-- =====================================================================
-- A row predicate cannot withhold a column, so the only thing standing between a faction editor and `project_id` is 303-column-grants.sql. Asked here as BEHAVIOUR, on the same caller whose allow half passed two assertions ago, rather than only as a catalogue count in 15-visibility-flags.test.sql.
SELECT
  throws_ok (
    $$UPDATE alliances SET project_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' WHERE id = '10100004-0000-0000-0000-00000000000a'$$,
    '42501',
    NULL,
    'alliances: an entity editor that MAY update its own row still may not name project_id -- the column bound, not the row predicate'
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-1010-0000-0000-000000000004'::uuid,
    '[]'::jsonb
  );

SELECT
  throws_ok (
    $$UPDATE factions SET project_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' WHERE id = '10100003-0000-0000-0000-00000000000a'$$,
    '42501',
    NULL,
    'factions: an entity editor that MAY update its own row still may not name project_id -- so the new write path cannot move a row between tenants'
  );

-- =====================================================================
-- Section 8: the project-editor boundary (37-38)
-- =====================================================================
-- D-07 and section 3.3: a ProjectEditor holds `project.edit_entities` -- which is why `admin_*` is now a misnomer -- and does NOT hold `project.edit_project_settings`, D-09's split. Both asked of the same caller, so the pair differs in exactly the permission under test rather than in the identity.
SELECT
  set_test_user (
    'authenticated',
    'cccccccc-1010-0000-0000-000000000003'::uuid,
    '[]'::jsonb
  );

SELECT
  is (
    entity_update_rowcount (
      'candidates',
      '10100001-0000-0000-0000-00000000000a',
      'editor'
    ),
    1,
    'a project EDITOR may update an entity in their project -- it holds project.edit_entities, which is why admin_* is now a misnomer'
  );

SELECT
  is (
    (
      SELECT
        user_can (
          'project',
          test_id ('project_a'),
          'project.edit_project_settings'
        )
    )::text || '/' || (
      SELECT
        user_can (
          'project',
          test_id ('project_a'),
          'project.edit_entities'
        )
    )::text,
    'false/true',
    'the same project EDITOR is denied project.edit_project_settings and allowed project.edit_entities -- D-09''s split, asked of one caller so the pair differs in exactly the permission'
  );

-- =====================================================================
-- Section 9: authenticated is a SUPERSET of anon, per table (39-43)
-- =====================================================================
-- Section 3.4 is silent on what an authenticated user with NO grant in the project may read, and the answer has always been "whatever anon may read". Since 162-10 that is literally the same expression on both halves -- one `entity_is_anon_visible` call until D-36, and since D-36 the same assembly of the same two helper calls -- so this states the relation as an equality of ID SETS rather than of counts. Two policies returning the same NUMBER of different rows is the failure a count cannot see.
SELECT
  set_test_user ('anon');

SELECT
  set_config(
    'gsd162.anon_ids',
    entity_visible_ids ('candidates') || '|' || entity_visible_ids ('organizations') || '|' || entity_visible_ids ('factions') || '|' || entity_visible_ids ('alliances'),
    true
  );

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-1010-0000-0000-0000000000ff'::uuid,
    '[]'::jsonb
  );

SELECT
  is (
    entity_visible_ids ('candidates'),
    split_part(current_setting('gsd162.anon_ids'), '|', 1),
    'candidates: an authenticated caller with no grants sees exactly the ID SET an anon caller sees'
  );

SELECT
  is (
    entity_visible_ids ('organizations'),
    split_part(current_setting('gsd162.anon_ids'), '|', 2),
    'organizations: an authenticated caller with no grants sees exactly the ID SET an anon caller sees'
  );

SELECT
  is (
    entity_visible_ids ('factions'),
    split_part(current_setting('gsd162.anon_ids'), '|', 3),
    'factions: an authenticated caller with no grants sees exactly the ID SET an anon caller sees'
  );

SELECT
  is (
    entity_visible_ids ('alliances'),
    split_part(current_setting('gsd162.anon_ids'), '|', 4),
    'alliances: an authenticated caller with no grants sees exactly the ID SET an anon caller sees'
  );

-- THE NON-VACUITY FLOOR for the four assertions above. Four equalities between two empty sets are four assertions that cannot fail. At least one table must actually be showing the anon caller a row.
SELECT
  ok (
    (
      SELECT
        count(*)
      FROM
        regexp_split_to_table(current_setting('gsd162.anon_ids'), '\|') s
      WHERE
        s <> 'NONE'
    ) > 0,
    'at least one of the four id sets compared above is non-empty, so those equalities are measurements rather than two empty sets agreeing'
  );

-- =====================================================================
-- Section 10: the structural properties, guarded by the estate rather than by one plan's shell (44-51)
-- =====================================================================
-- Task 4 proved each of these once, in a shell. A shell check runs when that plan runs and never again.
SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND 'authenticated' = ANY (roles)
        AND COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%user_can%'
    ),
    20,
    'all twenty TO authenticated policies on the four entity tables delegate to user_can -- the count is pinned, so a policy dropped rather than converted reddens here too'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND 'authenticated' = ANY (roles)
        AND (
          COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%can_access_project%'
          OR COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%has_role%'
          OR COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%is_candidate_self%'
          OR COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%uid()%'
          OR COALESCE(qual, '') || COALESCE(with_check, '') LIKE '%published%'
        )
    ),
    0,
    'no converted entity policy re-derives a rule answered elsewhere: not the two shims, not the retired self-ownership predicate, not an auth.uid() comparison, not the publication column'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND 'anon' = ANY (roles)
    ),
    4,
    'the four anon entity policies are still four -- V-6(A) re-expressed them, it did not create or drop one'
  );

-- ⚠ RE-POINTED BY D-36 (2026-09-17) FROM THE COMPOSITION TO THE TWO SUB-RULES IT COMPOSED. 162-10 asserted this of `entity_is_anon_visible`; that function is gone, because a SECURITY DEFINER composition calling two SECURITY DEFINER helpers pays a depth-2 per-row call and cost 271.9 ms anon against 39.4 for the direct calls. The property being asserted did not move -- SECURITY DEFINER with a pinned search_path is the escalation primitive, and D-21's "the entity type is an ARGUMENT" is the naming rule -- only the functions it is asserted OF. Both clauses now read the two helpers that survive, and `entity_has_confirmed_nomination` is the one that takes the entity type, still first.
--
-- THE THIRD CLAUSE IS NEW AND IS THE POINT OF RE-POINTING RATHER THAN DELETING: `entity_is_anon_visible` must not EXIST. Without it the composition could be reintroduced by any later plan and nothing in the estate would say so, and D-36's whole basis is that it is not there.
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname IN ('public', 'private')
        AND p.proname IN (
          'project_open_for_voters',
          'entity_has_confirmed_nomination'
        )
        AND p.prosecdef
        AND EXISTS (
          SELECT
            1
          FROM
            unnest(p.proconfig) c
          WHERE
            c LIKE 'search_path=%'
        )
    ) || '/' || (
      SELECT
        count(*)::integer
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname IN ('public', 'private')
        AND p.proname = 'entity_has_confirmed_nomination'
        AND pg_catalog.format_type (p.proargtypes[0], NULL) = 'entity_type'
    ) || '/' || (
      SELECT
        count(*)::integer
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'entity_is_anon_visible'
    ),
    '2/1/0',
    'both public-visibility sub-rules are SECURITY DEFINER with a pinned search_path and the one that discriminates on entity type takes it as its FIRST ARGUMENT (D-21, and the escalation primitive a mutable search_path would be); and the composition D-36 withdrew does not exist, so it cannot come back unremarked'
  );

-- The invariant the SECURITY DEFINER bypass rests on, and it now carries two plans' weight: 162-08's helpers read other tables from a policy, and 162-10 added a helper that reads the table its own policy filters. A later `ALTER TABLE ... FORCE ROW LEVEL SECURITY` on any of these six turns the recursion back on, and it would surface as a query-time error in twenty policies rather than as a schema diff.
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE
        n.nspname = 'public'
        AND c.relname IN (
          'projects',
          'nominations',
          'candidates',
          'organizations',
          'factions',
          'alliances'
        )
    ) || '/' || (
      SELECT
        count(*)::integer
      FROM
        pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE
        n.nspname = 'public'
        AND c.relname IN (
          'projects',
          'nominations',
          'candidates',
          'organizations',
          'factions',
          'alliances'
        )
        AND c.relforcerowsecurity
    ),
    '6/0',
    'six tables examined and none carries FORCE ROW LEVEL SECURITY -- the examined count is asserted too, so a clean answer cannot come from a query that reached nothing'
  );

-- D-21 MADE STRUCTURAL. For each verb family the four policy expressions, with the table name and the entity-type literal replaced by placeholders, must be ONE string. This is what makes "no predicate names a single entity type where it could take one as an argument" a checkable property of the applied database rather than a sentence in a plan -- and it is the shape 162-14 inherits for the storage policies.
--
-- ⚠ THE SELECT FAMILY IS THE ONE EXCEPTION, AND IT IS AN ACCEPTED COST OF D-36 (2026-09-17) RATHER THAN A DEFECT TO REPAIR. Under V-6(A) all eight entity SELECT policies delegated the public-visibility rule to one `entity_is_anon_visible (entity_type, id)` call, and that is what made the SELECT family collapse to one string. D-36 removed the composition -- the nesting cost 271.9 ms anon against 39.4 for the two helpers called directly -- so the rule is now ASSEMBLED in each qual, and `candidates` alone carries the two terms-of-use conjuncts, which are a property of that table and of no other. The normaliser therefore strips those two conjuncts as well, the message says so, and the assertion immediately after it pins the stripped term to exactly two of the eight policies so the strip cannot be vacuous. The stronger claim is not preserved by re-deriving it somewhere else; it is WITHDRAWN, and 162-17 owes in its place a guard holding the eight assemblies identical.
--
-- The other four families are untouched by D-36 and still collapse to one string with no strip at all.
SELECT
  is (
    (
      SELECT
        count(DISTINCT normalised)::integer
      FROM
        (
          SELECT
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        replace(
                          replace(
                            COALESCE(qual, '-') || '~' || COALESCE(with_check, '-'),
                            ' AND (terms_of_use_accepted IS NOT NULL) AND (terms_of_use_accepted < now())',
                            ''
                          ),
                          tablename || '.',
                          'TBL.'
                        ),
                        '''candidate''',
                        'ENT'
                      ),
                      '''organization''',
                      'ENT'
                    ),
                    '''faction''',
                    'ENT'
                  ),
                  '''alliance''',
                  'ENT'
                ),
                'candidates',
                'TBL'
              ),
              'organizations',
              'TBL'
            ) AS normalised
          FROM
            pg_policies
          WHERE
            schemaname = 'public'
            AND tablename IN (
              'organizations',
              'candidates',
              'factions',
              'alliances'
            )
            AND 'authenticated' = ANY (roles)
            AND cmd = 'SELECT'
        ) f
    ),
    1,
    'D-21 structural, SELECT family: the four entity tables'' SELECT predicates are ONE expression modulo the table name, the entity-type literal and the two terms-of-use conjuncts candidates alone carries -- narrowed by D-36 from the claim V-6(A) supported'
  );

SELECT
  is (
    (
      SELECT
        count(*) FILTER (
          WHERE
            COALESCE(qual, '') LIKE '% AND (terms_of_use_accepted IS NOT NULL) AND (terms_of_use_accepted < now())%'
        )::text || '/' || count(*)::text
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND cmd = 'SELECT'
    ),
    '2/8',
    'the term the SELECT-family normaliser strips is carried by exactly TWO of the EIGHT entity SELECT policies -- both of them candidates'' -- so the strip removes something real, the population it strips from is the whole eight, and no other entity table has acquired a terms-of-use conjunct'
  );

SELECT
  is (
    (
      SELECT
        count(
          DISTINCT replace(
            COALESCE(with_check, '-'),
            tablename || '.',
            'TBL.'
          )
        )::integer
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND cmd = 'INSERT'
        AND 'authenticated' = ANY (roles)
    ),
    1,
    'D-21 structural, INSERT family: one expression across the four tables'
  );

SELECT
  is (
    (
      SELECT
        count(
          DISTINCT replace(COALESCE(qual, '-'), tablename || '.', 'TBL.')
        )::integer
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND cmd = 'DELETE'
        AND 'authenticated' = ANY (roles)
    ),
    1,
    'D-21 structural, DELETE family: one expression across the four tables'
  );

SELECT
  is (
    (
      SELECT
        count(
          DISTINCT replace(
            COALESCE(qual, '-') || '~' || COALESCE(with_check, '-'),
            tablename || '.',
            'TBL.'
          )
        )::integer
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND cmd = 'UPDATE'
        AND policyname LIKE 'admin\_%'
        AND 'authenticated' = ANY (roles)
    ),
    1,
    'D-21 structural, admin UPDATE family: one expression across the four tables'
  );

-- The fifth family exists ONLY because P-3(a) added the two missing policies. Under P-3(b) the four tables would have carried two shapes and this assertion could not have been written at all.
SELECT
  is (
    (
      SELECT
        count(*)::integer || '/' || count(
          DISTINCT replace(
            COALESCE(qual, '-') || '~' || COALESCE(with_check, '-'),
            tablename || '.',
            'TBL.'
          )
        )::integer
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND cmd = 'UPDATE'
        AND policyname LIKE 'entity\_update\_own\_%'
        AND 'authenticated' = ANY (roles)
    ),
    '4/1',
    'D-21 structural, self-update family: all FOUR tables carry one, and it is one expression -- the fifth family exists only because P-3(a) added the two that were missing'
  );

-- =====================================================================
-- Section 11: every privileged function in the schema, not just this plan's (58)
-- =====================================================================
-- 16-anon-visibility.test.sql pins this for 162-08's three helpers by name. 162-10 adds a fourth that a policy calls PER ROW, and the phase now has eleven -- so the claim is made over the whole schema instead of a name list, because a name list only ever covers the functions someone remembered to add to it.
--
-- A mutable search_path on a SECURITY DEFINER function that reads tables the caller cannot read is a privilege-escalation primitive, not a style preference: the caller controls search_path, so it chooses which `projects` or `nominations` the owner-rights body resolves. Read from pg_proc.proconfig, because the catalogue is what runs and the file is not. The examined count is floored so `NONE` cannot come from a query that reached nothing.
SELECT
  is (
    (
      SELECT
        COALESCE(
          string_agg(
            p.proname,
            ','
            ORDER BY
              p.proname
          ),
          'NONE'
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname IN ('public', 'private')
        AND p.prosecdef
        AND NOT EXISTS (
          SELECT
            1
          FROM
            unnest(COALESCE(p.proconfig, ARRAY[]::text[])) c
          WHERE
            c LIKE 'search_path=%'
        )
    ) || ' / examined>=15:' || (
      SELECT
        (count(*) >= 15)::text
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname IN ('public', 'private')
        AND p.prosecdef
    ),
    'NONE / examined>=15:true',
    'every SECURITY DEFINER function in schemas public and private pins its search_path, over a population floored at fifteen -- the floor is asserted too, so a clean NONE cannot come from a query that reached no functions'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
