-- 08-triggers.test.sql: Data integrity trigger tests
--
-- Verifies trigger-based data integrity:
--   - validate_answer_value: rejects malformed answer data by type
--   - validate_answers_jsonb: smart trigger only validates changed keys
--   - validate_nomination: rejects invalid hierarchy and mismatched election/constituency
--   - enforce_external_id_immutability: blocks external_id changes once set
--
-- Tests run as postgres role since triggers fire regardless of role, and
-- we need to bypass RLS for test data manipulation.
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)
--             000-functions.sql (validate_answer_value, validate_nomination)
--             006-answers-jsonb.sql (validate_answers_jsonb trigger)
--             015-external-id.sql (enforce_external_id_immutability trigger)

BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT plan(16);

-- Create test fixture data
SELECT create_test_data();

-- =====================================================================
-- Section 1: validate_answer_value -- valid answers accepted
-- =====================================================================

-- question_a is singleChoiceOrdinal, update candidate_a with a valid numeric answer
SELECT lives_ok(
  format(
    $$UPDATE candidates SET answers = jsonb_build_object('%s', '{"value": 1}'::jsonb) WHERE id = '%s'$$,
    test_id('question_a'),
    test_id('candidate_a')
  ),
  'Valid singleChoiceOrdinal answer (numeric value) accepted'
);

-- =====================================================================
-- Section 2: validate_answer_value -- invalid type rejected
-- =====================================================================

-- Insert additional questions with different types for testing
INSERT INTO questions (id, project_id, type, category_id, name, published)
VALUES
  ('eeeeeeee-eeee-eeee-eeee-000000000101'::uuid, test_id('project_a'), 'text',    test_id('question_category_a'), '{"en":"Text Q"}'::jsonb, true),
  ('eeeeeeee-eeee-eeee-eeee-000000000102'::uuid, test_id('project_a'), 'number',  test_id('question_category_a'), '{"en":"Number Q"}'::jsonb, true),
  ('eeeeeeee-eeee-eeee-eeee-000000000103'::uuid, test_id('project_a'), 'boolean', test_id('question_category_a'), '{"en":"Boolean Q"}'::jsonb, true);

-- Text question with number value -> raises 'must be a string'
SELECT throws_ok(
  format(
    $$UPDATE candidates SET answers = jsonb_build_object('eeeeeeee-eeee-eeee-eeee-000000000101', '{"value": 42}'::jsonb) WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  NULL,
  'Answer for text question must be a string or localized string object',
  'Text question rejects numeric answer'
);

-- Number question with string value -> raises 'must be a number'
SELECT throws_ok(
  format(
    $$UPDATE candidates SET answers = jsonb_build_object('eeeeeeee-eeee-eeee-eeee-000000000102', '{"value": "not-a-number"}'::jsonb) WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  NULL,
  'Answer for number question must be a number',
  'Number question rejects string answer'
);

-- Boolean question with string value -> raises 'must be a boolean'
SELECT throws_ok(
  format(
    $$UPDATE candidates SET answers = jsonb_build_object('eeeeeeee-eeee-eeee-eeee-000000000103', '{"value": "yes"}'::jsonb) WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  NULL,
  'Answer for boolean question must be a boolean',
  'Boolean question rejects string answer'
);

-- singleChoiceOrdinal with array value -> raises 'must be a choice ID'
SELECT throws_ok(
  format(
    $$UPDATE candidates SET answers = jsonb_build_object('%s', '{"value": [1,2,3]}'::jsonb) WHERE id = '%s'$$,
    test_id('question_a'),
    test_id('candidate_a')
  ),
  NULL,
  'Answer for choice question must be a choice ID (string or number)',
  'SingleChoiceOrdinal question rejects array answer'
);

-- =====================================================================
-- Section 3: validate_answer_value -- nonexistent question rejected
-- =====================================================================

SELECT throws_ok(
  format(
    $$UPDATE candidates SET answers = jsonb_build_object('ffffffff-ffff-ffff-ffff-ffffffffffff', '{"value": 1}'::jsonb) WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  NULL,
  'Question ffffffff-ffff-ffff-ffff-ffffffffffff not found in project',
  'Nonexistent question UUID rejected'
);

-- =====================================================================
-- Section 4: validate_answers_jsonb -- smart trigger skips unchanged answers
-- =====================================================================

-- First set a valid answer
UPDATE candidates SET answers = jsonb_build_object(
  test_id('question_a')::text, '{"value": 1}'::jsonb
) WHERE id = test_id('candidate_a');

-- Then update an unrelated column (first_name) -- trigger should short-circuit
SELECT lives_ok(
  format(
    $$UPDATE candidates SET first_name = 'SmartTriggerTest' WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  'Smart trigger short-circuits when answers unchanged (name-only update)'
);

-- =====================================================================
-- Section 5: validate_nomination -- valid hierarchy accepted
-- =====================================================================

-- Alliance nomination (no parent) -> should work
INSERT INTO nominations (id, project_id, alliance_id, election_id, constituency_id, election_round, published)
VALUES (
  'eeeeeeee-eeee-eeee-eeee-000000000201'::uuid,
  test_id('project_a'),
  test_id('alliance_a'),
  test_id('election_a'),
  test_id('constituency_a'),
  1,
  false
);

-- Organization nomination under alliance -> should work
SELECT lives_ok(
  format(
    $$INSERT INTO nominations (id, project_id, organization_id, election_id, constituency_id, election_round, parent_nomination_id, published)
      VALUES ('eeeeeeee-eeee-eeee-eeee-000000000202'::uuid, '%s', '%s', '%s', '%s', 1, 'eeeeeeee-eeee-eeee-eeee-000000000201'::uuid, false)$$,
    test_id('project_a'),
    test_id('org_a'),
    test_id('election_a'),
    test_id('constituency_a')
  ),
  'Organization nomination under alliance accepted'
);

-- =====================================================================
-- Section 6: validate_nomination -- invalid hierarchy rejected
-- =====================================================================

-- Alliance with parent -> throws 'cannot have a parent'
SELECT throws_ok(
  format(
    $$INSERT INTO nominations (id, project_id, alliance_id, election_id, constituency_id, election_round, parent_nomination_id, published)
      VALUES (gen_random_uuid(), '%s', '%s', '%s', '%s', 1, '%s', false)$$,
    test_id('project_a'),
    test_id('alliance_a'),
    test_id('election_a'),
    test_id('constituency_a'),
    test_id('nomination_org_a')
  ),
  NULL,
  'Alliance nominations cannot have a parent',
  'Alliance nomination with parent rejected'
);

-- Faction without parent -> throws 'must have a parent'
SELECT throws_ok(
  format(
    $$INSERT INTO nominations (id, project_id, faction_id, election_id, constituency_id, election_round, published)
      VALUES (gen_random_uuid(), '%s', '%s', '%s', '%s', 1, false)$$,
    test_id('project_a'),
    test_id('faction_a'),
    test_id('election_a'),
    test_id('constituency_a')
  ),
  NULL,
  'Faction nominations must have a parent organization nomination',
  'Faction nomination without parent rejected'
);

-- Candidate under alliance -> throws 'must be an organization or faction'
SELECT throws_ok(
  format(
    $$INSERT INTO nominations (id, project_id, candidate_id, election_id, constituency_id, election_round, parent_nomination_id, published)
      VALUES (gen_random_uuid(), '%s', '%s', '%s', '%s', 1, 'eeeeeeee-eeee-eeee-eeee-000000000201'::uuid, false)$$,
    test_id('project_a'),
    test_id('candidate_a'),
    test_id('election_a'),
    test_id('constituency_a')
  ),
  NULL,
  NULL,
  'Candidate nomination under alliance rejected (parent must be organization or faction)'
);

-- Mismatched election_id between parent and child
SELECT throws_ok(
  format(
    $$INSERT INTO nominations (id, project_id, candidate_id, election_id, constituency_id, election_round, parent_nomination_id, published)
      VALUES (gen_random_uuid(), '%s', '%s', '%s', '%s', 1, '%s', false)$$,
    test_id('project_a'),
    test_id('candidate_a2'),
    test_id('election_b'),
    test_id('constituency_a'),
    test_id('nomination_org_a')
  ),
  NULL,
  NULL,
  'Nomination with mismatched election_id rejected'
);

-- =====================================================================
-- Section 7: enforce_external_id_immutability -- NULL to value allowed
-- =====================================================================

-- election_a was created without external_id; setting it should succeed
SELECT lives_ok(
  format(
    $$UPDATE elections SET external_id = 'ext-election-a' WHERE id = '%s'$$,
    test_id('election_a')
  ),
  'Setting external_id from NULL to value is allowed'
);

-- =====================================================================
-- Section 8: enforce_external_id_immutability -- value to different value blocked
-- =====================================================================

SELECT throws_ok(
  format(
    $$UPDATE elections SET external_id = 'ext-election-a-changed' WHERE id = '%s'$$,
    test_id('election_a')
  ),
  NULL,
  NULL,
  'Changing external_id to different value is blocked'
);

-- =====================================================================
-- Section 9: enforce_external_id_immutability -- value to NULL blocked
-- =====================================================================

SELECT throws_ok(
  format(
    $$UPDATE elections SET external_id = NULL WHERE id = '%s'$$,
    test_id('election_a')
  ),
  NULL,
  NULL,
  'Setting external_id to NULL once set is blocked'
);

-- =====================================================================
-- Section 10: enforce_external_id_immutability -- same value allowed (no-op)
-- =====================================================================

SELECT lives_ok(
  format(
    $$UPDATE elections SET external_id = 'ext-election-a' WHERE id = '%s'$$,
    test_id('election_a')
  ),
  'Updating external_id to same value is allowed (no-op)'
);

-- =====================================================================
-- Cleanup
-- =====================================================================

SELECT reset_role();

SELECT * FROM finish();
ROLLBACK;
