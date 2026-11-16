-- 50-nomination-write-guards.test.sql: what an entity's write of its nominations is checked against besides its own argument
--
-- Each assertion's description begins with the tag of the rule it pins:
--   STALE - `set_entity_nominations` takes the nominations in reach as the caller read them, each id with its updated_at, and refuses with SQLSTATE 40001 when the stored reach differs: a nomination created, moved, edited or deleted since the read is never deleted or written back by a set computed from the old read.
--   READ  - `get_entity_nominations` states each nomination's updated_at, which is what the writer is given back.
--   EXP   - the refusals of a malformed `p_expected_reach`, SQLSTATE 22023.
--   CONST - a nomination's constituency must be one of its election's constituencies, for a new nomination and for a move; a stored nomination that stays where it is is not judged by it.
--   ROUND - a round that is not stored is round 1, on both sides of every comparison of a nomination's round with its election's or its parent's.
--   BOUND - `get_nomination_parent_options` refuses more contests than a writer may name nominations.
--   REQ   - a requested parent organization counts only as a string that is not blank, for the end-of-transaction parent rule and for the confirmation rule.
--
-- A call that must live is made through `pg_temp.save`, which answers what the function answered or an object naming what it raised. Rows are read back as the owner.
--
-- Every impersonation passes an empty grant array, so each claim is projected from the rows this file writes. The user of the fixture's candidate_a edits every candidate of this file.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_seed_identity_grants).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (32);

SELECT
  create_test_data ();

-- =====================================================================
-- Names for the rows of this file
-- =====================================================================
CREATE FUNCTION pg_temp.eid (p_name text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $fn$
  SELECT ('50505050-5050-5050-5050-0000000000' || CASE p_name
    WHEN 'e_one' THEN 'e1'
    WHEN 'e_list' THEN 'e2'
    WHEN 'e_null' THEN 'e3'
    WHEN 'e_other' THEN 'e4'
    WHEN 'g_main' THEN 'f1'
    WHEN 'g_other' THEN 'f2'
    WHEN 'c_one' THEN 'c1'
    WHEN 'c_two' THEN 'c2'
    WHEN 'c_far' THEN 'c3'
    WHEN 'party' THEN 'b1'
    WHEN 'party_null' THEN 'b2'
    WHEN 'cand_stale' THEN 'a1'
    WHEN 'cand_const' THEN 'a2'
    WHEN 'cand_const_new' THEN 'a3'
    WHEN 'cand_const_kept' THEN 'a7'
    WHEN 'cand_round' THEN 'a4'
    WHEN 'cand_round_null' THEN 'a5'
    WHEN 'cand_req' THEN 'a6'
    WHEN 'n_party' THEN 'd1'
    WHEN 'n_party_null' THEN 'd2'
    WHEN 'n_stale' THEN 'd3'
    WHEN 'n_admin' THEN 'd4'
    WHEN 'n_ghost' THEN 'd5'
    WHEN 'n_const' THEN 'd6'
    WHEN 'n_round' THEN 'd7'
    WHEN 'n_round_null' THEN 'd8'
    WHEN 'n_const_kept' THEN 'd9'
  END)::uuid;
$fn$;

-- =====================================================================
-- Fixture, inserted before the first impersonation
-- =====================================================================
-- An election of the default type, one that requires a candidate's parent, one whose current round is not stored, and one over a constituency group of its own.
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
    pg_temp.eid ('e_one'),
    test_id ('project_a'),
    '{"en":"Election one"}'::jsonb,
    'organization_list_and_independents',
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
    pg_temp.eid ('e_null'),
    test_id ('project_a'),
    '{"en":"Election whose round is not stored"}'::jsonb,
    'organization_list_and_independents',
    NULL
  ),
  (
    pg_temp.eid ('e_other'),
    test_id ('project_a'),
    '{"en":"Other election"}'::jsonb,
    'organization_list_and_independents',
    1
  );

INSERT INTO
  constituency_groups (id, project_id, name)
VALUES
  (
    pg_temp.eid ('g_main'),
    test_id ('project_a'),
    '{"en":"Main group"}'::jsonb
  ),
  (
    pg_temp.eid ('g_other'),
    test_id ('project_a'),
    '{"en":"Other group"}'::jsonb
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
  ),
  (
    pg_temp.eid ('c_far'),
    test_id ('project_a'),
    '{"en":"Constituency of the other election"}'::jsonb
  );

INSERT INTO
  constituency_group_constituencies (constituency_group_id, constituency_id)
VALUES
  (pg_temp.eid ('g_main'), pg_temp.eid ('c_one')),
  (pg_temp.eid ('g_main'), pg_temp.eid ('c_two')),
  (pg_temp.eid ('g_other'), pg_temp.eid ('c_far'));

-- Election one is also held over the other group until the nominations below are stored: the link is removed after them, so `n_const_kept` is a nomination whose constituency was unlinked from its election after it was stored.
INSERT INTO
  election_constituency_groups (election_id, constituency_group_id)
VALUES
  (pg_temp.eid ('e_one'), pg_temp.eid ('g_main')),
  (pg_temp.eid ('e_one'), pg_temp.eid ('g_other')),
  (pg_temp.eid ('e_list'), pg_temp.eid ('g_main')),
  (pg_temp.eid ('e_null'), pg_temp.eid ('g_main')),
  (pg_temp.eid ('e_other'), pg_temp.eid ('g_other'));

-- Two parties: one nominated at the first contest of election one at round 1, and one nominated at its second contest with no round stored.
INSERT INTO
  organizations (id, project_id, name, confirmed)
VALUES
  (
    pg_temp.eid ('party'),
    test_id ('project_a'),
    '{"en":"Party"}'::jsonb,
    true
  ),
  (
    pg_temp.eid ('party_null'),
    test_id ('project_a'),
    '{"en":"Party nominated with no round"}'::jsonb,
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
      'cand_stale',
      'cand_const',
      'cand_const_new',
      'cand_const_kept',
      'cand_round',
      'cand_round_null',
      'cand_req'
    ]
  ) AS k (name);

INSERT INTO
  nominations (
    id,
    project_id,
    organization_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round,
    election_symbol,
    confirmed,
    updated_at
  )
VALUES
  (
    pg_temp.eid ('n_party'),
    test_id ('project_a'),
    pg_temp.eid ('party'),
    NULL,
    pg_temp.eid ('e_one'),
    pg_temp.eid ('c_one'),
    1,
    NULL,
    true,
    DEFAULT
  ),
  (
    pg_temp.eid ('n_party_null'),
    test_id ('project_a'),
    pg_temp.eid ('party_null'),
    NULL,
    pg_temp.eid ('e_one'),
    pg_temp.eid ('c_two'),
    NULL,
    NULL,
    true,
    DEFAULT
  ),
  (
    pg_temp.eid ('n_stale'),
    test_id ('project_a'),
    NULL,
    pg_temp.eid ('cand_stale'),
    pg_temp.eid ('e_one'),
    pg_temp.eid ('c_one'),
    1,
    '1',
    true,
    '2020-01-01T00:00:00Z'
  ),
  (
    pg_temp.eid ('n_const'),
    test_id ('project_a'),
    NULL,
    pg_temp.eid ('cand_const'),
    pg_temp.eid ('e_one'),
    pg_temp.eid ('c_one'),
    1,
    NULL,
    false,
    '2020-01-01T00:00:00Z'
  ),
  (
    pg_temp.eid ('n_round'),
    test_id ('project_a'),
    NULL,
    pg_temp.eid ('cand_round'),
    pg_temp.eid ('e_null'),
    pg_temp.eid ('c_one'),
    1,
    NULL,
    false,
    '2020-01-01T00:00:00Z'
  ),
  (
    pg_temp.eid ('n_round_null'),
    test_id ('project_a'),
    NULL,
    pg_temp.eid ('cand_round_null'),
    pg_temp.eid ('e_one'),
    pg_temp.eid ('c_one'),
    NULL,
    NULL,
    false,
    '2020-01-01T00:00:00Z'
  ),
  (
    pg_temp.eid ('n_const_kept'),
    test_id ('project_a'),
    NULL,
    pg_temp.eid ('cand_const_kept'),
    pg_temp.eid ('e_one'),
    pg_temp.eid ('c_far'),
    1,
    NULL,
    false,
    '2020-01-01T00:00:00Z'
  );

DELETE FROM election_constituency_groups
WHERE
  election_id = pg_temp.eid ('e_one')
  AND constituency_group_id = pg_temp.eid ('g_other');

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
  unnest(
    ARRAY[
      'cand_stale',
      'cand_const',
      'cand_const_new',
      'cand_const_kept',
      'cand_round',
      'cand_round_null',
      'cand_req'
    ]
  ) AS k (name);

-- =====================================================================
-- Instruments
-- =====================================================================
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

-- The nominations in reach of a candidate as the calling session reads them, each id with its updated_at: what a writer that has just read them would state.
CREATE FUNCTION pg_temp.reach_now (p_id uuid) RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT COALESCE(jsonb_object_agg(n.id, n.updated_at), '{}'::jsonb)
  FROM public.nominations n
  JOIN public.elections e ON e.id = n.election_id
  WHERE n.candidate_id = p_id
    AND COALESCE(n.election_round, 1) = COALESCE(e.current_round, 1)
    AND public.nomination_shape_rule(e.election_type, 'candidate') IN ('admitted', 'parent_required');
$fn$;

-- The statement that calls the function, as text, so that a database without the four-argument function fails each assertion on its own.
CREATE FUNCTION pg_temp.call (p_id uuid, p_nominations jsonb, p_expected jsonb) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    'SELECT public.set_entity_nominations(%L::public.entity_type, %L::uuid, %L::jsonb, %L::jsonb)',
    'candidate', p_id, p_nominations, p_expected);
$fn$;

-- What the function answers the calling session, or an object that says what it raised.
CREATE FUNCTION pg_temp.save (p_id uuid, p_nominations jsonb, p_expected jsonb) RETURNS jsonb LANGUAGE plpgsql AS $fn$
DECLARE
  v_answer jsonb;
BEGIN
  EXECUTE pg_temp.call(p_id, p_nominations, p_expected) INTO v_answer;
  RETURN v_answer;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('raised', SQLSTATE, 'message', SQLERRM);
END;
$fn$;

CREATE FUNCTION pg_temp.changed () RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT 'set_entity_nominations: the nominations have changed since they were read';
$fn$;

CREATE FUNCTION pg_temp.malformed_expectation () RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT 'set_entity_nominations: p_expected_reach must be a JSON object that maps each nomination id to its updated_at';
$fn$;

-- The nomination trigger's refusal of a nomination of election one at the constituency of the other election.
CREATE FUNCTION pg_temp.foreign_constituency () RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    'Nomination constituency %s is no constituency of its election %s',
    pg_temp.eid ('c_far'), pg_temp.eid ('e_one'));
$fn$;

-- The parent options of a candidate at one contest, asked as many times as given.
CREATE FUNCTION pg_temp.options_call (p_id uuid, p_times integer) RETURNS jsonb LANGUAGE sql AS $fn$
  SELECT public.get_nomination_parent_options(
    test_id ('project_a'),
    'candidate',
    p_id,
    (
      SELECT jsonb_agg(jsonb_build_object('election_id', pg_temp.eid ('e_one'), 'constituency_id', pg_temp.eid ('c_two')))
      FROM generate_series(1, p_times)
    ));
$fn$;

-- A candidate's nomination in the list election with no parent and the custom data given, inserted as the owner while the end-of-transaction parent rule is immediate.
CREATE FUNCTION pg_temp.requesting (
  p_custom_data jsonb,
  p_confirmed boolean,
  p_election text
) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    'SET CONSTRAINTS public.nominations_parent_required IMMEDIATE; '
    'INSERT INTO public.nominations (project_id, candidate_id, election_id, constituency_id, election_round, custom_data, confirmed) VALUES (%L, %L, %L, %L, 1, %L::jsonb, %L); '
    'SET CONSTRAINTS public.nominations_parent_required DEFERRED; '
    'DELETE FROM public.nominations WHERE candidate_id = %L',
    test_id ('project_a'), pg_temp.eid ('cand_req'), pg_temp.eid (p_election), pg_temp.eid ('c_one'),
    p_custom_data, p_confirmed, pg_temp.eid ('cand_req'));
$fn$;

-- =====================================================================
-- READ and STALE
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
      public.get_entity_nominations (
        test_id ('project_a'),
        'candidate',
        pg_temp.eid ('cand_stale')
      ) -> 0 ->> 'updated_at'
    )::timestamptz,
    '2020-01-01T00:00:00Z'::timestamptz,
    'READ: get_entity_nominations states the updated_at of each nomination'
  );

SELECT
  is (
    pg_temp.save (
      pg_temp.eid ('cand_stale'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.eid ('n_stale'),
          pg_temp.eid ('e_one'),
          pg_temp.eid ('c_one'),
          '1',
          '{"kind":"keep"}'
        )
      ),
      pg_temp.reach_now (pg_temp.eid ('cand_stale'))
    ) ->> 'unchanged',
    '1',
    'STALE: a set stated with the reach as it is stored lives'
  );

-- An administrator creates and confirms a second nomination of the candidate after the caller's read.
SELECT
  reset_role ();

INSERT INTO
  nominations (
    id,
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round,
    confirmed
  )
VALUES
  (
    pg_temp.eid ('n_admin'),
    test_id ('project_a'),
    pg_temp.eid ('cand_stale'),
    pg_temp.eid ('e_one'),
    pg_temp.eid ('c_two'),
    1,
    true
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
      pg_temp.eid ('cand_stale'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.eid ('n_stale'),
          pg_temp.eid ('e_one'),
          pg_temp.eid ('c_one'),
          '2',
          '{"kind":"keep"}'
        )
      ),
      jsonb_build_object(pg_temp.eid ('n_stale'), '2020-01-01T00:00:00Z')
    ),
    '40001',
    pg_temp.changed (),
    'STALE: a nomination created since the read is not deleted by a set computed from the read'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        array_agg(
          n.id::text || ' ' || COALESCE(n.election_symbol, '-') || ' ' || n.confirmed
          ORDER BY
            n.id
        )
      FROM
        nominations n
      WHERE
        n.candidate_id = pg_temp.eid ('cand_stale')
    ),
    ARRAY[
      pg_temp.eid ('n_stale')::text || ' 1 true',
      pg_temp.eid ('n_admin')::text || ' - true'
    ],
    'STALE: the refused call stored nothing: the created nomination stands, and the read one keeps its symbol and its confirmation'
  );

-- The administrator removes that nomination and moves the read one to the second constituency.
DELETE FROM nominations
WHERE
  id = pg_temp.eid ('n_admin');

UPDATE nominations
SET
  constituency_id = pg_temp.eid ('c_two')
WHERE
  id = pg_temp.eid ('n_stale');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.call (
      pg_temp.eid ('cand_stale'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.eid ('n_stale'),
          pg_temp.eid ('e_one'),
          pg_temp.eid ('c_one'),
          '1',
          '{"kind":"keep"}'
        )
      ),
      jsonb_build_object(pg_temp.eid ('n_stale'), '2020-01-01T00:00:00Z')
    ),
    '40001',
    pg_temp.changed (),
    'STALE: a move made since the read is not reverted by a set computed from the read'
  );

SELECT
  throws_ok (
    pg_temp.call (
      pg_temp.eid ('cand_stale'),
      '[]'::jsonb,
      pg_temp.reach_now (pg_temp.eid ('cand_stale')) || jsonb_build_object(pg_temp.eid ('n_ghost'), '2020-01-01T00:00:00Z')
    ),
    '40001',
    pg_temp.changed (),
    'STALE: an expectation that names a nomination no longer in reach is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      pg_temp.eid ('cand_stale'),
      '[]'::jsonb,
      '{}'::jsonb
    ),
    '40001',
    pg_temp.changed (),
    'STALE: an expectation that leaves out a nomination in reach is refused'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        n.constituency_id::text || ' ' || n.confirmed
      FROM
        nominations n
      WHERE
        n.id = pg_temp.eid ('n_stale')
    ),
    pg_temp.eid ('c_two')::text || ' true',
    'STALE: the moved nomination stays where the administrator put it, confirmed'
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
      pg_temp.eid ('cand_stale'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.eid ('n_stale'),
          pg_temp.eid ('e_one'),
          pg_temp.eid ('c_two'),
          '9',
          '{"kind":"keep"}'
        )
      ),
      pg_temp.reach_now (pg_temp.eid ('cand_stale'))
    ) ->> 'updated',
    '1',
    'STALE: the same edit stated with the reach read afresh is stored'
  );

-- =====================================================================
-- EXP: a malformed expectation
-- =====================================================================
SELECT
  throws_ok (
    pg_temp.call (pg_temp.eid ('cand_stale'), '[]'::jsonb, NULL),
    '22023',
    pg_temp.malformed_expectation (),
    'EXP: an expectation that is not stated is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      pg_temp.eid ('cand_stale'),
      '[]'::jsonb,
      '[]'::jsonb
    ),
    '22023',
    pg_temp.malformed_expectation (),
    'EXP: an expectation that is not an object is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      pg_temp.eid ('cand_stale'),
      '[]'::jsonb,
      '{"not a uuid":"2020-01-01T00:00:00Z"}'::jsonb
    ),
    '22023',
    pg_temp.malformed_expectation (),
    'EXP: an expectation whose key is not a uuid is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      pg_temp.eid ('cand_stale'),
      '[]'::jsonb,
      jsonb_build_object(pg_temp.eid ('n_stale'), 5)
    ),
    '22023',
    pg_temp.malformed_expectation (),
    'EXP: an expectation whose value is not a string is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      pg_temp.eid ('cand_stale'),
      '[]'::jsonb,
      jsonb_build_object(pg_temp.eid ('n_stale'), 'not a time')
    ),
    '22023',
    pg_temp.malformed_expectation (),
    'EXP: an expectation whose value is not a time is refused'
  );

-- =====================================================================
-- CONST: the constituency belongs to the election
-- =====================================================================
SELECT
  throws_ok (
    pg_temp.call (
      pg_temp.eid ('cand_const'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.eid ('n_const'),
          pg_temp.eid ('e_one'),
          pg_temp.eid ('c_far'),
          NULL,
          '{"kind":"none"}'
        )
      ),
      pg_temp.reach_now (pg_temp.eid ('cand_const'))
    ),
    '23514',
    pg_temp.foreign_constituency (),
    'CONST: a move to a constituency of another election is refused'
  );

SELECT
  throws_ok (
    pg_temp.call (
      pg_temp.eid ('cand_const_new'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_one'),
          pg_temp.eid ('c_far'),
          NULL,
          '{"kind":"none"}'
        )
      ),
      '{}'::jsonb
    ),
    '23514',
    pg_temp.foreign_constituency (),
    'CONST: a new nomination at a constituency of another election is refused'
  );

SELECT
  is (
    pg_temp.save (
      pg_temp.eid ('cand_const_new'),
      jsonb_build_array(
        pg_temp.item (
          NULL,
          pg_temp.eid ('e_one'),
          pg_temp.eid ('c_two'),
          NULL,
          '{"kind":"none"}'
        )
      ),
      '{}'::jsonb
    ) ->> 'inserted',
    '1',
    'CONST: a new nomination at a constituency of its election is stored'
  );

SELECT
  is (
    pg_temp.save (
      pg_temp.eid ('cand_const'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.eid ('n_const'),
          pg_temp.eid ('e_one'),
          pg_temp.eid ('c_two'),
          NULL,
          '{"kind":"none"}'
        )
      ),
      pg_temp.reach_now (pg_temp.eid ('cand_const'))
    ) ->> 'deleted',
    '1',
    'CONST: a move to another constituency of its election is stored'
  );

SELECT
  is (
    pg_temp.save (
      pg_temp.eid ('cand_const_kept'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.eid ('n_const_kept'),
          pg_temp.eid ('e_one'),
          pg_temp.eid ('c_far'),
          '5',
          '{"kind":"none"}'
        )
      ),
      pg_temp.reach_now (pg_temp.eid ('cand_const_kept'))
    ) ->> 'updated',
    '1',
    'CONST: a stored nomination that stays at a constituency outside its election is written, as it was stored'
  );

-- =====================================================================
-- ROUND: a round that is not stored is round 1
-- =====================================================================
SELECT
  is (
    pg_temp.save (
      pg_temp.eid ('cand_round'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.eid ('n_round'),
          pg_temp.eid ('e_null'),
          pg_temp.eid ('c_one'),
          '4',
          '{"kind":"none"}'
        )
      ),
      pg_temp.reach_now (pg_temp.eid ('cand_round'))
    ) ->> 'updated',
    '1',
    'ROUND: a nomination at round 1 of an election whose current round is not stored is in reach'
  );

SELECT
  is (
    pg_temp.save (
      pg_temp.eid ('cand_round_null'),
      jsonb_build_array(
        pg_temp.item (
          pg_temp.eid ('n_round_null'),
          pg_temp.eid ('e_one'),
          pg_temp.eid ('c_one'),
          NULL,
          jsonb_build_object(
            'kind',
            'entity',
            'entity_type',
            'organization',
            'entity_id',
            pg_temp.eid ('party')
          )
        )
      ),
      pg_temp.reach_now (pg_temp.eid ('cand_round_null'))
    ) ->> 'updated',
    '1',
    'ROUND: a nomination with no round stored, in an election at round 1, is in reach and is linked to its party''s round-1 nomination'
  );

SELECT
  ok (
    pg_temp.options_call (pg_temp.eid ('cand_round_null'), 1) @> jsonb_build_array(
      jsonb_build_object(
        'id',
        pg_temp.eid ('party_null'),
        'nominated',
        jsonb_build_array(
          jsonb_build_object(
            'election_id',
            pg_temp.eid ('e_one'),
            'constituency_id',
            pg_temp.eid ('c_two')
          )
        )
      )
    ),
    'ROUND: a party nominated with no round stored is nominated at round 1 of its election'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        n.parent_nomination_id
      FROM
        nominations n
      WHERE
        n.id = pg_temp.eid ('n_round_null')
    ),
    pg_temp.eid ('n_party'),
    'ROUND: the nomination stands under the party''s existing nomination, and no other was created'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations n
      WHERE
        n.organization_id = pg_temp.eid ('party')
    ),
    1,
    'ROUND: the party holds one nomination'
  );

-- =====================================================================
-- BOUND: the contests of the parent options
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    jsonb_typeof(
      pg_temp.options_call (pg_temp.eid ('cand_round_null'), 1000)
    ),
    'array',
    'BOUND: a thousand contests are answered'
  );

SELECT
  is (
    pg_temp.options_call (pg_temp.eid ('cand_round_null'), 1001),
    NULL,
    'BOUND: more than a thousand contests are refused with NULL'
  );

-- =====================================================================
-- REQ: a requested parent organization is a string that is not blank
-- =====================================================================
SELECT
  reset_role ();

SELECT
  throws_ok (
    pg_temp.requesting (
      '{"requestedParentOrganization":null}',
      false,
      'e_list'
    ),
    '23514',
    NULL,
    'REQ: a requested parent organization that is JSON null does not satisfy the parent rule'
  );

SELECT
  throws_ok (
    pg_temp.requesting (
      '{"requestedParentOrganization":"   "}',
      false,
      'e_list'
    ),
    '23514',
    NULL,
    'REQ: a requested parent organization that is blank does not satisfy the parent rule'
  );

SELECT
  throws_ok (
    pg_temp.requesting (
      '{"requestedParentOrganization":7}',
      false,
      'e_list'
    ),
    '23514',
    NULL,
    'REQ: a requested parent organization that is not a string does not satisfy the parent rule'
  );

SELECT
  lives_ok (
    pg_temp.requesting (
      '{"requestedParentOrganization":"Party Not Listed"}',
      false,
      'e_list'
    ),
    'REQ: a requested parent organization that names a party satisfies the parent rule'
  );

SELECT
  lives_ok (
    pg_temp.requesting (
      '{"requestedParentOrganization":null}',
      true,
      'e_one'
    ),
    'REQ: a nomination whose requested parent organization is JSON null may be confirmed where no parent is required'
  );

SELECT
  throws_ok (
    pg_temp.requesting (
      '{"requestedParentOrganization":"Party Not Listed"}',
      true,
      'e_one'
    ),
    'P0001',
    NULL,
    'REQ: a nomination that requests a named parent organization still cannot be confirmed'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
