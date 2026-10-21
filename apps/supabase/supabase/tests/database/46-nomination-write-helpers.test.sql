-- 46-nomination-write-helpers.test.sql: the rules every writer of a nomination shares, each stated once in a private function
--
-- A writer of nominations asks three private functions instead of holding the rules itself: `private.nomination_list_checked` bounds the array of nominations, `private.nomination_object_checked` states the shape of one nomination object and answers its normalised values, and `private.parent_nomination_resolved` finds a named parent's nomination at a contest, creating the bare row when there is none. All three run as their caller, so the policies of `public.nominations` and the cap on unconfirmed parent nominations still decide what is written. This file asserts each function on its own and, through `set_entity_nominations`, the bound; and, through both `set_entity_nominations` and `create_invitations`, the refusal of a parent, or of an invited entity that states nominations, that is no entity of the nomination's project.
--
-- Each assertion's description begins with the tag of the rule it pins:
--   CAT   - the three functions and `set_entity_nominations` in the catalogue, and who may execute them.
--   LIST  - the array of nominations: a JSON array of at most 1000 members, asked before any member.
--   VAL   - one nomination object: every shape refusal by its message, and the normalised answer.
--   RES   - a parent's nomination at a contest: found, or created bare and unconfirmed as the caller.
--   XPROJ - a parent, or an invited entity that states nominations, that is no entity of the nomination's project is refused by either writer, and nothing is written.
--
-- A refusal is asserted by its SQLSTATE and its whole message. Every call is made from a string, so a database without one of the functions fails each assertion on its own; a call that must live is made through `pg_temp.answer`, which answers what the function answered or an object that says what it raised.
--
-- Every impersonation passes an empty grant array, so each claim is projected from the rows this file writes. The user of the fixture's candidate_a edits the candidates of this file that an entity editor writes to; admin_a is project A's admin; the service role bypasses the policies.
--
-- This file never commits.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_seed_identity_grants).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (64);

SELECT
  create_test_data ();

-- =====================================================================
-- Names for the rows of this file
-- =====================================================================
-- `eid` names an election, a constituency, a group or an entity of this file.
CREATE FUNCTION pg_temp.eid (p_name text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $fn$
  SELECT ('46464646-4646-4646-4646-0000000000' || CASE p_name
    WHEN 'e_one' THEN 'e1'
    WHEN 'c_one' THEN 'c1'
    WHEN 'c_two' THEN 'c2'
    WHEN 'group' THEN 'f1'
    WHEN 'org_nominated' THEN 'b1'
    WHEN 'org_owner' THEN 'b2'
    WHEN 'org_admin' THEN 'b3'
    WHEN 'org_editor' THEN 'b4'
    WHEN 'org_twin' THEN 'b5'
    WHEN 'org_other_project' THEN 'b9'
    WHEN 'alliance_owner' THEN 'd1'
    WHEN 'cand_editor' THEN 'a1'
    WHEN 'cand_xproj' THEN 'a2'
    WHEN 'cand_list' THEN 'a3'
    WHEN 'cand_xinv' THEN 'a4'
    WHEN 'nothing' THEN '99'
  END)::uuid;
$fn$;

-- `nid` names a nomination the fixture inserts.
CREATE FUNCTION pg_temp.nid (p_name text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $fn$
  SELECT ('46464646-4646-4646-4646-000000000' || CASE p_name
    WHEN 'org_nominated' THEN '101'
    WHEN 'cand_editor' THEN 'a01'
  END)::uuid;
$fn$;

-- =====================================================================
-- Fixture, local to this transaction and inserted before the first impersonation
-- =====================================================================
-- One election of project A, of the default type, over one constituency group of two constituencies.
INSERT INTO
  elections (id, project_id, name, current_round)
VALUES
  (
    pg_temp.eid ('e_one'),
    test_id ('project_a'),
    '{"en":"Election of this file"}'::jsonb,
    1
  );

INSERT INTO
  constituency_groups (id, project_id, name)
VALUES
  (
    pg_temp.eid ('group'),
    test_id ('project_a'),
    '{"en":"Group of two"}'::jsonb
  );

INSERT INTO
  constituencies (id, project_id, name)
VALUES
  (
    pg_temp.eid ('c_one'),
    test_id ('project_a'),
    '{"en":"Constituency one"}'::jsonb
  ),
  (
    pg_temp.eid ('c_two'),
    test_id ('project_a'),
    '{"en":"Constituency two"}'::jsonb
  );

INSERT INTO
  constituency_group_constituencies (constituency_group_id, constituency_id)
VALUES
  (pg_temp.eid ('group'), pg_temp.eid ('c_one')),
  (pg_temp.eid ('group'), pg_temp.eid ('c_two'));

INSERT INTO
  election_constituency_groups (election_id, constituency_group_id)
VALUES
  (pg_temp.eid ('e_one'), pg_temp.eid ('group'));

-- Five organizations of project A: one nominated at the first contest and four with no nomination, one for each caller that creates a parent's row; and one organization of project B.
INSERT INTO
  organizations (id, project_id, name, confirmed)
VALUES
  (
    pg_temp.eid ('org_nominated'),
    test_id ('project_a'),
    '{"en":"Nominated Party"}'::jsonb,
    true
  ),
  (
    pg_temp.eid ('org_owner'),
    test_id ('project_a'),
    '{"en":"Party Created By The Owner"}'::jsonb,
    true
  ),
  (
    pg_temp.eid ('org_admin'),
    test_id ('project_a'),
    '{"en":"Party Created By The Admin"}'::jsonb,
    true
  ),
  (
    pg_temp.eid ('org_editor'),
    test_id ('project_a'),
    '{"en":"Party Created By An Editor"}'::jsonb,
    true
  ),
  (
    pg_temp.eid ('org_twin'),
    test_id ('project_a'),
    '{"en":"Party Of The Same Project"}'::jsonb,
    true
  ),
  (
    pg_temp.eid ('org_other_project'),
    test_id ('project_b'),
    '{"en":"Party Of Another Project"}'::jsonb,
    false
  );

INSERT INTO
  alliances (id, project_id, name, confirmed)
VALUES
  (
    pg_temp.eid ('alliance_owner'),
    test_id ('project_a'),
    '{"en":"Alliance Created By The Owner"}'::jsonb,
    true
  );

INSERT INTO
  candidates (id, project_id, first_name, last_name, confirmed)
SELECT
  pg_temp.eid (k.name),
  test_id ('project_a'),
  'Candidate',
  k.name,
  true
FROM
  unnest(
    ARRAY[
      'cand_editor',
      'cand_xproj',
      'cand_list',
      'cand_xinv'
    ]
  ) AS k (name);

INSERT INTO
  nominations (
    id,
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round,
    confirmed
  )
VALUES
  (
    pg_temp.nid ('org_nominated'),
    test_id ('project_a'),
    pg_temp.eid ('org_nominated'),
    pg_temp.eid ('e_one'),
    pg_temp.eid ('c_one'),
    1,
    true
  );

-- The authority rows: admin_a's own, and the user of candidate_a as the editor of the two candidates of this file an editor writes to. `cand_xproj` has no editor.
SELECT
  test_seed_identity_grants ('admin_a');

SELECT
  test_seed_identity_grants ('candidate_a');

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
SELECT
  test_user_id ('candidate_a'),
  'entity',
  'candidate',
  pg_temp.eid (k.name),
  'editor'
FROM
  unnest(ARRAY['cand_editor', 'cand_list']) AS k (name);

-- =====================================================================
-- Instruments
-- =====================================================================
-- What a statement answers the calling session, or an object that says what it raised. Not SECURITY DEFINER: every call made through it runs as the impersonated role.
CREATE FUNCTION pg_temp.answer (p_statement text) RETURNS jsonb LANGUAGE plpgsql AS $fn$
DECLARE
  v_answer jsonb;
BEGIN
  EXECUTE p_statement INTO v_answer;
  RETURN v_answer;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('raised', SQLSTATE, 'message', SQLERRM);
END;
$fn$;

-- The call of the list check, with prefix `p` and label `x`.
CREATE FUNCTION pg_temp.list_call (p_list jsonb) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    'SELECT private.nomination_list_checked(%L::jsonb, %L, %L)',
    p_list, 'p', 'x');
$fn$;

-- The call of the object check, with prefix `v` and label `o`.
CREATE FUNCTION pg_temp.object_call (p_object jsonb, p_parent_type text) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    'SELECT private.nomination_object_checked(%L::jsonb, %L::public.entity_type, %L, %L)',
    p_object, p_parent_type, 'v', 'o');
$fn$;

-- The call of the parent step at a contest of this file's election, round 1, with prefix `r` and label `l`. It answers `{"nomination_id", "created"}`.
CREATE FUNCTION pg_temp.resolve_call (
  p_project uuid,
  p_parent_type text,
  p_parent uuid,
  p_constituency uuid
) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    'SELECT to_jsonb(r) FROM private.parent_nomination_resolved(%L::uuid, %L::public.entity_type, %L::uuid, %L::uuid, %L::uuid, 1, %L, %L) AS r',
    p_project, p_parent_type, p_parent, pg_temp.eid ('e_one'), p_constituency, 'r', 'l');
$fn$;

-- The call of set_entity_nominations.
CREATE FUNCTION pg_temp.save_call (p_type text, p_id uuid, p_nominations jsonb) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    'SELECT public.set_entity_nominations(%L::public.entity_type, %L::uuid, %L::jsonb)',
    p_type, p_id, p_nominations);
$fn$;

-- The call of create_invitations in project A, confirming the named entities it invites.
CREATE FUNCTION pg_temp.invite_call (p_items jsonb) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    'SELECT public.create_invitations(%L::uuid, %L::jsonb, true)',
    test_id ('project_a'), p_items);
$fn$;

-- A well-formed object at this file's first contest, with the parent given.
CREATE FUNCTION pg_temp.obj (p_parent jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT jsonb_build_object(
    'election_id', pg_temp.eid ('e_one'),
    'constituency_id', pg_temp.eid ('c_one'),
    'parent', p_parent);
$fn$;

-- The answer of the object check for an object at this file's first contest.
CREATE FUNCTION pg_temp.checked (
  p_id uuid,
  p_symbol text,
  p_kind text,
  p_parent_entity_id uuid,
  p_name text
) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT jsonb_build_object(
    'id', p_id,
    'election_id', pg_temp.eid ('e_one'),
    'constituency_id', pg_temp.eid ('c_one'),
    'symbol', p_symbol,
    'kind', p_kind,
    'parent_entity_id', p_parent_entity_id,
    'name', p_name);
$fn$;

-- What a parent's nomination holds, as read by the calling session, and as expected of a bare row of this file's election.
CREATE FUNCTION pg_temp.parent_row (p_id uuid) RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT jsonb_build_object(
    'entity_id', COALESCE(n.organization_id, n.alliance_id),
    'entity_type', n.entity_type,
    'project_id', n.project_id,
    'election_id', n.election_id,
    'constituency_id', n.constituency_id,
    'election_round', n.election_round,
    'confirmed', n.confirmed,
    'election_symbol', n.election_symbol,
    'parent_nomination_id', n.parent_nomination_id,
    'custom_data', n.custom_data,
    'created_by', n.created_by)
  FROM public.nominations n
  WHERE n.id = p_id;
$fn$;

CREATE FUNCTION pg_temp.bare_row (
  p_entity_id uuid,
  p_entity_type text,
  p_constituency uuid,
  p_created_by uuid
) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT jsonb_build_object(
    'entity_id', p_entity_id,
    'entity_type', p_entity_type,
    'project_id', test_id ('project_a'),
    'election_id', pg_temp.eid ('e_one'),
    'constituency_id', p_constituency,
    'election_round', 1,
    'confirmed', false,
    'election_symbol', NULL,
    'parent_nomination_id', NULL,
    'custom_data', NULL,
    'created_by', p_created_by);
$fn$;

-- The id a stored answer of the parent step names.
CREATE FUNCTION pg_temp.answered_id (p_setting text) RETURNS uuid LANGUAGE sql STABLE AS $fn$
  SELECT (current_setting(p_setting)::jsonb ->> 'nomination_id')::uuid;
$fn$;

-- The definition of a function in the catalogue, exactly one of its name in its schema.
CREATE FUNCTION pg_temp.defined_as (
  p_schema text,
  p_name text,
  p_identity text,
  p_volatility "char",
  p_returns regtype
) RETURNS boolean LANGUAGE sql STABLE AS $fn$
  SELECT COALESCE(
    (
      SELECT count(*) = 1
        AND bool_and(
          NOT p.prosecdef
          AND 'search_path=""' = ANY (p.proconfig)
          AND p.provolatile = p_volatility
          AND p.pronargdefaults = 0
          AND p.prorettype = p_returns
          AND pg_get_function_identity_arguments(p.oid) = p_identity)
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = p_schema
        AND p.proname = p_name
    ),
    false);
$fn$;

-- Whether a function of `private` is executable by authenticated and service_role, and by neither anon nor PUBLIC.
CREATE FUNCTION pg_temp.granted_as_written (p_name text) RETURNS boolean LANGUAGE sql STABLE AS $fn$
  SELECT COALESCE(
    (
      SELECT count(*) = 1
        AND bool_and(
          has_function_privilege('authenticated', p.oid, 'EXECUTE')
          AND has_function_privilege('service_role', p.oid, 'EXECUTE')
          AND NOT has_function_privilege('anon', p.oid, 'EXECUTE')
          AND p.proacl IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM aclexplode(p.proacl) AS a
            WHERE a.grantee = 0
              AND a.privilege_type = 'EXECUTE'))
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'private'
        AND p.proname = p_name
    ),
    false);
$fn$;

-- =====================================================================
-- CAT: the functions in the catalogue
-- =====================================================================
SELECT
  ok (
    pg_temp.defined_as (
      'private',
      'nomination_list_checked',
      'p_list jsonb, p_prefix text, p_label text',
      'i',
      'void'
    ),
    'CAT: private.nomination_list_checked (list, prefix, label) returns void, is IMMUTABLE and not SECURITY DEFINER, has an empty search_path, and no parameter carries a default'
  );

SELECT
  ok (
    pg_temp.granted_as_written ('nomination_list_checked'),
    'CAT: authenticated and service_role may execute private.nomination_list_checked, and neither anon nor PUBLIC may'
  );

SELECT
  ok (
    pg_temp.defined_as (
      'private',
      'nomination_object_checked',
      'p_object jsonb, p_parent_type entity_type, p_prefix text, p_label text',
      's',
      'jsonb'
    ),
    'CAT: private.nomination_object_checked (object, parent type, prefix, label) returns jsonb, is STABLE and not SECURITY DEFINER, has an empty search_path, and no parameter carries a default'
  );

SELECT
  ok (
    pg_temp.granted_as_written ('nomination_object_checked'),
    'CAT: authenticated and service_role may execute private.nomination_object_checked, and neither anon nor PUBLIC may'
  );

SELECT
  ok (
    pg_temp.defined_as (
      'private',
      'parent_nomination_resolved',
      'p_project_id uuid, p_parent_type entity_type, p_parent_entity_id uuid, p_election_id uuid, p_constituency_id uuid, p_election_round integer, p_prefix text, p_label text, OUT nomination_id uuid, OUT created boolean',
      'v',
      'record'
    ),
    'CAT: private.parent_nomination_resolved (project, parent type, parent, election, constituency, round, prefix, label) answers the nomination id and whether it was created, is VOLATILE and not SECURITY DEFINER, has an empty search_path, and no parameter carries a default'
  );

SELECT
  ok (
    pg_temp.granted_as_written ('parent_nomination_resolved'),
    'CAT: authenticated and service_role may execute private.parent_nomination_resolved, and neither anon nor PUBLIC may'
  );

SELECT
  ok (
    COALESCE(
      (
        SELECT
          count(*) = 1
          AND bool_and(
            NOT p.prosecdef
            AND pg_get_function_identity_arguments(p.oid) = 'p_entity_type entity_type, p_entity_id uuid, p_nominations jsonb'
            AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
            AND NOT has_function_privilege('anon', p.oid, 'EXECUTE')
            AND NOT EXISTS (
              SELECT
                1
              FROM
                aclexplode(p.proacl) AS a
              WHERE
                a.grantee = 0
                AND a.privilege_type = 'EXECUTE'
            )
          )
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE
          n.nspname = 'public'
          AND p.proname = 'set_entity_nominations'
      ),
      false
    ),
    'CAT: set_entity_nominations is still the one function (type, id, nominations), not SECURITY DEFINER, executable by authenticated and by neither anon nor PUBLIC'
  );

-- =====================================================================
-- LIST: the array of nominations
-- =====================================================================
SELECT
  throws_ok (
    pg_temp.list_call ('{"election_id":"x"}'::jsonb),
    '22023',
    'p: x must be a JSON array',
    'LIST: an object is not an array'
  );

SELECT
  throws_ok (
    pg_temp.list_call ('"[]"'::jsonb),
    '22023',
    'p: x must be a JSON array',
    'LIST: a string is not an array'
  );

SELECT
  throws_ok (
    pg_temp.list_call ('null'::jsonb),
    '22023',
    'p: x must be a JSON array',
    'LIST: a JSON null is not an array'
  );

SELECT
  throws_ok (
    pg_temp.list_call (NULL),
    '22023',
    'p: x must be a JSON array',
    'LIST: an SQL NULL is not an array'
  );

SELECT
  lives_ok (
    pg_temp.list_call ('[]'::jsonb),
    'LIST: an empty array is admitted'
  );

SELECT
  lives_ok (
    pg_temp.list_call (
      (
        SELECT
          jsonb_agg(g)
        FROM
          generate_series(1, 1000) AS g
      )
    ),
    'LIST: an array of 1000 members is admitted, whatever its members are'
  );

SELECT
  throws_ok (
    pg_temp.list_call (
      (
        SELECT
          jsonb_agg(g)
        FROM
          generate_series(1, 1001) AS g
      )
    ),
    '22023',
    'p: x holds more than 1000 nominations',
    'LIST: an array of 1001 members is refused'
  );

-- Through set_entity_nominations, by the entity's own editor.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.save_call (
      'candidate',
      pg_temp.eid ('cand_list'),
      (
        SELECT
          jsonb_agg('{}'::jsonb)
        FROM
          generate_series(1, 1001)
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations holds more than 1000 nominations',
    'LIST: set_entity_nominations refuses 1001 objects that are each malformed by the bound, before any object is read'
  );

SELECT
  throws_ok (
    pg_temp.save_call (
      'candidate',
      pg_temp.eid ('cand_list'),
      (
        SELECT
          jsonb_agg('{}'::jsonb)
        FROM
          generate_series(1, 1000)
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[0] needs an election_id that is a uuid',
    'LIST: the twin, 1000 such objects, is refused by its first object'
  );

SELECT
  throws_ok (
    pg_temp.save_call (
      'candidate',
      pg_temp.eid ('cand_list'),
      '{}'::jsonb
    ),
    '22023',
    'set_entity_nominations: p_nominations must be a JSON array',
    'LIST: set_entity_nominations refuses a set that is not an array'
  );

SELECT
  reset_role ();

-- =====================================================================
-- VAL: one nomination object
-- =====================================================================
SELECT
  throws_ok (
    pg_temp.object_call ('"an object"'::jsonb, 'organization'),
    '22023',
    'v: o must be a JSON object',
    'VAL: a string is not an object'
  );

SELECT
  throws_ok (
    pg_temp.object_call (
      pg_temp.obj ('{"kind":"none"}'::jsonb) - 'election_id',
      'organization'
    ),
    '22023',
    'v: o needs an election_id that is a uuid',
    'VAL: an object with no election_id'
  );

SELECT
  throws_ok (
    pg_temp.object_call (
      pg_temp.obj ('{"kind":"none"}'::jsonb) || '{"constituency_id":7}'::jsonb,
      'organization'
    ),
    '22023',
    'v: o needs a constituency_id that is a uuid',
    'VAL: a constituency_id that is a number'
  );

SELECT
  throws_ok (
    pg_temp.object_call (
      pg_temp.obj ('{"kind":"none"}'::jsonb) || '{"id":null}'::jsonb,
      'organization'
    ),
    '22023',
    'v: o has an id that is not a uuid',
    'VAL: an id that is a JSON null'
  );

SELECT
  throws_ok (
    pg_temp.object_call (
      pg_temp.obj ('{"kind":"none"}'::jsonb) || '{"election_symbol":12}'::jsonb,
      'organization'
    ),
    '22023',
    'v: o has an election_symbol that is neither a string nor null',
    'VAL: a symbol that is a number'
  );

SELECT
  throws_ok (
    pg_temp.object_call (
      pg_temp.obj ('{"kind":"none"}'::jsonb) || jsonb_build_object('election_symbol', repeat('ä', 51)),
      'organization'
    ),
    '22023',
    'v: o has an election_symbol longer than 50 characters',
    'VAL: a symbol of 51 characters'
  );

SELECT
  throws_ok (
    pg_temp.object_call (
      pg_temp.obj ('{"kind":"none"}'::jsonb) - 'parent',
      'organization'
    ),
    '22023',
    'v: o needs a parent that is a JSON object',
    'VAL: an object with no parent'
  );

SELECT
  throws_ok (
    pg_temp.object_call (
      pg_temp.obj ('{"kind":"adopt"}'::jsonb),
      'organization'
    ),
    '22023',
    'v: o has a parent whose kind is not none, entity, other or keep',
    'VAL: a kind that is none of the four'
  );

SELECT
  throws_ok (
    pg_temp.object_call (
      pg_temp.obj (
        jsonb_build_object(
          'kind',
          'entity',
          'entity_type',
          'alliance',
          'entity_id',
          pg_temp.eid ('alliance_owner')
        )
      ),
      'organization'
    ),
    '22023',
    'v: o names a parent whose entity_type is not organization',
    'VAL: where the parent is an organization, an alliance is named in the message by the type asked for'
  );

SELECT
  throws_ok (
    pg_temp.object_call (
      pg_temp.obj (
        jsonb_build_object(
          'kind',
          'entity',
          'entity_type',
          'organization',
          'entity_id',
          pg_temp.eid ('org_owner')
        )
      ),
      'alliance'
    ),
    '22023',
    'v: o names a parent whose entity_type is not alliance',
    'VAL: where the parent is an alliance, an organization is refused and the message names alliance'
  );

SELECT
  throws_ok (
    pg_temp.object_call (
      pg_temp.obj (
        '{"kind":"entity","entity_type":"organization","entity_id":"not-a-uuid"}'::jsonb
      ),
      'organization'
    ),
    '22023',
    'v: o names a parent whose entity_id is not a uuid',
    'VAL: an entity_id that is not an id'
  );

SELECT
  throws_ok (
    pg_temp.object_call (
      pg_temp.obj ('{"kind":"other","name":5}'::jsonb),
      'organization'
    ),
    '22023',
    'v: o names a parent whose name is not a string',
    'VAL: a name that is a number'
  );

SELECT
  throws_ok (
    pg_temp.object_call (
      pg_temp.obj (
        jsonb_build_object('kind', 'other', 'name', E' \u3000\ufeff\t')
      ),
      'organization'
    ),
    '22023',
    'v: o names a parent whose name is blank',
    'VAL: a name of white space alone'
  );

SELECT
  throws_ok (
    pg_temp.object_call (
      pg_temp.obj (
        jsonb_build_object('kind', 'other', 'name', repeat('å', 101))
      ),
      'organization'
    ),
    '22023',
    'v: o names a parent whose name is longer than 100 characters',
    'VAL: a name of 101 characters'
  );

SELECT
  is (
    pg_temp.answer (
      pg_temp.object_call (
        pg_temp.obj ('{"kind":"none"}'::jsonb) || jsonb_build_object('election_symbol', E'\u00a0 12 \ufeff'),
        'organization'
      )
    ),
    pg_temp.checked (NULL, '12', 'none', NULL, NULL),
    'VAL: an object with no id is answered with a null id, its symbol trimmed of Unicode white space and the byte order mark'
  );

SELECT
  is (
    pg_temp.answer (
      pg_temp.object_call (
        pg_temp.obj ('{"kind":"keep"}'::jsonb) || jsonb_build_object(
          'id',
          pg_temp.nid ('org_nominated'),
          'election_symbol',
          E'\t  '
        ),
        'organization'
      )
    ),
    pg_temp.checked (
      pg_temp.nid ('org_nominated'),
      NULL,
      'keep',
      NULL,
      NULL
    ),
    'VAL: an id is echoed, and a blank symbol is answered as null'
  );

SELECT
  is (
    pg_temp.answer (
      pg_temp.object_call (
        pg_temp.obj (
          jsonb_build_object(
            'kind',
            'entity',
            'entity_type',
            'organization',
            'entity_id',
            pg_temp.eid ('org_owner'),
            'name',
            'not read'
          )
        ) || '{"election_symbol":null}'::jsonb,
        'organization'
      )
    ),
    pg_temp.checked (
      NULL,
      NULL,
      'entity',
      pg_temp.eid ('org_owner'),
      NULL
    ),
    'VAL: an entity parent is answered with its entity id and no name, and a JSON null symbol as null'
  );

SELECT
  is (
    pg_temp.answer (
      pg_temp.object_call (
        pg_temp.obj (
          jsonb_build_object(
            'kind',
            'entity',
            'entity_type',
            'alliance',
            'entity_id',
            pg_temp.eid ('alliance_owner')
          )
        ),
        'alliance'
      )
    ),
    pg_temp.checked (
      NULL,
      NULL,
      'entity',
      pg_temp.eid ('alliance_owner'),
      NULL
    ),
    'VAL: where the parent is an alliance, an alliance is admitted'
  );

SELECT
  is (
    pg_temp.answer (
      pg_temp.object_call (
        pg_temp.obj (
          jsonb_build_object(
            'kind',
            'other',
            'name',
            E'\t Party X\u3000\ufeff',
            'entity_id',
            pg_temp.eid ('org_owner')
          )
        ),
        'organization'
      )
    ),
    pg_temp.checked (NULL, NULL, 'other', NULL, 'Party X'),
    'VAL: an other parent is answered with its name trimmed and no entity id'
  );

SELECT
  is (
    pg_temp.answer (
      pg_temp.object_call (
        pg_temp.obj ('{"kind":"none"}'::jsonb) || jsonb_build_object(
          'election_symbol',
          E'  ' || repeat('ä', 50) || E'\u00a0'
        ),
        'organization'
      )
    ) ->> 'symbol',
    repeat('ä', 50),
    'VAL: a symbol of exactly 50 characters after the trim is admitted'
  );

SELECT
  is (
    pg_temp.answer (
      pg_temp.object_call (
        pg_temp.obj (
          jsonb_build_object('kind', 'other', 'name', repeat('å', 100))
        ),
        'organization'
      )
    ) ->> 'name',
    repeat('å', 100),
    'VAL: a name of exactly 100 characters is admitted'
  );

-- =====================================================================
-- RES: a parent's nomination at a contest
-- =====================================================================
-- As the owner, with no token: the claims an earlier impersonation set are cleared first.
SELECT
  set_test_user ('anon');

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.answer (
      pg_temp.resolve_call (
        test_id ('project_a'),
        'organization',
        pg_temp.eid ('org_nominated'),
        pg_temp.eid ('c_one')
      )
    ),
    jsonb_build_object(
      'nomination_id',
      pg_temp.nid ('org_nominated'),
      'created',
      false
    ),
    'RES: as the owner, a parent that holds a nomination at the contest is answered with it, and nothing is created'
  );

SELECT
  set_config(
    't46.owner',
    pg_temp.answer (
      pg_temp.resolve_call (
        test_id ('project_a'),
        'organization',
        pg_temp.eid ('org_owner'),
        pg_temp.eid ('c_one')
      )
    )::text,
    true
  );

SELECT
  is (
    current_setting('t46.owner')::jsonb - 'nomination_id',
    '{"created":true}'::jsonb,
    'RES: as the owner, a parent that holds no nomination at the contest is answered as created'
  );

SELECT
  is (
    pg_temp.parent_row (pg_temp.answered_id ('t46.owner')),
    pg_temp.bare_row (
      pg_temp.eid ('org_owner'),
      'organization',
      pg_temp.eid ('c_one'),
      NULL
    ),
    'RES: and the row answered is the organization''s at the contest, unconfirmed, with no symbol, parent or custom data'
  );

SELECT
  set_config(
    't46.alliance',
    pg_temp.answer (
      pg_temp.resolve_call (
        test_id ('project_a'),
        'alliance',
        pg_temp.eid ('alliance_owner'),
        pg_temp.eid ('c_one')
      )
    )::text,
    true
  );

SELECT
  is (
    jsonb_build_object(
      'created',
      current_setting('t46.alliance')::jsonb -> 'created',
      'row',
      pg_temp.parent_row (pg_temp.answered_id ('t46.alliance'))
    ),
    jsonb_build_object(
      'created',
      true,
      'row',
      pg_temp.bare_row (
        pg_temp.eid ('alliance_owner'),
        'alliance',
        pg_temp.eid ('c_one'),
        NULL
      )
    ),
    'RES: as the owner, an alliance''s bare row is created as the alliance''s'
  );

SELECT
  throws_ok (
    pg_temp.resolve_call (
      test_id ('project_a'),
      'organization',
      pg_temp.eid ('org_other_project'),
      pg_temp.eid ('c_one')
    ),
    '22023',
    'r: l names a parent that is no entity of the nomination''s project',
    'RES: an organization of another project is refused with the prefix and label given'
  );

SELECT
  throws_ok (
    pg_temp.resolve_call (
      test_id ('project_a'),
      'organization',
      pg_temp.eid ('nothing'),
      pg_temp.eid ('c_one')
    ),
    '22023',
    'r: l names a parent that is no entity of the nomination''s project',
    'RES: an id that names no organization is refused the same way'
  );

-- As project A's admin.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.answer (
      pg_temp.resolve_call (
        test_id ('project_a'),
        'organization',
        pg_temp.eid ('org_nominated'),
        pg_temp.eid ('c_one')
      )
    ),
    jsonb_build_object(
      'nomination_id',
      pg_temp.nid ('org_nominated'),
      'created',
      false
    ),
    'RES: as the project''s admin, a parent that holds a nomination at the contest is answered with it'
  );

SELECT
  set_config(
    't46.admin',
    pg_temp.answer (
      pg_temp.resolve_call (
        test_id ('project_a'),
        'organization',
        pg_temp.eid ('org_admin'),
        pg_temp.eid ('c_one')
      )
    )::text,
    true
  );

SELECT
  is (
    current_setting('t46.admin')::jsonb - 'nomination_id',
    '{"created":true}'::jsonb,
    'RES: as the project''s admin, a parent that holds no nomination at the contest is answered as created'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.parent_row (pg_temp.answered_id ('t46.admin')),
    pg_temp.bare_row (
      pg_temp.eid ('org_admin'),
      'organization',
      pg_temp.eid ('c_one'),
      test_user_id ('admin_a')
    ),
    'RES: and the row is the organization''s, unconfirmed and bare, inserted by the admin'
  );

-- As the editor of a candidate of project A.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.resolve_call (
      test_id ('project_a'),
      'organization',
      pg_temp.eid ('org_editor'),
      pg_temp.eid ('c_one')
    ),
    '42501',
    'new row violates row-level security policy for table "nominations"',
    'RES: as an entity''s editor that holds no nomination at the contest, the parent''s row is refused by the caller''s own policies'
  );

SELECT
  reset_role ();

INSERT INTO
  nominations (
    id,
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round
  )
VALUES
  (
    pg_temp.nid ('cand_editor'),
    test_id ('project_a'),
    pg_temp.eid ('cand_editor'),
    pg_temp.eid ('e_one'),
    pg_temp.eid ('c_one'),
    1
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  set_config(
    't46.editor',
    pg_temp.answer (
      pg_temp.resolve_call (
        test_id ('project_a'),
        'organization',
        pg_temp.eid ('org_editor'),
        pg_temp.eid ('c_one')
      )
    )::text,
    true
  );

SELECT
  is (
    current_setting('t46.editor')::jsonb - 'nomination_id',
    '{"created":true}'::jsonb,
    'RES: the twin, the same editor once its candidate holds a nomination at the contest, creates the parent''s row'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.parent_row (pg_temp.answered_id ('t46.editor')),
    pg_temp.bare_row (
      pg_temp.eid ('org_editor'),
      'organization',
      pg_temp.eid ('c_one'),
      test_user_id ('candidate_a')
    ),
    'RES: and the row is the organization''s, unconfirmed and bare, inserted by the editor'
  );

SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    pg_temp.resolve_call (
      test_id ('project_a'),
      'organization',
      pg_temp.eid ('org_twin'),
      pg_temp.eid ('c_one')
    ),
    '42501',
    'permission denied for function parent_nomination_resolved',
    'RES: anon is refused private.parent_nomination_resolved by privilege'
  );

SELECT
  reset_role ();

-- =====================================================================
-- XPROJ: a nomination's parent, and an invited entity that states nominations, must be entities of the nomination's project
--
-- Refused through set_entity_nominations, by project A's admin, who holds nomination.edit on every candidate of the project; and through create_invitations, by the service role, which bypasses the policies, for an invited entity of another project, and by project A's admin for a parent of another project. A refused call writes nothing: neither an invitation, nor the candidate's nomination, nor a row for the parent.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.save_call (
      'candidate',
      pg_temp.eid ('cand_xproj'),
      jsonb_build_array(
        jsonb_build_object(
          'election_id',
          pg_temp.eid ('e_one'),
          'constituency_id',
          pg_temp.eid ('c_two'),
          'parent',
          jsonb_build_object(
            'kind',
            'entity',
            'entity_type',
            'organization',
            'entity_id',
            pg_temp.eid ('org_other_project')
          )
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[0] names a parent that is no entity of the nomination''s project',
    'XPROJ: a new nomination naming an organization of another project as its parent is refused'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations n
      WHERE
        n.candidate_id = pg_temp.eid ('cand_xproj')
    ),
    0,
    'XPROJ: and the candidate holds no nomination afterwards'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations n
      WHERE
        n.organization_id = pg_temp.eid ('org_other_project')
    ),
    0,
    'XPROJ: and the organization of the other project holds no row'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.save_call (
      'candidate',
      pg_temp.eid ('cand_xproj'),
      jsonb_build_array(
        jsonb_build_object(
          'election_id',
          pg_temp.eid ('e_one'),
          'constituency_id',
          pg_temp.eid ('c_two'),
          'parent',
          jsonb_build_object(
            'kind',
            'entity',
            'entity_type',
            'organization',
            'entity_id',
            pg_temp.eid ('nothing')
          )
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[0] names a parent that is no entity of the nomination''s project',
    'XPROJ: a parent entity_id that names no entity is refused the same way'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations n
      WHERE
        n.candidate_id = pg_temp.eid ('cand_xproj')
    ),
    0,
    'XPROJ: and the candidate still holds no nomination'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.answer (
      pg_temp.save_call (
        'candidate',
        pg_temp.eid ('cand_xproj'),
        jsonb_build_array(
          jsonb_build_object(
            'election_id',
            pg_temp.eid ('e_one'),
            'constituency_id',
            pg_temp.eid ('c_two'),
            'parent',
            jsonb_build_object(
              'kind',
              'entity',
              'entity_type',
              'organization',
              'entity_id',
              pg_temp.eid ('org_twin')
            )
          )
        )
      )
    ),
    jsonb_build_object(
      'inserted',
      1,
      'updated',
      0,
      'deleted',
      0,
      'unchanged',
      0,
      'parents_created',
      1
    ),
    'XPROJ: the twin, an organization of the nomination''s own project, is written with its parent''s row'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        p.organization_id
      FROM
        nominations n
        JOIN nominations p ON p.id = n.parent_nomination_id
      WHERE
        n.candidate_id = pg_temp.eid ('cand_xproj')
    ),
    pg_temp.eid ('org_twin'),
    'XPROJ: and the candidate''s nomination stands under that organization''s new row'
  );

-- Through create_invitations.
SET
  LOCAL ROLE service_role;

SELECT
  throws_ok (
    pg_temp.invite_call (
      jsonb_build_array(
        jsonb_build_object(
          'target_type',
          'candidate',
          'target_id',
          test_id ('candidate_b'),
          'nominations',
          jsonb_build_array(
            pg_temp.obj ('{"kind":"none"}'::jsonb) || '{"confirmed":false}'::jsonb
          )
        )
      )
    ),
    '22023',
    'create_invitations: p_invitations[0] states nominations for an entity that is no entity of the project',
    'XPROJ: the service role inviting a candidate of another project with nominations is refused through create_invitations'
  );

SELECT
  reset_role ();

SELECT
  is (
    ARRAY[
      (
        SELECT
          count(*)::integer
        FROM
          invitations i
        WHERE
          i.target_id = test_id ('candidate_b')
      ),
      (
        SELECT
          count(*)::integer
        FROM
          nominations n
        WHERE
          n.candidate_id = test_id ('candidate_b')
          AND n.project_id = test_id ('project_a')
      )
    ],
    ARRAY[0, 0],
    'XPROJ: and neither an invitation nor a nomination of that candidate is stored'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.invite_call (
      jsonb_build_array(
        jsonb_build_object(
          'target_type',
          'candidate',
          'target_id',
          pg_temp.eid ('cand_xinv'),
          'nominations',
          jsonb_build_array(
            pg_temp.obj (
              jsonb_build_object(
                'kind',
                'entity',
                'entity_type',
                'organization',
                'entity_id',
                pg_temp.eid ('org_other_project')
              )
            ) || '{"confirmed":false}'::jsonb
          )
        )
      )
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] names a parent that is no entity of the nomination''s project',
    'XPROJ: an invitation whose nomination names an organization of another project as its parent is refused through create_invitations'
  );

SELECT
  reset_role ();

SELECT
  is (
    ARRAY[
      (
        SELECT
          count(*)::integer
        FROM
          invitations i
        WHERE
          i.target_id = pg_temp.eid ('cand_xinv')
      ),
      (
        SELECT
          count(*)::integer
        FROM
          nominations n
        WHERE
          n.candidate_id = pg_temp.eid ('cand_xinv')
      ),
      (
        SELECT
          count(*)::integer
        FROM
          nominations n
        WHERE
          n.organization_id = pg_temp.eid ('org_other_project')
      )
    ],
    ARRAY[0, 0, 0],
    'XPROJ: and neither an invitation, nor the candidate''s nomination, nor a row of the other project''s organization is stored'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.answer (
      pg_temp.invite_call (
        jsonb_build_array(
          jsonb_build_object(
            'target_type',
            'candidate',
            'target_id',
            pg_temp.eid ('cand_xinv'),
            'nominations',
            jsonb_build_array(
              pg_temp.obj (
                jsonb_build_object(
                  'kind',
                  'entity',
                  'entity_type',
                  'organization',
                  'entity_id',
                  pg_temp.eid ('org_twin')
                )
              ) || '{"confirmed":false}'::jsonb
            )
          )
        )
      )
    ) -> 0 -> 'nominations',
    jsonb_build_object(
      'inserted',
      1,
      'updated',
      0,
      'unchanged',
      0,
      'parents_created',
      1
    ),
    'XPROJ: the twin, an organization of the invitation''s own project, is written with its parent''s row through create_invitations'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        p.organization_id
      FROM
        nominations n
        JOIN nominations p ON p.id = n.parent_nomination_id
      WHERE
        n.candidate_id = pg_temp.eid ('cand_xinv')
    ),
    pg_temp.eid ('org_twin'),
    'XPROJ: and the invited candidate''s nomination stands under that organization''s new row'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
