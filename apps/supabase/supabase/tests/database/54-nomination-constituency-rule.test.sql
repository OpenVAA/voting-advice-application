-- 54-nomination-constituency-rule.test.sql: a nomination's constituency must be a constituency of its election, whoever writes the row
--
-- A constituency is one of an election's constituencies when a constituency group the election is linked to (election_constituency_groups) holds it (constituency_group_constituencies). The nomination trigger `validate_nomination` refuses any other with SQLSTATE 23514 and `Nomination constituency <id> is no constituency of its election <id>`, on every INSERT and on every UPDATE that changes the row's election or constituency. It binds every writer: an entity's own editor, a project admin, the service role and `bulk_import` alike.
--
-- A stored nomination that stays where it is is not judged again, so an edit of its symbol lives after its constituency is unlinked from its election.
--
-- Each writer is asserted twice: refused at a constituency its election is not linked to, and admitted at one it is linked to. A refusal is asserted by its SQLSTATE and its whole message.
--
-- Every impersonation passes an empty grant array, so each claim is projected from the rows this file writes. The user of the fixture's candidate_a edits two candidates of this file; admin_a is project A's admin.
--
-- Depends on:
-- - 00-helpers.test.sql (create_test_data, test_id, test_user_id, test_seed_identity_grants, set_test_user, reset_role)
-- - 011-validation-functions.sql (validate_nomination)
-- - 501-bulk-operations.sql (bulk_import and its link keys)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (13);

SELECT
  create_test_data ();

-- =====================================================================
-- Names for the rows of this file
-- =====================================================================
CREATE FUNCTION pg_temp.eid (p_name text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $fn$
  SELECT ('54545454-5454-5454-5454-0000000000' || CASE p_name
    WHEN 'election' THEN 'e1'
    WHEN 'group' THEN 'f1'
    WHEN 'c_in' THEN 'c1'
    WHEN 'c_out' THEN 'c2'
    WHEN 'c_dropped' THEN 'c3'
    WHEN 'cand_own' THEN 'a1'
    WHEN 'cand_admin' THEN 'a2'
    WHEN 'cand_service' THEN 'a3'
    WHEN 'cand_kept' THEN 'a4'
    WHEN 'n_kept' THEN 'd1'
  END)::uuid;
$fn$;

-- =====================================================================
-- Fixture, inserted before the first impersonation
-- =====================================================================
-- One election of the default type over one constituency group. The group holds `c_in` and, until the kept nomination below is stored, `c_dropped`; `c_out` is in no group of the election.
INSERT INTO
  elections (id, project_id, name, current_round)
VALUES
  (
    pg_temp.eid ('election'),
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
    '{"en":"Group of this file"}'::jsonb
  );

INSERT INTO
  constituencies (id, project_id, name)
VALUES
  (
    pg_temp.eid ('c_in'),
    test_id ('project_a'),
    '{"en":"Constituency of the election"}'::jsonb
  ),
  (
    pg_temp.eid ('c_out'),
    test_id ('project_a'),
    '{"en":"Constituency of no group of the election"}'::jsonb
  ),
  (
    pg_temp.eid ('c_dropped'),
    test_id ('project_a'),
    '{"en":"Constituency unlinked after a nomination was stored"}'::jsonb
  );

INSERT INTO
  constituency_group_constituencies (constituency_group_id, constituency_id)
VALUES
  (pg_temp.eid ('group'), pg_temp.eid ('c_in')),
  (pg_temp.eid ('group'), pg_temp.eid ('c_dropped'));

INSERT INTO
  election_constituency_groups (election_id, constituency_group_id)
VALUES
  (pg_temp.eid ('election'), pg_temp.eid ('group'));

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
      'cand_own',
      'cand_admin',
      'cand_service',
      'cand_kept'
    ]
  ) AS k (name);

-- A nomination stored while its constituency was linked to its election, and the link removed after it.
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
    pg_temp.eid ('n_kept'),
    test_id ('project_a'),
    pg_temp.eid ('cand_kept'),
    pg_temp.eid ('election'),
    pg_temp.eid ('c_dropped'),
    1
  );

DELETE FROM constituency_group_constituencies
WHERE
  constituency_group_id = pg_temp.eid ('group')
  AND constituency_id = pg_temp.eid ('c_dropped');

-- The authority rows: admin_a's own, and the user of candidate_a as the editor of two candidates of this file.
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
  unnest(ARRAY['cand_own', 'cand_kept']) AS k (name);

-- =====================================================================
-- Instruments
-- =====================================================================
-- The insert of a candidate's nomination in this file's election, as text, so that each assertion makes its own statement.
CREATE FUNCTION pg_temp.insert_call (p_candidate text, p_constituency text) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    'INSERT INTO public.nominations (project_id, candidate_id, election_id, constituency_id, election_round) VALUES (%L, %L, %L, %L, 1)',
    test_id ('project_a'), pg_temp.eid (p_candidate), pg_temp.eid ('election'), pg_temp.eid (p_constituency));
$fn$;

-- The trigger's refusal of a nomination at a constituency of this file that is no constituency of this file's election.
CREATE FUNCTION pg_temp.refusal (p_constituency text) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    'Nomination constituency %s is no constituency of its election %s',
    pg_temp.eid (p_constituency), pg_temp.eid ('election'));
$fn$;

-- One bulk_import payload: an election, its constituency group, a constituency and an organization nominated there. With p_with_links the election item names the group and the group item names the constituency.
CREATE FUNCTION pg_temp.payload (p_prefix text, p_with_links boolean) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT jsonb_build_object(
    'elections', jsonb_build_array(
      jsonb_build_object(
        'project_id', test_id ('project_a'),
        'external_id', p_prefix || '-el',
        'name', '{"en": "NCR election"}'::jsonb
      ) || CASE WHEN p_with_links THEN jsonb_build_object(
        'constituency_groups', jsonb_build_array(jsonb_build_object('external_id', p_prefix || '-cg'))
      ) ELSE '{}'::jsonb END
    ),
    'constituency_groups', jsonb_build_array(
      jsonb_build_object(
        'project_id', test_id ('project_a'),
        'external_id', p_prefix || '-cg',
        'name', '{"en": "NCR group"}'::jsonb
      ) || CASE WHEN p_with_links THEN jsonb_build_object(
        'constituencies', jsonb_build_array(jsonb_build_object('external_id', p_prefix || '-co'))
      ) ELSE '{}'::jsonb END
    ),
    'constituencies', jsonb_build_array(
      jsonb_build_object(
        'project_id', test_id ('project_a'),
        'external_id', p_prefix || '-co',
        'name', '{"en": "NCR constituency"}'::jsonb
      )
    ),
    'organizations', jsonb_build_array(
      jsonb_build_object(
        'project_id', test_id ('project_a'),
        'external_id', p_prefix || '-org',
        'name', '{"en": "NCR party"}'::jsonb
      )
    ),
    'nominations', jsonb_build_array(
      jsonb_build_object(
        'project_id', test_id ('project_a'),
        'external_id', p_prefix || '-nom',
        'organization', jsonb_build_object('external_id', p_prefix || '-org'),
        'election', jsonb_build_object('external_id', p_prefix || '-el'),
        'constituency', jsonb_build_object('external_id', p_prefix || '-co')
      )
    )
  );
$fn$;

-- bulk_import, with a raise answered as its SQLSTATE and its message, every uuid in the message written `<uuid>`: the import's rows have ids the database chooses. The raise still rolls back everything the import wrote.
CREATE FUNCTION pg_temp.import (p_data jsonb) RETURNS jsonb LANGUAGE plpgsql AS $fn$
BEGIN
  RETURN public.bulk_import(p_data);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'raised', SQLSTATE,
    'message', regexp_replace(SQLERRM, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '<uuid>', 'g'));
END;
$fn$;

-- The rows of project A whose external id begins with the payload's prefix, over the five collections of the payload.
CREATE FUNCTION pg_temp.imported_rows (p_prefix text) RETURNS integer LANGUAGE sql STABLE AS $fn$
  SELECT (
    (SELECT count(*) FROM public.elections WHERE project_id = test_id ('project_a') AND starts_with(external_id, p_prefix || '-'))
    + (SELECT count(*) FROM public.constituency_groups WHERE project_id = test_id ('project_a') AND starts_with(external_id, p_prefix || '-'))
    + (SELECT count(*) FROM public.constituencies WHERE project_id = test_id ('project_a') AND starts_with(external_id, p_prefix || '-'))
    + (SELECT count(*) FROM public.organizations WHERE project_id = test_id ('project_a') AND starts_with(external_id, p_prefix || '-'))
    + (SELECT count(*) FROM public.nominations WHERE project_id = test_id ('project_a') AND starts_with(external_id, p_prefix || '-'))
  )::integer;
$fn$;

-- =====================================================================
-- An entity's own editor
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    pg_temp.insert_call ('cand_own', 'c_out'),
    '23514',
    pg_temp.refusal ('c_out'),
    'NCR: a candidate''s own insert of a nomination at a constituency its election is not linked to is refused'
  );

SELECT
  lives_ok (
    pg_temp.insert_call ('cand_own', 'c_in'),
    'NCR: a candidate''s own insert of a nomination at a constituency of its election is admitted'
  );

SELECT
  lives_ok (
    format(
      'UPDATE public.nominations SET election_symbol = %L WHERE id = %L',
      '7',
      pg_temp.eid ('n_kept')
    ),
    'NCR: an edit of the symbol of a nomination whose constituency was unlinked from its election after it was stored lives'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        election_symbol
      FROM
        nominations
      WHERE
        id = pg_temp.eid ('n_kept')
    ),
    '7',
    'NCR: and the symbol is stored, at the constituency the nomination kept'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    format(
      'UPDATE public.nominations SET constituency_id = %L WHERE id = %L',
      pg_temp.eid ('c_out'),
      pg_temp.eid ('n_kept')
    ),
    '23514',
    pg_temp.refusal ('c_out'),
    'NCR: an update that moves a nomination to a constituency its election is not linked to is refused'
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
  throws_ok (
    pg_temp.insert_call ('cand_admin', 'c_out'),
    '23514',
    pg_temp.refusal ('c_out'),
    'NCR: a project admin''s insert of a nomination at a constituency its election is not linked to is refused'
  );

SELECT
  lives_ok (
    pg_temp.insert_call ('cand_admin', 'c_in'),
    'NCR: a project admin''s insert of a nomination at a constituency of its election is admitted'
  );

SELECT
  reset_role ();

-- =====================================================================
-- The service role, directly and through bulk_import
-- =====================================================================
SELECT
  set_config('request.jwt.claims', '', true);

SELECT
  set_config('role', 'service_role', true);

SELECT
  throws_ok (
    pg_temp.insert_call ('cand_service', 'c_out'),
    '23514',
    pg_temp.refusal ('c_out'),
    'NCR: the service role''s insert of a nomination at a constituency its election is not linked to is refused'
  );

SELECT
  lives_ok (
    pg_temp.insert_call ('cand_service', 'c_in'),
    'NCR: the service role''s insert of a nomination at a constituency of its election is admitted'
  );

SELECT
  is (
    pg_temp.import (pg_temp.payload ('ncr-bare', false)),
    jsonb_build_object(
      'raised',
      '23514',
      'message',
      'Nomination constituency <uuid> is no constituency of its election <uuid>'
    ),
    'NCR: a bulk_import whose nomination names a constituency its election is not linked to is refused'
  );

SELECT
  is (
    pg_temp.imported_rows ('ncr-bare'),
    0,
    'NCR: and the refused import wrote nothing'
  );

SELECT
  is (
    pg_temp.import (pg_temp.payload ('ncr-linked', true)),
    '{
      "elections": {"created": 1, "updated": 0},
      "constituency_groups": {"created": 1, "updated": 0},
      "constituencies": {"created": 1, "updated": 0},
      "organizations": {"created": 1, "updated": 0},
      "nominations": {"created": 1, "updated": 0}
    }'::jsonb,
    'NCR: the same import carrying the election''s links is admitted'
  );

SELECT
  is (
    pg_temp.imported_rows ('ncr-linked'),
    5,
    'NCR: and its election, group, constituency, organization and nomination are stored'
  );

SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
