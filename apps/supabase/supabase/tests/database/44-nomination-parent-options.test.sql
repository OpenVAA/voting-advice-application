-- 44-nomination-parent-options.test.sql: the entities an entity may name as its parent
--
-- `get_nomination_parent_options` answers the editor of one candidate or organization with the entities that entity may stand under in one project, as a jsonb array: for a candidate every confirmed organization of the project, for an organization every alliance of the project, confirmed or not. Each element holds exactly `id`, `entity_type`, `name`, `short_name`, `color`, `image` and `nominated`, and `nominated` lists those of the contests the caller asked about at which the option holds a nomination at the election's current round. This file pins who is listed and who is not, each absence by its own assertion; the keys and the values of an element, and that nothing else of an option or of its nominations leaves; what `nominated` holds for a contest at the current round, at another round, asked twice, not asked and of no election of the project; the empty array for a project that lists nothing; and every refusal, each of which is a NULL and never a raise.
--
-- The refused callers are another entity's editor, a caller naming an id that exists nowhere, a caller naming its own id under another type or another project, the editor of the parent organization, the editor of a faction and of an alliance, and a project admin. A refused argument of contests is a NULL, a JSON null, anything that is not an array, and an array holding a member that is not an object naming an election and a constituency by uuid. anon is refused by privilege.
--
-- The function is asked through `pg_temp.options`, which uses dynamic SQL and answers the JSON string "no such function" where the function does not exist and "raised <SQLSTATE>" where it raises, so each assertion below is an expectation whatever the database holds, and an assertion that an answer is NULL is also the assertion that nothing was raised.
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
  plan (66);

SELECT
  create_test_data ();

-- =====================================================================
-- Fixture, local to this transaction
-- =====================================================================
-- Project A, which is open for voters, gains an unconfirmed organization and two confirmed ones. The second party carries every column an option answers and every column it withholds; the third carries a name and an order alone, and sorts before the second by that order and after it by id. Project B, which is closed, gains a confirmed organization.
INSERT INTO
  organizations (
    id,
    project_id,
    name,
    short_name,
    info,
    color,
    image,
    sort_order,
    subtype,
    custom_data,
    external_id,
    answers,
    confirmed
  )
VALUES
  (
    '44444444-4444-4444-4444-0000000000b1',
    test_id ('project_a'),
    '{"en":"Pending Party"}'::jsonb,
    '{"en":"PP"}'::jsonb,
    NULL,
    NULL,
    NULL,
    0,
    NULL,
    NULL,
    NULL,
    '{}'::jsonb,
    false
  ),
  (
    '44444444-4444-4444-4444-0000000000b2',
    test_id ('project_b'),
    '{"en":"Closed Project Party"}'::jsonb,
    '{"en":"CPP"}'::jsonb,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{}'::jsonb,
    true
  ),
  (
    '44444444-4444-4444-4444-0000000000b4',
    test_id ('project_a'),
    '{"en":"Second Party","fi":"Toinen puolue"}'::jsonb,
    '{"en":"SP"}'::jsonb,
    '{"en":"Unpublished description of the second party"}'::jsonb,
    '{"normal":"#112233","dark":"#aabbcc"}'::jsonb,
    '{"path":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/organizations/44444444-4444-4444-4444-0000000000b4/44444444-4444-4444-4444-0000000000f1.png","alt":"Logo of the second party"}'::jsonb,
    2,
    'kind-of-the-second-party',
    '{"note":"internal data of the second party"}'::jsonb,
    'ext-second-party',
    jsonb_build_object(
      test_id ('question_a')::text,
      '{"value":1,"info":"Unpublished answer of the second party"}'::jsonb
    ),
    true
  ),
  (
    '44444444-4444-4444-4444-0000000000b5',
    test_id ('project_a'),
    '{"en":"Third Party"}'::jsonb,
    NULL,
    NULL,
    NULL,
    NULL,
    1,
    NULL,
    NULL,
    NULL,
    '{}'::jsonb,
    true
  );

-- An unconfirmed alliance in project A, beside the confirmed one of the shared fixture.
INSERT INTO
  alliances (
    id,
    project_id,
    name,
    short_name,
    info,
    color,
    confirmed
  )
VALUES
  (
    '44444444-4444-4444-4444-0000000000b3',
    test_id ('project_a'),
    '{"en":"Pending Alliance"}'::jsonb,
    '{"en":"PA"}'::jsonb,
    '{"en":"Unpublished description of the pending alliance"}'::jsonb,
    '{"normal":"#abc"}'::jsonb,
    false
  );

-- A second constituency and a second election in project A. The second election is at its round 2; the election of the shared fixture is at its round 1.
INSERT INTO
  constituencies (id, project_id, name)
VALUES
  (
    '44444444-4444-4444-4444-0000000000c1',
    test_id ('project_a'),
    '{"en":"Constituency A2"}'::jsonb
  );

INSERT INTO
  elections (id, project_id, name, current_round)
VALUES
  (
    '44444444-4444-4444-4444-0000000000e1',
    test_id ('project_a'),
    '{"en":"Election A2"}'::jsonb,
    2
  );

-- The nominations the options are asked about, beside those of the shared fixture, which nominate org_a and alliance_a at the first election and the first constituency, at round 1.
--
-- org_a: at the first election and the second constituency at round 2, which is not that election's current round; at the second election and the first constituency at round 2, which is.
-- The second party: at the first election and the first constituency at round 3, which is not the current round; at the second election at round 2, in both constituencies. The row at the first constituency names admin_b as its creator.
-- The unconfirmed alliance: at the second election and the first constituency at round 2.
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
    created_by
  )
VALUES
  (
    '44444444-4444-4444-4444-000000000101',
    test_id ('project_a'),
    test_id ('org_a'),
    NULL,
    test_id ('election_a'),
    '44444444-4444-4444-4444-0000000000c1',
    2,
    false,
    NULL
  ),
  (
    '44444444-4444-4444-4444-000000000102',
    test_id ('project_a'),
    '44444444-4444-4444-4444-0000000000b4',
    NULL,
    '44444444-4444-4444-4444-0000000000e1',
    test_id ('constituency_a'),
    2,
    false,
    test_user_id ('admin_b')
  ),
  (
    '44444444-4444-4444-4444-000000000103',
    test_id ('project_a'),
    '44444444-4444-4444-4444-0000000000b4',
    NULL,
    test_id ('election_a'),
    test_id ('constituency_a'),
    3,
    false,
    NULL
  ),
  (
    '44444444-4444-4444-4444-000000000104',
    test_id ('project_a'),
    NULL,
    '44444444-4444-4444-4444-0000000000b3',
    '44444444-4444-4444-4444-0000000000e1',
    test_id ('constituency_a'),
    2,
    false,
    NULL
  ),
  (
    '44444444-4444-4444-4444-000000000105',
    test_id ('project_a'),
    '44444444-4444-4444-4444-0000000000b4',
    NULL,
    '44444444-4444-4444-4444-0000000000e1',
    '44444444-4444-4444-4444-0000000000c1',
    2,
    false,
    NULL
  ),
  (
    '44444444-4444-4444-4444-000000000106',
    test_id ('project_a'),
    test_id ('org_a'),
    NULL,
    '44444444-4444-4444-4444-0000000000e1',
    test_id ('constituency_a'),
    2,
    false,
    NULL
  );

-- The editor rows of four fixture identities and the admin rows of one. organization_a also edits faction_a and alliance_a.
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

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    test_user_id ('organization_a'),
    'entity',
    'faction',
    test_id ('faction_a'),
    'editor'
  ),
  (
    test_user_id ('organization_a'),
    'entity',
    'alliance',
    test_id ('alliance_a'),
    'editor'
  );

-- What each assertion of an absence rests on: the entity exists, in the named project, with the named confirmation.
SELECT
  is (
    ARRAY[
      (
        SELECT
          project_id = test_id ('project_a')
          AND NOT confirmed
        FROM
          organizations
        WHERE
          id = '44444444-4444-4444-4444-0000000000b1'
      ),
      (
        SELECT
          project_id = test_id ('project_b')
          AND confirmed
        FROM
          organizations
        WHERE
          id = '44444444-4444-4444-4444-0000000000b2'
      ),
      (
        SELECT
          project_id = test_id ('project_b')
          AND NOT confirmed
        FROM
          organizations
        WHERE
          id = test_id ('org_b')
      ),
      (
        SELECT
          project_id = test_id ('project_a')
          AND confirmed
        FROM
          factions
        WHERE
          id = test_id ('faction_a')
      ),
      (
        SELECT
          project_id = test_id ('project_a')
          AND confirmed
        FROM
          alliances
        WHERE
          id = test_id ('alliance_a')
      ),
      (
        SELECT
          project_id = test_id ('project_a')
          AND NOT confirmed
        FROM
          alliances
        WHERE
          id = '44444444-4444-4444-4444-0000000000b3'
      ),
      (
        SELECT
          project_id = test_id ('project_b')
          AND NOT confirmed
        FROM
          alliances
        WHERE
          id = test_id ('alliance_b')
      ),
      (
        SELECT
          current_round = 1
        FROM
          elections
        WHERE
          id = test_id ('election_a')
      ),
      (
        SELECT
          current_round = 2
        FROM
          elections
        WHERE
          id = '44444444-4444-4444-4444-0000000000e1'
      )
    ],
    ARRAY[
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ],
    'the fixture: an unconfirmed organization in the open project, a confirmed and an unconfirmed one in the closed project, a confirmed faction, a confirmed and an unconfirmed alliance in the open project and an unconfirmed one in the closed project, and two elections at rounds 1 and 2'
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
          AND p.proname = 'get_nomination_parent_options'
          AND pg_get_function_identity_arguments(p.oid) = 'p_project_id uuid, p_entity_type entity_type, p_entity_id uuid, p_contests jsonb'
      ),
      false
    ),
    'get_nomination_parent_options (project, type, id, contests) returns jsonb, is STABLE and SECURITY DEFINER with an empty search_path, and no parameter carries a default'
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
          AND p.proname = 'get_nomination_parent_options'
      ),
      false
    ),
    'authenticated may execute get_nomination_parent_options and anon may not'
  );

-- The answer public.get_nomination_parent_options gives the caller, or a JSON string that says why there is none.
CREATE FUNCTION pg_temp.options (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_contests jsonb
) RETURNS jsonb LANGUAGE plpgsql AS $fn$
DECLARE
  v_answer jsonb;
BEGIN
  EXECUTE 'SELECT public.get_nomination_parent_options ($1, $2, $3, $4)'
  INTO v_answer
  USING p_project_id, p_entity_type, p_entity_id, p_contests;
  RETURN v_answer;
EXCEPTION
  WHEN undefined_function THEN
    RETURN to_jsonb('no such function'::text);
  WHEN OTHERS THEN
    RETURN to_jsonb('raised ' || SQLSTATE);
END;
$fn$;

-- That answer where it is an array, and NULL where it is anything else, so that every instrument below answers NULL for a refusal.
CREATE FUNCTION pg_temp.option_list (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_contests jsonb
) RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT CASE WHEN jsonb_typeof(a.answer) = 'array' THEN a.answer END
  FROM (SELECT pg_temp.options(p_project_id, p_entity_type, p_entity_id, p_contests) AS answer) a;
$fn$;

-- The ids of the options, in the order answered: an empty string for an empty array.
CREATE FUNCTION pg_temp.listed (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_contests jsonb
) RETURNS text LANGUAGE sql AS $fn$
  SELECT CASE WHEN l.list IS NOT NULL THEN COALESCE(
    (SELECT string_agg(e.element ->> 'id', ',' ORDER BY e.ord) FROM jsonb_array_elements(l.list) WITH ORDINALITY AS e (element, ord)),
    '') END
  FROM (SELECT pg_temp.option_list(p_project_id, p_entity_type, p_entity_id, p_contests) AS list) l;
$fn$;

-- Whether one entity is among the options.
CREATE FUNCTION pg_temp.lists (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_contests jsonb,
  p_option_id uuid
) RETURNS boolean LANGUAGE sql AS $fn$
  SELECT CASE WHEN l.list IS NOT NULL THEN EXISTS (
    SELECT 1 FROM jsonb_array_elements(l.list) AS e (element) WHERE e.element ->> 'id' = p_option_id::text) END
  FROM (SELECT pg_temp.option_list(p_project_id, p_entity_type, p_entity_id, p_contests) AS list) l;
$fn$;

-- The option that describes one entity.
CREATE FUNCTION pg_temp.option (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_contests jsonb,
  p_option_id uuid
) RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT e.element
  FROM jsonb_array_elements(pg_temp.option_list(p_project_id, p_entity_type, p_entity_id, p_contests)) AS e (element)
  WHERE e.element ->> 'id' = p_option_id::text;
$fn$;

-- The sorted keys of the options, one list per distinct key set: a single list when every option holds the same keys.
CREATE FUNCTION pg_temp.option_keys (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_contests jsonb
) RETURNS text LANGUAGE sql AS $fn$
  SELECT string_agg(DISTINCT k.keys, ' | ')
  FROM (
    SELECT (SELECT string_agg(j.key, ',' ORDER BY j.key) FROM jsonb_object_keys(e.element) AS j (key)) AS keys
    FROM jsonb_array_elements(pg_temp.option_list(p_project_id, p_entity_type, p_entity_id, p_contests)) AS e (element)
  ) k;
$fn$;

-- The same over the members of every option's `nominated`.
CREATE FUNCTION pg_temp.nominated_keys (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_contests jsonb
) RETURNS text LANGUAGE sql AS $fn$
  SELECT string_agg(DISTINCT k.keys, ' | ')
  FROM (
    SELECT (SELECT string_agg(j.key, ',' ORDER BY j.key) FROM jsonb_object_keys(m.member) AS j (key)) AS keys
    FROM jsonb_array_elements(pg_temp.option_list(p_project_id, p_entity_type, p_entity_id, p_contests)) AS e (element),
      jsonb_array_elements(e.element -> 'nominated') AS m (member)
  ) k;
$fn$;

-- The distinct values of `nominated` over the options: a single value when every option holds the same one.
CREATE FUNCTION pg_temp.nominated_values (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_contests jsonb
) RETURNS text LANGUAGE sql AS $fn$
  SELECT string_agg(DISTINCT (e.element -> 'nominated')::text, ' | ')
  FROM jsonb_array_elements(pg_temp.option_list(p_project_id, p_entity_type, p_entity_id, p_contests)) AS e (element);
$fn$;

-- The distinct entity types of the options.
CREATE FUNCTION pg_temp.listed_types (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_contests jsonb
) RETURNS text LANGUAGE sql AS $fn$
  SELECT string_agg(DISTINCT e.element ->> 'entity_type', ',')
  FROM jsonb_array_elements(pg_temp.option_list(p_project_id, p_entity_type, p_entity_id, p_contests)) AS e (element);
$fn$;

-- One contest, as a member of the argument of contests and of `nominated`.
CREATE FUNCTION pg_temp.contest (p_election_id uuid, p_constituency_id uuid) RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT jsonb_build_object('election_id', p_election_id, 'constituency_id', p_constituency_id);
$fn$;

-- The first election and the first constituency: its election is at round 1.
CREATE FUNCTION pg_temp.contest_one () RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT pg_temp.contest(public.test_id('election_a'), public.test_id('constituency_a'));
$fn$;

-- The first election and the second constituency.
CREATE FUNCTION pg_temp.contest_two () RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT pg_temp.contest(public.test_id('election_a'), '44444444-4444-4444-4444-0000000000c1');
$fn$;

-- The second election and the first constituency: its election is at round 2.
CREATE FUNCTION pg_temp.contest_three () RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT pg_temp.contest('44444444-4444-4444-4444-0000000000e1', public.test_id('constituency_a'));
$fn$;

-- The three contests, in that order.
CREATE FUNCTION pg_temp.asked () RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT jsonb_build_array(pg_temp.contest_one(), pg_temp.contest_two(), pg_temp.contest_three());
$fn$;

-- =====================================================================
-- A candidate's editor, in the open project
-- =====================================================================
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
        count(*)
      FROM
        organizations
      WHERE
        id = '44444444-4444-4444-4444-0000000000b5'
    )::integer,
    0,
    'through the tables a candidate cannot read a confirmed organization of its open project that has no confirmed nomination'
  );

SELECT
  is (
    jsonb_typeof(
      pg_temp.options (
        test_id ('project_a'),
        'candidate',
        test_id ('candidate_a'),
        pg_temp.asked ()
      )
    ),
    'array',
    'a candidate''s editor asking for its own candidate is answered with a jsonb array'
  );

SELECT
  is (
    pg_temp.listed (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked ()
    ),
    '44444444-4444-4444-4444-0000000000b5,44444444-4444-4444-4444-0000000000b4,' || test_id ('org_a')::text,
    'it holds every confirmed organization of the project, in the order of sort_order with nulls last and then id'
  );

SELECT
  is (
    pg_temp.lists (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked (),
      '44444444-4444-4444-4444-0000000000b1'
    ),
    false,
    'an unconfirmed organization of the project is not an option for a candidate'
  );

SELECT
  is (
    pg_temp.lists (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked (),
      test_id ('faction_a')
    ),
    false,
    'a faction is not an option for a candidate'
  );

SELECT
  is (
    pg_temp.lists (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked (),
      test_id ('alliance_a')
    ),
    false,
    'a confirmed alliance is not an option for a candidate'
  );

SELECT
  is (
    pg_temp.lists (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked (),
      '44444444-4444-4444-4444-0000000000b3'
    ),
    false,
    'nor is an unconfirmed alliance'
  );

SELECT
  is (
    pg_temp.lists (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked (),
      '44444444-4444-4444-4444-0000000000b2'
    ),
    false,
    'a confirmed organization of another project is not an option'
  );

SELECT
  is (
    pg_temp.lists (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked (),
      test_id ('org_b')
    ),
    false,
    'nor is an unconfirmed organization of another project'
  );

SELECT
  is (
    pg_temp.listed_types (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked ()
    ),
    'organization',
    'every option of a candidate states the entity type organization'
  );

SELECT
  is (
    pg_temp.option_keys (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked ()
    ),
    'color,entity_type,id,image,name,nominated,short_name',
    'every option of a candidate holds exactly the seven allow-listed keys'
  );

SELECT
  is (
    pg_temp.option (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked (),
      '44444444-4444-4444-4444-0000000000b4'
    ),
    jsonb_build_object(
      'id',
      '44444444-4444-4444-4444-0000000000b4',
      'entity_type',
      'organization',
      'name',
      '{"en":"Second Party","fi":"Toinen puolue"}'::jsonb,
      'short_name',
      '{"en":"SP"}'::jsonb,
      'color',
      '{"normal":"#112233","dark":"#aabbcc"}'::jsonb,
      'image',
      '{"path":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/organizations/44444444-4444-4444-4444-0000000000b4/44444444-4444-4444-4444-0000000000f1.png","alt":"Logo of the second party"}'::jsonb,
      'nominated',
      jsonb_build_array(pg_temp.contest_three ())
    ),
    'an option is the entity''s id, its type, its name, short name, colour and image as stored, and the contests it is nominated at, and nothing else'
  );

SELECT
  is (
    pg_temp.option (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked (),
      test_id ('org_a')
    ),
    jsonb_build_object(
      'id',
      test_id ('org_a'),
      'entity_type',
      'organization',
      'name',
      '{"en":"Org A"}'::jsonb,
      'short_name',
      NULL,
      'color',
      NULL,
      'image',
      NULL,
      'nominated',
      jsonb_build_array(pg_temp.contest_one (), pg_temp.contest_three ())
    ),
    'an option without a short name, a colour or an image carries each key as a JSON null'
  );

SELECT
  is (
    pg_temp.option (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked (),
      test_id ('org_a')
    ) -> 'nominated',
    jsonb_build_array(pg_temp.contest_one (), pg_temp.contest_three ()),
    'nominated holds each asked contest at which the option is nominated at the election''s current round, and not the asked contest at which its one nomination is of another round'
  );

SELECT
  is (
    pg_temp.option (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked (),
      '44444444-4444-4444-4444-0000000000b4'
    ) -> 'nominated',
    jsonb_build_array(pg_temp.contest_three ()),
    'a nomination at round 3 of an election at its round 1 does not count, beside one at round 2 of an election at its round 2, which does'
  );

SELECT
  is (
    pg_temp.option (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked (),
      '44444444-4444-4444-4444-0000000000b5'
    ) -> 'nominated',
    '[]'::jsonb,
    'an option nominated at none of the asked contests carries an empty array'
  );

SELECT
  is (
    pg_temp.nominated_keys (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked ()
    ),
    'constituency_id,election_id',
    'every member of nominated holds exactly election_id and constituency_id'
  );

SELECT
  is (
    pg_temp.option (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      jsonb_build_array(pg_temp.contest_three (), pg_temp.contest_one ()),
      test_id ('org_a')
    ) -> 'nominated',
    jsonb_build_array(pg_temp.contest_three (), pg_temp.contest_one ()),
    'nominated follows the order in which the contests were asked'
  );

SELECT
  is (
    pg_temp.option (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      jsonb_build_array(
        pg_temp.contest_one (),
        pg_temp.contest_three (),
        pg_temp.contest_one ()
      ),
      test_id ('org_a')
    ) -> 'nominated',
    jsonb_build_array(pg_temp.contest_one (), pg_temp.contest_three ()),
    'a contest asked twice is answered once, at the place it was first asked'
  );

SELECT
  is (
    pg_temp.option (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      jsonb_build_array(pg_temp.contest_one ()),
      '44444444-4444-4444-4444-0000000000b4'
    ) -> 'nominated',
    '[]'::jsonb,
    'a contest the caller did not ask about is not answered: an option nominated at two other contests carries an empty array'
  );

SELECT
  is (
    pg_temp.option (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      jsonb_build_array(
        pg_temp.contest_one () || '{"note":"not read"}'::jsonb
      ),
      test_id ('org_a')
    ) -> 'nominated',
    jsonb_build_array(pg_temp.contest_one ()),
    'another key of an asked contest is neither refused nor answered'
  );

SELECT
  is (
    pg_temp.nominated_values (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      '[]'::jsonb
    ),
    '[]',
    'an empty array of contests gives every option an empty nominated'
  );

SELECT
  is (
    pg_temp.listed (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      '[]'::jsonb
    ),
    '44444444-4444-4444-4444-0000000000b5,44444444-4444-4444-4444-0000000000b4,' || test_id ('org_a')::text,
    'and lists the same options'
  );

SELECT
  is (
    pg_temp.nominated_values (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      jsonb_build_array(
        pg_temp.contest (
          '44444444-4444-4444-4444-0000000000ff',
          test_id ('constituency_a')
        ),
        pg_temp.contest (
          test_id ('election_b'),
          test_id ('constituency_b')
        )
      )
    ),
    '[]',
    'a contest whose election names nothing, and one whose election is of another project, are answered as not nominated and not refused'
  );

SELECT
  ok (
    COALESCE(
      (
        SELECT
          jsonb_typeof(a.answer) = 'array'
          AND position('Unpublished' IN a.answer::text) = 0
          AND position('internal data' IN a.answer::text) = 0
          AND position('ext-second-party' IN a.answer::text) = 0
          AND position('kind-of-the-second-party' IN a.answer::text) = 0
          AND position(test_user_id ('admin_b')::text IN a.answer::text) = 0
          AND position(
            '44444444-4444-4444-4444-000000000102' IN a.answer::text
          ) = 0
          AND position(test_id ('question_a')::text IN a.answer::text) = 0
        FROM
          (
            SELECT
              pg_temp.options (
                test_id ('project_a'),
                'candidate',
                test_id ('candidate_a'),
                pg_temp.asked ()
              ) AS answer
          ) a
      ),
      false
    ),
    'the answer holds nowhere an option''s description, custom data, external id, subtype or answers, and neither the id nor the creator of a nomination'
  );

-- Every refusal is a NULL. The instrument answers a JSON string where the function raises, so each of these also asserts that nothing was raised.
SELECT
  ok (
    pg_temp.options (
      NULL,
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked ()
    ) IS NULL,
    'a NULL project is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      NULL,
      test_id ('candidate_a'),
      pg_temp.asked ()
    ) IS NULL,
    'a NULL type is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      NULL,
      pg_temp.asked ()
    ) IS NULL,
    'a NULL id is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a2'),
      pg_temp.asked ()
    ) IS NULL,
    'a candidate another user edits is answered with NULL, not with an empty array'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'organization',
      test_id ('org_a'),
      pg_temp.asked ()
    ) IS NULL,
    'an organization another user edits is answered with NULL, publicly visible though it is'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      '44444444-4444-4444-4444-0000000000ff',
      pg_temp.asked ()
    ) IS NULL,
    'an id that names nothing is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'organization',
      test_id ('candidate_a'),
      pg_temp.asked ()
    ) IS NULL,
    'the caller''s own id under another type is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_b'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked ()
    ) IS NULL,
    'the caller''s own candidate named under another project is answered with NULL: the project argument selects among the caller''s own grants and lists no other project'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      NULL
    ) IS NULL,
    'a NULL argument of contests is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      'null'::jsonb
    ) IS NULL,
    'a JSON null as the contests is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.contest_one ()
    ) IS NULL,
    'one contest that is not inside an array is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      '"contests"'::jsonb
    ) IS NULL,
    'a JSON string as the contests is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      '[1]'::jsonb
    ) IS NULL,
    'an array holding a number is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      '[[]]'::jsonb
    ) IS NULL,
    'an array holding an array is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      jsonb_build_array(
        jsonb_build_object('election_id', test_id ('election_a'))
      )
    ) IS NULL,
    'a contest that names no constituency is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      jsonb_build_array(
        jsonb_build_object('constituency_id', test_id ('constituency_a'))
      )
    ) IS NULL,
    'a contest that names no election is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      jsonb_build_array(
        jsonb_build_object(
          'election_id',
          'not-a-uuid',
          'constituency_id',
          test_id ('constituency_a')
        )
      )
    ) IS NULL,
    'a contest whose election is a string that is no uuid is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      jsonb_build_array(
        jsonb_build_object(
          'election_id',
          test_id ('election_a'),
          'constituency_id',
          7
        )
      )
    ) IS NULL,
    'a contest whose constituency is a number is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      jsonb_build_array(
        jsonb_build_object(
          'election_id',
          NULL,
          'constituency_id',
          test_id ('constituency_a')
        )
      )
    ) IS NULL,
    'a contest whose election is a JSON null is answered with NULL'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      jsonb_build_array(pg_temp.contest_one (), 1)
    ) IS NULL,
    'one member that is not a contest refuses the whole argument, whatever stands beside it'
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.get_nomination_parent_options(%L, 'candidate', %L, '[{"election_id":"not-a-uuid","constituency_id":"neither"}]'::jsonb)$$,
      test_id ('project_a'),
      test_id ('candidate_a')
    ),
    'asked directly with contests that are no uuids, the function raises nothing'
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
        organizations
      WHERE
        id = '44444444-4444-4444-4444-0000000000b2'
    )::integer,
    0,
    'through the tables a candidate of a closed project cannot read a confirmed organization of that project'
  );

SELECT
  is (
    pg_temp.listed (
      test_id ('project_b'),
      'candidate',
      test_id ('candidate_b'),
      '[]'::jsonb
    ),
    '44444444-4444-4444-4444-0000000000b2',
    'the editor of a candidate of the closed project is answered with the one confirmed organization of that project, and with none of the open project'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_b'),
      '[]'::jsonb
    ) IS NULL
    AND pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      '[]'::jsonb
    ) IS NULL,
    'an editor of another project is answered with NULL under the open project, for its own candidate and for a candidate of that project'
  );

-- The one confirmed organization of the closed project loses its confirmation, and the project lists nothing a candidate may name.
SELECT
  reset_role ();

UPDATE organizations
SET
  confirmed = false
WHERE
  id = '44444444-4444-4444-4444-0000000000b2';

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_b'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.options (
      test_id ('project_b'),
      'candidate',
      test_id ('candidate_b'),
      '[]'::jsonb
    ),
    '[]'::jsonb,
    'a project with no confirmed organization answers its candidate''s editor with an empty array, which is an answer where NULL is a refusal'
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
        alliances
      WHERE
        id = '44444444-4444-4444-4444-0000000000b3'
    )::integer,
    0,
    'through the tables an organization cannot read an unconfirmed alliance of its project'
  );

SELECT
  is (
    pg_temp.listed (
      test_id ('project_a'),
      'organization',
      test_id ('org_a'),
      pg_temp.asked ()
    ),
    '44444444-4444-4444-4444-0000000000b3,' || test_id ('alliance_a')::text,
    'an organization''s editor is answered with every alliance of the project, the unconfirmed one included, and with no alliance of another project'
  );

SELECT
  is (
    pg_temp.listed_types (
      test_id ('project_a'),
      'organization',
      test_id ('org_a'),
      pg_temp.asked ()
    ),
    'alliance',
    'every option of an organization states the entity type alliance: no organization is listed'
  );

SELECT
  is (
    pg_temp.lists (
      test_id ('project_a'),
      'organization',
      test_id ('org_a'),
      pg_temp.asked (),
      test_id ('alliance_b')
    ),
    false,
    'an alliance of another project is not an option'
  );

SELECT
  is (
    pg_temp.option (
      test_id ('project_a'),
      'organization',
      test_id ('org_a'),
      pg_temp.asked (),
      '44444444-4444-4444-4444-0000000000b3'
    ),
    jsonb_build_object(
      'id',
      '44444444-4444-4444-4444-0000000000b3',
      'entity_type',
      'alliance',
      'name',
      '{"en":"Pending Alliance"}'::jsonb,
      'short_name',
      '{"en":"PA"}'::jsonb,
      'color',
      '{"normal":"#abc"}'::jsonb,
      'image',
      NULL,
      'nominated',
      jsonb_build_array(pg_temp.contest_three ())
    ),
    'an alliance is answered with the same seven keys, its description withheld'
  );

SELECT
  is (
    pg_temp.option (
      test_id ('project_a'),
      'organization',
      test_id ('org_a'),
      pg_temp.asked (),
      test_id ('alliance_a')
    ) -> 'nominated',
    jsonb_build_array(pg_temp.contest_one ()),
    'an alliance''s nominated holds the asked contest at which it is nominated at the election''s current round'
  );

SELECT
  is (
    pg_temp.option_keys (
      test_id ('project_a'),
      'organization',
      test_id ('org_a'),
      pg_temp.asked ()
    ),
    'color,entity_type,id,image,name,nominated,short_name',
    'every option of an organization holds exactly the same seven keys'
  );

-- The matrix gives a parent organization's editor nomination.read on its child candidate. The function answers the child's own editor alone.
SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked ()
    ) IS NULL,
    'the editor of a parent organization is answered with NULL for its child candidate'
  );

-- The grant lookup names the faction and the alliance the caller edits, and the function serves candidates and organizations alone.
SELECT
  ok (
    test_id ('faction_a') IN (
      SELECT
        private.caller_entity_ids (test_id ('project_a'), 'faction')
    )
    AND test_id ('alliance_a') IN (
      SELECT
        private.caller_entity_ids (test_id ('project_a'), 'alliance')
    ),
    'control: the grant lookup names the faction and the alliance the caller edits'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'faction',
      test_id ('faction_a'),
      pg_temp.asked ()
    ) IS NULL,
    'a faction''s editor is answered with NULL for its own faction, not with an empty array'
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'alliance',
      test_id ('alliance_a'),
      pg_temp.asked ()
    ) IS NULL,
    'an alliance''s editor is answered with NULL for its own alliance, not with an empty array'
  );

SELECT
  reset_role ();

-- =====================================================================
-- A project admin
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  ok (
    pg_temp.options (
      test_id ('project_a'),
      'candidate',
      test_id ('candidate_a'),
      pg_temp.asked ()
    ) IS NULL,
    'a project admin is answered with NULL: the function is the editor''s read'
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
      $$SELECT public.get_nomination_parent_options(%L, 'candidate', %L, '[]'::jsonb)$$,
      test_id ('project_a'),
      test_id ('candidate_a')
    ),
    '42501',
    NULL,
    'anon is refused get_nomination_parent_options by privilege'
  );

SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
