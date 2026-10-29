-- 08-triggers.test.sql: Data integrity trigger tests
--
-- Verifies trigger-based data integrity:
--   - validate_answer_value: rejects malformed answer data by type
--   - validate_answers_jsonb: smart trigger only validates changed keys
--   - validate_nomination: rejects invalid hierarchy and mismatched election/constituency
--   - nomination_shape_rule, validate_nomination and nominations_parent_required: the election-type rule, cell by cell and for every role
--   - enforce_external_id_immutability: blocks external_id changes once set
--
-- Tests run as postgres role since triggers fire regardless of role, and we need to bypass RLS for test data manipulation. Section 12 also writes as a project administrator, as an entity's own editor and as the service role, to show that the election-type rule exempts none of them.
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)
--             000-functions.sql (validate_answer_value, validate_nomination) 006-answers-jsonb.sql (validate_answers_jsonb trigger) 015-external-id.sql (enforce_external_id_immutability trigger)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (113);

-- Create test fixture data
SELECT
  create_test_data ();

-- =====================================================================
-- Section 1: validate_answer_value -- valid answers accepted
-- =====================================================================
-- question_a is singleChoiceOrdinal, update candidate_a with a valid numeric answer
SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET answers = jsonb_build_object('%s', '{"value": 1}'::jsonb) WHERE id = '%s'$$,
      test_id ('question_a'),
      test_id ('candidate_a')
    ),
    'Valid singleChoiceOrdinal answer (numeric value) accepted'
  );

-- =====================================================================
-- Section 2: validate_answer_value -- invalid type rejected
-- =====================================================================
-- Insert additional questions with different types for testing
INSERT INTO
  questions (id, project_id, type, category_id, name)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000101'::uuid,
    test_id ('project_a'),
    'text',
    test_id ('question_category_a'),
    '{"en":"Text Q"}'::jsonb
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000102'::uuid,
    test_id ('project_a'),
    'number',
    test_id ('question_category_a'),
    '{"en":"Number Q"}'::jsonb
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000103'::uuid,
    test_id ('project_a'),
    'boolean',
    test_id ('question_category_a'),
    '{"en":"Boolean Q"}'::jsonb
  );

-- Text question with number value -> raises 'must be a string'
SELECT
  throws_ok (
    format(
      $$UPDATE candidates SET answers = jsonb_build_object('eeeeeeee-eeee-eeee-eeee-000000000101', '{"value": 42}'::jsonb) WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    NULL,
    'Answer for text question must be a string or localized string object',
    'Text question rejects numeric answer'
  );

-- Number question with string value -> raises 'must be a number'
SELECT
  throws_ok (
    format(
      $$UPDATE candidates SET answers = jsonb_build_object('eeeeeeee-eeee-eeee-eeee-000000000102', '{"value": "not-a-number"}'::jsonb) WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    NULL,
    'Answer for number question must be a number',
    'Number question rejects string answer'
  );

-- Boolean question with string value -> raises 'must be a boolean'
SELECT
  throws_ok (
    format(
      $$UPDATE candidates SET answers = jsonb_build_object('eeeeeeee-eeee-eeee-eeee-000000000103', '{"value": "yes"}'::jsonb) WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    NULL,
    'Answer for boolean question must be a boolean',
    'Boolean question rejects string answer'
  );

-- singleChoiceOrdinal with array value -> raises 'must be a choice ID'
SELECT
  throws_ok (
    format(
      $$UPDATE candidates SET answers = jsonb_build_object('%s', '{"value": [1,2,3]}'::jsonb) WHERE id = '%s'$$,
      test_id ('question_a'),
      test_id ('candidate_a')
    ),
    NULL,
    'Answer for choice question must be a choice ID (string or number)',
    'SingleChoiceOrdinal question rejects array answer'
  );

-- =====================================================================
-- Section 3: validate_answer_value -- nonexistent question rejected
-- =====================================================================
SELECT
  throws_ok (
    format(
      $$UPDATE candidates SET answers = jsonb_build_object('ffffffff-ffff-ffff-ffff-ffffffffffff', '{"value": 1}'::jsonb) WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    NULL,
    'Question ffffffff-ffff-ffff-ffff-ffffffffffff not found in project',
    'Nonexistent question UUID rejected'
  );

-- =====================================================================
-- Section 4: validate_answers_jsonb -- smart trigger skips unchanged answers
-- =====================================================================
-- First set a valid answer
UPDATE candidates
SET
  answers = jsonb_build_object(
    test_id ('question_a')::text,
    '{"value": 1}'::jsonb
  )
WHERE
  id = test_id ('candidate_a');

-- Then update an unrelated column (first_name) -- trigger should short-circuit
SELECT
  lives_ok (
    format(
      $$UPDATE candidates SET first_name = 'SmartTriggerTest' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    'Smart trigger short-circuits when answers unchanged (name-only update)'
  );

-- =====================================================================
-- Section 5: validate_nomination -- valid hierarchy accepted
-- =====================================================================
-- An alliance nomination with no parent, to hang the two assertions below off.
--
-- ⚠ IT IS THE SHARED FIXTURE'S ROW, NOT A SECOND ONE. This block used to INSERT its own top-level `alliance_a` nomination at (election_a, constituency_a, round 1). 162-08 later added `nomination_alliance_a` to `create_test_data ()` at exactly that contest, and the two have been duplicates ever since -- invisibly, because nothing forbade it. 162-12's `nominations_entity_parent_contest_key UNIQUE NULLS NOT DISTINCT` does forbid it, and MEASURED: installing that key turned this file red here, at the insert. Reusing the fixture's row asserts the same three things with one fewer row and no duplicate; every description string below is unchanged.
-- Organization nomination under alliance -> should work
SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (id, project_id, organization_id, election_id, constituency_id, election_round, parent_nomination_id)
      VALUES ('eeeeeeee-eeee-eeee-eeee-000000000202'::uuid, '%s', '%s', '%s', '%s', 1, test_id ('nomination_alliance_a'))$$,
      test_id ('project_a'),
      test_id ('org_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'Organization nomination under alliance accepted'
  );

-- =====================================================================
-- Section 6: validate_nomination -- invalid hierarchy rejected
-- =====================================================================
-- Alliance with parent -> throws 'cannot have a parent'
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (id, project_id, alliance_id, election_id, constituency_id, election_round, parent_nomination_id)
      VALUES (gen_random_uuid(), '%s', '%s', '%s', '%s', 1, '%s')$$,
      test_id ('project_a'),
      test_id ('alliance_a'),
      test_id ('election_a'),
      test_id ('constituency_a'),
      test_id ('nomination_org_a')
    ),
    NULL,
    'Alliance nominations cannot have a parent',
    'Alliance nomination with parent rejected'
  );

-- Faction without parent -> throws 'must have a parent'
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (id, project_id, faction_id, election_id, constituency_id, election_round)
      VALUES (gen_random_uuid(), '%s', '%s', '%s', '%s', 1)$$,
      test_id ('project_a'),
      test_id ('faction_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    NULL,
    'Faction nominations must have a parent organization nomination',
    'Faction nomination without parent rejected'
  );

-- =====================================================================
-- Section 6b: section 11.8's tightening -- *THE* organization, not *an* organization (162-12)
--
-- `validate_nomination` has always required a faction's parent to be AN organization nomination. Section
-- 11.8 tightens that to THE organization the faction itself belongs to, which became expressible only when 162-07b made `factions.organization_id` a NOT NULL column.
--
-- ⚠ THIS RULE IS EXERCISED BY THE pgTAP ESTATE AND BY NOTHING ELSE. 162-07b measured that NO seed template and NO E2E fixture emits a faction row at all, so a green E2E suite says nothing whatever about it. That is stated here rather than implied, because the natural reading of a green suite is the opposite.
--
-- Three assertions, and the third is what makes the first two a TIGHTENING rather than a REPLACEMENT: the pre-existing parent-type rule still fires, with its original message, for a faction under a non-organization.
-- =====================================================================
-- Fixture for the pair, as plain top-level statements: a second nomination of the faction's OWN organization at round 4, and a DIFFERENT organization with its own nomination at round 5. The rounds differ because `nominations_entity_parent_contest_key` forbids two nominations of one entity at one contest under one parent.
INSERT INTO
  nominations (
    id,
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round
  )
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000301'::uuid,
    test_id ('project_a'),
    test_id ('org_a'),
    test_id ('election_a'),
    test_id ('constituency_a'),
    4
  );

INSERT INTO
  organizations (id, project_id, name, confirmed)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000302'::uuid,
    test_id ('project_a'),
    '{"en":"Other Org"}'::jsonb,
    false
  );

INSERT INTO
  nominations (
    id,
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round
  )
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000303'::uuid,
    test_id ('project_a'),
    'eeeeeeee-eeee-eeee-eeee-000000000302'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    5
  );

-- The faction's OWN organization -> accepted.
SELECT
  lives_ok (
    format(
      $$INSERT INTO nominations (id, project_id, faction_id, election_id, constituency_id, election_round, parent_nomination_id)
      VALUES (gen_random_uuid(), '%s', '%s', '%s', '%s', 4, 'eeeeeeee-eeee-eeee-eeee-000000000301'::uuid)$$,
      test_id ('project_a'),
      test_id ('faction_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'Faction nomination under the nomination of its OWN organization accepted'
  );

-- A DIFFERENT organization in the same project -> rejected, and the message names BOTH organizations.
-- D-23: in a seed log a message naming one is indistinguishable from the parent-type error above it.
SELECT
  throws_like (
    format(
      $$INSERT INTO nominations (id, project_id, faction_id, election_id, constituency_id, election_round, parent_nomination_id)
      VALUES (gen_random_uuid(), '%s', '%s', '%s', '%s', 5, 'eeeeeeee-eeee-eeee-eeee-000000000303'::uuid)$$,
      test_id ('project_a'),
      test_id ('faction_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    '%faction belongs to organization%parent nomination carries organization%',
    'Faction nomination under a DIFFERENT organization rejected, and the message names BOTH organizations'
  );

-- Candidate under alliance -> throws 'must be an organization or faction'
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (id, project_id, candidate_id, election_id, constituency_id, election_round, parent_nomination_id)
      VALUES (gen_random_uuid(), '%s', '%s', '%s', '%s', 1, test_id ('nomination_alliance_a'))$$,
      test_id ('project_a'),
      test_id ('candidate_a'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    NULL,
    NULL,
    'Candidate nomination under alliance rejected (parent must be organization or faction)'
  );

-- Mismatched election_id between parent and child
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (id, project_id, candidate_id, election_id, constituency_id, election_round, parent_nomination_id)
      VALUES (gen_random_uuid(), '%s', '%s', '%s', '%s', 1, '%s')$$,
      test_id ('project_a'),
      test_id ('candidate_a2'),
      test_id ('election_b'),
      test_id ('constituency_a'),
      test_id ('nomination_org_a')
    ),
    NULL,
    NULL,
    'Nomination with mismatched election_id rejected'
  );

-- =====================================================================
-- Section 7: enforce_external_id_immutability -- NULL to value allowed
-- =====================================================================
-- election_a was created without external_id; setting it should succeed
SELECT
  lives_ok (
    format(
      $$UPDATE elections SET external_id = 'ext-election-a' WHERE id = '%s'$$,
      test_id ('election_a')
    ),
    'Setting external_id from NULL to value is allowed'
  );

-- =====================================================================
-- Section 8: enforce_external_id_immutability -- value to different value blocked
-- =====================================================================
SELECT
  throws_ok (
    format(
      $$UPDATE elections SET external_id = 'ext-election-a-changed' WHERE id = '%s'$$,
      test_id ('election_a')
    ),
    NULL,
    NULL,
    'Changing external_id to different value is blocked'
  );

-- =====================================================================
-- Section 9: enforce_external_id_immutability -- value to NULL blocked
-- =====================================================================
SELECT
  throws_ok (
    format(
      $$UPDATE elections SET external_id = NULL WHERE id = '%s'$$,
      test_id ('election_a')
    ),
    NULL,
    NULL,
    'Setting external_id to NULL once set is blocked'
  );

-- =====================================================================
-- Section 10: enforce_external_id_immutability -- same value allowed (no-op)
-- =====================================================================
SELECT
  lives_ok (
    format(
      $$UPDATE elections SET external_id = 'ext-election-a' WHERE id = '%s'$$,
      test_id ('election_a')
    ),
    'Updating external_id to same value is allowed (no-op)'
  );

-- =====================================================================
-- Section 11: is_image / validate_image -- the extracted image-shape utility
-- =====================================================================
SELECT
  reset_role ();

-- The pair exists under the names the rest of the schema calls them by.
SELECT
  has_function (
    'public',
    'is_image',
    ARRAY['jsonb'],
    'public.is_image(jsonb) exists (image-shape validation is callable on its own, not only reachable through an answer write)'
  );

SELECT
  has_function (
    'public',
    'validate_image',
    ARRAY['jsonb'],
    'public.validate_image(jsonb) exists (the raising form, which keeps the specific diagnostics the predicate cannot return)'
  );

-- The predicate, in both directions.
SELECT
  ok (
    public.is_image (
      '{"path": "portraits/alice.png", "pathDark": "portraits/alice-dark.png", "alt": "Alice Alpha", "width": 800, "height": 600, "focalPoint": {"x": 0.5, "y": 0.25}}'::jsonb
    ),
    'is_image accepts a complete StoredImage (path, pathDark, alt, width, height and a focal point)'
  );

SELECT
  ok (
    NOT public.is_image ('{"alt": "Alice Alpha"}'::jsonb),
    'is_image rejects an object with no path'
  );

-- The validator returns quietly on a value that satisfies every rule.
SELECT
  lives_ok (
    $$SELECT public.validate_image('{"path": "portraits/alice.png", "pathDark": "portraits/alice-dark.png", "alt": "Alice Alpha", "width": 800, "height": 600, "focalPoint": {"x": 0.5, "y": 0.25}}'::jsonb)$$,
    'validate_image accepts a complete StoredImage including an optional focal point'
  );

-- The eleven distinct messages, each asserted by its own text. Extraction is only lossless if a caller still learns WHICH rule it broke, so each one is named here.
SELECT
  throws_ok (
    $$SELECT public.validate_image('"not-an-object"'::jsonb)$$,
    NULL,
    'Answer for image question must be an object',
    'validate_image: a JSON string is not an image object'
  );

SELECT
  throws_ok (
    $$SELECT public.validate_image('{"alt": "Alice Alpha"}'::jsonb)$$,
    NULL,
    'StoredImage must have a "path" property',
    'validate_image: an image without a path is rejected, and the message names the missing property'
  );

SELECT
  throws_ok (
    $$SELECT public.validate_image('{"path": 42}'::jsonb)$$,
    NULL,
    'StoredImage "path" must be a string',
    'validate_image: a non-string path is rejected by name'
  );

SELECT
  throws_ok (
    $$SELECT public.validate_image('{"path": "a.png", "pathDark": 42}'::jsonb)$$,
    NULL,
    'StoredImage "pathDark" must be a string',
    'validate_image: a non-string pathDark is rejected by name'
  );

SELECT
  throws_ok (
    $$SELECT public.validate_image('{"path": "a.png", "alt": 42}'::jsonb)$$,
    NULL,
    'StoredImage "alt" must be a string',
    'validate_image: a non-string alt is rejected by name'
  );

SELECT
  throws_ok (
    $$SELECT public.validate_image('{"path": "a.png", "width": "wide"}'::jsonb)$$,
    NULL,
    'StoredImage "width" must be a number',
    'validate_image: a non-numeric width is rejected by name'
  );

SELECT
  throws_ok (
    $$SELECT public.validate_image('{"path": "a.png", "height": "tall"}'::jsonb)$$,
    NULL,
    'StoredImage "height" must be a number',
    'validate_image: a non-numeric height is rejected by name'
  );

SELECT
  throws_ok (
    $$SELECT public.validate_image('{"path": "a.png", "focalPoint": 5}'::jsonb)$$,
    NULL,
    'StoredImage "focalPoint" must be an object',
    'validate_image: a scalar focalPoint is rejected by name'
  );

SELECT
  throws_ok (
    $$SELECT public.validate_image('{"path": "a.png", "focalPoint": {"x": 0.5}}'::jsonb)$$,
    NULL,
    'StoredImage "focalPoint" must have "x" and "y" properties',
    'validate_image: a focalPoint missing one coordinate is rejected, and the message names both'
  );

SELECT
  throws_ok (
    $$SELECT public.validate_image('{"path": "a.png", "focalPoint": {"x": "left", "y": 0.5}}'::jsonb)$$,
    NULL,
    'StoredImage "focalPoint.x" must be a number',
    'validate_image: a non-numeric focalPoint.x is rejected by name'
  );

SELECT
  throws_ok (
    $$SELECT public.validate_image('{"path": "a.png", "focalPoint": {"x": 0.5, "y": "top"}}'::jsonb)$$,
    NULL,
    'StoredImage "focalPoint.y" must be a number',
    'validate_image: a non-numeric focalPoint.y is rejected by name'
  );

-- =====================================================================
-- Section 12: the election-type rule -- which entity types an election admits
--
-- `public.nomination_shape_rule` states the matrix once. `validate_nomination` refuses, at the statement, a row whose entity type the election's type does not admit: SQLSTATE 23514 and a message that begins `Nomination shape refused: `. Where the matrix answers `parent_required`, the constraint trigger `nominations_parent_required` refuses, at the end of the transaction, a candidate's row that has neither a parent nomination nor `requestedParentOrganization` in its custom data: SQLSTATE 23514 and a message that begins `Nomination parent required: `.
--
-- An election that must prove a refusal states its type. The fixture's own election states none and takes the column default, which admits every entity type.
--
-- This file never commits, so the deferred rule never fires by itself here. Every assertion that reads it forces it inside the asserted statements, and none leaves the constraint immediate: a refusal is restored by the rolled-back subtransaction of `throws_ok`, and a statement that lives names the constraint and puts it back itself.
-- =====================================================================
SELECT
  reset_role ();

-- Three elections of project A that each state a type, linked to the fixture's constituency group as the fixture's own election is.
INSERT INTO
  elections (id, project_id, name, election_type)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000401'::uuid,
    test_id ('project_a'),
    '{"en":"List election"}'::jsonb,
    'organization_list'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000402'::uuid,
    test_id ('project_a'),
    '{"en":"Candidates-only election"}'::jsonb,
    'candidate_only'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000403'::uuid,
    test_id ('project_a'),
    '{"en":"Organizations-only election"}'::jsonb,
    'organization_only'
  );

INSERT INTO
  election_constituency_groups (election_id, constituency_group_id)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000401'::uuid,
    test_id ('constituency_group_a')
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000402'::uuid,
    test_id ('constituency_group_a')
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-000000000403'::uuid,
    test_id ('constituency_group_a')
  );

-- `shape_election` names the election of project A that has the given type.
CREATE FUNCTION pg_temp.shape_election (p_shape text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $fn$
  SELECT CASE p_shape
    WHEN 'organization_list' THEN 'eeeeeeee-eeee-eeee-eeee-000000000401'::uuid
    WHEN 'organization_list_and_independents' THEN test_id ('election_a')
    WHEN 'candidate_only' THEN 'eeeeeeee-eeee-eeee-eeee-000000000402'::uuid
    WHEN 'organization_only' THEN 'eeeeeeee-eeee-eeee-eeee-000000000403'::uuid
  END;
$fn$;

-- `nominate` writes the INSERT that nominates one entity of project A in the election of the given type, at the fixture's constituency. The id is named only when one is given, because the INSERT column grant of `authenticated` does not hold it.
CREATE FUNCTION pg_temp.nominate (
  p_entity_column text,
  p_entity_id uuid,
  p_shape text,
  p_round integer,
  p_parent uuid DEFAULT NULL,
  p_id uuid DEFAULT NULL,
  p_custom_data jsonb DEFAULT NULL
) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT format(
    'INSERT INTO public.nominations (%sproject_id, %I, election_id, constituency_id, election_round, parent_nomination_id, custom_data) VALUES (%s%L, %L, %L, %L, %s, %L, %L)',
    CASE WHEN p_id IS NULL THEN '' ELSE 'id, ' END,
    p_entity_column,
    CASE WHEN p_id IS NULL THEN '' ELSE quote_literal(p_id) || ', ' END,
    test_id ('project_a'),
    p_entity_id,
    pg_temp.shape_election (p_shape),
    test_id ('constituency_a'),
    p_round,
    p_parent,
    p_custom_data
  );
$fn$;

-- `answer` runs a one-value query and returns the value as text. A query that names a function the database does not have answers a sentinel, so each cell of the grid fails as an assertion of its own instead of aborting the file.
CREATE FUNCTION pg_temp.answer (p_query text) RETURNS text LANGUAGE plpgsql AS $fn$
DECLARE
  v_answer text;
BEGIN
  EXECUTE p_query INTO v_answer;
  RETURN v_answer;
EXCEPTION WHEN undefined_function THEN
  RETURN '(no such function)';
END;
$fn$;

-- `forced` appends the two statements that fire the pending parent rule and put the constraint back to deferred.
CREATE FUNCTION pg_temp.forced (p_statements text) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT p_statements || '; SET CONSTRAINTS public.nominations_parent_required IMMEDIATE; SET CONSTRAINTS public.nominations_parent_required DEFERRED';
$fn$;

-- `parent_rule_is_deferred` answers whether a lone party-less candidate row in the list election raises nothing at its own statement. The row is deleted in the same block, so the pending rule finds nothing to judge afterwards.
CREATE FUNCTION pg_temp.parent_rule_is_deferred () RETURNS boolean LANGUAGE plpgsql AS $fn$
BEGIN
  BEGIN
    INSERT INTO public.nominations (project_id, candidate_id, election_id, constituency_id, election_round)
    VALUES (test_id ('project_a'), test_id ('candidate_a2'), pg_temp.shape_election ('organization_list'), test_id ('constituency_a'), 9);
    DELETE FROM public.nominations
    WHERE candidate_id = test_id ('candidate_a2')
      AND election_id = pg_temp.shape_election ('organization_list')
      AND election_round = 9;
  EXCEPTION WHEN check_violation THEN
    RETURN false;
  END;
  RETURN true;
END;
$fn$;

-- `parent_rule_probe_while_immediate` is the control of the probe above: it asks the probe with the constraint immediate, and puts the constraint back before it returns. It answers NULL when the database has no such constraint.
CREATE FUNCTION pg_temp.parent_rule_probe_while_immediate () RETURNS boolean LANGUAGE plpgsql AS $fn$
DECLARE
  v_deferred boolean;
BEGIN
  SET CONSTRAINTS public.nominations_parent_required IMMEDIATE;
  v_deferred := pg_temp.parent_rule_is_deferred ();
  SET CONSTRAINTS public.nominations_parent_required DEFERRED;
  RETURN v_deferred;
EXCEPTION WHEN undefined_object THEN
  RETURN NULL;
END;
$fn$;

-- ---------------------------------------------------------------------
-- 12a: the matrix function, cell by cell
-- ---------------------------------------------------------------------
SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('organization_list', 'candidate')$$
    ),
    'parent_required',
    'nomination_shape_rule: organization_list x candidate is parent_required'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('organization_list', 'organization')$$
    ),
    'admitted',
    'nomination_shape_rule: organization_list x organization is admitted'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('organization_list', 'faction')$$
    ),
    'admitted',
    'nomination_shape_rule: organization_list x faction is admitted'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('organization_list', 'alliance')$$
    ),
    'admitted',
    'nomination_shape_rule: organization_list x alliance is admitted'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('organization_list_and_independents', 'candidate')$$
    ),
    'admitted',
    'nomination_shape_rule: organization_list_and_independents x candidate is admitted'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('organization_list_and_independents', 'organization')$$
    ),
    'admitted',
    'nomination_shape_rule: organization_list_and_independents x organization is admitted'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('organization_list_and_independents', 'faction')$$
    ),
    'admitted',
    'nomination_shape_rule: organization_list_and_independents x faction is admitted'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('organization_list_and_independents', 'alliance')$$
    ),
    'admitted',
    'nomination_shape_rule: organization_list_and_independents x alliance is admitted'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('candidate_only', 'candidate')$$
    ),
    'admitted',
    'nomination_shape_rule: candidate_only x candidate is admitted'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('candidate_only', 'organization')$$
    ),
    'refused',
    'nomination_shape_rule: candidate_only x organization is refused'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('candidate_only', 'faction')$$
    ),
    'refused',
    'nomination_shape_rule: candidate_only x faction is refused'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('candidate_only', 'alliance')$$
    ),
    'refused',
    'nomination_shape_rule: candidate_only x alliance is refused'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('organization_only', 'candidate')$$
    ),
    'refused',
    'nomination_shape_rule: organization_only x candidate is refused'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('organization_only', 'organization')$$
    ),
    'admitted',
    'nomination_shape_rule: organization_only x organization is admitted'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('organization_only', 'faction')$$
    ),
    'refused',
    'nomination_shape_rule: organization_only x faction is refused'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('organization_only', 'alliance')$$
    ),
    'admitted',
    'nomination_shape_rule: organization_only x alliance is admitted'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule(NULL, 'candidate')$$
    ),
    NULL,
    'nomination_shape_rule: no election type answers NULL'
  );

SELECT
  is (
    pg_temp.answer (
      $$SELECT public.nomination_shape_rule('organization_list', NULL)$$
    ),
    NULL,
    'nomination_shape_rule: no entity type answers NULL'
  );

-- The matrix reads no table and no role, and neither does either function that asks it: all three exist, and none names the caller.
SELECT
  is (
    (
      SELECT
        ARRAY[
          count(*),
          count(*) FILTER (
            WHERE
              p.prosrc ~* '(current_user|session_user|current_role|current_setting|auth\.|user_can)'
          )
        ]
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname IN (
          'nomination_shape_rule',
          'validate_nomination',
          'validate_nomination_parent_required'
        )
    ),
    ARRAY[3::bigint, 0::bigint],
    'the matrix function and the two trigger functions exist, and none reads a role, a claim or a grant'
  );

SELECT
  is (
    (
      SELECT
        p.provolatile = 'i'
        AND NOT p.prosecdef
        AND array_to_string(p.proconfig, ',') LIKE 'search_path=%'
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'nomination_shape_rule'
    ),
    true,
    'nomination_shape_rule is IMMUTABLE, not SECURITY DEFINER, and pins its search_path'
  );

SELECT
  is (
    (
      SELECT
        t.tgdeferrable
        AND t.tginitdeferred
        AND t.tgtype = 21
      FROM
        pg_trigger t
      WHERE
        t.tgrelid = 'public.nominations'::regclass
        AND t.tgname = 'nominations_parent_required'
    ),
    true,
    'nominations_parent_required fires AFTER INSERT OR UPDATE for each row, deferrable and initially deferred'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_trigger t
        JOIN pg_proc p ON p.oid = t.tgfoid
      WHERE
        t.tgrelid = 'public.elections'::regclass
        AND NOT t.tgisinternal
        AND p.proname LIKE '%nomination%'
    ),
    0,
    'no trigger on public.elections asks a nomination rule'
  );

SELECT
  is (
    (
      SELECT
        e.election_type::text
      FROM
        elections e
      WHERE
        e.id = test_id ('election_a')
    ),
    'organization_list_and_independents',
    'the fixture election states no type and takes the default, organization_list_and_independents'
  );

-- ---------------------------------------------------------------------
-- 12b: one write per cell, as the owner of the tables
--
-- A faction's row names the nomination of its own organization at the same contest wherever that nomination can exist, so the refusal asserted is the election type's and not the hierarchy's. In a candidates-only election no organization nomination can exist, and the faction's row is refused before the hierarchy is asked.
-- ---------------------------------------------------------------------
-- organization_list
SELECT
  lives_ok (
    pg_temp.nominate (
      'alliance_id',
      test_id ('alliance_a'),
      'organization_list',
      1
    ),
    'organization_list x alliance: the write is admitted'
  );

SELECT
  lives_ok (
    pg_temp.nominate (
      'organization_id',
      test_id ('org_a'),
      'organization_list',
      1,
      NULL,
      'eeeeeeee-eeee-eeee-eeee-000000000412'
    ),
    'organization_list x organization: the write is admitted'
  );

SELECT
  lives_ok (
    pg_temp.nominate (
      'faction_id',
      test_id ('faction_a'),
      'organization_list',
      1,
      'eeeeeeee-eeee-eeee-eeee-000000000412'
    ),
    'organization_list x faction: the write is admitted under its organization'
  );

SELECT
  lives_ok (
    pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a'),
      'organization_list',
      1,
      'eeeeeeee-eeee-eeee-eeee-000000000412'
    ),
    'organization_list x candidate: the write is admitted at the statement'
  );

-- organization_list_and_independents, at round 2: the fixture holds round 1 of this contest.
SELECT
  lives_ok (
    pg_temp.nominate (
      'alliance_id',
      test_id ('alliance_a'),
      'organization_list_and_independents',
      2
    ),
    'organization_list_and_independents x alliance: the write is admitted'
  );

SELECT
  lives_ok (
    pg_temp.nominate (
      'organization_id',
      test_id ('org_a'),
      'organization_list_and_independents',
      2,
      NULL,
      'eeeeeeee-eeee-eeee-eeee-000000000442'
    ),
    'organization_list_and_independents x organization: the write is admitted'
  );

SELECT
  lives_ok (
    pg_temp.nominate (
      'faction_id',
      test_id ('faction_a'),
      'organization_list_and_independents',
      2,
      'eeeeeeee-eeee-eeee-eeee-000000000442'
    ),
    'organization_list_and_independents x faction: the write is admitted under its organization'
  );

SELECT
  lives_ok (
    pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a'),
      'organization_list_and_independents',
      2
    ),
    'organization_list_and_independents x candidate: the write is admitted without a parent'
  );

-- candidate_only
SELECT
  lives_ok (
    pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a'),
      'candidate_only',
      1,
      NULL,
      'eeeeeeee-eeee-eeee-eeee-000000000421'
    ),
    'candidate_only x candidate: the write is admitted'
  );

SELECT
  throws_ok (
    pg_temp.nominate (
      'organization_id',
      test_id ('org_a'),
      'candidate_only',
      1
    ),
    '23514',
    'Nomination shape refused: an organization cannot be nominated in an election of type candidate_only (election eeeeeeee-eeee-eeee-eeee-000000000402)',
    'candidate_only x organization: the write is refused, 23514, naming the entity type, the election type and the election'
  );

SELECT
  throws_ok (
    pg_temp.nominate (
      'faction_id',
      test_id ('faction_a'),
      'candidate_only',
      1
    ),
    '23514',
    'Nomination shape refused: a faction cannot be nominated in an election of type candidate_only (election eeeeeeee-eeee-eeee-eeee-000000000402)',
    'candidate_only x faction: the write is refused, 23514, for the election type and not for its missing parent'
  );

SELECT
  throws_ok (
    pg_temp.nominate (
      'alliance_id',
      test_id ('alliance_a'),
      'candidate_only',
      1
    ),
    '23514',
    'Nomination shape refused: an alliance cannot be nominated in an election of type candidate_only (election eeeeeeee-eeee-eeee-eeee-000000000402)',
    'candidate_only x alliance: the write is refused, 23514, naming the entity type, the election type and the election'
  );

-- organization_only
SELECT
  lives_ok (
    pg_temp.nominate (
      'organization_id',
      test_id ('org_a'),
      'organization_only',
      1,
      NULL,
      'eeeeeeee-eeee-eeee-eeee-000000000431'
    ),
    'organization_only x organization: the write is admitted'
  );

SELECT
  lives_ok (
    pg_temp.nominate (
      'alliance_id',
      test_id ('alliance_a'),
      'organization_only',
      1
    ),
    'organization_only x alliance: the write is admitted'
  );

SELECT
  throws_ok (
    pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a'),
      'organization_only',
      1
    ),
    '23514',
    'Nomination shape refused: a candidate cannot be nominated in an election of type organization_only (election eeeeeeee-eeee-eeee-eeee-000000000403)',
    'organization_only x candidate: the write is refused, 23514, naming the entity type, the election type and the election'
  );

SELECT
  throws_ok (
    pg_temp.nominate (
      'faction_id',
      test_id ('faction_a'),
      'organization_only',
      1,
      'eeeeeeee-eeee-eeee-eeee-000000000431'
    ),
    '23514',
    'Nomination shape refused: a faction cannot be nominated in an election of type organization_only (election eeeeeeee-eeee-eeee-eeee-000000000403)',
    'organization_only x faction: the write is refused, 23514, although its parent is the nomination of its own organization'
  );

-- An UPDATE is bound as an INSERT is: a stored row cannot be moved into an election whose type refuses it.
SELECT
  throws_ok (
    $$UPDATE public.nominations SET election_id = 'eeeeeeee-eeee-eeee-eeee-000000000403' WHERE id = 'eeeeeeee-eeee-eeee-eeee-000000000421'$$,
    '23514',
    'Nomination shape refused: a candidate cannot be nominated in an election of type organization_only (election eeeeeeee-eeee-eeee-eeee-000000000403)',
    'an UPDATE that moves a candidate nomination into an organization_only election is refused, 23514'
  );

-- ---------------------------------------------------------------------
-- 12c: the rule exempts no role
--
-- Each refused cell again as a project administrator, the cells an entity's own editor can attempt as that editor, and a refused cell of each kind as the service role. A BEFORE trigger runs ahead of the row-level-security check, so each refusal is the rule's 23514 with the rule's message and never a policy's 42501. One admitted cell per role lives, which shows that the role can write the table at all.
-- ---------------------------------------------------------------------
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  throws_ok (
    pg_temp.nominate (
      'organization_id',
      test_id ('org_a'),
      'candidate_only',
      1
    ),
    '23514',
    'Nomination shape refused: an organization cannot be nominated in an election of type candidate_only (election eeeeeeee-eeee-eeee-eeee-000000000402)',
    'a project administrator: candidate_only x organization is refused, 23514'
  );

SELECT
  throws_ok (
    pg_temp.nominate (
      'faction_id',
      test_id ('faction_a'),
      'candidate_only',
      1
    ),
    '23514',
    'Nomination shape refused: a faction cannot be nominated in an election of type candidate_only (election eeeeeeee-eeee-eeee-eeee-000000000402)',
    'a project administrator: candidate_only x faction is refused, 23514'
  );

SELECT
  throws_ok (
    pg_temp.nominate (
      'alliance_id',
      test_id ('alliance_a'),
      'candidate_only',
      1
    ),
    '23514',
    'Nomination shape refused: an alliance cannot be nominated in an election of type candidate_only (election eeeeeeee-eeee-eeee-eeee-000000000402)',
    'a project administrator: candidate_only x alliance is refused, 23514'
  );

SELECT
  throws_ok (
    pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a2'),
      'organization_only',
      1
    ),
    '23514',
    'Nomination shape refused: a candidate cannot be nominated in an election of type organization_only (election eeeeeeee-eeee-eeee-eeee-000000000403)',
    'a project administrator: organization_only x candidate is refused, 23514'
  );

SELECT
  throws_ok (
    pg_temp.nominate (
      'faction_id',
      test_id ('faction_a'),
      'organization_only',
      1,
      'eeeeeeee-eeee-eeee-eeee-000000000431'
    ),
    '23514',
    'Nomination shape refused: a faction cannot be nominated in an election of type organization_only (election eeeeeeee-eeee-eeee-eeee-000000000403)',
    'a project administrator: organization_only x faction is refused, 23514'
  );

SELECT
  lives_ok (
    pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a'),
      'candidate_only',
      2
    ),
    'a project administrator: candidate_only x candidate is admitted'
  );

SELECT
  throws_ok (
    $$UPDATE public.nominations SET election_id = 'eeeeeeee-eeee-eeee-eeee-000000000402' WHERE id = 'eeeeeeee-eeee-eeee-eeee-000000000431'$$,
    '23514',
    'Nomination shape refused: an organization cannot be nominated in an election of type candidate_only (election eeeeeeee-eeee-eeee-eeee-000000000402)',
    'a project administrator: an UPDATE that moves an organization nomination into a candidate_only election is refused, 23514'
  );

-- The editor of candidate_a.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  throws_ok (
    pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a'),
      'organization_only',
      1
    ),
    '23514',
    'Nomination shape refused: a candidate cannot be nominated in an election of type organization_only (election eeeeeeee-eeee-eeee-eeee-000000000403)',
    'a candidate''s own editor: organization_only x candidate is refused, 23514 and not 42501'
  );

-- The editor of candidate_a2, which has no nomination in the fixture.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a2'),
    test_user_grants ('candidate_a2')
  );

SELECT
  lives_ok (
    pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a2'),
      'candidate_only',
      1
    ),
    'a candidate''s own editor: candidate_only x candidate is admitted'
  );

SELECT
  throws_ok (
    format(
      $$UPDATE public.nominations SET election_id = 'eeeeeeee-eeee-eeee-eeee-000000000403' WHERE candidate_id = %L AND election_id = 'eeeeeeee-eeee-eeee-eeee-000000000402'$$,
      test_id ('candidate_a2')
    ),
    '23514',
    'Nomination shape refused: a candidate cannot be nominated in an election of type organization_only (election eeeeeeee-eeee-eeee-eeee-000000000403)',
    'a candidate''s own editor: an UPDATE that moves its nomination into an organization_only election is refused, 23514'
  );

SELECT
  throws_ok (
    pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a2'),
      'organization_list',
      1
    ) || '; SET CONSTRAINTS ALL IMMEDIATE',
    '23514',
    NULL,
    'a candidate''s own editor: a lone party-less row in an organization_list election is refused when the transaction ends, 23514'
  );

SELECT
  throws_like (
    pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a2'),
      'organization_list',
      1
    ) || '; SET CONSTRAINTS ALL IMMEDIATE',
    'Nomination parent required: candidate nomination % in election eeeeeeee-eeee-eeee-eeee-000000000401 has neither a parent nomination nor a requested parent organization',
    'a candidate''s own editor: that refusal names the row and the election'
  );

-- The editor of org_a.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  throws_ok (
    pg_temp.nominate (
      'organization_id',
      test_id ('org_a'),
      'candidate_only',
      1
    ),
    '23514',
    'Nomination shape refused: an organization cannot be nominated in an election of type candidate_only (election eeeeeeee-eeee-eeee-eeee-000000000402)',
    'an organization''s own editor: candidate_only x organization is refused, 23514 and not 42501'
  );

SELECT
  lives_ok (
    pg_temp.nominate (
      'organization_id',
      test_id ('org_a'),
      'organization_only',
      2
    ),
    'an organization''s own editor: organization_only x organization is admitted'
  );

-- The service role: no token, and row-level security bypassed.
SELECT
  set_config('request.jwt.claims', '', true);

SELECT
  set_config('role', 'service_role', true);

SELECT
  throws_ok (
    pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a'),
      'organization_only',
      1
    ),
    '23514',
    'Nomination shape refused: a candidate cannot be nominated in an election of type organization_only (election eeeeeeee-eeee-eeee-eeee-000000000403)',
    'the service role: organization_only x candidate is refused, 23514'
  );

SELECT
  throws_ok (
    pg_temp.nominate (
      'organization_id',
      test_id ('org_a'),
      'candidate_only',
      1
    ),
    '23514',
    'Nomination shape refused: an organization cannot be nominated in an election of type candidate_only (election eeeeeeee-eeee-eeee-eeee-000000000402)',
    'the service role: candidate_only x organization is refused, 23514'
  );

SELECT
  lives_ok (
    pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a'),
      'candidate_only',
      3
    ),
    'the service role: candidate_only x candidate is admitted'
  );

SELECT
  throws_ok (
    pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a2'),
      'organization_list',
      1,
      NULL,
      'eeeeeeee-eeee-eeee-eeee-000000000450'
    ) || '; SET CONSTRAINTS ALL IMMEDIATE',
    '23514',
    'Nomination parent required: candidate nomination eeeeeeee-eeee-eeee-eeee-000000000450 in election eeeeeeee-eeee-eeee-eeee-000000000401 has neither a parent nomination nor a requested parent organization',
    'the service role: a lone party-less row in an organization_list election is refused when the transaction ends, 23514'
  );

SELECT
  reset_role ();

-- ---------------------------------------------------------------------
-- 12d: the parent rule, at the end of the transaction
--
-- Every row below is candidate_a2's, in a round of its own. After each assertion that forces the rule the probe is asked, so a statement that left the constraint immediate is named by the assertion directly after it.
-- ---------------------------------------------------------------------
SELECT
  throws_ok (
    pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a2'),
      'organization_list',
      1,
      NULL,
      'eeeeeeee-eeee-eeee-eeee-000000000451'
    ) || '; SET CONSTRAINTS ALL IMMEDIATE',
    '23514',
    'Nomination parent required: candidate nomination eeeeeeee-eeee-eeee-eeee-000000000451 in election eeeeeeee-eeee-eeee-eeee-000000000401 has neither a parent nomination nor a requested parent organization',
    'organization_list: a lone candidate row with no parent is refused when all constraints are set immediate, 23514, naming the row and the election'
  );

SELECT
  ok (
    pg_temp.parent_rule_is_deferred (),
    'after the refused lone row, a party-less insert raises nothing at its own statement'
  );

SELECT
  throws_ok (
    pg_temp.forced (
      pg_temp.nominate (
        'candidate_id',
        test_id ('candidate_a2'),
        'organization_list',
        1,
        NULL,
        'eeeeeeee-eeee-eeee-eeee-000000000451'
      )
    ),
    '23514',
    'Nomination parent required: candidate nomination eeeeeeee-eeee-eeee-eeee-000000000451 in election eeeeeeee-eeee-eeee-eeee-000000000401 has neither a parent nomination nor a requested parent organization',
    'organization_list: the same lone row is refused when the constraint is forced by name'
  );

SELECT
  ok (
    pg_temp.parent_rule_is_deferred (),
    'after the lone row refused by name, a party-less insert raises nothing at its own statement'
  );

-- The candidate's own row, then the parent organization's row, then the repoint.
SELECT
  lives_ok (
    pg_temp.forced (
      pg_temp.nominate (
        'candidate_id',
        test_id ('candidate_a2'),
        'organization_list',
        2,
        NULL,
        'eeeeeeee-eeee-eeee-eeee-000000000452'
      ) || '; ' || pg_temp.nominate (
        'organization_id',
        test_id ('org_a'),
        'organization_list',
        2,
        NULL,
        'eeeeeeee-eeee-eeee-eeee-000000000453'
      ) || $$; UPDATE public.nominations SET parent_nomination_id = 'eeeeeeee-eeee-eeee-eeee-000000000453' WHERE id = 'eeeeeeee-eeee-eeee-eeee-000000000452'$$
    ),
    'organization_list: own row, then the parent row, then the repoint, then the forced rule lives'
  );

SELECT
  ok (
    pg_temp.parent_rule_is_deferred (),
    'after the three-statement order, a party-less insert raises nothing at its own statement'
  );

SELECT
  lives_ok (
    pg_temp.forced (
      pg_temp.nominate (
        'candidate_id',
        test_id ('candidate_a2'),
        'organization_list',
        3,
        NULL,
        'eeeeeeee-eeee-eeee-eeee-000000000454',
        '{"requestedParentOrganization": "A party not in the system"}'::jsonb
      )
    ),
    'organization_list: a lone row whose custom data holds requestedParentOrganization lives when the rule is forced'
  );

SELECT
  ok (
    pg_temp.parent_rule_is_deferred (),
    'after the row with a requested parent organization, a party-less insert raises nothing at its own statement'
  );

SELECT
  lives_ok (
    pg_temp.forced (
      pg_temp.nominate (
        'candidate_id',
        test_id ('candidate_a2'),
        'organization_list_and_independents',
        3,
        NULL,
        'eeeeeeee-eeee-eeee-eeee-000000000459'
      )
    ),
    'organization_list_and_independents: a lone candidate row with no parent lives when the rule is forced'
  );

SELECT
  ok (
    pg_temp.parent_rule_is_deferred (),
    'after the party-less row of the default type, a party-less insert raises nothing at its own statement'
  );

-- A candidate's row under its party's, stored: clearing the parent is an UPDATE the rule judges as it judges an INSERT.
INSERT INTO
  nominations (
    id,
    project_id,
    organization_id,
    election_id,
    constituency_id,
    election_round
  )
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000455'::uuid,
    test_id ('project_a'),
    test_id ('org_a'),
    'eeeeeeee-eeee-eeee-eeee-000000000401'::uuid,
    test_id ('constituency_a'),
    5
  );

INSERT INTO
  nominations (
    id,
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round,
    parent_nomination_id
  )
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-000000000456'::uuid,
    test_id ('project_a'),
    test_id ('candidate_a2'),
    'eeeeeeee-eeee-eeee-eeee-000000000401'::uuid,
    test_id ('constituency_a'),
    5,
    'eeeeeeee-eeee-eeee-eeee-000000000455'::uuid
  );

SELECT
  throws_ok (
    $$UPDATE public.nominations SET parent_nomination_id = NULL WHERE id = 'eeeeeeee-eeee-eeee-eeee-000000000456'; SET CONSTRAINTS ALL IMMEDIATE$$,
    '23514',
    'Nomination parent required: candidate nomination eeeeeeee-eeee-eeee-eeee-000000000456 in election eeeeeeee-eeee-eeee-eeee-000000000401 has neither a parent nomination nor a requested parent organization',
    'organization_list: an UPDATE that clears a candidate row''s parent is refused when the rule is forced, 23514'
  );

SELECT
  ok (
    pg_temp.parent_rule_is_deferred (),
    'after the refused UPDATE, a party-less insert raises nothing at its own statement'
  );

SELECT
  lives_ok (
    pg_temp.forced (
      pg_temp.nominate (
        'candidate_id',
        test_id ('candidate_a2'),
        'organization_list',
        6,
        NULL,
        'eeeeeeee-eeee-eeee-eeee-000000000457'
      ) || $$; DELETE FROM public.nominations WHERE id = 'eeeeeeee-eeee-eeee-eeee-000000000457'$$
    ),
    'organization_list: a lone row inserted and deleted before the rule is forced raises nothing'
  );

SELECT
  ok (
    pg_temp.parent_rule_is_deferred (),
    'after the row that was deleted before the rule ran, a party-less insert raises nothing at its own statement'
  );

-- The constraint is deferred here: the lone insert, alone, raises nothing at its own statement. Its control is the same insert with every constraint immediate, which raises at the insert.
SELECT
  lives_ok (
    pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a2'),
      'organization_list',
      7,
      NULL,
      'eeeeeeee-eeee-eeee-eeee-000000000458'
    ),
    'organization_list: after every forced assertion, a lone party-less insert raises nothing at its own statement'
  );

DELETE FROM nominations
WHERE
  id = 'eeeeeeee-eeee-eeee-eeee-000000000458'::uuid;

SELECT
  throws_ok (
    'SET CONSTRAINTS ALL IMMEDIATE; ' || pg_temp.nominate (
      'candidate_id',
      test_id ('candidate_a2'),
      'organization_list',
      8,
      NULL,
      'eeeeeeee-eeee-eeee-eeee-000000000460'
    ),
    '23514',
    'Nomination parent required: candidate nomination eeeeeeee-eeee-eeee-eeee-000000000460 in election eeeeeeee-eeee-eeee-eeee-000000000401 has neither a parent nomination nor a requested parent organization',
    'organization_list: with every constraint immediate, the same lone insert raises at its own statement'
  );

SELECT
  is (
    pg_temp.parent_rule_probe_while_immediate (),
    false,
    'the probe answers false while the constraint is immediate'
  );

SELECT
  ok (
    pg_temp.parent_rule_is_deferred (),
    'after the two controls, a party-less insert raises nothing at its own statement'
  );

-- ---------------------------------------------------------------------
-- 12e: an election's type is changed
--
-- Nothing re-checks the nominations an election holds when its type changes. The rule is asked when a nomination is written, so a later write of a row the new type refuses is refused.
-- ---------------------------------------------------------------------
SELECT
  lives_ok (
    $$UPDATE public.elections SET election_type = 'organization_only' WHERE id = 'eeeeeeee-eeee-eeee-eeee-000000000402'$$,
    'an election that holds candidate nominations can be changed to organization_only'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations n
      WHERE
        n.id = 'eeeeeeee-eeee-eeee-eeee-000000000421'::uuid
        AND n.election_id = 'eeeeeeee-eeee-eeee-eeee-000000000402'::uuid
    ),
    1,
    'the candidate nomination the election held is still stored after the change'
  );

SELECT
  throws_ok (
    $$UPDATE public.nominations SET custom_data = '{"note": "edited"}'::jsonb WHERE id = 'eeeeeeee-eeee-eeee-eeee-000000000421'$$,
    '23514',
    'Nomination shape refused: a candidate cannot be nominated in an election of type organization_only (election eeeeeeee-eeee-eeee-eeee-000000000402)',
    'a later write of a stored row that the election''s new type refuses is refused, 23514'
  );

UPDATE elections
SET
  election_type = 'candidate_only'
WHERE
  id = 'eeeeeeee-eeee-eeee-eeee-000000000402'::uuid;

-- =====================================================================
-- Cleanup
-- =====================================================================
SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
