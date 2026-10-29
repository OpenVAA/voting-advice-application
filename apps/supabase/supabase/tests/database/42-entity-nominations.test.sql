-- 42-entity-nominations.test.sql: an entity's own nominations, with the parent each stands under resolved
--
-- `get_entity_nominations` answers the editor of one candidate or organization with that entity's nominations in one project, confirmed or not, as a jsonb array. Each element names the election and the constituency, carries the round, the election symbol, the confirmation flag, the custom data and the time it was last updated, and holds the parent as its entity type, entity id, name and short name, or as a JSON null. This file pins the answer for a candidate and for an organization; the parent resolved where the caller's own row-level security refuses both the parent's nomination and the parent's entity row, under an unconfirmed parent and in a project closed for voters, each beside the control that the same read succeeds for a confirmed parent in an open project; the keys of an element and of a parent, and that neither the creator of a row nor anything of the parent beyond those four keys leaves; the empty array for an entity with no nomination; and every refusal, each of which is a NULL and never a raise.
--
-- The refused callers are another entity's editor, a caller naming an id that exists nowhere, a caller naming its own id under another type or another project, the editor of the parent organization, a faction's editor, a project admin with and without an admin-role grant on the entity, and a global admin. anon is refused by privilege.
--
-- Every impersonation passes an empty grant array, so each claim is projected from the rows this file writes.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_seed_identity_grants).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (70);

SELECT
  create_test_data ();

-- =====================================================================
-- Fixture, local to this transaction
-- =====================================================================
-- An unconfirmed organization and an unconfirmed alliance in project A, which is open for voters, and a confirmed organization in project B, which is closed. The fourth organization shares candidate_a's id: the entity tables have independent primary keys, so one uuid names a candidate and an organization of the same project.
INSERT INTO
  organizations (id, project_id, name, short_name, info, confirmed)
VALUES
  (
    '42424242-4242-4242-4242-0000000000b1',
    test_id ('project_a'),
    '{"en":"Pending Party","fi":"Odottava puolue"}'::jsonb,
    '{"en":"PP"}'::jsonb,
    '{"en":"Unpublished description of the pending party"}'::jsonb,
    false
  ),
  (
    '42424242-4242-4242-4242-0000000000b2',
    test_id ('project_b'),
    '{"en":"Closed Project Party"}'::jsonb,
    '{"en":"CPP"}'::jsonb,
    NULL,
    true
  ),
  (
    test_id ('candidate_a'),
    test_id ('project_a'),
    '{"en":"Organization sharing an id"}'::jsonb,
    NULL,
    NULL,
    false
  );

INSERT INTO
  alliances (id, project_id, name, short_name, confirmed)
VALUES
  (
    '42424242-4242-4242-4242-0000000000b3',
    test_id ('project_a'),
    '{"en":"Pending Alliance"}'::jsonb,
    '{"en":"PA"}'::jsonb,
    false
  );

-- The parents' nominations. A child shares its parent's election, constituency and round, so each parent stands at the round its child is given below.
INSERT INTO
  nominations (
    id,
    project_id,
    organization_id,
    alliance_id,
    election_id,
    constituency_id,
    election_round,
    confirmed,
    name,
    election_symbol,
    custom_data
  )
VALUES
  (
    '42424242-4242-4242-4242-000000000101',
    test_id ('project_a'),
    '42424242-4242-4242-4242-0000000000b1',
    NULL,
    test_id ('election_a'),
    test_id ('constituency_a'),
    2,
    false,
    '{"en":"Label of the parent nomination"}'::jsonb,
    '99',
    '{"note":"data of the parent nomination"}'::jsonb
  ),
  (
    '42424242-4242-4242-4242-000000000102',
    test_id ('project_b'),
    '42424242-4242-4242-4242-0000000000b2',
    NULL,
    test_id ('election_b'),
    test_id ('constituency_b'),
    2,
    true,
    NULL,
    NULL,
    NULL
  ),
  (
    '42424242-4242-4242-4242-000000000103',
    test_id ('project_a'),
    NULL,
    '42424242-4242-4242-4242-0000000000b3',
    test_id ('election_a'),
    test_id ('constituency_a'),
    3,
    false,
    NULL,
    NULL,
    NULL
  );

-- candidate_a gains three nominations beside the confirmed one the shared fixture gives it under org_a: one under the unconfirmed organization, one under faction_a and one with no parent. The first names admin_b as its creator. candidate_b gains one under the confirmed organization of the closed project.
INSERT INTO
  nominations (
    id,
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round,
    parent_nomination_id,
    confirmed,
    sort_order,
    election_symbol,
    custom_data,
    created_by
  )
VALUES
  (
    '42424242-4242-4242-4242-000000000a01',
    test_id ('project_a'),
    test_id ('candidate_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    2,
    '42424242-4242-4242-4242-000000000101',
    false,
    2,
    '12',
    '{"note":"awaiting the party"}'::jsonb,
    test_user_id ('admin_b')
  ),
  (
    '42424242-4242-4242-4242-000000000a02',
    test_id ('project_a'),
    test_id ('candidate_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    test_id ('nomination_faction_a'),
    false,
    1,
    NULL,
    NULL,
    NULL
  ),
  (
    '42424242-4242-4242-4242-000000000a03',
    test_id ('project_a'),
    test_id ('candidate_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    3,
    NULL,
    false,
    NULL,
    NULL,
    '{"requestedParentOrganization":"A party not in the system"}'::jsonb,
    NULL
  ),
  (
    '42424242-4242-4242-4242-000000000a04',
    test_id ('project_b'),
    test_id ('candidate_b'),
    test_id ('election_b'),
    test_id ('constituency_b'),
    2,
    '42424242-4242-4242-4242-000000000102',
    true,
    NULL,
    NULL,
    NULL,
    NULL
  );

-- org_a gains a nomination under the unconfirmed alliance, and the organization sharing candidate_a's id is nominated once, with no parent.
INSERT INTO
  nominations (
    id,
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round,
    parent_nomination_id,
    confirmed
  )
VALUES
  (
    '42424242-4242-4242-4242-000000000a05',
    test_id ('project_a'),
    test_id ('org_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    3,
    '42424242-4242-4242-4242-000000000103',
    false
  ),
  (
    '42424242-4242-4242-4242-000000000a06',
    test_id ('project_a'),
    test_id ('candidate_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    5,
    NULL,
    false
  );

-- The editor rows of four fixture identities and the admin rows of two. organization_a also edits the organization sharing candidate_a's id.
SELECT
  test_seed_identity_grants ('candidate_a');

SELECT
  test_seed_identity_grants ('candidate_a2');

SELECT
  test_seed_identity_grants ('candidate_b');

SELECT
  test_seed_identity_grants ('organization_a');

SELECT
  test_seed_identity_grants ('admin_a');

SELECT
  test_seed_identity_grants ('super_admin');

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    test_user_id ('organization_a'),
    'entity',
    'organization',
    test_id ('candidate_a'),
    'editor'
  );

-- What makes each parent unreadable to its child: the unconfirmed pair stands in the open project, and the confirmed pair in the closed one.
SELECT
  is (
    ARRAY[
      project_open_for_voters (test_id ('project_a')),
      (
        SELECT
          confirmed
        FROM
          organizations
        WHERE
          id = '42424242-4242-4242-4242-0000000000b1'
      ),
      (
        SELECT
          confirmed
        FROM
          nominations
        WHERE
          id = '42424242-4242-4242-4242-000000000101'
      ),
      project_open_for_voters (test_id ('project_b')),
      (
        SELECT
          confirmed
        FROM
          organizations
        WHERE
          id = '42424242-4242-4242-4242-0000000000b2'
      ),
      (
        SELECT
          confirmed
        FROM
          nominations
        WHERE
          id = '42424242-4242-4242-4242-000000000102'
      )
    ],
    ARRAY[true, false, false, false, true, true],
    'the fixture: an unconfirmed parent and its unconfirmed nomination in the open project, a confirmed parent and its confirmed nomination in the closed one'
  );

SELECT
  is (
    (
      SELECT
        created_by
      FROM
        nominations
      WHERE
        id = '42424242-4242-4242-4242-000000000a01'
    ),
    test_user_id ('admin_b'),
    'the fixture: the stored nomination names the user who created it'
  );

-- =====================================================================
-- The function in the catalogue
-- =====================================================================
SELECT
  ok (
    COALESCE(
      (
        SELECT
          p.prosecdef
          AND 'search_path=""' = ANY (p.proconfig)
          AND p.provolatile = 's'
          AND p.pronargdefaults = 0
          AND p.prorettype = 'jsonb'::regtype
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE
          n.nspname = 'public'
          AND p.proname = 'get_entity_nominations'
          AND pg_get_function_identity_arguments(p.oid) = 'p_project_id uuid, p_entity_type entity_type, p_entity_id uuid'
      ),
      false
    ),
    'get_entity_nominations (project, type, id) returns jsonb, is STABLE and SECURITY DEFINER with an empty search_path, and no parameter carries a default'
  );

SELECT
  ok (
    COALESCE(
      (
        SELECT
          has_function_privilege('authenticated', p.oid, 'EXECUTE')
          AND NOT has_function_privilege('anon', p.oid, 'EXECUTE')
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE
          n.nspname = 'public'
          AND p.proname = 'get_entity_nominations'
      ),
      false
    ),
    'authenticated may execute get_entity_nominations and anon may not'
  );

-- The answer public.get_entity_nominations gives the caller for one entity.
CREATE FUNCTION pg_temp.answer (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS jsonb LANGUAGE sql AS $$
  SELECT public.get_entity_nominations(p_project_id, p_entity_type, p_entity_id);
$$;

-- How many elements that answer holds.
CREATE FUNCTION pg_temp.element_count (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS integer LANGUAGE sql AS $$
  SELECT jsonb_array_length(public.get_entity_nominations(p_project_id, p_entity_type, p_entity_id));
$$;

-- The nomination ids of the answer's elements, in the order answered.
CREATE FUNCTION pg_temp.listed (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS text LANGUAGE sql AS $$
  SELECT COALESCE(string_agg(e.element ->> 'id', ',' ORDER BY e.ord), '')
  FROM jsonb_array_elements(public.get_entity_nominations(p_project_id, p_entity_type, p_entity_id)) WITH ORDINALITY AS e (element, ord);
$$;

-- The element of the answer that describes one nomination.
CREATE FUNCTION pg_temp.element (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_nomination_id uuid
) RETURNS jsonb LANGUAGE sql AS $$
  SELECT e.element
  FROM jsonb_array_elements(public.get_entity_nominations(p_project_id, p_entity_type, p_entity_id)) AS e (element)
  WHERE e.element ->> 'id' = p_nomination_id::text;
$$;

-- The sorted keys of the answer's elements, one list per distinct key set: a single list when every element holds the same keys.
CREATE FUNCTION pg_temp.element_keys (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS text LANGUAGE sql AS $$
  SELECT string_agg(DISTINCT k.keys, ' | ')
  FROM (
    SELECT (SELECT string_agg(j.key, ',' ORDER BY j.key) FROM jsonb_object_keys(e.element) AS j (key)) AS keys
    FROM jsonb_array_elements(public.get_entity_nominations(p_project_id, p_entity_type, p_entity_id)) AS e (element)
  ) k;
$$;

-- The same over the parents of the elements that have one.
CREATE FUNCTION pg_temp.parent_keys (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS text LANGUAGE sql AS $$
  SELECT string_agg(DISTINCT k.keys, ' | ')
  FROM (
    SELECT (SELECT string_agg(j.key, ',' ORDER BY j.key) FROM jsonb_object_keys(e.element -> 'parent') AS j (key)) AS keys
    FROM jsonb_array_elements(public.get_entity_nominations(p_project_id, p_entity_type, p_entity_id)) AS e (element)
    WHERE jsonb_typeof(e.element -> 'parent') = 'object'
  ) k;
$$;

-- =====================================================================
-- A candidate's editor, in the open project
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

-- Through the tables the unconfirmed parent is refused, nomination row and entity row alike. The confirmed parent of the same candidate is the control: the same two reads return it.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        nominations
      WHERE
        id = '42424242-4242-4242-4242-000000000101'
    )::integer,
    0,
    'through the tables a candidate cannot read the nomination of its unconfirmed parent organization'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        organizations
      WHERE
        id = '42424242-4242-4242-4242-0000000000b1'
    )::integer,
    0,
    'nor the row of that organization'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        nominations
      WHERE
        id = test_id ('nomination_org_a')
    )::integer,
    1,
    'control: the same candidate reads the nomination of its confirmed parent in the open project'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        organizations
      WHERE
        id = test_id ('org_a')
    )::integer,
    1,
    'control: and the row of that organization'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.get_entity_nominations(%L, 'candidate', %L)$$,
      test_id ('project_a'),
      test_id ('candidate_a')
    ),
    'a candidate''s editor asking for its own candidate raises nothing'
  );

SELECT
  is (
    jsonb_typeof(
      pg_temp.answer (
        test_id ('project_a'),
        'candidate',
        test_id ('candidate_a')
      )
    ),
    'array',
    'the answer is a jsonb array'
  );

SELECT
  is (
    pg_temp.element_count (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a')
    ),
    4,
    'it holds every nomination of the candidate, confirmed or not'
  );

SELECT
  is (
    pg_temp.listed (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a')
    ),
    '42424242-4242-4242-4242-000000000a02,42424242-4242-4242-4242-000000000a01,42424242-4242-4242-4242-000000000a03,' || test_id ('nomination_cand_a')::text,
    'in the order of sort_order with nulls last and then id, and without the nomination of the organization that shares the candidate''s id'
  );

SELECT
  is (
    pg_temp.element (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      test_id ('nomination_cand_a')
    ) -> 'confirmed',
    'true'::jsonb,
    'a confirmed nomination is answered as confirmed'
  );

SELECT
  is (
    pg_temp.element (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      '42424242-4242-4242-4242-000000000a01'
    ) -> 'confirmed',
    'false'::jsonb,
    'an unconfirmed nomination is answered as unconfirmed'
  );

SELECT
  is (
    pg_temp.element (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      '42424242-4242-4242-4242-000000000a01'
    ),
    jsonb_build_object(
      'id',
      '42424242-4242-4242-4242-000000000a01',
      'election_id',
      test_id ('election_a'),
      'election_name',
      '{"en":"Election A"}'::jsonb,
      'constituency_id',
      test_id ('constituency_a'),
      'constituency_name',
      '{"en":"Constituency A"}'::jsonb,
      'election_round',
      2,
      'election_symbol',
      '12',
      'confirmed',
      false,
      'custom_data',
      '{"note":"awaiting the party"}'::jsonb,
      'updated_at',
      (
        SELECT
          n.updated_at
        FROM
          nominations n
        WHERE
          n.id = '42424242-4242-4242-4242-000000000a01'
      ),
      'parent',
      '{"entity_type":"organization","entity_id":"42424242-4242-4242-4242-0000000000b1","name":{"en":"Pending Party","fi":"Odottava puolue"},"short_name":{"en":"PP"}}'::jsonb
    ),
    'an element is the nomination''s id, election and constituency with their localized names, round, symbol, confirmation, custom data, updated_at and parent, and nothing else'
  );

SELECT
  is (
    pg_temp.element (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      '42424242-4242-4242-4242-000000000a01'
    ) -> 'parent',
    '{"entity_type":"organization","entity_id":"42424242-4242-4242-4242-0000000000b1","name":{"en":"Pending Party","fi":"Odottava puolue"},"short_name":{"en":"PP"}}'::jsonb,
    'the unconfirmed parent the tables refuse is resolved to its entity type, entity id, name and short name'
  );

SELECT
  is (
    pg_temp.element (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      test_id ('nomination_cand_a')
    ) -> 'parent',
    jsonb_build_object(
      'entity_type',
      'organization',
      'entity_id',
      test_id ('org_a'),
      'name',
      '{"en":"Org A"}'::jsonb,
      'short_name',
      NULL
    ),
    'the confirmed parent is resolved the same way, and a parent without a short name carries the key as a JSON null'
  );

SELECT
  is (
    pg_temp.element (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      test_id ('nomination_cand_a')
    ) #>> '{parent,entity_id}',
    test_id ('org_a')::text,
    'the parent''s entity_id is the id of the organization whose nomination the candidate''s nomination stands under'
  );

SELECT
  is (
    pg_temp.element (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      '42424242-4242-4242-4242-000000000a02'
    ) -> 'parent',
    jsonb_build_object(
      'entity_type',
      'faction',
      'entity_id',
      test_id ('faction_a'),
      'name',
      '{"en":"Faction A"}'::jsonb,
      'short_name',
      NULL
    ),
    'a parent that is a faction is resolved from the factions table'
  );

SELECT
  ok (
    pg_temp.element (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      '42424242-4242-4242-4242-000000000a03'
    ) ? 'parent'
    AND pg_temp.element (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      '42424242-4242-4242-4242-000000000a03'
    ) -> 'parent' = 'null'::jsonb,
    'a nomination with no parent carries the parent key as a JSON null'
  );

SELECT
  is (
    pg_temp.element (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      '42424242-4242-4242-4242-000000000a03'
    ) #>> '{custom_data,requestedParentOrganization}',
    'A party not in the system',
    'the custom data of a nomination that names a party outside the system is carried'
  );

SELECT
  is (
    jsonb_build_array(
      pg_temp.element (
        test_id ('project_a'),
        'candidate',
        test_id ('candidate_a'),
        test_id ('nomination_cand_a')
      ) -> 'custom_data',
      pg_temp.element (
        test_id ('project_a'),
        'candidate',
        test_id ('candidate_a'),
        test_id ('nomination_cand_a')
      ) -> 'election_symbol',
      pg_temp.element (
        test_id ('project_a'),
        'candidate',
        test_id ('candidate_a'),
        test_id ('nomination_cand_a')
      ) -> 'election_round'
    ),
    '[null,null,1]'::jsonb,
    'a nomination that stores no custom data and no symbol carries both keys as JSON nulls, beside its round'
  );

SELECT
  is (
    pg_temp.element_keys (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a')
    ),
    'confirmed,constituency_id,constituency_name,custom_data,election_id,election_name,election_round,election_symbol,id,parent,updated_at',
    'every element of a candidate''s answer holds exactly the eleven allow-listed keys'
  );

SELECT
  is (
    pg_temp.parent_keys (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a')
    ),
    'entity_id,entity_type,name,short_name',
    'every parent holds exactly entity_type, entity_id, name and short_name'
  );

SELECT
  ok (
    position(
      'created_by' IN pg_temp.answer (
        test_id ('project_a'),
        'candidate',
        test_id ('candidate_a')
      )::text
    ) = 0
    AND position(
      test_user_id ('admin_b')::text IN pg_temp.answer (
        test_id ('project_a'),
        'candidate',
        test_id ('candidate_a')
      )::text
    ) = 0,
    'the answer holds no created_by key and nowhere the id of the user who created a nomination'
  );

SELECT
  ok (
    position(
      '42424242-4242-4242-4242-000000000101' IN pg_temp.answer (
        test_id ('project_a'),
        'candidate',
        test_id ('candidate_a')
      )::text
    ) = 0
    AND position(
      'Unpublished description' IN pg_temp.answer (
        test_id ('project_a'),
        'candidate',
        test_id ('candidate_a')
      )::text
    ) = 0
    AND position(
      'parent nomination' IN pg_temp.answer (
        test_id ('project_a'),
        'candidate',
        test_id ('candidate_a')
      )::text
    ) = 0,
    'the answer holds neither the parent''s description nor the id, the label or the custom data of the parent''s nomination'
  );

-- Every refusal is asserted twice: the call raises nothing, and the answer is NULL.
SELECT
  lives_ok (
    format(
      $$SELECT public.get_entity_nominations(%L, 'candidate', %L)$$,
      test_id ('project_a'),
      test_id ('candidate_a2')
    ),
    'asking for a candidate another user edits raises nothing'
  );

SELECT
  ok (
    pg_temp.answer (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a2')
    ) IS NULL,
    'a candidate another user edits is answered with NULL, publicly visible though it is'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.get_entity_nominations(%L, 'organization', %L)$$,
      test_id ('project_a'),
      test_id ('org_a')
    ),
    'asking for an organization another user edits raises nothing'
  );

SELECT
  ok (
    pg_temp.answer (
      test_id ('project_a'),
      'organization',
      test_id ('org_a')
    ) IS NULL,
    'the candidate''s own confirmed parent organization, which another user edits, is answered with NULL'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.get_entity_nominations(%L, 'candidate', '42424242-4242-4242-4242-0000000000ff')$$,
      test_id ('project_a')
    ),
    'asking for an id that names nothing raises nothing'
  );

SELECT
  ok (
    pg_temp.answer (
      test_id ('project_a'),
      'candidate',
      '42424242-4242-4242-4242-0000000000ff'
    ) IS NULL,
    'an id that names nothing is answered with NULL'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.get_entity_nominations(%L, 'organization', %L)$$,
      test_id ('project_a'),
      test_id ('candidate_a')
    ),
    'asking for the caller''s own id under another type raises nothing'
  );

SELECT
  ok (
    pg_temp.answer (
      test_id ('project_a'),
      'organization',
      test_id ('candidate_a')
    ) IS NULL,
    'the caller''s own id under another type is answered with NULL, although a nominated organization carries that id'
  );

SELECT
  ok (
    pg_temp.answer (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a2')
    ) IS NOT DISTINCT FROM pg_temp.answer (
      test_id ('project_a'),
      'candidate',
      '42424242-4242-4242-4242-0000000000ff'
    )
    AND pg_temp.answer (
      test_id ('project_a'),
      'organization',
      test_id ('org_a')
    ) IS NOT DISTINCT FROM pg_temp.answer (
      test_id ('project_a'),
      'candidate',
      '42424242-4242-4242-4242-0000000000ff'
    )
    AND pg_temp.answer (
      test_id ('project_a'),
      'organization',
      test_id ('candidate_a')
    ) IS NOT DISTINCT FROM pg_temp.answer (
      test_id ('project_a'),
      'candidate',
      '42424242-4242-4242-4242-0000000000ff'
    ),
    'another user''s entity, an id that names nothing and the caller''s own id under another type get one and the same answer'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.get_entity_nominations(%L, 'candidate', %L)$$,
      test_id ('project_b'),
      test_id ('candidate_a')
    ),
    'asking for the caller''s own candidate under another project raises nothing'
  );

SELECT
  ok (
    pg_temp.answer (
      test_id ('project_b'),
      'candidate',
      test_id ('candidate_a')
    ) IS NULL,
    'the caller''s own candidate named under another project is answered with NULL'
  );

SELECT
  ok (
    pg_temp.answer (NULL, 'candidate', test_id ('candidate_a')) IS NULL
    AND pg_temp.answer (
      test_id ('project_a'),
      NULL,
      test_id ('candidate_a')
    ) IS NULL
    AND pg_temp.answer (test_id ('project_a'), 'candidate', NULL) IS NULL,
    'a NULL project, a NULL type and a NULL id are each answered with NULL'
  );

SELECT
  reset_role ();

-- =====================================================================
-- A candidate's editor, in the project closed for voters
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_b'),
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        nominations
      WHERE
        id = '42424242-4242-4242-4242-000000000102'
    )::integer,
    0,
    'through the tables a candidate of a closed project cannot read the confirmed nomination of its confirmed parent organization'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        organizations
      WHERE
        id = '42424242-4242-4242-4242-0000000000b2'
    )::integer,
    0,
    'nor the row of that organization'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.get_entity_nominations(%L, 'candidate', %L)$$,
      test_id ('project_b'),
      test_id ('candidate_b')
    ),
    'a candidate''s editor asking for its own candidate in a closed project raises nothing'
  );

SELECT
  is (
    pg_temp.listed (
      test_id ('project_b'),
      'candidate',
      test_id ('candidate_b')
    ),
    '42424242-4242-4242-4242-000000000a04,' || test_id ('nomination_cand_b')::text,
    'the answer holds both nominations of the candidate'
  );

SELECT
  is (
    pg_temp.element (
      test_id ('project_b'),
      'candidate',
      test_id ('candidate_b'),
      '42424242-4242-4242-4242-000000000a04'
    ) -> 'parent',
    '{"entity_type":"organization","entity_id":"42424242-4242-4242-4242-0000000000b2","name":{"en":"Closed Project Party"},"short_name":{"en":"CPP"}}'::jsonb,
    'the confirmed parent the tables refuse in a closed project is resolved to its entity type, entity id, name and short name'
  );

SELECT
  is (
    pg_temp.element (
      test_id ('project_b'),
      'candidate',
      test_id ('candidate_b'),
      test_id ('nomination_cand_b')
    ) -> 'parent',
    jsonb_build_object(
      'entity_type',
      'organization',
      'entity_id',
      test_id ('org_b'),
      'name',
      '{"en":"Org B"}'::jsonb,
      'short_name',
      NULL
    ),
    'and so is an unconfirmed parent in that closed project'
  );

SELECT
  is (
    jsonb_build_array(
      pg_temp.element (
        test_id ('project_b'),
        'candidate',
        test_id ('candidate_b'),
        '42424242-4242-4242-4242-000000000a04'
      ) -> 'election_name',
      pg_temp.element (
        test_id ('project_b'),
        'candidate',
        test_id ('candidate_b'),
        '42424242-4242-4242-4242-000000000a04'
      ) -> 'constituency_name'
    ),
    '[{"en":"Election B"},{"en":"Constituency B"}]'::jsonb,
    'the election and the constituency of a closed project are named'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.get_entity_nominations(%L, 'candidate', %L)$$,
      test_id ('project_a'),
      test_id ('candidate_a')
    ),
    'an editor of another project asking for a candidate raises nothing'
  );

SELECT
  ok (
    pg_temp.answer (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a')
    ) IS NULL
    AND pg_temp.answer (
      test_id ('project_b'),
      'candidate',
      test_id ('candidate_a')
    ) IS NULL,
    'an editor of another project is answered with NULL for a candidate of the open project, under either project'
  );

SELECT
  reset_role ();

-- =====================================================================
-- An organization's editor
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        nominations
      WHERE
        id = '42424242-4242-4242-4242-000000000103'
    )::integer,
    0,
    'through the tables an organization cannot read the nomination of its unconfirmed parent alliance'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        alliances
      WHERE
        id = '42424242-4242-4242-4242-0000000000b3'
    )::integer,
    0,
    'nor the row of that alliance'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.get_entity_nominations(%L, 'organization', %L)$$,
      test_id ('project_a'),
      test_id ('org_a')
    ),
    'an organization''s editor asking for its own organization raises nothing'
  );

SELECT
  is (
    pg_temp.listed (
      test_id ('project_a'),
      'organization',
      test_id ('org_a')
    ),
    '42424242-4242-4242-4242-000000000a05,' || test_id ('nomination_org_a')::text,
    'the answer holds both nominations of the organization'
  );

SELECT
  is (
    pg_temp.element (
      test_id ('project_a'),
      'organization',
      test_id ('org_a'),
      '42424242-4242-4242-4242-000000000a05'
    ) -> 'parent',
    '{"entity_type":"alliance","entity_id":"42424242-4242-4242-4242-0000000000b3","name":{"en":"Pending Alliance"},"short_name":{"en":"PA"}}'::jsonb,
    'the unconfirmed parent alliance the tables refuse is resolved to its entity type, entity id, name and short name'
  );

SELECT
  is (
    jsonb_build_array(
      pg_temp.element (
        test_id ('project_a'),
        'organization',
        test_id ('org_a'),
        test_id ('nomination_org_a')
      ) -> 'parent',
      pg_temp.element (
        test_id ('project_a'),
        'organization',
        test_id ('org_a'),
        test_id ('nomination_org_a')
      ) -> 'confirmed'
    ),
    '[null,true]'::jsonb,
    'the organization''s confirmed nomination with no parent is answered as confirmed, with a JSON null parent'
  );

SELECT
  is (
    pg_temp.element_keys (
      test_id ('project_a'),
      'organization',
      test_id ('org_a')
    ),
    'confirmed,constituency_id,constituency_name,custom_data,election_id,election_name,election_round,election_symbol,id,parent,updated_at',
    'every element of an organization''s answer holds exactly the same eleven keys'
  );

SELECT
  is (
    pg_temp.listed (
      test_id ('project_a'),
      'organization',
      test_id ('candidate_a')
    ),
    '42424242-4242-4242-4242-000000000a06',
    'the editor of the organization that shares a candidate''s id is answered with that organization''s nomination alone'
  );

-- The matrix gives a parent organization's editor nomination.read on its child candidate. The function answers the child's own editor alone, so the parent's editor does not learn which other parties the candidate stands for.
SELECT
  ok (
    user_can (
      'entity',
      test_id ('candidate_a'),
      'nomination.read',
      'candidate'
    ),
    'control: the editor of a parent organization holds nomination.read on its child candidate'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.get_entity_nominations(%L, 'candidate', %L)$$,
      test_id ('project_a'),
      test_id ('candidate_a')
    ),
    'the editor of a parent organization asking for its child candidate raises nothing'
  );

SELECT
  ok (
    pg_temp.answer (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a')
    ) IS NULL,
    'the editor of a parent organization is answered with NULL for its child candidate'
  );

-- The same user is given an editor grant on faction_a. The grant lookup names the faction, and the function serves candidates and organizations alone.
SELECT
  reset_role ();

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    test_user_id ('organization_a'),
    'entity',
    'faction',
    test_id ('faction_a'),
    'editor'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    '[]'::jsonb
  );

SELECT
  ok (
    test_id ('faction_a') IN (
      SELECT
        private.caller_entity_ids (test_id ('project_a'), 'faction')
    ),
    'control: the grant lookup names the faction the caller edits'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.get_entity_nominations(%L, 'faction', %L)$$,
      test_id ('project_a'),
      test_id ('faction_a')
    ),
    'a faction''s editor asking for its own faction raises nothing'
  );

SELECT
  ok (
    pg_temp.answer (
      test_id ('project_a'),
      'faction',
      test_id ('faction_a')
    ) IS NULL,
    'a faction''s editor is answered with NULL for its own nominated faction, not with an empty array'
  );

SELECT
  reset_role ();

-- =====================================================================
-- An entity with no nomination
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a2'),
    '[]'::jsonb
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.get_entity_nominations(%L, 'candidate', %L)$$,
      test_id ('project_a'),
      test_id ('candidate_a2')
    ),
    'the editor of a candidate with no nomination asking for it raises nothing'
  );

SELECT
  is (
    pg_temp.answer (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a2')
    ),
    '[]'::jsonb,
    'the editor of a candidate with no nomination is answered with an empty array, where another caller asking for the same candidate got NULL'
  );

SELECT
  reset_role ();

-- =====================================================================
-- Admins
-- =====================================================================
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
        nominations
      WHERE
        candidate_id = test_id ('candidate_a')
    )::integer,
    4,
    'control: a project admin reads every nomination of a candidate of its project through the tables'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.get_entity_nominations(%L, 'candidate', %L)$$,
      test_id ('project_a'),
      test_id ('candidate_a')
    ),
    'a project admin asking for a candidate of its project raises nothing'
  );

SELECT
  ok (
    pg_temp.answer (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a')
    ) IS NULL,
    'a project admin is answered with NULL: the function is the editor''s read'
  );

SELECT
  reset_role ();

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    test_user_id ('admin_a'),
    'entity',
    'candidate',
    test_id ('candidate_a'),
    'admin'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  ok (
    pg_temp.answer (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a')
    ) IS NULL,
    'an admin-role grant on the candidate itself changes nothing: only the editor grant names the caller''s entity'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('super_admin'),
    '[]'::jsonb
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.get_entity_nominations(%L, 'candidate', %L)$$,
      test_id ('project_a'),
      test_id ('candidate_a')
    ),
    'a global admin asking for a candidate raises nothing'
  );

SELECT
  ok (
    pg_temp.answer (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a')
    ) IS NULL,
    'a global admin is answered with NULL'
  );

SELECT
  reset_role ();

-- =====================================================================
-- anon
-- =====================================================================
SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    format(
      $$SELECT public.get_entity_nominations(%L, 'candidate', %L)$$,
      test_id ('project_a'),
      test_id ('candidate_a')
    ),
    '42501',
    NULL,
    'anon is refused get_entity_nominations by privilege'
  );

SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
