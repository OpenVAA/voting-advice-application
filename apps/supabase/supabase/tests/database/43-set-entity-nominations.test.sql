-- 43-set-entity-nominations.test.sql: an entity's whole set of nominations, written in one call under the caller's own rights
--
-- `set_entity_nominations` takes the set of nominations a candidate or an organization is to hold and inserts, updates, links and deletes until the rows it may write equal that set. It is SECURITY INVOKER, so the policies, the column grants and the triggers of `public.nominations` decide every statement; this file asserts the function's own rules and that each of those guards refuses through it.
--
-- Each assertion's description begins with the tag of the rule it pins:
--   CAT   - the function in the catalogue and who may execute it.
--   ARG   - every refusal of a malformed argument, SQLSTATE 22023, an object named by its index.
--   WHO   - a caller that does not hold `nomination.edit` on the entity.
--   NEW   - a new nomination: unconfirmed, at its election's current round, the symbol trimmed.
--   OTHER - the requested name in the custom data, merged with the keys already there.
--   LINK  - a listed party or alliance: its nomination at the contest linked, or created when there is none.
--   REQ   - the parent a candidate needs where its election's type requires one, raised inside the call.
--   SKIP  - a nomination whose values did not change is not written.
--   EDIT  - a changed value is written and leaves the row unconfirmed.
--   KEEP  - an object that leaves its row's parent as it is.
--   DEL   - a nomination the set leaves out is deleted, and only inside the function's reach.
--   MOVE  - a changed constituency is a delete and an insert.
--   U02   - several nominations of one election.
--   LOCK  - under the nominations lock every call that would write raises.
--   ATOM  - a refused call stores nothing.
--   CAP   - the cap on unconfirmed parent nominations a caller originates, met through the function.
--   ENC   - white space, lengths in characters and exact comparison.
--   MODE  - the end-of-transaction parent rule is deferred again after a call.
--   ANON  - refused by privilege.
--
-- A refusal is asserted by its SQLSTATE and, where the function words it, by its whole message. A call that must live is made through `pg_temp.save`, which answers what the function answered, and the rows are then read as the owner: an entity's editor cannot read the nomination it has created for a party.
--
-- Every assertion that reads a guard has a twin that differs in one thing: the same call by the entity's own editor, with the lock off, with one row fewer, without its last object.
--
-- Every impersonation passes an empty grant array, so each claim is projected from the rows this file writes. The user of the fixture's candidate_a edits every candidate of this file that is written to, and the user of organization_a both organizations.
--
-- This file never commits. The function forces the end-of-transaction parent rule itself; the statements here that probe the constraint's mode leave nothing pending and never leave it immediate.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_seed_identity_grants).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (130);

SELECT
  create_test_data ();

-- =====================================================================
-- Names for the rows of this file
-- =====================================================================
-- `eid` names an election, a constituency or an entity of this file.
CREATE FUNCTION pg_temp.eid (p_name text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $fn$
  SELECT ('43434343-4343-4343-4343-0000000000' || CASE p_name
    WHEN 'e_default' THEN 'e1'
    WHEN 'e_list' THEN 'e2'
    WHEN 'e_round2' THEN 'e3'
    WHEN 'e_flipped' THEN 'e4'
    WHEN 'c_one' THEN 'c1'
    WHEN 'c_two' THEN 'c2'
    WHEN 'party_nominated' THEN 'b1'
    WHEN 'party_bare' THEN 'b2'
    WHEN 'org_with_child' THEN 'b3'
    WHEN 'org_bare' THEN 'b4'
    WHEN 'alliance_bare' THEN 'd1'
    WHEN 'alliance_nominated' THEN 'd2'
    WHEN 'cand_arg' THEN 'a1'
    WHEN 'cand_new' THEN 'a2'
    WHEN 'cand_req' THEN 'a3'
    WHEN 'cand_skip' THEN 'a4'
    WHEN 'cand_keep' THEN 'a5'
    WHEN 'cand_del' THEN 'a6'
    WHEN 'cand_move' THEN 'a7'
    WHEN 'cand_child' THEN 'a8'
    WHEN 'cand_several' THEN 'a9'
    WHEN 'cand_lock' THEN 'aa'
    WHEN 'cand_atom' THEN 'ab'
    WHEN 'cand_cap' THEN 'ac'
    WHEN 'cand_enc' THEN 'ad'
    WHEN 'cand_probe' THEN 'ae'
  END)::uuid;
$fn$;

-- `nid` names a nomination the fixture inserts.
CREATE FUNCTION pg_temp.nid (p_name text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $fn$
  SELECT ('43434343-4343-4343-4343-000000000' || CASE p_name
    WHEN 'party_nominated' THEN '101'
    WHEN 'alliance_nominated' THEN '102'
    WHEN 'org_with_child' THEN '103'
    WHEN 'arg_current' THEN 'a01'
    WHEN 'arg_old_round' THEN 'a02'
    WHEN 'skip' THEN 'a04'
    WHEN 'keep' THEN 'a05'
    WHEN 'del_one' THEN 'a06'
    WHEN 'del_round2' THEN 'a07'
    WHEN 'del_old_round' THEN 'a08'
    WHEN 'del_flipped' THEN 'a09'
    WHEN 'move' THEN 'a0a'
    WHEN 'child' THEN 'a0b'
    WHEN 'several_one' THEN 'a0c'
    WHEN 'several_two' THEN 'a0d'
    WHEN 'lock' THEN 'a0e'
  END)::uuid;
$fn$;

-- =====================================================================
-- Fixture, local to this transaction and inserted before the first impersonation, so that no row names a creator
-- =====================================================================
-- Four elections of project A over one constituency group of two constituencies: one that takes the default type, one that states `organization_list`, one whose current round is 2, and one that takes the default type here and is given a type that refuses candidates once its nomination is stored.
INSERT INTO
  elections (
    id,
    project_id,
    name,
    election_type,
    current_round
  )
VALUES
  (
    pg_temp.eid ('e_default'),
    test_id ('project_a'),
    '{"en":"Default-type election"}'::jsonb,
    DEFAULT,
    1
  ),
  (
    pg_temp.eid ('e_list'),
    test_id ('project_a'),
    '{"en":"List election"}'::jsonb,
    'organization_list',
    1
  ),
  (
    pg_temp.eid ('e_round2'),
    test_id ('project_a'),
    '{"en":"Election in its second round"}'::jsonb,
    DEFAULT,
    2
  ),
  (
    pg_temp.eid ('e_flipped'),
    test_id ('project_a'),
    '{"en":"Election whose type is changed"}'::jsonb,
    DEFAULT,
    1
  );

INSERT INTO
  constituency_groups (id, project_id, name)
VALUES
  (
    '43434343-4343-4343-4343-0000000000f1',
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
  (
    '43434343-4343-4343-4343-0000000000f1',
    pg_temp.eid ('c_one')
  ),
  (
    '43434343-4343-4343-4343-0000000000f1',
    pg_temp.eid ('c_two')
  );

INSERT INTO
  election_constituency_groups (election_id, constituency_group_id)
SELECT
  pg_temp.eid (e.name),
  '43434343-4343-4343-4343-0000000000f1'
FROM
  unnest(
    ARRAY['e_default', 'e_list', 'e_round2', 'e_flipped']
  ) AS e (name);

-- Two parties a candidate may name, one nominated at the first contest of the default-type election and one nominated nowhere; and two organizations that the user of organization_a edits, one whose nomination has a candidate's nomination under it and one with no nomination.
INSERT INTO
  organizations (id, project_id, name, confirmed)
VALUES
  (
    pg_temp.eid ('party_nominated'),
    test_id ('project_a'),
    '{"en":"Nominated Party"}'::jsonb,
    true
  ),
  (
    pg_temp.eid ('party_bare'),
    test_id ('project_a'),
    '{"en":"Party Without A Nomination"}'::jsonb,
    true
  ),
  (
    pg_temp.eid ('org_with_child'),
    test_id ('project_a'),
    '{"en":"Organization With A Candidate"}'::jsonb,
    true
  ),
  (
    pg_temp.eid ('org_bare'),
    test_id ('project_a'),
    '{"en":"Organization Without A Nomination"}'::jsonb,
    true
  );

-- Two alliances an organization may name, one nominated nowhere and one nominated at the first contest of the default-type election.
INSERT INTO
  alliances (id, project_id, name, confirmed)
VALUES
  (
    pg_temp.eid ('alliance_bare'),
    test_id ('project_a'),
    '{"en":"Alliance Without A Nomination"}'::jsonb,
    false
  ),
  (
    pg_temp.eid ('alliance_nominated'),
    test_id ('project_a'),
    '{"en":"Nominated Alliance"}'::jsonb,
    true
  );

-- One candidate per section, so that no section reads what another wrote.
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
      'cand_arg',
      'cand_new',
      'cand_req',
      'cand_skip',
      'cand_keep',
      'cand_del',
      'cand_move',
      'cand_child',
      'cand_several',
      'cand_lock',
      'cand_atom',
      'cand_cap',
      'cand_enc',
      'cand_probe'
    ]
  ) AS k (name);

-- The parents' nominations.
INSERT INTO
  nominations (
    id,
    project_id,
    organization_id,
    alliance_id,
    election_id,
    constituency_id,
    election_round,
    confirmed
  )
VALUES
  (
    pg_temp.nid ('party_nominated'),
    test_id ('project_a'),
    pg_temp.eid ('party_nominated'),
    NULL,
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one'),
    1,
    true
  ),
  (
    pg_temp.nid ('alliance_nominated'),
    test_id ('project_a'),
    NULL,
    pg_temp.eid ('alliance_nominated'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one'),
    1,
    false
  ),
  (
    pg_temp.nid ('org_with_child'),
    test_id ('project_a'),
    pg_temp.eid ('org_with_child'),
    NULL,
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one'),
    1,
    true
  );

-- The candidates' nominations. `skip` is confirmed and stands under a party; `keep` is confirmed and stands under the shared fixture's faction; `child` stands under an organization's nomination. `skip` and `keep` carry an updated_at in the past, because every statement of this transaction that writes a row gives it the same timestamp, and an assertion that a row was not written must be able to tell.
INSERT INTO
  nominations (
    id,
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round,
    parent_nomination_id,
    election_symbol,
    confirmed,
    updated_at
  )
VALUES
  (
    pg_temp.nid ('arg_current'),
    test_id ('project_a'),
    pg_temp.eid ('cand_arg'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one'),
    1,
    NULL,
    NULL,
    false,
    DEFAULT
  ),
  (
    pg_temp.nid ('arg_old_round'),
    test_id ('project_a'),
    pg_temp.eid ('cand_arg'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one'),
    7,
    NULL,
    NULL,
    false,
    DEFAULT
  ),
  (
    pg_temp.nid ('skip'),
    test_id ('project_a'),
    pg_temp.eid ('cand_skip'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one'),
    1,
    pg_temp.nid ('party_nominated'),
    '3',
    true,
    '2020-01-01T00:00:00Z'
  ),
  (
    pg_temp.nid ('keep'),
    test_id ('project_a'),
    pg_temp.eid ('cand_keep'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    test_id ('nomination_faction_a'),
    NULL,
    true,
    '2020-01-01T00:00:00Z'
  ),
  (
    pg_temp.nid ('del_one'),
    test_id ('project_a'),
    pg_temp.eid ('cand_del'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one'),
    1,
    NULL,
    NULL,
    false,
    DEFAULT
  ),
  (
    pg_temp.nid ('del_round2'),
    test_id ('project_a'),
    pg_temp.eid ('cand_del'),
    pg_temp.eid ('e_round2'),
    pg_temp.eid ('c_one'),
    2,
    NULL,
    NULL,
    false,
    DEFAULT
  ),
  (
    pg_temp.nid ('del_old_round'),
    test_id ('project_a'),
    pg_temp.eid ('cand_del'),
    pg_temp.eid ('e_round2'),
    pg_temp.eid ('c_one'),
    1,
    NULL,
    NULL,
    false,
    DEFAULT
  ),
  (
    pg_temp.nid ('del_flipped'),
    test_id ('project_a'),
    pg_temp.eid ('cand_del'),
    pg_temp.eid ('e_flipped'),
    pg_temp.eid ('c_one'),
    1,
    NULL,
    NULL,
    false,
    DEFAULT
  ),
  (
    pg_temp.nid ('move'),
    test_id ('project_a'),
    pg_temp.eid ('cand_move'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one'),
    1,
    NULL,
    '7',
    true,
    DEFAULT
  ),
  (
    pg_temp.nid ('child'),
    test_id ('project_a'),
    pg_temp.eid ('cand_child'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one'),
    1,
    pg_temp.nid ('org_with_child'),
    NULL,
    false,
    DEFAULT
  ),
  (
    pg_temp.nid ('several_one'),
    test_id ('project_a'),
    pg_temp.eid ('cand_several'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one'),
    1,
    NULL,
    NULL,
    false,
    DEFAULT
  ),
  (
    pg_temp.nid ('several_two'),
    test_id ('project_a'),
    pg_temp.eid ('cand_several'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_two'),
    1,
    NULL,
    NULL,
    false,
    DEFAULT
  ),
  (
    pg_temp.nid ('lock'),
    test_id ('project_a'),
    pg_temp.eid ('cand_lock'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one'),
    1,
    NULL,
    '5',
    false,
    DEFAULT
  );

-- The election's type is changed after its nomination is stored: nothing re-checks a stored nomination, and the new type refuses a candidate.
UPDATE elections
SET
  election_type = 'organization_only'
WHERE
  id = pg_temp.eid ('e_flipped');

-- The editor rows: the three fixture identities' own, the candidates this file writes to for the user of candidate_a, and both organizations for the user of organization_a. `cand_child` and `cand_probe` have no editor.
SELECT
  test_seed_identity_grants ('candidate_a');

SELECT
  test_seed_identity_grants ('candidate_a2');

SELECT
  test_seed_identity_grants ('organization_a');

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
SELECT
  test_user_id ('candidate_a'),
  'entity',
  'candidate',
  pg_temp.eid (k.name),
  'editor'
FROM
  unnest(
    ARRAY[
      'cand_arg',
      'cand_new',
      'cand_req',
      'cand_skip',
      'cand_keep',
      'cand_del',
      'cand_move',
      'cand_several',
      'cand_lock',
      'cand_atom',
      'cand_cap',
      'cand_enc'
    ]
  ) AS k (name);

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
SELECT
  test_user_id ('organization_a'),
  'entity',
  'organization',
  pg_temp.eid (o.name),
  'editor'
FROM
  unnest(ARRAY['org_with_child', 'org_bare']) AS o (name);

SELECT
  is (
    ARRAY(
      SELECT
        e.election_type::text || ' ' || e.current_round
      FROM
        elections e
      WHERE
        e.id IN (
          pg_temp.eid ('e_default'),
          pg_temp.eid ('e_list'),
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('e_flipped')
        )
      ORDER BY
        e.id
    ),
    ARRAY[
      'organization_list_and_independents 1',
      'organization_list 1',
      'organization_list_and_independents 2',
      'organization_only 1'
    ],
    'the fixture: an election of the default type, one that requires a candidate''s parent, one in its second round and one whose type now refuses a candidate'
  );

-- =====================================================================
-- Instruments
-- =====================================================================
-- One object of the argument. The id is left out when none is given.
CREATE FUNCTION pg_temp.item (
  p_id uuid,
  p_election uuid,
  p_constituency uuid,
  p_symbol text,
  p_parent jsonb
) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT jsonb_strip_nulls(jsonb_build_object('id', p_id))
    || jsonb_build_object(
      'election_id', p_election,
      'constituency_id', p_constituency,
      'election_symbol', p_symbol,
      'parent', p_parent);
$fn$;

-- The four kinds of parent.
CREATE FUNCTION pg_temp.none () RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT '{"kind":"none"}'::jsonb;
$fn$;

CREATE FUNCTION pg_temp.keep () RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT '{"kind":"keep"}'::jsonb;
$fn$;

CREATE FUNCTION pg_temp.other (p_name text) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT jsonb_build_object('kind', 'other', 'name', p_name);
$fn$;

CREATE FUNCTION pg_temp.entity (p_type text, p_id uuid) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT jsonb_build_object('kind', 'entity', 'entity_type', p_type, 'entity_id', p_id);
$fn$;

-- The nominations in reach of an entity as the calling session reads them, each id with its updated_at: the expectation of a caller that has just read them, so that every call here is made from a read that is current.
CREATE FUNCTION pg_temp.reach_now (p_type text, p_id uuid) RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT COALESCE(jsonb_object_agg(n.id, n.updated_at), '{}'::jsonb)
  FROM public.nominations n
  JOIN public.elections e ON e.id = n.election_id
  WHERE (
      (p_type = 'candidate' AND n.candidate_id = p_id)
      OR (p_type = 'organization' AND n.organization_id = p_id)
    )
    AND COALESCE(n.election_round, 1) = COALESCE(e.current_round, 1)
    AND public.nomination_shape_rule(e.election_type, p_type::public.entity_type) IN ('admitted', 'parent_required');
$fn$;

-- The statement that calls the function, as text: `throws_ok` runs a string, so a database without the function fails each refusal as an assertion of its own. The expected reach is read when the statement runs. `50-nomination-write-guards.test.sql` asserts what a stale one is refused with.
CREATE FUNCTION pg_temp.call (p_type text, p_id uuid, p_nominations jsonb) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    'SELECT public.set_entity_nominations(%L::public.entity_type, %L::uuid, %L::jsonb, pg_temp.reach_now(%L, %L::uuid))',
    p_type, p_id, p_nominations, p_type, p_id);
$fn$;

-- What the function answers the calling session, or an object that says what it raised. It is not SECURITY DEFINER: under owner rights every policy would admit every statement, and the assertions below would pass against any function.
CREATE FUNCTION pg_temp.save (p_type text, p_id uuid, p_nominations jsonb) RETURNS jsonb LANGUAGE plpgsql AS $fn$
DECLARE
  v_answer jsonb;
BEGIN
  EXECUTE pg_temp.call(p_type, p_id, p_nominations) INTO v_answer;
  RETURN v_answer;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('raised', SQLSTATE, 'message', SQLERRM);
END;
$fn$;

-- The answer of a call that lived.
CREATE FUNCTION pg_temp.counts (
  p_inserted integer,
  p_updated integer,
  p_deleted integer,
  p_unchanged integer,
  p_parents_created integer
) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT jsonb_build_object(
    'inserted', p_inserted,
    'updated', p_updated,
    'deleted', p_deleted,
    'unchanged', p_unchanged,
    'parents_created', p_parents_created);
$fn$;

-- The id of the nomination an entity holds at a contest at the election's current round, read by the calling session.
CREATE FUNCTION pg_temp.held (
  p_entity uuid,
  p_election uuid,
  p_constituency uuid
) RETURNS uuid LANGUAGE sql AS $fn$
  SELECT n.id
  FROM public.nominations n
  JOIN public.elections e ON e.id = n.election_id
  WHERE COALESCE(n.candidate_id, n.organization_id, n.alliance_id) = p_entity
    AND n.election_id = p_election
    AND n.constituency_id = p_constituency
    AND n.election_round IS NOT DISTINCT FROM e.current_round;
$fn$;

-- What a nomination holds, as an expectation and as read by the calling session.
CREATE FUNCTION pg_temp.holding (
  p_confirmed boolean,
  p_round integer,
  p_symbol text,
  p_parent uuid,
  p_custom_data jsonb
) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT jsonb_build_object(
    'confirmed', p_confirmed,
    'round', p_round,
    'symbol', p_symbol,
    'parent', p_parent,
    'custom_data', p_custom_data);
$fn$;

CREATE FUNCTION pg_temp.stored (p_id uuid) RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT pg_temp.holding(n.confirmed, n.election_round, n.election_symbol, n.parent_nomination_id, n.custom_data)
  FROM public.nominations n
  WHERE n.id = p_id;
$fn$;

-- How many nominations an entity holds, at every round and in every election, read by the calling session.
CREATE FUNCTION pg_temp.held_count (p_entity uuid) RETURNS integer LANGUAGE sql AS $fn$
  SELECT count(*)::integer
  FROM public.nominations n
  WHERE COALESCE(n.candidate_id, n.organization_id, n.alliance_id) = p_entity;
$fn$;

-- The message of a statement that affected fewer rows than it was meant to.
CREATE FUNCTION pg_temp.unwritten () RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT 'set_entity_nominations: a nomination could not be written; nominations are locked or the rows are no longer the caller''s';
$fn$;

-- A candidate's row with no parent in the election that requires one, inserted and deleted in one string, so that the pending rule finds nothing to judge afterwards. It raises at its own statement exactly when the constraint is immediate.
CREATE FUNCTION pg_temp.probe () RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    'INSERT INTO public.nominations (project_id, candidate_id, election_id, constituency_id, election_round) VALUES (%L, %L, %L, %L, 9); DELETE FROM public.nominations WHERE candidate_id = %L',
    test_id ('project_a'), pg_temp.eid ('cand_probe'), pg_temp.eid ('e_list'), pg_temp.eid ('c_one'), pg_temp.eid ('cand_probe'));
$fn$;

-- =====================================================================
-- CAT: the function in the catalogue
-- =====================================================================
SELECT
  ok (
    COALESCE(
      (
        SELECT
          NOT p.prosecdef
          AND 'search_path=""' = ANY (p.proconfig)
          AND p.provolatile = 'v'
          AND p.pronargdefaults = 0
          AND p.prorettype = 'jsonb'::regtype
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE
          n.nspname = 'public'
          AND p.proname = 'set_entity_nominations'
          AND pg_get_function_identity_arguments(p.oid) = 'p_entity_type entity_type, p_entity_id uuid, p_nominations jsonb, p_expected_reach jsonb'
      ),
      false
    ),
    'CAT: set_entity_nominations (type, id, nominations, expected reach) returns jsonb, is VOLATILE and not SECURITY DEFINER, has an empty search_path, and no parameter carries a default'
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
          AND p.proname = 'set_entity_nominations'
      ),
      false
    ),
    'CAT: authenticated may execute set_entity_nominations and anon may not'
  );

-- =====================================================================
-- ARG: the refusals of the argument
--
-- The caller edits the entity it names, so each refusal is the argument's. The object that is refused stands second wherever the rule lets it, behind an object that is well formed, so the message's index is not the only index there is.
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.call ('faction', pg_temp.eid ('cand_arg'), '[]'::jsonb),
    '22023',
    'set_entity_nominations: p_entity_type must be candidate or organization',
    'ARG: a faction is not served'
  );

SELECT
  throws_ok (
    pg_temp.call ('alliance', pg_temp.eid ('cand_arg'), '[]'::jsonb),
    '22023',
    'set_entity_nominations: p_entity_type must be candidate or organization',
    'ARG: an alliance is not served'
  );

SELECT
  throws_ok (
    pg_temp.call (NULL, pg_temp.eid ('cand_arg'), '[]'::jsonb),
    '22023',
    'set_entity_nominations: p_entity_type, p_entity_id and p_nominations must each be stated',
    'ARG: a NULL entity type is refused'
  );

SELECT
  throws_ok (
    pg_temp.call ('candidate', NULL, '[]'::jsonb),
    '22023',
    'set_entity_nominations: p_entity_type, p_entity_id and p_nominations must each be stated',
    'ARG: a NULL entity id is refused'
  );

SELECT
  throws_ok (
    pg_temp.call ('candidate', pg_temp.eid ('cand_arg'), NULL),
    '22023',
    'set_entity_nominations: p_entity_type, p_entity_id and p_nominations must each be stated',
    'ARG: a NULL set is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      pg_temp.item (
        pg_temp.nid ('arg_current'),
        pg_temp.eid ('e_default'),
        pg_temp.eid ('c_one'),
        NULL,
        pg_temp.none ()
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations must be a JSON array',
    'ARG: a set that is one object and not an array is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      'null'::jsonb
    ),
    '22023',
    'set_entity_nominations: p_nominations must be a JSON array',
    'ARG: a set that is a JSON null is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        'not an object'
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] must be a JSON object',
    'ARG: a member that is not an object is refused by its index'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ) - 'election_id'
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] needs an election_id that is a uuid',
    'ARG: an object with no election_id is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ) || '{"election_id":"not-a-uuid"}'::jsonb
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] needs an election_id that is a uuid',
    'ARG: an election_id that is not an id is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ) - 'constituency_id'
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] needs a constituency_id that is a uuid',
    'ARG: an object with no constituency_id is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ) || '{"constituency_id":7}'::jsonb
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] needs a constituency_id that is a uuid',
    'ARG: a constituency_id that is not an id is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ) || '{"id":"7"}'::jsonb
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] has an id that is not a uuid',
    'ARG: an id that is not an id is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ) || '{"id":null}'::jsonb
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] has an id that is not a uuid',
    'ARG: an id that is a JSON null is not an absent id, and is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] names an id that another object of the set names',
    'ARG: an id named twice is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          '43434343-4343-4343-4343-00000000dead'::uuid,
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[0] names an id that is no nomination of the entity this function may write',
    'ARG: an id that names no nomination is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_old_round'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[0] names an id that is no nomination of the entity this function may write',
    'ARG: the id of the entity''s nomination at a round that is not its election''s current one is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('skip'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[0] names an id that is no nomination of the entity this function may write',
    'ARG: the id of another entity''s nomination, which the caller also edits, is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[0] names an election_id other than its nomination''s',
    'ARG: an id with an election_id that is not the stored row''s is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          '43434343-4343-4343-4343-00000000dead'::uuid,
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[0] names an election_id that is no election the caller can read',
    'ARG: an election_id that names no election is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ) || '{"election_symbol":12}'::jsonb
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] has an election_symbol that is neither a string nor null',
    'ARG: a symbol that is a number is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ) - 'parent'
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] needs a parent that is a JSON object',
    'ARG: an object with no parent is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          '"none"'::jsonb
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] needs a parent that is a JSON object',
    'ARG: a parent that is a string is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          '{"kind":"party"}'::jsonb
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] has a parent whose kind is not none, entity, other or keep',
    'ARG: a parent of an unknown kind is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.entity ('alliance', pg_temp.eid ('alliance_nominated'))
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] names a parent whose entity_type is not organization',
    'ARG: a candidate that names an alliance is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          '{"kind":"entity","entity_type":"organization","entity_id":"the party"}'::jsonb
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] names a parent whose entity_id is not a uuid',
    'ARG: a parent whose entity_id is not an id is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          '{"kind":"other","name":7}'::jsonb
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] names a parent whose name is not a string',
    'ARG: a requested name that is a number is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.other ('')
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] names a parent whose name is blank',
    'ARG: an empty requested name is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.keep ()
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] keeps a parent, which only an object that names an id and does not change its constituency may',
    'ARG: keep on an object with no id is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_two'),
          NULL,
          pg_temp.keep ()
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[0] keeps a parent, which only an object that names an id and does not change its constituency may',
    'ARG: keep on an object that changes its row''s constituency is refused'
  );

-- The twin of every refusal above: the well-formed object alone lives, and the entity's rows are as the fixture left them.
SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_arg'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('arg_current'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (0, 0, 0, 1, 0),
    'ARG: the well-formed object that stood first in those sets lives alone, and is answered as unchanged'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.held_count (pg_temp.eid ('cand_arg')),
    2,
    'ARG: no refused set wrote or removed a nomination of the entity'
  );

-- An organization names an alliance.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.call (
      'organization',
      pg_temp.eid ('org_bare'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.entity ('organization', pg_temp.eid ('party_nominated'))
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[0] names a parent whose entity_type is not alliance',
    'ARG: an organization that names an organization is refused'
  );

SELECT
  reset_role ();

-- =====================================================================
-- WHO: the caller holds `nomination.edit` on the entity
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a2'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_new'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          E'  12\t',
          pg_temp.none ()
        )
      )
    ),
    '42501',
    'set_entity_nominations: the caller does not hold nomination.edit on the named entity',
    'WHO: the editor of another candidate is refused'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.held_count (pg_temp.eid ('cand_new')),
    0,
    'WHO: and nothing is written'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      '43434343-4343-4343-4343-00000000dead'::uuid,
      '[]'::jsonb
    ),
    '42501',
    'set_entity_nominations: the caller does not hold nomination.edit on the named entity',
    'WHO: an id that names no candidate is refused in the same words'
  );

-- =====================================================================
-- NEW: a new nomination
--
-- The first call is the one the other candidate's editor was refused, made by the candidate's own.
-- =====================================================================
SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_new'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          E'  12\t',
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (1, 0, 0, 0, 0),
    'NEW: the same call by the candidate''s own editor is answered with one insert and nothing else'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.stored (
      pg_temp.held (
        pg_temp.eid ('cand_new'),
        pg_temp.eid ('e_default'),
        pg_temp.eid ('c_one')
      )
    ),
    pg_temp.holding (false, 1, '12', NULL, NULL),
    'NEW: the row is unconfirmed, at the election''s current round, with the symbol trimmed, no parent and no custom data'
  );

SELECT
  is (
    (
      SELECT
        n.created_by
      FROM
        nominations n
      WHERE
        n.candidate_id = pg_temp.eid ('cand_new')
    ),
    test_user_id ('candidate_a'),
    'NEW: and names the caller as its creator'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_new'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_new'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '12',
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          E' \t ',
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (1, 0, 0, 1, 0),
    'NEW: a second nomination beside the first is one insert, and the first is unchanged'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.stored (
      pg_temp.held (
        pg_temp.eid ('cand_new'),
        pg_temp.eid ('e_round2'),
        pg_temp.eid ('c_one')
      )
    ),
    pg_temp.holding (false, 2, NULL, NULL, NULL),
    'NEW: in the election whose current round is 2 the row is at round 2, and a blank symbol is stored as no symbol'
  );

-- =====================================================================
-- OTHER and LINK: the requested name, and a listed party
--
-- The first nomination of the candidate is given a key of its own in the custom data, as the owner, so that the merge has something to keep.
-- =====================================================================
UPDATE nominations
SET
  custom_data = '{"note":"kept"}'::jsonb
WHERE
  id = pg_temp.held (
    pg_temp.eid ('cand_new'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one')
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_new'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_new'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '12',
          pg_temp.other (E'\u00a0 Party X  ')
        ),
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_new'),
            pg_temp.eid ('e_round2'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (0, 1, 0, 1, 0),
    'OTHER: a requested name on one of two nominations is one update, and the other is unchanged'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.stored (
      pg_temp.held (
        pg_temp.eid ('cand_new'),
        pg_temp.eid ('e_default'),
        pg_temp.eid ('c_one')
      )
    ),
    pg_temp.holding (
      false,
      1,
      '12',
      NULL,
      '{"note":"kept","requestedParentOrganization":"Party X"}'::jsonb
    ),
    'OTHER: the name is stored trimmed under requestedParentOrganization, no parent is linked, and the key the row already held is still there'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_new'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_new'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '12',
          pg_temp.entity ('organization', pg_temp.eid ('party_nominated'))
        ),
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_new'),
            pg_temp.eid ('e_round2'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (0, 1, 0, 1, 0),
    'LINK: a listed party that holds a nomination at the contest is one update, and no parent is created'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.stored (
      pg_temp.held (
        pg_temp.eid ('cand_new'),
        pg_temp.eid ('e_default'),
        pg_temp.eid ('c_one')
      )
    ),
    pg_temp.holding (
      false,
      1,
      '12',
      pg_temp.nid ('party_nominated'),
      '{"note":"kept"}'::jsonb
    ),
    'OTHER: choosing a listed party afterwards links the party''s nomination, removes the requested name and keeps the other key'
  );

SELECT
  is (
    pg_temp.held_count (pg_temp.eid ('party_nominated')),
    1,
    'LINK: the party still holds the one nomination it had'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_new'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_new'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '12',
          pg_temp.other ('Party Y')
        ),
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_new'),
            pg_temp.eid ('e_round2'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (0, 1, 0, 1, 0),
    'OTHER: a requested name in place of a listed party is one update'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.stored (
      pg_temp.held (
        pg_temp.eid ('cand_new'),
        pg_temp.eid ('e_default'),
        pg_temp.eid ('c_one')
      )
    ),
    pg_temp.holding (
      false,
      1,
      '12',
      NULL,
      '{"note":"kept","requestedParentOrganization":"Party Y"}'::jsonb
    ),
    'OTHER: it unlinks the party, stores the name and keeps the other key'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_new'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_new'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '12',
          pg_temp.none ()
        ),
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_new'),
            pg_temp.eid ('e_round2'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (0, 1, 0, 1, 0),
    'OTHER: no parent in place of a requested name is one update'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.stored (
      pg_temp.held (
        pg_temp.eid ('cand_new'),
        pg_temp.eid ('e_default'),
        pg_temp.eid ('c_one')
      )
    ),
    pg_temp.holding (false, 1, '12', NULL, '{"note":"kept"}'::jsonb),
    'OTHER: choosing no parent afterwards removes the requested name and keeps the other key'
  );

-- A requested name on a nomination an administrator has confirmed. A nomination that carries a requested name cannot be confirmed, so the save stores the name and the nomination is confirmed no longer.
UPDATE public.nominations
SET
  confirmed = true
WHERE
  id = pg_temp.held (
    pg_temp.eid ('cand_new'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one')
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_new'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_new'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '12',
          pg_temp.other ('Party Z')
        ),
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_new'),
            pg_temp.eid ('e_round2'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (0, 1, 0, 1, 0),
    'OTHER: a requested name in place of no parent on a confirmed nomination is one update'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.stored (
      pg_temp.held (
        pg_temp.eid ('cand_new'),
        pg_temp.eid ('e_default'),
        pg_temp.eid ('c_one')
      )
    ),
    pg_temp.holding (
      false,
      1,
      '12',
      NULL,
      '{"note":"kept","requestedParentOrganization":"Party Z"}'::jsonb
    ),
    'OTHER: the nomination holds the name and is confirmed no longer'
  );

-- The nomination as the assertions below start from it: not confirmed, with no requested name.
UPDATE public.nominations
SET
  confirmed = false,
  custom_data = '{"note":"kept"}'::jsonb
WHERE
  id = pg_temp.held (
    pg_temp.eid ('cand_new'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one')
  );

-- A listed party that holds no nomination at the contest.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_new'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_new'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '12',
          pg_temp.none ()
        ),
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_new'),
            pg_temp.eid ('e_round2'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.entity ('organization', pg_temp.eid ('party_bare'))
        )
      )
    ),
    pg_temp.counts (0, 1, 0, 1, 1),
    'LINK: a listed party that holds no nomination at the contest is one update, and the answer counts one parent created'
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_new'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_new'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '12',
          pg_temp.none ()
        ),
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_new'),
            pg_temp.eid ('e_round2'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.entity ('organization', pg_temp.eid ('party_bare'))
        )
      )
    ),
    pg_temp.counts (0, 0, 0, 2, 0),
    'SKIP: the same set a second time counts every row as unchanged and nothing else, and creates no second parent'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.stored (
      pg_temp.held (
        pg_temp.eid ('party_bare'),
        pg_temp.eid ('e_round2'),
        pg_temp.eid ('c_one')
      )
    ),
    pg_temp.holding (false, 2, NULL, NULL, NULL),
    'LINK: the party''s new nomination is unconfirmed, at the election''s current round, and carries no symbol, no parent and no custom data'
  );

SELECT
  is (
    (
      SELECT
        n.created_by
      FROM
        nominations n
      WHERE
        n.organization_id = pg_temp.eid ('party_bare')
    ),
    test_user_id ('candidate_a'),
    'LINK: it is the party''s only nomination, and it names the caller as its creator'
  );

SELECT
  is (
    (
      SELECT
        n.parent_nomination_id
      FROM
        nominations n
      WHERE
        n.id = pg_temp.held (
          pg_temp.eid ('cand_new'),
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one')
        )
    ),
    pg_temp.held (
      pg_temp.eid ('party_bare'),
      pg_temp.eid ('e_round2'),
      pg_temp.eid ('c_one')
    ),
    'LINK: and the candidate''s nomination stands under it'
  );

-- An organization and an alliance, likewise.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'organization',
      pg_temp.eid ('org_bare'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.entity ('alliance', pg_temp.eid ('alliance_nominated'))
        )
      )
    ),
    pg_temp.counts (1, 0, 0, 0, 0),
    'LINK: an organization that names an alliance nominated at the contest is one insert, and no parent is created'
  );

SELECT
  is (
    pg_temp.save (
      'organization',
      pg_temp.eid ('org_bare'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('org_bare'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.entity ('alliance', pg_temp.eid ('alliance_nominated'))
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.entity ('alliance', pg_temp.eid ('alliance_bare'))
        )
      )
    ),
    pg_temp.counts (1, 0, 0, 1, 1),
    'LINK: an organization that names an alliance with no nomination at the contest is one insert and one parent created, and its first nomination is unchanged'
  );

SELECT
  reset_role ();

SELECT
  is (
    ARRAY[
      (
        SELECT
          n.parent_nomination_id
        FROM
          nominations n
        WHERE
          n.id = pg_temp.held (
            pg_temp.eid ('org_bare'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          )
      ),
      (
        SELECT
          n.parent_nomination_id
        FROM
          nominations n
        WHERE
          n.id = pg_temp.held (
            pg_temp.eid ('org_bare'),
            pg_temp.eid ('e_round2'),
            pg_temp.eid ('c_one')
          )
      )
    ],
    ARRAY[
      pg_temp.nid ('alliance_nominated'),
      pg_temp.held (
        pg_temp.eid ('alliance_bare'),
        pg_temp.eid ('e_round2'),
        pg_temp.eid ('c_one')
      )
    ],
    'LINK: the organization''s two nominations stand under the alliance''s stored nomination and under the one created for the other alliance'
  );

SELECT
  is (
    pg_temp.stored (
      pg_temp.held (
        pg_temp.eid ('alliance_bare'),
        pg_temp.eid ('e_round2'),
        pg_temp.eid ('c_one')
      )
    ),
    pg_temp.holding (false, 2, NULL, NULL, NULL),
    'LINK: the alliance''s new nomination is unconfirmed, at the election''s current round, and carries nothing else'
  );

SELECT
  is (
    (
      SELECT
        n.created_by
      FROM
        nominations n
      WHERE
        n.alliance_id = pg_temp.eid ('alliance_bare')
    ),
    test_user_id ('organization_a'),
    'LINK: it is the alliance''s only nomination, and it names the organization''s editor as its creator'
  );

-- =====================================================================
-- REQ and MODE: the parent a candidate needs, and the constraint's mode after a call
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_req'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_list'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    '23514',
    NULL,
    'REQ: a candidate with no parent in an election that requires one is refused inside the call'
  );

SELECT
  throws_like (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_req'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_list'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    'Nomination parent required: %',
    'REQ: and the refusal is the parent rule''s'
  );

SELECT
  reset_role ();

SELECT
  lives_ok (
    pg_temp.probe (),
    'MODE: after a call that raised at the forced rule, a candidate''s row with no parent in that election raises nothing at its own statement'
  );

SELECT
  is (
    pg_temp.held_count (pg_temp.eid ('cand_req')),
    0,
    'REQ: no row of the refused call is stored'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_req'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_list'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.other ('A party that is not listed')
        )
      )
    ),
    pg_temp.counts (1, 0, 0, 0, 0),
    'REQ: with a requested name the same call lives'
  );

SELECT
  reset_role ();

SELECT
  lives_ok (
    pg_temp.probe (),
    'MODE: after a call that lived, a candidate''s row with no parent in that election raises nothing at its own statement'
  );

SELECT
  throws_ok (
    'SET CONSTRAINTS public.nominations_parent_required IMMEDIATE; ' || pg_temp.probe (),
    '23514',
    NULL,
    'MODE: the control of that probe: with the constraint immediate the same row is refused at its own statement'
  );

SELECT
  lives_ok (
    pg_temp.probe (),
    'MODE: and the control left the constraint deferred'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_req'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_list'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.entity ('organization', pg_temp.eid ('party_bare'))
        )
      )
    ),
    pg_temp.counts (1, 0, 1, 0, 1),
    'REQ: with a listed party the same call lives: the stored nomination, which the set does not name, is deleted, a new one is inserted, and the party''s nomination is created'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.stored (
      pg_temp.held (
        pg_temp.eid ('cand_req'),
        pg_temp.eid ('e_list'),
        pg_temp.eid ('c_one')
      )
    ),
    pg_temp.holding (
      false,
      1,
      NULL,
      pg_temp.held (
        pg_temp.eid ('party_bare'),
        pg_temp.eid ('e_list'),
        pg_temp.eid ('c_one')
      ),
      NULL
    ),
    'REQ: the candidate''s one nomination stands under the party''s, and carries no requested name'
  );

-- =====================================================================
-- SKIP and EDIT: an unchanged row is not written, and a changed one is unconfirmed
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_skip'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('skip'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          ' 3 ',
          pg_temp.entity ('organization', pg_temp.eid ('party_nominated'))
        )
      )
    ),
    pg_temp.counts (0, 0, 0, 1, 0),
    'SKIP: a set that states the stored symbol, untrimmed, and the stored parent counts the row as unchanged and nothing else'
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_skip'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('skip'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '3',
          pg_temp.keep ()
        )
      )
    ),
    pg_temp.counts (0, 0, 0, 1, 0),
    'SKIP: and so does a set that keeps the parent'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        n.confirmed::text || ' ' || n.updated_at::text
      FROM
        nominations n
      WHERE
        n.id = pg_temp.nid ('skip')
    ),
    'true ' || '2020-01-01T00:00:00Z'::timestamptz::text,
    'SKIP: confirmed and updated_at of the confirmed row are as they were'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_skip'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('skip'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '4',
          pg_temp.entity ('organization', pg_temp.eid ('party_nominated'))
        )
      )
    ),
    pg_temp.counts (0, 1, 0, 0, 0),
    'EDIT: a changed symbol on the confirmed row is one update'
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_skip'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('skip'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '4',
          pg_temp.entity ('organization', pg_temp.eid ('party_nominated'))
        )
      )
    ),
    pg_temp.counts (0, 0, 0, 1, 0),
    'SKIP: the edited set a second time writes nothing'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.stored (pg_temp.nid ('skip')),
    pg_temp.holding (
      false,
      1,
      '4',
      pg_temp.nid ('party_nominated'),
      NULL
    ),
    'EDIT: the row holds the new symbol, stands where it stood, and is unconfirmed'
  );

SELECT
  ok (
    (
      SELECT
        n.updated_at > '2020-01-01T00:00:00Z'::timestamptz
      FROM
        nominations n
      WHERE
        n.id = pg_temp.nid ('skip')
    ),
    'EDIT: and its updated_at moved, which is what the unchanged row''s did not do'
  );

-- =====================================================================
-- KEEP: the row's parent left as it is
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_keep'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('keep'),
          test_id ('election_a'),
          test_id ('constituency_a'),
          NULL,
          pg_temp.keep ()
        )
      )
    ),
    pg_temp.counts (0, 0, 0, 1, 0),
    'KEEP: keep on the row that stands under a faction''s nomination, with nothing else changed, counts the row as unchanged'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        pg_temp.stored (n.id)::text || ' ' || n.updated_at::text
      FROM
        nominations n
      WHERE
        n.id = pg_temp.nid ('keep')
    ),
    pg_temp.holding (
      true,
      1,
      NULL,
      test_id ('nomination_faction_a'),
      NULL
    )::text || ' ' || '2020-01-01T00:00:00Z'::timestamptz::text,
    'KEEP: the row still stands under the faction''s nomination, is still confirmed and was not written'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_keep'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('keep'),
          test_id ('election_a'),
          test_id ('constituency_a'),
          '9',
          pg_temp.keep ()
        )
      )
    ),
    pg_temp.counts (0, 1, 0, 0, 0),
    'KEEP: keep beside a changed symbol is one update'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.stored (pg_temp.nid ('keep')),
    pg_temp.holding (
      false,
      1,
      '9',
      test_id ('nomination_faction_a'),
      NULL
    ),
    'KEEP: which writes the symbol and leaves the row under the faction''s nomination'
  );

-- =====================================================================
-- DEL: what the set leaves out, and what the function may not reach
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_del'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('del_one'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (0, 0, 1, 1, 0),
    'DEL: of the candidate''s four nominations the set names one: one is deleted, one unchanged, and two are not counted'
  );

SELECT
  reset_role ();

SELECT
  is (
    ARRAY(
      SELECT
        n.id
      FROM
        nominations n
      WHERE
        n.candidate_id = pg_temp.eid ('cand_del')
      ORDER BY
        n.id
    ),
    ARRAY[
      pg_temp.nid ('del_one'),
      pg_temp.nid ('del_old_round'),
      pg_temp.nid ('del_flipped')
    ],
    'DEL: the row the set left out at its election''s current round is gone'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_del'),
      '[]'::jsonb
    ),
    pg_temp.counts (0, 0, 1, 0, 0),
    'DEL: an empty array is a valid set and deletes the one row left in reach'
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_del'),
      '[]'::jsonb
    ),
    pg_temp.counts (0, 0, 0, 0, 0),
    'DEL: the row at a round that is not current and the row in the election whose type now refuses a candidate are never counted'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_del'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('del_flipped'),
          pg_temp.eid ('e_flipped'),
          pg_temp.eid ('c_one'),
          '1',
          pg_temp.none ()
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[0] names an id that is no nomination of the entity this function may write',
    'DEL: a set that names the row in that election by its id is refused, so the row is not updated either'
  );

SELECT
  reset_role ();

SELECT
  is (
    ARRAY(
      SELECT
        n.id
      FROM
        nominations n
      WHERE
        n.candidate_id = pg_temp.eid ('cand_del')
      ORDER BY
        n.id
    ),
    ARRAY[
      pg_temp.nid ('del_old_round'),
      pg_temp.nid ('del_flipped')
    ],
    'DEL: both rows outside the reach are still there'
  );

-- =====================================================================
-- MOVE: a changed constituency
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_move'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('move'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_two'),
          '8',
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (1, 0, 1, 0, 0),
    'MOVE: an id with another constituency of its election counts once as deleted and once as inserted'
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
          nominations n
        WHERE
          n.id = pg_temp.nid ('move')
      ),
      pg_temp.held_count (pg_temp.eid ('cand_move'))
    ],
    ARRAY[0, 1],
    'MOVE: the old row is gone and the candidate holds one nomination'
  );

SELECT
  is (
    pg_temp.stored (
      pg_temp.held (
        pg_temp.eid ('cand_move'),
        pg_temp.eid ('e_default'),
        pg_temp.eid ('c_two')
      )
    ),
    pg_temp.holding (false, 1, '8', NULL, NULL),
    'MOVE: a new unconfirmed row stands at the new constituency, with the symbol the object carried'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.call (
      'organization',
      pg_temp.eid ('org_with_child'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('org_with_child'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_two'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    '23503',
    'update or delete on table "nominations" violates foreign key constraint "nominations_parent_nomination_id_fkey" on table "nominations"',
    'MOVE: the same for an organization''s row with a candidate''s nomination under it is refused by the parent foreign key'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'organization',
      pg_temp.eid ('org_with_child'),
      '[]'::jsonb
    ),
    '23503',
    'update or delete on table "nominations" violates foreign key constraint "nominations_parent_nomination_id_fkey" on table "nominations"',
    'DEL: and so is a set that leaves that row out'
  );

SELECT
  is (
    pg_temp.save (
      'organization',
      pg_temp.eid ('org_with_child'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('org_with_child'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (0, 0, 0, 1, 0),
    'MOVE: the same object at the row''s own constituency lives'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        o.constituency_id::text || ' ' || o.confirmed::text || ' ' || c.parent_nomination_id::text
      FROM
        nominations o
        JOIN nominations c ON c.id = pg_temp.nid ('child')
      WHERE
        o.id = pg_temp.nid ('org_with_child')
    ),
    pg_temp.eid ('c_one')::text || ' true ' || pg_temp.nid ('org_with_child')::text,
    'MOVE: after the refused move both rows are as before: the organization''s at its constituency and confirmed, the candidate''s under it'
  );

-- =====================================================================
-- U02: several nominations of one election
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_several'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('several_one'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          pg_temp.nid ('several_two'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_two'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (0, 0, 0, 2, 0),
    'U02: two objects of one election that each name a stored row live'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_several'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('several_one'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          pg_temp.nid ('several_two'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_two'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[2] is a new nomination in an election for which the set holds another object',
    'U02: a third object without an id in that election is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_several'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          pg_temp.nid ('several_two'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_two'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[0] is a new nomination in an election for which the set holds another object',
    'U02: and it is the object without an id that is named, wherever it stands'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_several'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_two'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[1] is a new nomination in an election for which the set holds another object',
    'U02: two objects without an id in one election are refused'
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_several'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('several_one'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          pg_temp.nid ('several_two'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_two'),
          NULL,
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (1, 0, 0, 2, 0),
    'U02: one object without an id in another election, beside the two, lives'
  );

-- =====================================================================
-- ATOM: a refused call stores nothing
--
-- The first set is refused when it is validated and the second when its last object is written, after the two before it were.
-- =====================================================================
SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_atom'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '1',
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          '2',
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_list'),
          pg_temp.eid ('c_one'),
          NULL,
          '{"kind":"party"}'::jsonb
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[2] has a parent whose kind is not none, entity, other or keep',
    'ATOM: a set whose last object is malformed is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_atom'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '1',
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          '2',
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_flipped'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    '23514',
    NULL,
    'ATOM: a set whose last object is in an election whose type refuses a candidate is refused when that object is written'
  );

SELECT
  throws_like (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_atom'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '1',
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          '2',
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_flipped'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    'Nomination shape refused: %',
    'ATOM: by the election-type rule, which the function passes through'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.held_count (pg_temp.eid ('cand_atom')),
    0,
    'ATOM: neither refused set left the objects before its last one written'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_atom'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '1',
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          '2',
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (2, 0, 0, 0, 0),
    'ATOM: the same set without its last object lives'
  );

-- =====================================================================
-- LOCK: the nominations lock
-- =====================================================================
SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = jsonb_recursive_merge (
    settings,
    '{"access":{"nominationsLocked":true}}'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_lock'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('lock'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '6',
          pg_temp.none ()
        )
      )
    ),
    '42501',
    pg_temp.unwritten (),
    'LOCK: with nominations locked, a set that changes a symbol only raises'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_lock'),
      '[]'::jsonb
    ),
    '42501',
    pg_temp.unwritten (),
    'LOCK: a set that removes a row only raises'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_lock'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('lock'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '5',
          pg_temp.none ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.none ()
        )
      )
    ),
    '42501',
    'new row violates row-level security policy for table "nominations"',
    'LOCK: a set with a new row raises, refused by the insert policy'
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_lock'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('lock'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '5',
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (0, 0, 0, 1, 0),
    'LOCK: a set equal to what is stored writes nothing, and is answered'
  );

SELECT
  reset_role ();

SELECT
  is (
    ARRAY[
      pg_temp.stored (pg_temp.nid ('lock'))::text,
      pg_temp.held_count (pg_temp.eid ('cand_lock'))::text
    ],
    ARRAY[
      pg_temp.holding (false, 1, '5', NULL, NULL)::text,
      '1'
    ],
    'LOCK: the symbol is unchanged, the row is still there and no row was added'
  );

UPDATE app_settings
SET
  settings = jsonb_recursive_merge (
    settings,
    '{"access":{"nominationsLocked":false}}'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_lock'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.nid ('lock'),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          '6',
          pg_temp.none ()
        )
      )
    ),
    pg_temp.counts (0, 1, 0, 0, 0),
    'LOCK: with the lock off the set that changes the symbol is one update'
  );

-- =====================================================================
-- ENC: white space, lengths in characters, exact comparison
-- =====================================================================
SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_enc'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.other (E'  \t\u00a0\u3000')
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[0] names a parent whose name is blank',
    'ENC: a name of white space alone -- spaces, a tab, a no-break space, an ideographic space -- is refused'
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_enc'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.other (repeat(U&'\+01D538', 100))
        )
      )
    ),
    pg_temp.counts (1, 0, 0, 0, 0),
    'ENC: a name of 100 characters outside the basic plane lives'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_enc'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_enc'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.other (repeat(U&'\+01D538', 101))
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[0] names a parent whose name is longer than 100 characters',
    'ENC: and one of 101 is refused'
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_enc'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_enc'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          E'\u00a0' || repeat('9', 49) || E'a\t ',
          pg_temp.keep ()
        )
      )
    ),
    pg_temp.counts (0, 1, 0, 0, 0),
    'ENC: a symbol of 50 characters lives, counted after the white space around it is removed'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_enc'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_enc'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          repeat('9', 51),
          pg_temp.keep ()
        )
      )
    ),
    '22023',
    'set_entity_nominations: p_nominations[0] has an election_symbol longer than 50 characters',
    'ENC: and one of 51 is refused'
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_enc'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_enc'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          repeat('9', 49) || 'A',
          pg_temp.keep ()
        )
      )
    ),
    pg_temp.counts (0, 1, 0, 0, 0),
    'ENC: a symbol that differs from the stored one in the case of one letter is a change'
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_enc'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_enc'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          U&'\00E9',
          pg_temp.keep ()
        )
      )
    ),
    pg_temp.counts (0, 1, 0, 0, 0),
    'ENC: a symbol of one precomposed letter is stored'
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_enc'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_enc'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_one')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          U&'e\0301',
          pg_temp.keep ()
        )
      )
    ),
    pg_temp.counts (0, 1, 0, 0, 0),
    'ENC: and the same letter as a base letter and a combining accent is a change: nothing is normalised'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (n.custom_data ->> 'requestedParentOrganization') || ' ' || n.election_symbol
      FROM
        nominations n
      WHERE
        n.candidate_id = pg_temp.eid ('cand_enc')
    ),
    repeat(U&'\+01D538', 100) || ' ' || U&'e\0301',
    'ENC: the row holds the 100-character name and the symbol as it was last sent'
  );

-- =====================================================================
-- CAP: the cap on unconfirmed parent nominations, through the function
--
-- The caller's authorship so far is cleared and nine unconfirmed nominations of a party are recorded as the caller's, each at a round of its own, so that the next parent the caller creates is the tenth.
-- =====================================================================
UPDATE nominations
SET
  created_by = NULL
WHERE
  created_by = test_user_id ('candidate_a');

INSERT INTO
  nominations (
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round,
    created_by
  )
SELECT
  test_id ('project_a'),
  pg_temp.eid ('party_nominated'),
  pg_temp.eid ('e_default'),
  pg_temp.eid ('c_two'),
  20 + i,
  test_user_id ('candidate_a')
FROM
  generate_series(1, 9) AS i;

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    private.caller_unconfirmed_originated_count (),
    9,
    'CAP: the fixture: the caller has originated nine unconfirmed parent nominations'
  );

SELECT
  is (
    pg_temp.save (
      'candidate',
      pg_temp.eid ('cand_cap'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_two'),
          NULL,
          pg_temp.entity ('organization', pg_temp.eid ('party_bare'))
        )
      )
    ),
    pg_temp.counts (1, 0, 0, 0, 1),
    'CAP: the parent that is the caller''s tenth is created'
  );

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_cap'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_cap'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_two')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_two'),
          NULL,
          pg_temp.keep ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_two'),
          NULL,
          pg_temp.entity ('organization', pg_temp.eid ('party_bare'))
        )
      )
    ),
    'P0001',
    NULL,
    'CAP: the parent that would be the caller''s eleventh raises through the function'
  );

SELECT
  throws_like (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_cap'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.held (
            pg_temp.eid ('cand_cap'),
            pg_temp.eid ('e_default'),
            pg_temp.eid ('c_two')
          ),
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_two'),
          NULL,
          pg_temp.keep ()
        ),
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_round2'),
          pg_temp.eid ('c_two'),
          NULL,
          pg_temp.entity ('organization', pg_temp.eid ('party_bare'))
        )
      )
    ),
    'A caller may originate at most %',
    'CAP: with the message that names the cap'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.held_count (pg_temp.eid ('cand_cap')),
    1,
    'CAP: and the candidate''s nomination that the refused call had inserted before the parent is not stored'
  );

-- =====================================================================
-- ANON: refused by privilege
-- =====================================================================
SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    pg_temp.call (
      'candidate',
      pg_temp.eid ('cand_new'),
      '[]'::jsonb
    ),
    '42501',
    'permission denied for function set_entity_nominations',
    'ANON: anon is refused set_entity_nominations by privilege, before the function runs'
  );

SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
