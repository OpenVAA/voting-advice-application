-- 11-question-rpcs.test.sql: get_questions and get_nominations RPC contract tests.
--
-- Verifies the two read RPCs the voter app calls, both of which are typed from generated types rather than from the live database, so a build can be green while the SQL these assertions cover does not exist at all.
--   - get_questions is SECURITY INVOKER and executable by anon and by authenticated.
--   - Exactly one overload of each RPC exists, because a second one makes PostgREST answer PGRST203 at runtime.
--   - get_questions returns a jsonb object carrying both a categories key and a questions key, each always a JSON array.
--   - Each of the three filter axes behaves identically on question_categories and on questions: a NULL parameter returns everything, a NULL or empty-array column is included, and a non-matching value is excluded.
--   - get_nominations filters on the scalar election_round, and its result carries the joined entity columns. This file is the first pgTAP coverage that RPC has ever had.
--
-- Assertions insert their own synthetic rows rather than reusing create_test_data()'s, because the fixture rows leave all three filter columns NULL and so exercise only one of the three branches per axis. The synthetic rows use an ee...-prefixed id range that no fixture or seed uses.
--
-- Membership is asserted against specific row ids rather than against absolute result counts. A count assertion would pass or fail depending on whether the database happens to carry dev-seed data at the time of the run, which is exactly the kind of environment-dependent test the E2E hard rule forbids.
--
-- Depends on: 00-helpers.test.sql (create_test_data, test_id) and 00004_question_rpcs_and_nomination_election_round.sql (get_questions, the 4-argument get_nominations).

BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT plan(55);

-- Create test fixture data
SELECT create_test_data();

-- =====================================================================
-- Helpers
-- =====================================================================

-- These live in pg_temp, never in public. 00-helpers.test.sql defines its helpers outside its BEGIN/ROLLBACK block, so they persist in public after a suite run and get written into the generated types by any yarn db:types that follows. A pg_temp function cannot be captured that way even if this file's ROLLBACK were ever removed.
CREATE FUNCTION pg_temp.result_has(p_result jsonb, p_key text, p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_result -> p_key) AS e
    WHERE e ->> 'id' = p_id::text
  );
$$;

-- =====================================================================
-- Synthetic filter fixtures
-- =====================================================================

-- Five categories covering every branch of the filter predicate. The NULL-column and empty-array rows are the "applies to all elections" semantic transcribed from the client-side predicate the RPC replaces, and inverting it is the most likely silent regression.
INSERT INTO question_categories (id, project_id, name, election_ids, constituency_ids, election_rounds) VALUES
  ('eeeeeeee-eeee-eeee-eeee-000000000001', test_id('project_a'), '{"en":"Cat all (NULL columns)"}'::jsonb,   NULL, NULL, NULL),
  ('eeeeeeee-eeee-eeee-eeee-000000000002', test_id('project_a'), '{"en":"Cat all (empty arrays)"}'::jsonb,   '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
  ('eeeeeeee-eeee-eeee-eeee-000000000003', test_id('project_a'), '{"en":"Cat election A only"}'::jsonb,      to_jsonb(ARRAY[test_id('election_a')::text]), NULL, NULL),
  ('eeeeeeee-eeee-eeee-eeee-000000000004', test_id('project_a'), '{"en":"Cat constituency A only"}'::jsonb,  NULL, to_jsonb(ARRAY[test_id('constituency_a')::text]), NULL),
  ('eeeeeeee-eeee-eeee-eeee-000000000005', test_id('project_a'), '{"en":"Cat round 2 only"}'::jsonb,         NULL, NULL, '[2]'::jsonb);

-- Five questions mirroring the categories, all parented to the never-filtered category so that any exclusion observed below is the question's own filter columns acting and not the category's.
INSERT INTO questions (id, project_id, type, category_id, name, election_ids, constituency_ids, election_rounds) VALUES
  ('eeeeeeee-eeee-eeee-eeee-000000000011', test_id('project_a'), 'text', 'eeeeeeee-eeee-eeee-eeee-000000000001', '{"en":"Q all (NULL columns)"}'::jsonb,  NULL, NULL, NULL),
  ('eeeeeeee-eeee-eeee-eeee-000000000012', test_id('project_a'), 'text', 'eeeeeeee-eeee-eeee-eeee-000000000001', '{"en":"Q all (empty arrays)"}'::jsonb,  '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
  ('eeeeeeee-eeee-eeee-eeee-000000000013', test_id('project_a'), 'text', 'eeeeeeee-eeee-eeee-eeee-000000000001', '{"en":"Q election A only"}'::jsonb,     to_jsonb(ARRAY[test_id('election_a')::text]), NULL, NULL),
  ('eeeeeeee-eeee-eeee-eeee-000000000014', test_id('project_a'), 'text', 'eeeeeeee-eeee-eeee-eeee-000000000001', '{"en":"Q constituency A only"}'::jsonb, NULL, to_jsonb(ARRAY[test_id('constituency_a')::text]), NULL),
  ('eeeeeeee-eeee-eeee-eeee-000000000015', test_id('project_a'), 'text', 'eeeeeeee-eeee-eeee-eeee-000000000001', '{"en":"Q round 2 only"}'::jsonb,        NULL, NULL, '[2]'::jsonb);

-- A standalone organization nomination in round 2. Every create_test_data() nomination is round 1, so without this row the round-exclusion case below would be vacuous.
INSERT INTO nominations (id, project_id, organization_id, election_id, constituency_id, election_round, published) VALUES
  ('eeeeeeee-eeee-eeee-eeee-000000000021', test_id('project_a'), test_id('org_a'), test_id('election_a'), test_id('constituency_a'), 2, true);

-- =====================================================================
-- Section 1: get_questions security shape
-- =====================================================================

SELECT ok(
  NOT (SELECT p.prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'get_questions'),
  'get_questions is SECURITY INVOKER (not DEFINER)'
);

SELECT ok(
  has_function_privilege('anon', 'public.get_questions(uuid, uuid, integer)', 'EXECUTE'),
  'anon can EXECUTE get_questions'
);

SELECT ok(
  has_function_privilege('authenticated', 'public.get_questions(uuid, uuid, integer)', 'EXECUTE'),
  'authenticated can EXECUTE get_questions'
);

-- =====================================================================
-- Section 2: exactly one overload of each RPC (the PGRST203 guard)
-- =====================================================================

SELECT is(
  (SELECT count(*)::integer FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'get_questions'),
  1,
  'get_questions has exactly one overload'
);

SELECT is(
  (SELECT count(*)::integer FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'get_nominations'),
  1,
  'get_nominations has exactly one overload (a second would make PostgREST return PGRST203)'
);

SELECT is(
  (SELECT p.oid::regprocedure::text FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'get_questions'),
  'get_questions(uuid,uuid,integer)',
  'get_questions has the three-argument signature'
);

SELECT is(
  (SELECT p.oid::regprocedure::text FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'get_nominations'),
  'get_nominations(uuid,uuid,boolean,integer)',
  'get_nominations has the four-argument signature, so the three-argument overload was dropped'
);

-- =====================================================================
-- Section 3: get_questions result shape
-- =====================================================================

SELECT ok(
  jsonb_exists(get_questions(), 'categories'),
  'get_questions result carries a categories key'
);

SELECT ok(
  jsonb_exists(get_questions(), 'questions'),
  'get_questions result carries a questions key'
);

SELECT is(
  jsonb_typeof(get_questions() -> 'categories'),
  'array',
  'get_questions categories is a JSON array'
);

SELECT is(
  jsonb_typeof(get_questions() -> 'questions'),
  'array',
  'get_questions questions is a JSON array'
);

-- =====================================================================
-- Section 4: election axis, categories
-- =====================================================================

SELECT ok(
  pg_temp.result_has(get_questions(), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000003'),
  'NULL p_election_id returns the election-A-only category (NULL parameter means all)'
);

SELECT ok(
  pg_temp.result_has(get_questions(test_id('election_a')), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000001'),
  'p_election_id includes the category whose election_ids is NULL'
);

SELECT ok(
  pg_temp.result_has(get_questions(test_id('election_a')), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000002'),
  'p_election_id includes the category whose election_ids is an empty array'
);

SELECT ok(
  pg_temp.result_has(get_questions(test_id('election_a')), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000003'),
  'p_election_id includes the category naming that election'
);

SELECT ok(
  NOT pg_temp.result_has(get_questions(test_id('election_b')), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000003'),
  'p_election_id excludes the category naming a different election'
);

-- =====================================================================
-- Section 5: election axis, questions
-- =====================================================================

SELECT ok(
  pg_temp.result_has(get_questions(), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000013'),
  'NULL p_election_id returns the election-A-only question (NULL parameter means all)'
);

SELECT ok(
  pg_temp.result_has(get_questions(test_id('election_a')), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000011'),
  'p_election_id includes the question whose election_ids is NULL'
);

SELECT ok(
  pg_temp.result_has(get_questions(test_id('election_a')), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000012'),
  'p_election_id includes the question whose election_ids is an empty array'
);

SELECT ok(
  pg_temp.result_has(get_questions(test_id('election_a')), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000013'),
  'p_election_id includes the question naming that election'
);

SELECT ok(
  NOT pg_temp.result_has(get_questions(test_id('election_b')), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000013'),
  'p_election_id excludes the question naming a different election'
);

-- =====================================================================
-- Section 6: constituency axis, categories
-- =====================================================================

SELECT ok(
  pg_temp.result_has(get_questions(), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000004'),
  'NULL p_constituency_id returns the constituency-A-only category (NULL parameter means all)'
);

SELECT ok(
  pg_temp.result_has(get_questions(NULL, test_id('constituency_a')), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000001'),
  'p_constituency_id includes the category whose constituency_ids is NULL'
);

SELECT ok(
  pg_temp.result_has(get_questions(NULL, test_id('constituency_a')), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000002'),
  'p_constituency_id includes the category whose constituency_ids is an empty array'
);

SELECT ok(
  pg_temp.result_has(get_questions(NULL, test_id('constituency_a')), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000004'),
  'p_constituency_id includes the category naming that constituency'
);

SELECT ok(
  NOT pg_temp.result_has(get_questions(NULL, test_id('constituency_b')), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000004'),
  'p_constituency_id excludes the category naming a different constituency'
);

-- =====================================================================
-- Section 7: constituency axis, questions
-- =====================================================================

SELECT ok(
  pg_temp.result_has(get_questions(), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000014'),
  'NULL p_constituency_id returns the constituency-A-only question (NULL parameter means all)'
);

SELECT ok(
  pg_temp.result_has(get_questions(NULL, test_id('constituency_a')), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000011'),
  'p_constituency_id includes the question whose constituency_ids is NULL'
);

SELECT ok(
  pg_temp.result_has(get_questions(NULL, test_id('constituency_a')), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000012'),
  'p_constituency_id includes the question whose constituency_ids is an empty array'
);

SELECT ok(
  pg_temp.result_has(get_questions(NULL, test_id('constituency_a')), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000014'),
  'p_constituency_id includes the question naming that constituency'
);

SELECT ok(
  NOT pg_temp.result_has(get_questions(NULL, test_id('constituency_b')), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000014'),
  'p_constituency_id excludes the question naming a different constituency'
);

-- =====================================================================
-- Section 8: election-round axis, categories
-- =====================================================================

SELECT ok(
  pg_temp.result_has(get_questions(), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000005'),
  'NULL p_election_round returns the round-2-only category (NULL parameter means all)'
);

SELECT ok(
  pg_temp.result_has(get_questions(NULL, NULL, 2), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000001'),
  'p_election_round includes the category whose election_rounds is NULL'
);

SELECT ok(
  pg_temp.result_has(get_questions(NULL, NULL, 2), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000002'),
  'p_election_round includes the category whose election_rounds is an empty array'
);

SELECT ok(
  pg_temp.result_has(get_questions(NULL, NULL, 2), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000005'),
  'p_election_round includes the category naming that round'
);

SELECT ok(
  NOT pg_temp.result_has(get_questions(NULL, NULL, 1), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000005'),
  'p_election_round excludes the category naming a different round'
);

-- =====================================================================
-- Section 9: election-round axis, questions
-- =====================================================================

SELECT ok(
  pg_temp.result_has(get_questions(), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000015'),
  'NULL p_election_round returns the round-2-only question (NULL parameter means all)'
);

SELECT ok(
  pg_temp.result_has(get_questions(NULL, NULL, 2), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000011'),
  'p_election_round includes the question whose election_rounds is NULL'
);

SELECT ok(
  pg_temp.result_has(get_questions(NULL, NULL, 2), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000012'),
  'p_election_round includes the question whose election_rounds is an empty array'
);

SELECT ok(
  pg_temp.result_has(get_questions(NULL, NULL, 2), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000015'),
  'p_election_round includes the question naming that round'
);

SELECT ok(
  NOT pg_temp.result_has(get_questions(NULL, NULL, 1), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000015'),
  'p_election_round excludes the question naming a different round'
);

-- =====================================================================
-- Section 10: questions are filtered on their own columns
-- =====================================================================

-- Every synthetic question is parented to the NULL-column category, which survives any filter. The client-side assembly this RPC replaces filtered categories only and then read every question belonging to the surviving categories, so under that behaviour the election-A-only question would come back here.
SELECT ok(
  pg_temp.result_has(get_questions(test_id('election_b')), 'categories', 'eeeeeeee-eeee-eeee-eeee-000000000001')
  AND NOT pg_temp.result_has(get_questions(test_id('election_b')), 'questions', 'eeeeeeee-eeee-eeee-eeee-000000000013'),
  'A question is excluded by its own election_ids even when its category survives the filter'
);

-- =====================================================================
-- Section 11: get_nominations
-- =====================================================================

SELECT ok(
  (SELECT count(*) FROM get_nominations())::integer >= 1,
  'get_nominations with all defaults returns rows'
);

SELECT ok(
  EXISTS (SELECT 1 FROM get_nominations() n WHERE n.id = test_id('nomination_cand_a')),
  'get_nominations with all defaults returns the candidate_a nomination'
);

SELECT is(
  (SELECT n.entity_id FROM get_nominations() n WHERE n.id = test_id('nomination_cand_a')),
  test_id('candidate_a'),
  'get_nominations resolves entity_id to the nominated candidate'
);

SELECT is(
  (SELECT n.entity_first_name || ' ' || n.entity_last_name FROM get_nominations() n WHERE n.id = test_id('nomination_cand_a')),
  'Alice Alpha',
  'get_nominations joins the candidate name columns onto the nomination row'
);

SELECT ok(
  EXISTS (SELECT 1 FROM get_nominations(p_election_round => 1) n WHERE n.id = test_id('nomination_cand_a')),
  'p_election_round = 1 includes a round 1 nomination'
);

SELECT ok(
  NOT EXISTS (SELECT 1 FROM get_nominations(p_election_round => 1) n WHERE n.id = 'eeeeeeee-eeee-eeee-eeee-000000000021'),
  'p_election_round = 1 excludes a round 2 nomination'
);

SELECT ok(
  EXISTS (SELECT 1 FROM get_nominations(p_election_round => 2) n WHERE n.id = 'eeeeeeee-eeee-eeee-eeee-000000000021'),
  'p_election_round = 2 includes the round 2 nomination'
);

SELECT ok(
  EXISTS (SELECT 1 FROM get_nominations(p_election_round => NULL) n WHERE n.id = 'eeeeeeee-eeee-eeee-eeee-000000000021')
  AND EXISTS (SELECT 1 FROM get_nominations(p_election_round => NULL) n WHERE n.id = test_id('nomination_cand_a')),
  'NULL p_election_round returns nominations from every round'
);

SELECT lives_ok(
  $$SELECT count(*) FROM get_nominations(
      p_election_id => NULL,
      p_constituency_id => NULL,
      p_include_unconfirmed => false,
      p_election_round => NULL
    )$$,
  'get_nominations resolves when all four parameters are passed by name'
);

-- =====================================================================
-- Section 12: a non-array filter column raises rather than falling back
-- =====================================================================

-- These two assertions PIN CURRENT BEHAVIOUR, not desired behaviour. The three filter columns are JSONB with no CHECK constraint, and jsonb_array_length raises on a value that is not an array, so a hand-authored or imported row storing an object there makes get_questions error instead of treating the row as "applies to all". This matches the client-side predicate the RPC transcribes, which mishandles the same value, so 157-03 implemented it as specified rather than hardening it unilaterally. Pinning it here means the day someone adds a CHECK constraint or a jsonb_typeof guard, this file fails loudly and the change is made deliberately rather than discovered in production.

INSERT INTO question_categories (id, project_id, name, election_rounds) VALUES
  ('eeeeeeee-eeee-eeee-eeee-000000000031', test_id('project_a'), '{"en":"Cat with a non-array election_rounds"}'::jsonb, '{"round": 1}'::jsonb);

SELECT throws_ok(
  $$SELECT get_questions(NULL, NULL, 1)$$,
  '22023',
  'cannot get array length of a non-array',
  'A non-array election_rounds raises when a filter parameter is supplied'
);

SELECT lives_ok(
  $$SELECT get_questions()$$,
  'A non-array election_rounds is harmless when every filter parameter is NULL, because the parameter IS NULL branch short-circuits first'
);

-- =====================================================================
-- Section 13: empty tables return empty arrays, never null
-- =====================================================================

-- The adapter parses this payload with zod, so the difference between [] and null at this boundary is the difference between an empty question list and a parse failure. This runs last because it empties both tables.
DELETE FROM questions;
DELETE FROM question_categories;

SELECT is(
  get_questions() -> 'categories',
  '[]'::jsonb,
  'get_questions returns an empty categories array rather than null when no category matches'
);

SELECT is(
  get_questions() -> 'questions',
  '[]'::jsonb,
  'get_questions returns an empty questions array rather than null when no question matches'
);

-- =====================================================================
-- Cleanup
-- =====================================================================

SELECT * FROM finish();
ROLLBACK;
