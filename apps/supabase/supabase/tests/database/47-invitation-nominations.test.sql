-- 47-invitation-nominations.test.sql: an invitation that states whether its entity is confirmed and which nominations the entity holds
--
-- `create_invitations (p_project_id, p_invitations, p_confirm_entity)` seeds a batch of invitations. `p_confirm_entity` has no default and says whether the call confirms each named entity it invites: `true` confirms every entity of the batch that has a name, and `false` confirms no one and never unconfirms an entity. An entity-scope item for a candidate or an organization may carry a `nominations` array: an object without an `id` creates a nomination of the invited entity, an object with one names a nomination of that entity and changes what differs, and no nomination is ever deleted. The nominations are written as the caller, so the policies, the column grants and the triggers of `public.nominations` decide every statement, and each object passes the shape checks `set_entity_nominations` applies.
--
-- Each assertion's description begins with the tag of the rule it pins:
--   CAT   - the one function of that name in the catalogue, its parameters without a default, and who may execute it.
--   ARG   - a call without p_confirm_entity or with NULL, a batch of project-scope items, and every refusal of a malformed item or object; a refused batch writes nothing.
--   CONF  - which entities a call confirms: the named ones under true, none under false, and never an unconfirmation.
--   NEW   - a new nomination: its parent, its round, its trimmed symbol, its stated columns and its confirmation.
--   LINK  - a named parent with no nomination at the contest: its row is created bare and unconfirmed.
--   UPD   - an object that names a nomination of the invited entity by its id: written, left unchanged, or refused.
--   NODEL - an invitation never deletes a nomination.
--   PAR   - the shape refusals of one object, in the words set_entity_nominations uses, under the invitation's label.
--   BOUND - the nominations of one item hold at most 1000 objects, counted before any object is read.
--   WHO   - the caller's own authority: what the project editor may confirm, what a caller without authority over the project learns, and anon.
--   REQ   - the parent a candidate needs where its election's type requires one, raised inside the call.
--   MODE  - the end-of-transaction parent rule is deferred again after a call.
--   ANS   - the keys of each item's answer.
--
-- A refusal is asserted by its SQLSTATE and its whole message, or, where another rule words it, by the beginning of its message. Every call is made from a string, so a database without the function fails each assertion on its own. A call that must live is recorded with `pg_temp.remember`, which keeps what the function answered, or an object that says what it raised, in a transaction-local setting; the rows are then read as the owner.
--
-- THE IDENTITIES. admin_a is project A's admin, and this file adds a project editor of project A, who holds `entity.confirm` and not `nomination.confirm`. The service role bypasses the policies. Every impersonation passes an empty grant array, so each claim is projected from public.grants.
--
-- No invitation of this file is bound to an address: each one gets a generated code, so no two items meet the address index.
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
  plan (104);

SELECT
  create_test_data ();

-- =====================================================================
-- Names for the rows of this file
-- =====================================================================
-- `eid` names an election, a constituency, a group, an entity or a user of this file, or no row at all.
CREATE FUNCTION pg_temp.eid (p_name text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $fn$
  SELECT ('47474747-4747-4747-4747-000000000' || CASE p_name
    WHEN 'e_default' THEN 'e01'
    WHEN 'e_list' THEN 'e02'
    WHEN 'e_round2' THEN 'e03'
    WHEN 'group' THEN 'f01'
    WHEN 'c_one' THEN 'c01'
    WHEN 'c_two' THEN 'c02'
    WHEN 'party' THEN 'b01'
    WHEN 'party_bare' THEN 'b02'
    WHEN 'org_named' THEN 'b03'
    WHEN 'org_nameless' THEN 'b04'
    WHEN 'org_false' THEN 'b05'
    WHEN 'org_two' THEN 'b06'
    WHEN 'org_par' THEN 'b07'
    WHEN 'cand_named' THEN 'a01'
    WHEN 'cand_nameless' THEN 'a02'
    WHEN 'cand_mix_named' THEN 'a03'
    WHEN 'cand_mix_nameless' THEN 'a04'
    WHEN 'cand_false' THEN 'a05'
    WHEN 'cand_confirmed' THEN 'a06'
    WHEN 'cand_itemkey' THEN 'a07'
    WHEN 'cand_new' THEN 'a08'
    WHEN 'cand_round' THEN 'a09'
    WHEN 'cand_admin_conf' THEN 'a10'
    WHEN 'cand_service_conf' THEN 'a11'
    WHEN 'cand_other' THEN 'a12'
    WHEN 'cand_link' THEN 'a13'
    WHEN 'cand_upd' THEN 'a14'
    WHEN 'cand_nodel' THEN 'a15'
    WHEN 'cand_argx' THEN 'a16'
    WHEN 'cand_argy' THEN 'a17'
    WHEN 'cand_par' THEN 'a18'
    WHEN 'cand_who' THEN 'a19'
    WHEN 'cand_who_refused' THEN 'a20'
    WHEN 'cand_who_first' THEN 'a21'
    WHEN 'cand_who_upd' THEN 'a22'
    WHEN 'cand_req' THEN 'a23'
    WHEN 'cand_probe' THEN 'a24'
    WHEN 'editor' THEN 'ee1'
    WHEN 'no_entity' THEN 'fff'
  END)::uuid;
$fn$;

-- `nid` names a nomination the fixture inserts, or none.
CREATE FUNCTION pg_temp.nid (p_name text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $fn$
  SELECT ('47474747-4747-4747-4747-100000000' || CASE p_name
    WHEN 'party' THEN 'b01'
    WHEN 'upd_symbol' THEN '101'
    WHEN 'upd_same' THEN '102'
    WHEN 'upd_merge' THEN '103'
    WHEN 'nodel_one' THEN '104'
    WHEN 'nodel_two' THEN '105'
    WHEN 'who_confirmed' THEN '106'
    WHEN 'nothing' THEN 'fff'
  END)::uuid;
$fn$;

-- =====================================================================
-- Fixture, local to this transaction and inserted before the first impersonation, so that no row names a creator
-- =====================================================================
-- Three elections of project A over one constituency group of two constituencies: one of the default type, one that states `organization_list`, and one of the default type whose current round is 2.
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
SELECT
  pg_temp.eid (e.name),
  pg_temp.eid ('group')
FROM
  unnest(ARRAY['e_default', 'e_list', 'e_round2']) AS e (name);

-- A party nominated at the first contest of the default-type election and one nominated nowhere; three unconfirmed organizations that are invited, one of them nameless; and two confirmed organizations that are invited with nominations.
INSERT INTO
  organizations (id, project_id, name, confirmed)
VALUES
  (
    pg_temp.eid ('party'),
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
    pg_temp.eid ('org_named'),
    test_id ('project_a'),
    '{"en":"Named Organization"}'::jsonb,
    false
  ),
  (
    pg_temp.eid ('org_nameless'),
    test_id ('project_a'),
    '{"en":"   "}'::jsonb,
    false
  ),
  (
    pg_temp.eid ('org_false'),
    test_id ('project_a'),
    '{"en":"Organization Invited Unconfirmed"}'::jsonb,
    false
  ),
  (
    pg_temp.eid ('org_two'),
    test_id ('project_a'),
    '{"en":"Organization In Two Constituencies"}'::jsonb,
    true
  ),
  (
    pg_temp.eid ('org_par'),
    test_id ('project_a'),
    '{"en":"Organization Of The Shape Refusals"}'::jsonb,
    true
  );

-- One candidate per case, so that no case reads what another wrote. The candidates whose confirmation is asserted start unconfirmed; the nameless ones have blank names.
INSERT INTO
  candidates (id, project_id, first_name, last_name, confirmed)
SELECT
  pg_temp.eid (k.name),
  test_id ('project_a'),
  k.first_name,
  k.last_name,
  k.confirmed
FROM
  (
    VALUES
      ('cand_named', 'Nora', 'Named', false),
      ('cand_nameless', '', '', false),
      ('cand_mix_named', 'Mia', 'Mixed', false),
      ('cand_mix_nameless', '  ', ' ', false),
      ('cand_false', 'Fay', 'False', false),
      ('cand_confirmed', 'Cora', 'Confirmed', true),
      ('cand_itemkey', 'Ike', 'Itemkey', false),
      ('cand_new', 'Candidate', 'New', true),
      ('cand_round', 'Candidate', 'Round', true),
      ('cand_admin_conf', 'Candidate', 'Admin', true),
      ('cand_service_conf', 'Candidate', 'Service', true),
      ('cand_other', 'Candidate', 'Other', true),
      ('cand_link', 'Candidate', 'Link', true),
      ('cand_upd', 'Candidate', 'Update', true),
      ('cand_nodel', 'Candidate', 'Nodel', true),
      ('cand_argx', 'Ada', 'Argx', false),
      ('cand_argy', 'Candidate', 'Argy', true),
      ('cand_par', 'Candidate', 'Par', true),
      ('cand_who', 'Wes', 'Who', false),
      ('cand_who_refused', 'Candidate', 'Refused', true),
      ('cand_who_first', 'Fred', 'First', false),
      (
        'cand_who_upd',
        'Candidate',
        'Confirmed Row',
        true
      ),
      ('cand_req', 'Candidate', 'Req', true),
      ('cand_probe', 'Candidate', 'Probe', true)
  ) AS k (name, first_name, last_name, confirmed);

-- The party's nomination.
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
    pg_temp.nid ('party'),
    test_id ('project_a'),
    pg_temp.eid ('party'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one'),
    1,
    true
  );

-- The candidates' nominations. `upd_symbol` stands under the party; `upd_same` carries an updated_at in the past, because every statement of this transaction that writes a row gives it the same timestamp; `upd_merge` carries custom data with a requested party; `who_confirmed` is confirmed.
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
    custom_data,
    confirmed,
    updated_at
  )
VALUES
  (
    pg_temp.nid ('upd_symbol'),
    test_id ('project_a'),
    pg_temp.eid ('cand_upd'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one'),
    1,
    pg_temp.nid ('party'),
    '1',
    NULL,
    false,
    DEFAULT
  ),
  (
    pg_temp.nid ('upd_same'),
    test_id ('project_a'),
    pg_temp.eid ('cand_upd'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_two'),
    1,
    NULL,
    '5',
    NULL,
    false,
    '2020-01-01T00:00:00Z'
  ),
  (
    pg_temp.nid ('upd_merge'),
    test_id ('project_a'),
    pg_temp.eid ('cand_upd'),
    pg_temp.eid ('e_round2'),
    pg_temp.eid ('c_one'),
    2,
    NULL,
    NULL,
    '{"note":"stored","requestedParentOrganization":"Requested Party"}'::jsonb,
    false,
    DEFAULT
  ),
  (
    pg_temp.nid ('nodel_one'),
    test_id ('project_a'),
    pg_temp.eid ('cand_nodel'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one'),
    1,
    NULL,
    NULL,
    NULL,
    false,
    DEFAULT
  ),
  (
    pg_temp.nid ('nodel_two'),
    test_id ('project_a'),
    pg_temp.eid ('cand_nodel'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_two'),
    1,
    NULL,
    NULL,
    NULL,
    false,
    DEFAULT
  ),
  (
    pg_temp.nid ('who_confirmed'),
    test_id ('project_a'),
    pg_temp.eid ('cand_who_upd'),
    pg_temp.eid ('e_default'),
    pg_temp.eid ('c_one'),
    1,
    NULL,
    '1',
    NULL,
    true,
    DEFAULT
  );

-- A project editor of project A.
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
    pg_temp.eid ('editor'),
    '00000000-0000-0000-0000-000000000000',
    'project_editor_47@test.com',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

-- The authority rows: admin_a's own and the project editor's.
SELECT
  test_seed_identity_grants ('admin_a');

INSERT INTO
  grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    pg_temp.eid ('editor'),
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  );

-- =====================================================================
-- Instruments
-- =====================================================================
-- The statement that calls the function, as text.
CREATE FUNCTION pg_temp.seed_call (p_project uuid, p_items jsonb, p_confirm boolean) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    'SELECT public.create_invitations(%L::uuid, %L::jsonb, %L::boolean)',
    p_project, p_items, p_confirm);
$fn$;

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

-- Keeps the answer of a statement in a transaction-local setting, read back by `recall`.
CREATE FUNCTION pg_temp.remember (p_setting text, p_statement text) RETURNS void LANGUAGE plpgsql AS $fn$
BEGIN
  PERFORM set_config(p_setting, pg_temp.answer(p_statement)::text, true);
END;
$fn$;

CREATE FUNCTION pg_temp.recall (p_setting text) RETURNS jsonb LANGUAGE sql STABLE AS $fn$
  SELECT current_setting(p_setting, true)::jsonb;
$fn$;

-- How a statement is refused: its SQLSTATE and, when its message begins with the prefix given, that prefix, otherwise the whole message; `lived` when it raised nothing.
CREATE FUNCTION pg_temp.refusal (p_statement text, p_prefix text) RETURNS text LANGUAGE plpgsql AS $fn$
BEGIN
  EXECUTE p_statement;
  RETURN 'lived';
EXCEPTION WHEN OTHERS THEN
  RETURN SQLSTATE || ': ' || CASE
    WHEN left(SQLERRM, length(p_prefix)) = p_prefix THEN p_prefix
    ELSE SQLERRM
  END;
END;
$fn$;

-- One key of every item of an answer, in order; an answer that is not an array is returned as it is.
CREATE FUNCTION pg_temp.each (p_answer jsonb, p_key text) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE AS $fn$
BEGIN
  IF jsonb_typeof(p_answer) IS DISTINCT FROM 'array' THEN
    RETURN p_answer;
  END IF;
  RETURN (
    SELECT COALESCE(jsonb_agg(t.item -> p_key ORDER BY t.ordinality), '[]'::jsonb)
    FROM jsonb_array_elements(p_answer) WITH ORDINALITY AS t (item, ordinality));
END;
$fn$;

-- The keys of an object in byte order, or null for anything that is not an object.
CREATE FUNCTION pg_temp.keys (p_object jsonb) RETURNS text[] LANGUAGE plpgsql IMMUTABLE AS $fn$
BEGIN
  IF jsonb_typeof(p_object) IS DISTINCT FROM 'object' THEN
    RETURN NULL;
  END IF;
  RETURN ARRAY(SELECT k FROM jsonb_object_keys(p_object) AS k ORDER BY k COLLATE "C");
END;
$fn$;

-- The invitation ids of an answer, or none for an answer that is not an array.
CREATE FUNCTION pg_temp.answered_ids (p_answer jsonb) RETURNS uuid[] LANGUAGE plpgsql IMMUTABLE AS $fn$
BEGIN
  IF jsonb_typeof(p_answer) IS DISTINCT FROM 'array' THEN
    RETURN '{}'::uuid[];
  END IF;
  RETURN ARRAY(SELECT (e ->> 'id')::uuid FROM jsonb_array_elements(p_answer) AS e);
END;
$fn$;

-- One item of the argument: an entity named by its type and id, with a nominations key only when one is given.
CREATE FUNCTION pg_temp.inv (p_type text, p_target uuid, p_nominations jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT jsonb_build_object('target_type', p_type, 'target_id', p_target)
    || CASE
      WHEN p_nominations IS NULL THEN '{}'::jsonb
      ELSE jsonb_build_object('nominations', p_nominations)
    END;
$fn$;

-- One nomination object. The id is left out when none is given.
CREATE FUNCTION pg_temp.nom (
  p_id uuid,
  p_election uuid,
  p_constituency uuid,
  p_symbol text,
  p_parent jsonb,
  p_confirmed boolean
) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT jsonb_strip_nulls(jsonb_build_object('id', p_id))
    || jsonb_build_object(
      'election_id', p_election,
      'constituency_id', p_constituency,
      'election_symbol', p_symbol,
      'parent', p_parent,
      'confirmed', p_confirmed);
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

-- A well-formed new object at the first contest of the default-type election, with no parent, unconfirmed.
CREATE FUNCTION pg_temp.plain () RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT pg_temp.nom(NULL, pg_temp.eid ('e_default'), pg_temp.eid ('c_one'), NULL, pg_temp.none(), false);
$fn$;

-- The counts an item that states nominations answers.
CREATE FUNCTION pg_temp.counts (
  p_inserted integer,
  p_updated integer,
  p_unchanged integer,
  p_parents_created integer
) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT jsonb_build_object(
    'inserted', p_inserted,
    'updated', p_updated,
    'unchanged', p_unchanged,
    'parents_created', p_parents_created);
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

-- Every nomination an entity holds at a contest, at any round, with every column an object may state, read by the calling session.
CREATE FUNCTION pg_temp.rows_at (
  p_entity uuid,
  p_election uuid,
  p_constituency uuid
) RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT jsonb_agg(
    pg_temp.holding(n.confirmed, n.election_round, n.election_symbol, n.parent_nomination_id, n.custom_data)
      || jsonb_build_object(
        'name', n.name,
        'short_name', n.short_name,
        'info', n.info,
        'color', n.color,
        'image', n.image,
        'sort_order', n.sort_order,
        'subtype', n.subtype,
        'external_id', n.external_id)
    ORDER BY n.id)
  FROM public.nominations n
  WHERE COALESCE(n.candidate_id, n.organization_id) = p_entity
    AND n.election_id = p_election
    AND n.constituency_id = p_constituency;
$fn$;

-- The confirmation of every nomination an entity holds at a contest, read by the calling session.
CREATE FUNCTION pg_temp.confirmations_at (
  p_entity uuid,
  p_election uuid,
  p_constituency uuid
) RETURNS boolean[] LANGUAGE sql AS $fn$
  SELECT ARRAY(
    SELECT n.confirmed
    FROM public.nominations n
    WHERE COALESCE(n.candidate_id, n.organization_id) = p_entity
      AND n.election_id = p_election
      AND n.constituency_id = p_constituency
    ORDER BY n.id);
$fn$;

-- How many nominations an entity holds, at every round and in every election, read by the calling session.
CREATE FUNCTION pg_temp.held_count (p_entity uuid) RETURNS integer LANGUAGE sql AS $fn$
  SELECT count(*)::integer
  FROM public.nominations n
  WHERE COALESCE(n.candidate_id, n.organization_id) = p_entity;
$fn$;

-- How many invitations name one of the targets, read by the calling session.
CREATE FUNCTION pg_temp.invitations_of (VARIADIC p_targets uuid[]) RETURNS integer LANGUAGE sql AS $fn$
  SELECT count(*)::integer
  FROM public.invitations i
  WHERE i.target_id = ANY (p_targets);
$fn$;

-- The confirmation of entities of both types, in id order, read by the calling session.
CREATE FUNCTION pg_temp.confirmed (VARIADIC p_ids uuid[]) RETURNS boolean[] LANGUAGE sql AS $fn$
  SELECT ARRAY(
    SELECT e.confirmed
    FROM (
      SELECT c.id, c.confirmed FROM public.candidates c WHERE c.id = ANY (p_ids)
      UNION ALL
      SELECT o.id, o.confirmed FROM public.organizations o WHERE o.id = ANY (p_ids)
    ) AS e
    ORDER BY e.id);
$fn$;

-- The nominations a candidate's nominations stand under, read by the calling session.
CREATE FUNCTION pg_temp.parents_of (p_entity uuid) RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT jsonb_agg(
    jsonb_build_object(
      'organization_id', p.organization_id,
      'election_id', p.election_id,
      'constituency_id', p.constituency_id,
      'election_round', p.election_round,
      'confirmed', p.confirmed,
      'election_symbol', p.election_symbol,
      'parent_nomination_id', p.parent_nomination_id,
      'custom_data', p.custom_data)
    ORDER BY p.id)
  FROM public.nominations n
  JOIN public.nominations p ON p.id = n.parent_nomination_id
  WHERE n.candidate_id = p_entity;
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
  is (
    ARRAY(
      SELECT
        pg_get_function_identity_arguments(p.oid)
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'create_invitations'
    ),
    ARRAY[
      'p_project_id uuid, p_invitations jsonb, p_confirm_entity boolean'
    ],
    'CAT: exactly one function named create_invitations exists, taking the project, the invitations and p_confirm_entity'
  );

SELECT
  ok (
    COALESCE(
      (
        SELECT
          p.pronargdefaults = 0
          AND NOT p.prosecdef
          AND 'search_path=""' = ANY (p.proconfig)
          AND p.prorettype = 'jsonb'::regtype
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE
          n.nspname = 'public'
          AND p.proname = 'create_invitations'
          AND pg_get_function_identity_arguments(p.oid) = 'p_project_id uuid, p_invitations jsonb, p_confirm_entity boolean'
      ),
      false
    ),
    'CAT: no parameter carries a default, and the function is SECURITY INVOKER with an empty search_path and returns jsonb'
  );

SELECT
  ok (
    COALESCE(
      (
        SELECT
          has_function_privilege('authenticated', p.oid, 'EXECUTE')
          AND has_function_privilege('service_role', p.oid, 'EXECUTE')
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
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE
          n.nspname = 'public'
          AND p.proname = 'create_invitations'
          AND pg_get_function_identity_arguments(p.oid) = 'p_project_id uuid, p_invitations jsonb, p_confirm_entity boolean'
      ),
      false
    ),
    'CAT: authenticated and service_role may execute it, and neither anon nor PUBLIC may'
  );

-- =====================================================================
-- ARG: p_confirm_entity
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    format(
      'SELECT public.create_invitations(%L::uuid, %L::jsonb)',
      test_id ('project_a'),
      '[{"scope":"project","role":"editor"}]'
    ),
    '42883',
    NULL,
    'ARG: a call by position without p_confirm_entity finds no function'
  );

SELECT
  throws_ok (
    format(
      'SELECT public.create_invitations(p_project_id => %L::uuid, p_invitations => %L::jsonb)',
      test_id ('project_a'),
      '[{"scope":"project","role":"editor"}]'
    ),
    '42883',
    NULL,
    'ARG: a call by name without p_confirm_entity finds no function'
  );

SELECT
  throws_ok (
    pg_temp.seed_call (
      test_id ('project_a'),
      '[{"scope":"project","role":"editor"}]'::jsonb,
      NULL
    ),
    '22023',
    'create_invitations: p_confirm_entity must be true or false',
    'ARG: a NULL p_confirm_entity is refused'
  );

SELECT
  pg_temp.remember (
    't47.project_true',
    pg_temp.seed_call (
      test_id ('project_a'),
      '[{"scope":"project","role":"editor"},{"scope":"project","role":"editor"}]'::jsonb,
      true
    )
  );

SELECT
  pg_temp.remember (
    't47.project_false',
    pg_temp.seed_call (
      test_id ('project_a'),
      '[{"scope":"project","role":"editor"},{"scope":"project","role":"editor"}]'::jsonb,
      false
    )
  );

SELECT
  is (
    pg_temp.each (
      pg_temp.recall ('t47.project_true'),
      'entity_confirmed'
    ),
    '[null, null]'::jsonb,
    'ARG: a batch of project-scope items with true lives, and each item answers entity_confirmed null'
  );

SELECT
  is (
    pg_temp.each (
      pg_temp.recall ('t47.project_false'),
      'entity_confirmed'
    ),
    '[null, null]'::jsonb,
    'ARG: a batch of project-scope items with false lives, and each item answers entity_confirmed null'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        invitations i
      WHERE
        i.id = ANY (
          pg_temp.answered_ids (pg_temp.recall ('t47.project_true')) || pg_temp.answered_ids (pg_temp.recall ('t47.project_false'))
        )
    ),
    4,
    'ARG: the four project-scope invitations of the two batches are stored'
  );

-- =====================================================================
-- CONF: which entities a call confirms
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.conf_named',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv ('candidate', pg_temp.eid ('cand_named'), NULL),
        pg_temp.inv ('organization', pg_temp.eid ('org_named'), NULL)
      ),
      true
    )
  );

SELECT
  pg_temp.remember (
    't47.conf_nameless',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv ('candidate', pg_temp.eid ('cand_nameless'), NULL),
        pg_temp.inv (
          'organization',
          pg_temp.eid ('org_nameless'),
          NULL
        )
      ),
      true
    )
  );

SELECT
  pg_temp.remember (
    't47.conf_mixed',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv ('candidate', pg_temp.eid ('cand_mix_named'), NULL),
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_mix_nameless'),
          NULL
        )
      ),
      true
    )
  );

SELECT
  pg_temp.remember (
    't47.conf_false',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv ('candidate', pg_temp.eid ('cand_false'), NULL),
        pg_temp.inv ('organization', pg_temp.eid ('org_false'), NULL),
        pg_temp.inv ('candidate', pg_temp.eid ('cand_confirmed'), NULL)
      ),
      false
    )
  );

SELECT
  pg_temp.remember (
    't47.conf_itemkey',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv ('candidate', pg_temp.eid ('cand_itemkey'), NULL) || '{"confirm_entity":true}'::jsonb
      ),
      false
    )
  );

SELECT
  is (
    pg_temp.each (
      pg_temp.recall ('t47.conf_named'),
      'entity_confirmed'
    ),
    '[true, true]'::jsonb,
    'CONF: with true, a named candidate and a named organization each answer entity_confirmed true'
  );

SELECT
  is (
    pg_temp.each (
      pg_temp.recall ('t47.conf_nameless'),
      'entity_confirmed'
    ),
    '[false, false]'::jsonb,
    'CONF: with true, a nameless candidate and a nameless organization each answer entity_confirmed false'
  );

SELECT
  is (
    pg_temp.each (
      pg_temp.recall ('t47.conf_mixed'),
      'entity_confirmed'
    ),
    '[true, false]'::jsonb,
    'CONF: one batch with true that mixes a named and a nameless candidate answers each by its name'
  );

SELECT
  is (
    pg_temp.each (
      pg_temp.recall ('t47.conf_false'),
      'entity_confirmed'
    ),
    '[false, false, true]'::jsonb,
    'CONF: with false, the unconfirmed entities answer false and an entity already confirmed answers true'
  );

SELECT
  is (
    pg_temp.each (
      pg_temp.recall ('t47.conf_itemkey'),
      'entity_confirmed'
    ),
    '[false]'::jsonb,
    'CONF: an item carrying a confirm_entity key of its own, in a call with false, answers entity_confirmed false'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.confirmed (
      pg_temp.eid ('cand_named'),
      pg_temp.eid ('cand_nameless'),
      pg_temp.eid ('cand_mix_named'),
      pg_temp.eid ('cand_mix_nameless'),
      pg_temp.eid ('org_named'),
      pg_temp.eid ('org_nameless')
    ),
    ARRAY[true, false, true, false, true, false],
    'CONF: as stored, the named entities of the calls with true are confirmed and the nameless ones are not'
  );

SELECT
  is (
    pg_temp.confirmed (
      pg_temp.eid ('cand_false'),
      pg_temp.eid ('cand_confirmed'),
      pg_temp.eid ('cand_itemkey'),
      pg_temp.eid ('org_false')
    ),
    ARRAY[false, true, false, false],
    'CONF: as stored, the calls with false confirmed no one and unconfirmed no one, and the item key overrode nothing'
  );

SELECT
  is (
    pg_temp.invitations_of (
      pg_temp.eid ('cand_false'),
      pg_temp.eid ('cand_confirmed'),
      pg_temp.eid ('cand_itemkey'),
      pg_temp.eid ('org_false')
    ),
    4,
    'CONF: and the calls with false stored their four invitations'
  );

-- =====================================================================
-- NEW: a new nomination
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.new',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_new'),
          jsonb_build_array(
            pg_temp.nom (
              NULL,
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_one'),
              '  12  ',
              pg_temp.entity ('organization', pg_temp.eid ('party')),
              false
            ) || jsonb_build_object(
              'name',
              '{"en":"Nomination name"}'::jsonb,
              'short_name',
              '{"en":"NN"}'::jsonb,
              'info',
              '{"en":"About the nomination"}'::jsonb,
              'color',
              '{"normal":"#112233"}'::jsonb,
              'image',
              '{"path":"none.jpg"}'::jsonb,
              'sort_order',
              3,
              'subtype',
              'list',
              'external_id',
              'nom-47-new'
            )
          )
        )
      ),
      true
    )
  );

SELECT
  is (
    pg_temp.recall ('t47.new') -> 0 -> 'nominations',
    pg_temp.counts (1, 0, 0, 0),
    'NEW: a new nomination under a party that holds a nomination at the contest answers inserted 1'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.rows_at (
      pg_temp.eid ('cand_new'),
      pg_temp.eid ('e_default'),
      pg_temp.eid ('c_one')
    ),
    jsonb_build_array(
      pg_temp.holding (false, 1, '12', pg_temp.nid ('party'), NULL) || jsonb_build_object(
        'name',
        '{"en":"Nomination name"}'::jsonb,
        'short_name',
        '{"en":"NN"}'::jsonb,
        'info',
        '{"en":"About the nomination"}'::jsonb,
        'color',
        '{"normal":"#112233"}'::jsonb,
        'image',
        '{"path":"none.jpg"}'::jsonb,
        'sort_order',
        3,
        'subtype',
        'list',
        'external_id',
        'nom-47-new'
      )
    ),
    'NEW: the row stands under the party''s nomination, unconfirmed, at the election''s current round, with the symbol trimmed and every stated column written'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.round',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_round'),
          jsonb_build_array(
            pg_temp.nom (
              NULL,
              pg_temp.eid ('e_round2'),
              pg_temp.eid ('c_one'),
              NULL,
              pg_temp.none (),
              false
            ),
            pg_temp.nom (
              NULL,
              pg_temp.eid ('e_round2'),
              pg_temp.eid ('c_two'),
              NULL,
              pg_temp.none (),
              false
            ) || '{"election_round":1}'::jsonb
          )
        )
      ),
      true
    )
  );

SELECT
  is (
    pg_temp.recall ('t47.round') -> 0 -> 'nominations',
    pg_temp.counts (2, 0, 0, 0),
    'NEW: two new nominations in an election in its second round answer inserted 2'
  );

SELECT
  reset_role ();

SELECT
  is (
    ARRAY(
      SELECT
        n.election_round
      FROM
        nominations n
      WHERE
        n.candidate_id = pg_temp.eid ('cand_round')
      ORDER BY
        n.constituency_id
    ),
    ARRAY[2, 1],
    'NEW: an object that states no round is written at the election''s current round, and one that states a round at that round'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.admin_conf',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_admin_conf'),
          jsonb_build_array(
            pg_temp.nom (
              NULL,
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_two'),
              NULL,
              pg_temp.none (),
              true
            )
          )
        )
      ),
      true
    )
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.confirmations_at (
      pg_temp.eid ('cand_admin_conf'),
      pg_temp.eid ('e_default'),
      pg_temp.eid ('c_two')
    ),
    ARRAY[true],
    'NEW: a nomination the project admin states confirmed is stored confirmed'
  );

SET
  LOCAL ROLE service_role;

SELECT
  pg_temp.remember (
    't47.service_conf',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_service_conf'),
          jsonb_build_array(
            pg_temp.nom (
              NULL,
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_two'),
              NULL,
              pg_temp.none (),
              true
            )
          )
        )
      ),
      true
    )
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.confirmations_at (
      pg_temp.eid ('cand_service_conf'),
      pg_temp.eid ('e_default'),
      pg_temp.eid ('c_two')
    ),
    ARRAY[true],
    'NEW: a nomination the service role states confirmed is stored confirmed'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.other',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_other'),
          jsonb_build_array(
            pg_temp.nom (
              NULL,
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_two'),
              NULL,
              pg_temp.other ('  Requested Party  '),
              false
            ) || '{"custom_data":{"note":"stated"}}'::jsonb
          )
        )
      ),
      true
    )
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        jsonb_agg(n.custom_data)
      FROM
        nominations n
      WHERE
        n.candidate_id = pg_temp.eid ('cand_other')
    ),
    '[{"note":"stated","requestedParentOrganization":"Requested Party"}]'::jsonb,
    'NEW: a parent of kind other writes the stated custom data with the trimmed requested name beside it'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.org_two',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'organization',
          pg_temp.eid ('org_two'),
          jsonb_build_array(
            pg_temp.nom (
              NULL,
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_one'),
              NULL,
              pg_temp.none (),
              false
            ),
            pg_temp.nom (
              NULL,
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_two'),
              NULL,
              pg_temp.none (),
              false
            )
          )
        )
      ),
      true
    )
  );

SELECT
  is (
    pg_temp.recall ('t47.org_two') -> 0 -> 'nominations',
    pg_temp.counts (2, 0, 0, 0),
    'NEW: an organization nominated in both constituencies of one election in one item answers inserted 2'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.held_count (pg_temp.eid ('org_two')),
    2,
    'NEW: and both of its nominations are stored'
  );

-- =====================================================================
-- LINK: a named parent with no nomination at the contest
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.link',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_link'),
          jsonb_build_array(
            pg_temp.nom (
              NULL,
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_one'),
              NULL,
              pg_temp.entity ('organization', pg_temp.eid ('party_bare')),
              false
            )
          )
        )
      ),
      true
    )
  );

SELECT
  is (
    pg_temp.recall ('t47.link') -> 0 -> 'nominations',
    pg_temp.counts (1, 0, 0, 1),
    'LINK: a party with no nomination at the contest answers inserted 1 and parents_created 1'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.parents_of (pg_temp.eid ('cand_link')),
    jsonb_build_array(
      jsonb_build_object(
        'organization_id',
        pg_temp.eid ('party_bare'),
        'election_id',
        pg_temp.eid ('e_default'),
        'constituency_id',
        pg_temp.eid ('c_one'),
        'election_round',
        1,
        'confirmed',
        false,
        'election_symbol',
        NULL,
        'parent_nomination_id',
        NULL,
        'custom_data',
        NULL
      )
    ),
    'LINK: the candidate stands under the party''s new row, which is bare and unconfirmed'
  );

-- =====================================================================
-- UPD: an object that names a nomination of the invited entity by its id
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_upd'),
          jsonb_build_array(
            pg_temp.nom (
              pg_temp.nid ('nodel_one'),
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_one'),
              '9',
              pg_temp.keep (),
              false
            )
          )
        )
      ),
      true
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] names an id that is no nomination of the invited entity',
    'UPD: an id of another entity''s nomination is refused'
  );

SELECT
  throws_ok (
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_upd'),
          jsonb_build_array(
            pg_temp.nom (
              pg_temp.nid ('nothing'),
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_one'),
              '9',
              pg_temp.keep (),
              false
            )
          )
        )
      ),
      true
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] names an id that is no nomination of the invited entity',
    'UPD: an id that names no nomination is refused the same way'
  );

SELECT
  throws_ok (
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_upd'),
          jsonb_build_array(
            pg_temp.nom (
              pg_temp.nid ('upd_symbol'),
              pg_temp.eid ('e_round2'),
              pg_temp.eid ('c_one'),
              '9',
              pg_temp.keep (),
              false
            )
          )
        )
      ),
      true
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] names an election_id other than its nomination''s',
    'UPD: an election other than the nomination''s is refused'
  );

SELECT
  throws_ok (
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_upd'),
          jsonb_build_array(
            pg_temp.nom (
              pg_temp.nid ('upd_symbol'),
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_two'),
              '9',
              pg_temp.keep (),
              false
            )
          )
        )
      ),
      true
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] names a constituency_id other than its nomination''s; an invitation moves no nomination',
    'UPD: a constituency other than the nomination''s is refused, not moved'
  );

SELECT
  throws_ok (
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_upd'),
          jsonb_build_array(
            pg_temp.nom (
              pg_temp.nid ('upd_symbol'),
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_one'),
              '9',
              pg_temp.keep (),
              false
            ) || '{"election_round":2}'::jsonb
          )
        )
      ),
      true
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] names an election_round other than its nomination''s',
    'UPD: a round other than the nomination''s is refused'
  );

SELECT
  throws_ok (
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_upd'),
          jsonb_build_array(
            pg_temp.nom (
              pg_temp.nid ('upd_symbol'),
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_one'),
              '9',
              pg_temp.keep (),
              false
            ),
            pg_temp.nom (
              pg_temp.nid ('upd_symbol'),
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_one'),
              '8',
              pg_temp.keep (),
              false
            )
          )
        )
      ),
      true
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[1] names an id that another object of the array names',
    'UPD: an id that two objects of the array name is refused'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.stored (pg_temp.nid ('upd_symbol')),
    pg_temp.holding (false, 1, '1', pg_temp.nid ('party'), NULL),
    'UPD: after each refusal the nomination is as it was'
  );

SELECT
  is (
    pg_temp.invitations_of (pg_temp.eid ('cand_upd')),
    0,
    'UPD: and no refused call stored an invitation of the entity'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.upd',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_upd'),
          jsonb_build_array(
            pg_temp.nom (
              pg_temp.nid ('upd_symbol'),
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_one'),
              '2',
              pg_temp.keep (),
              false
            )
          )
        )
      ),
      true
    )
  );

SELECT
  is (
    pg_temp.recall ('t47.upd') -> 0 -> 'nominations',
    pg_temp.counts (0, 1, 0, 0),
    'UPD: an object that names the entity''s nomination by its id and changes the symbol answers updated 1'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.stored (pg_temp.nid ('upd_symbol')),
    pg_temp.holding (false, 1, '2', pg_temp.nid ('party'), NULL),
    'UPD: the symbol is written and keep leaves the parent as it was'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.same',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_upd'),
          jsonb_build_array(
            pg_temp.nom (
              pg_temp.nid ('upd_same'),
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_two'),
              '5',
              pg_temp.none (),
              false
            )
          )
        )
      ),
      true
    )
  );

SELECT
  is (
    pg_temp.recall ('t47.same') -> 0 -> 'nominations',
    pg_temp.counts (0, 0, 1, 0),
    'UPD: an object equal to its stored nomination answers unchanged 1'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        n.updated_at
      FROM
        nominations n
      WHERE
        n.id = pg_temp.nid ('upd_same')
    ),
    '2020-01-01T00:00:00Z'::timestamptz,
    'UPD: and the unchanged row is not written'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.merge',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_upd'),
          jsonb_build_array(
            pg_temp.nom (
              pg_temp.nid ('upd_merge'),
              pg_temp.eid ('e_round2'),
              pg_temp.eid ('c_one'),
              NULL,
              pg_temp.keep (),
              false
            ) || '{"custom_data":{"note":"restated","extra":"added"}}'::jsonb
          )
        )
      ),
      true
    )
  );

SELECT
  is (
    pg_temp.recall ('t47.merge') -> 0 -> 'nominations',
    pg_temp.counts (0, 1, 0, 0),
    'UPD: an object that states custom data over a stored nomination answers updated 1'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.stored (pg_temp.nid ('upd_merge')) -> 'custom_data',
    '{"note":"restated","extra":"added","requestedParentOrganization":"Requested Party"}'::jsonb,
    'UPD: the stated keys are written over the stored custom data, every other stored key is kept, and the requested name survives under keep'
  );

-- =====================================================================
-- NODEL: an invitation never deletes a nomination
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.nodel_empty',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_nodel'),
          '[]'::jsonb
        )
      ),
      true
    )
  );

SELECT
  is (
    pg_temp.recall ('t47.nodel_empty') -> 0 -> 'nominations',
    pg_temp.counts (0, 0, 0, 0),
    'NODEL: an item with an empty nominations array answers four zeros'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.held_count (pg_temp.eid ('cand_nodel')),
    2,
    'NODEL: and both of the entity''s nominations remain'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.nodel_new',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_nodel'),
          jsonb_build_array(
            pg_temp.nom (
              NULL,
              pg_temp.eid ('e_round2'),
              pg_temp.eid ('c_one'),
              NULL,
              pg_temp.none (),
              false
            )
          )
        )
      ),
      true
    )
  );

SELECT
  is (
    pg_temp.recall ('t47.nodel_new') -> 0 -> 'nominations',
    pg_temp.counts (1, 0, 0, 0),
    'NODEL: an item with only a new nomination answers inserted 1 and nothing else'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.held_count (pg_temp.eid ('cand_nodel')),
    3,
    'NODEL: and the entity''s two other nominations remain beside the new one'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.nodel_none',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv ('candidate', pg_temp.eid ('cand_nodel'), NULL)
      ),
      true
    )
  );

SELECT
  is (
    (pg_temp.recall ('t47.nodel_none') -> 0) ? 'nominations',
    false,
    'NODEL: an item without a nominations key answers no nominations key'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.held_count (pg_temp.eid ('cand_nodel')),
    3,
    'NODEL: and writes no nomination'
  );

-- =====================================================================
-- ARG: the refusals of an item and of a nomination object
--
-- Every refused batch begins with a well-formed item for an unconfirmed named candidate with one nomination, so a batch that wrote anything before its refusal would leave an invitation, a nomination or a confirmation behind.
-- =====================================================================
CREATE FUNCTION pg_temp.good () RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT pg_temp.inv('candidate', pg_temp.eid ('cand_argx'), jsonb_build_array(pg_temp.plain()));
$fn$;

-- A batch of the well-formed item and one refused item for the second candidate, whose nominations are given.
CREATE FUNCTION pg_temp.refused_second (p_nominations jsonb) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT pg_temp.seed_call(
    test_id ('project_a'),
    jsonb_build_array(pg_temp.good(), pg_temp.inv('candidate', pg_temp.eid ('cand_argy'), p_nominations)),
    true);
$fn$;

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.good (),
        '{"scope":"project","role":"editor","nominations":[]}'::jsonb
      ),
      true
    ),
    '22023',
    'create_invitations: p_invitations[1] states nominations, which only an entity-scope item may',
    'ARG: nominations on a project-scope item are refused'
  );

SELECT
  throws_ok (
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.good (),
        pg_temp.inv ('faction', test_id ('faction_a'), '[]'::jsonb)
      ),
      true
    ),
    '22023',
    'create_invitations: p_invitations[1] states nominations for a faction, which only a candidate or an organization may hold',
    'ARG: nominations for a faction are refused'
  );

SELECT
  throws_ok (
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.good (),
        pg_temp.inv ('alliance', test_id ('alliance_a'), '[]'::jsonb)
      ),
      true
    ),
    '22023',
    'create_invitations: p_invitations[1] states nominations for an alliance, which only a candidate or an organization may hold',
    'ARG: nominations for an alliance are refused'
  );

SELECT
  throws_ok (
    pg_temp.refused_second ('{}'::jsonb),
    '22023',
    'create_invitations: p_invitations[1].nominations must be a JSON array',
    'ARG: nominations that are an object are refused'
  );

SELECT
  throws_ok (
    pg_temp.refused_second ('null'::jsonb),
    '22023',
    'create_invitations: p_invitations[1].nominations must be a JSON array',
    'ARG: nominations that are a JSON null are refused'
  );

SELECT
  throws_ok (
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.good (),
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_argx'),
          '[]'::jsonb
        )
      ),
      true
    ),
    '22023',
    'create_invitations: p_invitations[1] states nominations for an entity an earlier item of the batch states them for',
    'ARG: the same entity''s nominations on two items of one batch are refused'
  );

SELECT
  throws_ok (
    pg_temp.refused_second (jsonb_build_array(pg_temp.plain () - 'confirmed')),
    '22023',
    'create_invitations: p_invitations[1].nominations[0] needs confirmed, which is true or false',
    'ARG: an object without confirmed is refused'
  );

SELECT
  throws_ok (
    pg_temp.refused_second (
      jsonb_build_array(pg_temp.plain () || '{"confirmed":"true"}'::jsonb)
    ),
    '22023',
    'create_invitations: p_invitations[1].nominations[0] needs confirmed, which is true or false',
    'ARG: an object whose confirmed is a string is refused'
  );

SELECT
  throws_ok (
    pg_temp.refused_second (
      jsonb_build_array(
        pg_temp.plain () || '{"election_round":1.5}'::jsonb
      )
    ),
    '22023',
    'create_invitations: p_invitations[1].nominations[0] has an election_round that is not an integer',
    'ARG: an election_round that is not an integer is refused'
  );

SELECT
  throws_ok (
    pg_temp.refused_second (
      jsonb_build_array(
        pg_temp.nom (
          NULL,
          pg_temp.eid ('e_default'),
          pg_temp.eid ('c_one'),
          NULL,
          pg_temp.keep (),
          false
        )
      )
    ),
    '22023',
    'create_invitations: p_invitations[1].nominations[0] keeps a parent, which only an object that names an id may',
    'ARG: keep on an object without an id is refused'
  );

SELECT
  throws_ok (
    pg_temp.refused_second (
      jsonb_build_array(pg_temp.plain () || '{"custom_data":[]}'::jsonb)
    ),
    '22023',
    'create_invitations: p_invitations[1].nominations[0] has a custom_data that is not a JSON object',
    'ARG: custom data that is not an object is refused'
  );

SELECT
  throws_ok (
    pg_temp.refused_second (
      jsonb_build_array(
        pg_temp.plain () || '{"custom_data":{"requestedParentOrganization":"Unchecked Party"}}'::jsonb
      )
    ),
    '22023',
    'create_invitations: p_invitations[1].nominations[0] states requestedParentOrganization in custom_data, which only a parent of kind other sets',
    'ARG: custom data that carries the requested name is refused'
  );

SELECT
  throws_ok (
    pg_temp.refused_second (
      jsonb_build_array(
        pg_temp.plain () || '{"name":"A bare string"}'::jsonb
      )
    ),
    '22023',
    'create_invitations: p_invitations[1].nominations[0] has a name that is neither a JSON object nor null',
    'ARG: a name that is not an object is refused'
  );

SELECT
  throws_ok (
    pg_temp.refused_second (
      jsonb_build_array(pg_temp.plain () || '{"sort_order":"3"}'::jsonb)
    ),
    '22023',
    'create_invitations: p_invitations[1].nominations[0] has a sort_order that is neither an integer nor null',
    'ARG: a sort_order that is not an integer is refused'
  );

SELECT
  throws_ok (
    pg_temp.refused_second (
      jsonb_build_array(pg_temp.plain () || '{"subtype":5}'::jsonb)
    ),
    '22023',
    'create_invitations: p_invitations[1].nominations[0] has a subtype that is neither a string nor null',
    'ARG: a subtype that is not a string is refused'
  );

SELECT
  throws_ok (
    pg_temp.refused_second (
      jsonb_build_array(
        pg_temp.nom (
          NULL,
          test_id ('election_b'),
          test_id ('constituency_b'),
          NULL,
          pg_temp.none (),
          false
        )
      )
    ),
    '22023',
    'create_invitations: p_invitations[1].nominations[0] names an election_id that is no election of the project the caller can read',
    'ARG: an election of another project is refused'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.invitations_of (
      pg_temp.eid ('cand_argx'),
      pg_temp.eid ('cand_argy')
    ),
    0,
    'ARG: no refused batch stored an invitation'
  );

SELECT
  is (
    pg_temp.held_count (pg_temp.eid ('cand_argx')) + pg_temp.held_count (pg_temp.eid ('cand_argy')),
    0,
    'ARG: no refused batch stored a nomination'
  );

SELECT
  is (
    pg_temp.confirmed (pg_temp.eid ('cand_argx')),
    ARRAY[false],
    'ARG: no refused batch confirmed its entity'
  );

-- =====================================================================
-- PAR: the shape refusals of one object, under the invitation's label
-- =====================================================================
-- A batch of one candidate's item whose one object is given.
CREATE FUNCTION pg_temp.par_call (p_type text, p_target uuid, p_object jsonb) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT pg_temp.seed_call(
    test_id ('project_a'),
    jsonb_build_array(pg_temp.inv(p_type, p_target, jsonb_build_array(p_object))),
    true);
$fn$;

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.par_call (
      'candidate',
      pg_temp.eid ('cand_par'),
      '"an object"'::jsonb
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] must be a JSON object',
    'PAR: a string is not an object'
  );

SELECT
  throws_ok (
    pg_temp.par_call (
      'candidate',
      pg_temp.eid ('cand_par'),
      pg_temp.plain () - 'election_id'
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] needs an election_id that is a uuid',
    'PAR: an object with no election_id'
  );

SELECT
  throws_ok (
    pg_temp.par_call (
      'candidate',
      pg_temp.eid ('cand_par'),
      pg_temp.plain () || '{"constituency_id":7}'::jsonb
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] needs a constituency_id that is a uuid',
    'PAR: a constituency_id that is a number'
  );

SELECT
  throws_ok (
    pg_temp.par_call (
      'candidate',
      pg_temp.eid ('cand_par'),
      pg_temp.plain () || '{"id":null}'::jsonb
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] has an id that is not a uuid',
    'PAR: an id that is a JSON null'
  );

SELECT
  throws_ok (
    pg_temp.par_call (
      'candidate',
      pg_temp.eid ('cand_par'),
      pg_temp.plain () || '{"election_symbol":12}'::jsonb
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] has an election_symbol that is neither a string nor null',
    'PAR: a symbol that is a number'
  );

SELECT
  throws_ok (
    pg_temp.par_call (
      'candidate',
      pg_temp.eid ('cand_par'),
      pg_temp.plain () || jsonb_build_object('election_symbol', repeat('x', 51))
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] has an election_symbol longer than 50 characters',
    'PAR: a symbol of 51 characters'
  );

SELECT
  throws_ok (
    pg_temp.par_call (
      'candidate',
      pg_temp.eid ('cand_par'),
      pg_temp.plain () - 'parent'
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] needs a parent that is a JSON object',
    'PAR: an object with no parent'
  );

SELECT
  throws_ok (
    pg_temp.par_call (
      'candidate',
      pg_temp.eid ('cand_par'),
      pg_temp.plain () || '{"parent":{"kind":"adopt"}}'::jsonb
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] has a parent whose kind is not none, entity, other or keep',
    'PAR: a kind that is none of the four'
  );

SELECT
  throws_ok (
    pg_temp.par_call (
      'candidate',
      pg_temp.eid ('cand_par'),
      pg_temp.plain () || jsonb_build_object(
        'parent',
        pg_temp.entity ('alliance', test_id ('alliance_a'))
      )
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] names a parent whose entity_type is not organization',
    'PAR: a candidate naming an alliance as its parent, named in the message by the type asked for'
  );

SELECT
  throws_ok (
    pg_temp.par_call (
      'organization',
      pg_temp.eid ('org_par'),
      pg_temp.plain () || jsonb_build_object(
        'parent',
        pg_temp.entity ('organization', pg_temp.eid ('party'))
      )
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] names a parent whose entity_type is not alliance',
    'PAR: an organization naming an organization as its parent, named in the message by the type asked for'
  );

SELECT
  throws_ok (
    pg_temp.par_call (
      'candidate',
      pg_temp.eid ('cand_par'),
      pg_temp.plain () || '{"parent":{"kind":"entity","entity_type":"organization","entity_id":"not-a-uuid"}}'::jsonb
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] names a parent whose entity_id is not a uuid',
    'PAR: an entity_id that is not an id'
  );

SELECT
  throws_ok (
    pg_temp.par_call (
      'candidate',
      pg_temp.eid ('cand_par'),
      pg_temp.plain () || '{"parent":{"kind":"other","name":5}}'::jsonb
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] names a parent whose name is not a string',
    'PAR: a name that is a number'
  );

SELECT
  throws_ok (
    pg_temp.par_call (
      'candidate',
      pg_temp.eid ('cand_par'),
      pg_temp.plain () || '{"parent":{"kind":"other","name":"   "}}'::jsonb
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] names a parent whose name is blank',
    'PAR: a name of spaces alone'
  );

SELECT
  throws_ok (
    pg_temp.par_call (
      'candidate',
      pg_temp.eid ('cand_par'),
      pg_temp.plain () || jsonb_build_object('parent', pg_temp.other (repeat('x', 101)))
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] names a parent whose name is longer than 100 characters',
    'PAR: a name of 101 characters'
  );

-- =====================================================================
-- BOUND: at most 1000 objects in one item's nominations
-- =====================================================================
SELECT
  throws_ok (
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_par'),
          (
            SELECT
              jsonb_agg('"an object"'::jsonb)
            FROM
              generate_series(1, 1001)
          )
        )
      ),
      true
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations holds more than 1000 nominations',
    'BOUND: 1001 malformed objects are refused by the bound, before any object is read'
  );

SELECT
  throws_ok (
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_par'),
          (
            SELECT
              jsonb_agg('"an object"'::jsonb)
            FROM
              generate_series(1, 1000)
          )
        )
      ),
      true
    ),
    '22023',
    'create_invitations: p_invitations[0].nominations[0] must be a JSON object',
    'BOUND: the twin, 1000 such objects, is refused by its first object'
  );

SELECT
  reset_role ();

-- =====================================================================
-- WHO: the caller's own authority
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    pg_temp.eid ('editor'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.who',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_who'),
          jsonb_build_array(
            pg_temp.nom (
              NULL,
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_two'),
              NULL,
              pg_temp.none (),
              false
            )
          )
        )
      ),
      true
    )
  );

SELECT
  is (
    pg_temp.each (pg_temp.recall ('t47.who'), 'entity_confirmed'),
    '[true]'::jsonb,
    'WHO: the project editor, who holds entity.confirm, seeds a named entity with true and it answers entity_confirmed true'
  );

SELECT
  is (
    pg_temp.refusal (
      pg_temp.seed_call (
        test_id ('project_a'),
        jsonb_build_array(
          pg_temp.inv ('candidate', pg_temp.eid ('cand_who_first'), NULL),
          pg_temp.inv (
            'candidate',
            pg_temp.eid ('cand_who_refused'),
            jsonb_build_array(
              pg_temp.nom (
                NULL,
                pg_temp.eid ('e_default'),
                pg_temp.eid ('c_two'),
                NULL,
                pg_temp.none (),
                true
              )
            )
          )
        ),
        true
      ),
      'Setting nomination '
    ),
    'P0001: Setting nomination ',
    'WHO: a new nomination the project editor states confirmed is refused by the rule that confirming a nomination needs nomination.confirm'
  );

SELECT
  throws_ok (
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_who_upd'),
          jsonb_build_array(
            pg_temp.nom (
              pg_temp.nid ('who_confirmed'),
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_one'),
              '2',
              pg_temp.none (),
              true
            )
          )
        )
      ),
      true
    ),
    '42501',
    'create_invitations: p_invitations[0].nominations[0] could not be written as stated',
    'WHO: on a confirmed nomination, the project editor''s object that states it confirmed and changes its symbol is refused rather than stored unconfirmed'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.confirmed (
      pg_temp.eid ('cand_who'),
      pg_temp.eid ('cand_who_first')
    ),
    ARRAY[true, false],
    'WHO: as stored, the project editor''s entity is confirmed, and the refused batch confirmed none of its entities'
  );

SELECT
  is (
    pg_temp.invitations_of (
      pg_temp.eid ('cand_who_first'),
      pg_temp.eid ('cand_who_refused')
    ) + pg_temp.held_count (pg_temp.eid ('cand_who_refused')),
    0,
    'WHO: and the refused batch stored neither an invitation nor a nomination'
  );

SELECT
  is (
    pg_temp.stored (pg_temp.nid ('who_confirmed')),
    pg_temp.holding (true, 1, '1', NULL, NULL),
    'WHO: and the confirmed nomination the refused object named is as it was'
  );

SELECT
  set_test_user (
    'authenticated',
    pg_temp.eid ('editor'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.who_twin',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_who_upd'),
          jsonb_build_array(
            pg_temp.nom (
              pg_temp.nid ('who_confirmed'),
              pg_temp.eid ('e_default'),
              pg_temp.eid ('c_one'),
              '2',
              pg_temp.none (),
              false
            )
          )
        )
      ),
      true
    )
  );

SELECT
  is (
    pg_temp.recall ('t47.who_twin') -> 0 -> 'nominations',
    pg_temp.counts (0, 1, 0, 0),
    'WHO: the twin, which states the nomination unconfirmed, answers updated 1'
  );

SELECT
  reset_role ();

SELECT
  is (
    pg_temp.stored (pg_temp.nid ('who_confirmed')),
    pg_temp.holding (false, 1, '2', NULL, NULL),
    'WHO: and the row holds the new symbol, unconfirmed'
  );

SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    pg_temp.seed_call (test_id ('project_a'), '[]'::jsonb, true),
    '42501',
    'permission denied for function create_invitations',
    'WHO: anon is refused create_invitations by privilege, before the function runs'
  );

SELECT
  reset_role ();

-- admin_a holds no authority over project B and cannot read its candidate_b. Asked of an entity of project B and of an id that names no entity, the call answers the same refusal.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  is (
    ARRAY[
      pg_temp.refusal (
        pg_temp.seed_call (
          test_id ('project_b'),
          jsonb_build_array(
            pg_temp.inv (
              'candidate',
              test_id ('candidate_b'),
              jsonb_build_array(pg_temp.plain ())
            )
          ),
          false
        ),
        'create_invitations: p_invitations[0] states nominations for an entity that is no entity of the project'
      ),
      pg_temp.refusal (
        pg_temp.seed_call (
          test_id ('project_b'),
          jsonb_build_array(
            pg_temp.inv (
              'candidate',
              pg_temp.eid ('no_entity'),
              jsonb_build_array(pg_temp.plain ())
            )
          ),
          false
        ),
        'create_invitations: p_invitations[0] states nominations for an entity that is no entity of the project'
      )
    ],
    ARRAY[
      '22023: create_invitations: p_invitations[0] states nominations for an entity that is no entity of the project',
      '22023: create_invitations: p_invitations[0] states nominations for an entity that is no entity of the project'
    ],
    'WHO: a caller without authority over the project gets the same refusal for an entity it cannot read and for an id that names no entity'
  );

SELECT
  reset_role ();

-- =====================================================================
-- REQ and MODE: the parent a candidate needs, and the constraint's mode after a call
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  is (
    pg_temp.refusal (
      pg_temp.seed_call (
        test_id ('project_a'),
        jsonb_build_array(
          pg_temp.inv (
            'candidate',
            pg_temp.eid ('cand_req'),
            jsonb_build_array(
              pg_temp.nom (
                NULL,
                pg_temp.eid ('e_list'),
                pg_temp.eid ('c_one'),
                NULL,
                pg_temp.none (),
                false
              )
            )
          )
        ),
        true
      ),
      'Nomination parent required: '
    ),
    '23514: Nomination parent required: ',
    'REQ: a candidate''s nomination with no parent in an election that requires one is refused inside the call'
  );

SELECT
  reset_role ();

SELECT
  lives_ok (
    pg_temp.probe (),
    'MODE: after a call refused at the forced rule, a candidate''s row with no parent in that election raises nothing at its own statement'
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
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  pg_temp.remember (
    't47.req',
    pg_temp.seed_call (
      test_id ('project_a'),
      jsonb_build_array(
        pg_temp.inv (
          'candidate',
          pg_temp.eid ('cand_req'),
          jsonb_build_array(
            pg_temp.nom (
              NULL,
              pg_temp.eid ('e_list'),
              pg_temp.eid ('c_one'),
              NULL,
              pg_temp.other ('A party that is not listed'),
              false
            )
          )
        )
      ),
      true
    )
  );

SELECT
  is (
    pg_temp.recall ('t47.req') -> 0 -> 'nominations',
    pg_temp.counts (1, 0, 0, 0),
    'REQ: with a requested name the same call lives'
  );

SELECT
  reset_role ();

SELECT
  lives_ok (
    pg_temp.probe (),
    'MODE: after a call that wrote a nomination, a candidate''s row with no parent in that election raises nothing at its own statement'
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

-- =====================================================================
-- ANS: the keys of each item's answer
-- =====================================================================
SELECT
  is (
    pg_temp.keys (pg_temp.recall ('t47.new') -> 0),
    ARRAY[
      'code',
      'email',
      'entity_confirmed',
      'expires_at',
      'id',
      'nominations',
      'role',
      'scope',
      'target_id',
      'target_type'
    ],
    'ANS: an item that states nominations answers the eight keys of every item, entity_confirmed and nominations'
  );

SELECT
  is (
    pg_temp.keys (pg_temp.recall ('t47.new') -> 0 -> 'nominations'),
    ARRAY[
      'inserted',
      'parents_created',
      'unchanged',
      'updated'
    ],
    'ANS: its nominations answer holds exactly inserted, updated, unchanged and parents_created'
  );

SELECT
  is (
    pg_temp.keys (pg_temp.recall ('t47.conf_named') -> 0),
    ARRAY[
      'code',
      'email',
      'entity_confirmed',
      'expires_at',
      'id',
      'role',
      'scope',
      'target_id',
      'target_type'
    ],
    'ANS: an entity-scope item without nominations answers the eight keys and entity_confirmed'
  );

SELECT
  is (
    pg_temp.keys (pg_temp.recall ('t47.project_true') -> 0),
    ARRAY[
      'code',
      'email',
      'entity_confirmed',
      'expires_at',
      'id',
      'role',
      'scope',
      'target_id',
      'target_type'
    ],
    'ANS: a project-scope item answers the same nine keys'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
