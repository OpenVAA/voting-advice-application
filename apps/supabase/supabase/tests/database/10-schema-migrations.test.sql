-- 10-schema-migrations.test.sql: schema migration tests
--
-- Verifies the schema-migration and admin-tooling additions:
--   customization JSONB column on app_settings feedback table with CHECK constraint, RLS, and rate limiting terms_of_use_accepted timestamptz column on candidates upsert_answers RPC (merge/overwrite modes, null stripping, RLS) merge_question_custom_data RPC for question custom_data JSONB merge admin_jobs table with admin-only RLS
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)
--
-- Assertions are NOT hand-numbered here. They were, and the numbering drifted twice - an insertion renumbered its neighbours above and below while leaving a span comment in the middle untouched. pgTAP numbers its own output, the other ten files in this suite carry no numbering, and a hand-maintained parallel index earns nothing it does not eventually get wrong. Describe what an assertion proves; do not number it.

BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT plan(90);

-- Create test fixture data
SELECT create_test_data();

-- =====================================================================
-- customization column on app_settings
-- =====================================================================

-- Column exists
SELECT has_column(
  'public', 'app_settings', 'customization',
  'app_settings has customization column'
);

-- Column type is jsonb
SELECT col_type_is(
  'public', 'app_settings', 'customization', 'jsonb',
  'customization column is jsonb type'
);

-- Anon can SELECT customization from app_settings
SELECT set_test_user('anon');
SELECT ok(
  (SELECT customization IS NOT NULL FROM app_settings WHERE id = test_id('app_settings_a')),
  'anon can SELECT customization from app_settings (not null after insert)'
);

-- Admin can UPDATE customization on own project app_settings
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT lives_ok(
  format(
    $$UPDATE app_settings SET customization = '{"logo": {"path": "test.png"}}'::jsonb WHERE id = '%s'$$,
    test_id('app_settings_a')
  ),
  'admin_a can UPDATE customization on own project app_settings'
);

-- Verify the update took effect
SELECT reset_role();
SELECT is(
  (SELECT customization ->> 'logo' FROM app_settings WHERE id = test_id('app_settings_a')),
  '{"path": "test.png"}',
  'customization was actually updated by admin_a'
);

-- Admin from project_b cannot UPDATE app_settings of project_a
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_b'),
  test_user_roles('admin_b')
);

SELECT lives_ok(
  format(
    $$UPDATE app_settings SET customization = '{"hacked": true}'::jsonb WHERE id = '%s'$$,
    test_id('app_settings_a')
  ),
  'admin_b UPDATE on project_a app_settings does not raise error (but affects 0 rows)'
);

SELECT reset_role();
SELECT is(
  (SELECT customization ->> 'logo' FROM app_settings WHERE id = test_id('app_settings_a')),
  '{"path": "test.png"}',
  'app_settings_a customization unchanged after admin_b update attempt'
);

-- =====================================================================
-- feedback table
-- =====================================================================

-- Table exists
SELECT has_table('public', 'feedback', 'feedback table exists');

-- Column existence checks
SELECT has_column('public', 'feedback', 'id',          'feedback has id column');
SELECT has_column('public', 'feedback', 'project_id',  'feedback has project_id column');
SELECT has_column('public', 'feedback', 'rating',      'feedback has rating column');
SELECT has_column('public', 'feedback', 'description', 'feedback has description column');
SELECT has_column('public', 'feedback', 'date',        'feedback has date column');
SELECT has_column('public', 'feedback', 'url',         'feedback has url column');
SELECT has_column('public', 'feedback', 'user_agent',  'feedback has user_agent column');
SELECT has_column('public', 'feedback', 'created_at',  'feedback has created_at column');

-- Anon can INSERT feedback with rating only (description NULL)
SELECT set_test_user('anon');
SELECT lives_ok(
  format(
    $$INSERT INTO feedback (project_id, rating, date, created_at) VALUES ('%s', 5, now(), now())$$,
    test_id('project_a')
  ),
  'anon can INSERT feedback with rating only (description NULL)'
);

-- Anon can INSERT feedback with description only (rating NULL)
SELECT lives_ok(
  format(
    $$INSERT INTO feedback (project_id, description, date, created_at) VALUES ('%s', 'Some feedback', now(), now())$$,
    test_id('project_a')
  ),
  'anon can INSERT feedback with description only (rating NULL)'
);

-- Anon INSERT with both rating AND description NULL throws CHECK violation
SELECT throws_ok(
  format(
    $$INSERT INTO feedback (project_id, date, created_at) VALUES ('%s', now(), now())$$,
    test_id('project_a')
  ),
  '23514',
  NULL,
  'anon INSERT feedback with both rating and description NULL throws CHECK violation'
);

-- Anon cannot SELECT feedback (0 rows returned, RLS silently hides)
SELECT is(
  (SELECT count(*) FROM feedback)::integer,
  0,
  'anon cannot SELECT feedback (0 rows returned, RLS silently hides)'
);

-- Anon cannot UPDATE feedback (no UPDATE policy -- silently affects 0 rows)
SELECT lives_ok(
  format(
    $$UPDATE feedback SET rating = 1 WHERE id = '%s'$$,
    test_id('feedback_a')
  ),
  'anon UPDATE on feedback does not raise error (but affects 0 rows due to RLS)'
);

-- Admin_a can SELECT feedback for project_a
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT ok(
  (SELECT count(*) FROM feedback WHERE project_id = test_id('project_a'))::integer >= 1,
  'admin_a can SELECT feedback for project_a'
);

-- Admin_b cannot SELECT feedback for project_a (cross-project isolation)
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_b'),
  test_user_roles('admin_b')
);

SELECT is(
  (SELECT count(*) FROM feedback WHERE project_id = test_id('project_a'))::integer,
  0,
  'admin_b cannot SELECT feedback for project_a (cross-project isolation)'
);

-- Admin_a can DELETE feedback for project_a
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT lives_ok(
  format(
    $$DELETE FROM feedback WHERE id = '%s'$$,
    test_id('feedback_a')
  ),
  'admin_a can DELETE feedback for project_a'
);

-- Rate limiting: 6th insert from same IP raises exception Reset to postgres to clear rate limit counter, then switch to anon
SELECT reset_role();

-- Clean the rate limit counter for our test IP
DELETE FROM private.feedback_rate_limits WHERE ip_address = '10.0.0.99';

-- Set request headers with a unique test IP
SELECT set_config('request.headers', '{"x-forwarded-for": "10.0.0.99"}', true);
SELECT set_test_user('anon');

-- Insert 5 feedback rows (within rate limit)
INSERT INTO feedback (project_id, rating, date, created_at)
  VALUES (test_id('project_a'), 1, now(), now());
INSERT INTO feedback (project_id, rating, date, created_at)
  VALUES (test_id('project_a'), 2, now(), now());
INSERT INTO feedback (project_id, rating, date, created_at)
  VALUES (test_id('project_a'), 3, now(), now());
INSERT INTO feedback (project_id, rating, date, created_at)
  VALUES (test_id('project_a'), 4, now(), now());
INSERT INTO feedback (project_id, rating, date, created_at)
  VALUES (test_id('project_a'), 5, now(), now());

-- 6th insert should exceed rate limit
SELECT throws_ok(
  format(
    $$INSERT INTO feedback (project_id, rating, date, created_at) VALUES ('%s', 1, now(), now())$$,
    test_id('project_a')
  ),
  'P0001',
  'Rate limit exceeded. Please try again later.',
  'rate limiting: 6th INSERT from same IP raises exception'
);

-- =====================================================================
-- terms_of_use_accepted column on candidates
-- =====================================================================

SELECT reset_role();

-- Column exists
SELECT has_column(
  'public', 'candidates', 'terms_of_use_accepted',
  'candidates has terms_of_use_accepted column'
);

-- Column type is timestamptz
SELECT col_type_is(
  'public', 'candidates', 'terms_of_use_accepted',
  'timestamp with time zone',
  'terms_of_use_accepted is timestamptz type'
);

-- Column is nullable
SELECT col_is_null(
  'public', 'candidates', 'terms_of_use_accepted',
  'terms_of_use_accepted is nullable'
);

-- Candidate_a can UPDATE terms_of_use_accepted on own row
SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT lives_ok(
  format(
    $$UPDATE candidates SET terms_of_use_accepted = now() WHERE id = '%s'$$,
    test_id('candidate_a')
  ),
  'candidate_a can UPDATE terms_of_use_accepted on own row'
);

-- Verify it was set
SELECT reset_role();
SELECT ok(
  (SELECT terms_of_use_accepted IS NOT NULL FROM candidates WHERE id = test_id('candidate_a')),
  'terms_of_use_accepted was actually set for candidate_a'
);

-- Candidate_a cannot UPDATE terms_of_use_accepted on candidate_b's row
SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT lives_ok(
  format(
    $$UPDATE candidates SET terms_of_use_accepted = now() WHERE id = '%s'$$,
    test_id('candidate_b')
  ),
  'candidate_a UPDATE on candidate_b terms_of_use_accepted does not raise error (0 rows)'
);

SELECT reset_role();
SELECT ok(
  (SELECT terms_of_use_accepted IS NULL FROM candidates WHERE id = test_id('candidate_b')),
  'candidate_b terms_of_use_accepted unchanged after candidate_a update attempt'
);

-- =====================================================================
-- upsert_answers RPC
-- =====================================================================

-- Function exists
SELECT has_function(
  'public', 'upsert_answers', ARRAY['uuid', 'jsonb', 'boolean'],
  'upsert_answers(uuid, jsonb, boolean) function exists'
);

-- SECURITY INVOKER (not DEFINER)
SELECT ok(
  NOT (SELECT prosecdef FROM pg_proc WHERE proname = 'upsert_answers'),
  'upsert_answers is SECURITY INVOKER (not DEFINER)'
);

-- Candidate_a calling with overwrite=true and empty '{}' returns '{}'
SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT is(
  (SELECT upsert_answers(test_id('candidate_a'), '{}'::jsonb, true)),
  '{}'::jsonb,
  'upsert_answers with overwrite=true and empty answers returns {}'
);

-- Candidate_a calling with overwrite=false and empty '{}' returns '{}'
SELECT is(
  (SELECT upsert_answers(test_id('candidate_a'), '{}'::jsonb, false)),
  '{}'::jsonb,
  'upsert_answers with overwrite=false and empty answers returns {}'
);

-- Candidate_a cannot call upsert_answers for candidate_b's id
SELECT throws_ok(
  format(
    $$SELECT upsert_answers('%s', '{}'::jsonb, false)$$,
    test_id('candidate_b')
  ),
  NULL,
  NULL,
  'candidate_a cannot call upsert_answers for candidate_b (throws error)'
);

-- Reset to postgres for RPC merge/overwrite tests
SELECT reset_role();

-- Set up a valid answer on candidate_a for merge testing question_a is singleChoiceOrdinal in project_a
UPDATE candidates SET answers = jsonb_build_object(
  test_id('question_a')::text, '{"value": 1}'::jsonb
) WHERE id = test_id('candidate_a');

-- Switch back to candidate_a
SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

-- Merge mode: overwrite=false merges new answers with existing Add a text question for a simpler merge test
SELECT reset_role();
INSERT INTO questions (id, project_id, type, category_id, name, published)
VALUES (
  'eeeeeeee-eeee-eeee-eeee-000000000301'::uuid,
  test_id('project_a'),
  'text',
  test_id('question_category_a'),
  '{"en":"Text Question for Merge Test"}'::jsonb,
  true
);
SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT ok(
  (SELECT upsert_answers(
    test_id('candidate_a'),
    jsonb_build_object('eeeeeeee-eeee-eeee-eeee-000000000301', '{"value": "merge answer"}'::jsonb),
    false
  )) ? test_id('question_a')::text,
  'merge mode (overwrite=false) preserves existing answers'
);

-- Overwrite mode: overwrite=true replaces all answers
SELECT is(
  (SELECT upsert_answers(
    test_id('candidate_a'),
    jsonb_build_object('eeeeeeee-eeee-eeee-eeee-000000000301', '{"value": "only answer"}'::jsonb),
    true
  )) ? test_id('question_a')::text,
  false,
  'overwrite mode (overwrite=true) replaces existing answers (old key gone)'
);

-- Null stripping: null values are removed from merged result
SELECT ok(
  NOT (
    (SELECT upsert_answers(
      test_id('candidate_a'),
      jsonb_build_object('eeeeeeee-eeee-eeee-eeee-000000000301', 'null'::jsonb),
      false
    )) ? 'eeeeeeee-eeee-eeee-eeee-000000000301'
  ),
  'upsert_answers strips null values from merged answers'
);

-- =====================================================================
-- upsert_answers covers every entity carrying an answers column
-- =====================================================================

-- The widening: candidates and organizations are the only two tables carrying an answers column, the two id spaces are distinct, and the organizations attempt runs only when the candidate update matched no row.

SELECT set_test_user(
  'authenticated',
  test_user_id('organization_a'),
  test_user_roles('organization_a')
);

-- The capability that did not exist before: an organization admin writes its own organization's answers through the same RPC a candidate uses.
SELECT upsert_answers(
  test_id('org_a'),
  jsonb_build_object(test_id('question_a')::text, '{"value": 1}'::jsonb),
  false
);

-- The write landed on the organizations row, read back outside the caller's session
SELECT reset_role();
SELECT is(
  (SELECT answers FROM organizations WHERE id = test_id('org_a')),
  jsonb_build_object(test_id('question_a')::text, '{"value": 1}'::jsonb),
  'an organization admin can store its own organization answers through upsert_answers'
);

-- Merge semantics with an empty answers object is a no-op that still returns the stored value
SELECT set_test_user(
  'authenticated',
  test_user_id('organization_a'),
  test_user_roles('organization_a')
);

SELECT is(
  (SELECT upsert_answers(test_id('org_a'), '{}'::jsonb, false)),
  jsonb_build_object(test_id('question_a')::text, '{"value": 1}'::jsonb),
  'upsert_answers with merge semantics and an empty answers object leaves the stored organization answers unchanged and returns them'
);

-- The pre-existing candidate path is unregressed by the widening
SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT upsert_answers(
  test_id('candidate_a'),
  jsonb_build_object('eeeeeeee-eeee-eeee-eeee-000000000301', '{"value": "still a candidate write"}'::jsonb),
  true
);

SELECT reset_role();
SELECT is(
  (SELECT answers FROM candidates WHERE id = test_id('candidate_a')),
  jsonb_build_object('eeeeeeee-eeee-eeee-eeee-000000000301', '{"value": "still a candidate write"}'::jsonb),
  'a candidate call still stores answers on the candidate row after the widening'
);

-- An id in neither table raises the unchanged not-found exception, so the fall-through ends where it always did
SELECT set_test_user(
  'authenticated',
  test_user_id('organization_a'),
  test_user_roles('organization_a')
);

SELECT throws_ok(
  $$SELECT upsert_answers('eeeeeeee-eeee-eeee-eeee-000000000399'::uuid, '{"x": 1}'::jsonb, false)$$,
  'P0001',
  'Entity not found or access denied: eeeeeeee-eeee-eeee-eeee-000000000399',
  'an id matching neither candidates nor organizations raises the existing not-found exception'
);

-- The widened branch is RLS-gated, not merely id-gated. The candidate branch has carried this negative since the RPC existed (candidate_a cannot write candidate_b, above); the organization branch is the newly-reachable authorization surface and had only positive-path coverage. org_b sits in project_b with a NULL auth_user_id, so neither disjunct of organizations' self-edit policy holds for organization_a: the UPDATE matches no row and the function ends at the same not-found RAISE as an id in neither table.
SELECT set_test_user(
  'authenticated',
  test_user_id('organization_a'),
  test_user_roles('organization_a')
);

SELECT throws_ok(
  format(
    $$SELECT upsert_answers('%s', '{"x": 1}'::jsonb, false)$$,
    test_id('org_b')
  ),
  'P0001',
  NULL,
  'organization_a cannot call upsert_answers for org_b (the widened organization branch is gated by that table''s RLS, not merely by the id not matching a candidate)'
);

SELECT reset_role();
SELECT is(
  (SELECT answers FROM organizations WHERE id = test_id('org_b')),
  '{}'::jsonb,
  'org_b answers are untouched by the rejected cross-organization write (the throw is not merely a return-value artefact - nothing landed)'
);

-- =====================================================================
-- admin_jobs table
-- =====================================================================

SELECT reset_role();

-- Table exists
SELECT has_table('public', 'admin_jobs', 'admin_jobs table exists');

-- Column existence checks
SELECT has_column('public', 'admin_jobs', 'id',          'admin_jobs has id column');
SELECT has_column('public', 'admin_jobs', 'project_id',  'admin_jobs has project_id column');
SELECT has_column('public', 'admin_jobs', 'job_id',      'admin_jobs has job_id column');
SELECT has_column('public', 'admin_jobs', 'job_type',    'admin_jobs has job_type column');
SELECT has_column('public', 'admin_jobs', 'election_id', 'admin_jobs has election_id column');
SELECT has_column('public', 'admin_jobs', 'author',      'admin_jobs has author column');
SELECT has_column('public', 'admin_jobs', 'end_status',  'admin_jobs has end_status column');
SELECT has_column('public', 'admin_jobs', 'start_time',  'admin_jobs has start_time column');
SELECT has_column('public', 'admin_jobs', 'end_time',    'admin_jobs has end_time column');
SELECT has_column('public', 'admin_jobs', 'input',       'admin_jobs has input column');
SELECT has_column('public', 'admin_jobs', 'output',      'admin_jobs has output column');
SELECT has_column('public', 'admin_jobs', 'messages',    'admin_jobs has messages column');

-- Admin_a can SELECT admin_jobs for project_a
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT ok(
  (SELECT count(*) FROM admin_jobs WHERE project_id = test_id('project_a'))::integer >= 1,
  'admin_a can SELECT admin_jobs for project_a'
);

-- Admin_b cannot SELECT admin_jobs for project_a (cross-project isolation)
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_b'),
  test_user_roles('admin_b')
);

SELECT is(
  (SELECT count(*) FROM admin_jobs WHERE project_id = test_id('project_a'))::integer,
  0,
  'admin_b cannot SELECT admin_jobs for project_a (cross-project isolation)'
);

-- Candidate cannot SELECT admin_jobs (admin-only)
SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT is(
  (SELECT count(*) FROM admin_jobs)::integer,
  0,
  'candidate_a cannot SELECT admin_jobs (admin-only table)'
);

-- Anon cannot SELECT admin_jobs
SELECT set_test_user('anon');

SELECT is(
  (SELECT count(*) FROM admin_jobs)::integer,
  0,
  'anon cannot SELECT admin_jobs'
);

-- =====================================================================
-- merge_question_custom_data RPC
-- =====================================================================

SELECT reset_role();

-- Function exists
SELECT has_function(
  'public', 'merge_question_custom_data', ARRAY['uuid', 'jsonb'],
  'merge_question_custom_data(uuid, jsonb) function exists'
);

-- SECURITY INVOKER (not DEFINER)
SELECT ok(
  NOT (SELECT prosecdef FROM pg_proc WHERE proname = 'merge_question_custom_data'),
  'merge_question_custom_data is SECURITY INVOKER (not DEFINER)'
);

-- Admin_a can merge custom_data on question in own project
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT ok(
  (SELECT merge_question_custom_data(test_id('question_a'), '{"arguments": [{"en": "test"}]}'::jsonb)) IS NOT NULL,
  'admin_a can call merge_question_custom_data on own project question'
);

-- Verify the merge result contains the new key
SELECT reset_role();
SELECT ok(
  (SELECT custom_data ? 'arguments' FROM questions WHERE id = test_id('question_a')),
  'question_a custom_data now has arguments key after merge'
);

-- Merge preserves existing keys when adding new ones
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT ok(
  (SELECT merge_question_custom_data(test_id('question_a'), '{"terms": [{"en": "term1"}]}'::jsonb)) ? 'arguments',
  'merge_question_custom_data preserves existing keys (arguments still present after adding terms)'
);

-- Admin_b cannot call merge_question_custom_data on project_a question
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_b'),
  test_user_roles('admin_b')
);

SELECT throws_ok(
  format(
    $$SELECT merge_question_custom_data('%s', '{"hacked": true}'::jsonb)$$,
    test_id('question_a')
  ),
  NULL,
  NULL,
  'admin_b cannot call merge_question_custom_data on project_a question (throws error)'
);

-- Candidate cannot call merge_question_custom_data
SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT throws_ok(
  format(
    $$SELECT merge_question_custom_data('%s', '{"hacked": true}'::jsonb)$$,
    test_id('question_a')
  ),
  NULL,
  NULL,
  'candidate_a cannot call merge_question_custom_data (throws error)'
);

-- merge_question_custom_data handles NULL custom_data (COALESCE)
SELECT reset_role();
UPDATE questions SET custom_data = NULL WHERE id = test_id('question_a');

SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT ok(
  (SELECT merge_question_custom_data(test_id('question_a'), '{"video": {"en": "url"}}'::jsonb)) ? 'video',
  'merge_question_custom_data handles NULL custom_data via COALESCE'
);

-- No definition survives under the pre-rename name. A rename that left a stale definition behind in the catalogue is invisible to every source-tree grep, because the source only ever carries the name it was renamed to.
SELECT reset_role();
SELECT hasnt_function(
  'public', 'merge_custom_data',
  'no function named merge_custom_data survives in public (the pre-rename name of merge_question_custom_data)'
);

-- =====================================================================
-- entity display-name columns
-- =====================================================================

SELECT reset_role();

-- candidates carries no name column
SELECT hasnt_column(
  'public', 'candidates', 'name',
  'candidates has no name column (a candidate display name is derived from first_name/last_name)'
);

-- organizations still carries one
SELECT has_column(
  'public', 'organizations', 'name',
  'organizations has a name column (an organization has no first/last name to derive one from)'
);

-- the initials override survives on candidates
SELECT has_column(
  'public', 'candidates', 'short_name',
  'candidates has a short_name column (the generated-initials override)'
);

-- =====================================================================
-- role and entity enum vocabularies
-- =====================================================================

SELECT reset_role();

-- the role vocabulary
SELECT enum_has_labels(
  'public', 'user_role_type',
  ARRAY['candidate', 'organization', 'project_admin', 'account_admin', 'super_admin']::name[],
  'user_role_type carries exactly the five role labels, in order (a role literal is compared inside RLS predicates, where a stale one denies silently instead of erroring)'
);

-- the entity vocabulary it is kept in step with
SELECT enum_has_labels(
  'public', 'entity_type',
  ARRAY['candidate', 'organization', 'faction', 'alliance']::name[],
  'entity_type carries exactly the four entity labels, in order (the role vocabulary above uses the same term for the same thing)'
);

-- =====================================================================
-- role scope vocabulary and the predicate that reads it
-- =====================================================================

SELECT reset_role();

-- the scope vocabulary
SELECT enum_has_labels(
  'public', 'role_scope_type',
  ARRAY['candidate', 'organization', 'project', 'account', 'global']::name[],
  'role_scope_type carries exactly the five scope labels, in order (the vocabulary user_roles.scope_type used to carry as a trailing comment, which constrained nothing)'
);

-- the column carries that type, read back out of the rebuilt catalogue
SELECT col_type_is(
  'public', 'user_roles', 'scope_type', 'role_scope_type',
  'user_roles.scope_type is role_scope_type, not text (an illegal scope is rejected at INSERT instead of inserting cleanly and comparing false in every predicate afterwards)'
);

-- has_role takes its role and its scope as enums
SELECT has_function(
  'public', 'has_role', ARRAY['user_role_type', 'role_scope_type', 'uuid'],
  'has_role(user_role_type, role_scope_type, uuid) function exists (role identity in the auth layer is a type, not a convention)'
);

-- And the pre-rewrite signature does NOT survive alongside it. CREATE OR REPLACE FUNCTION with changed parameter types creates an OVERLOAD; it does not replace. No source-tree grep can see a survivor, because the source only ever carries the signature it was rewritten to - the same reasoning the merge_custom_data hasnt_function above rests on. Every call site in 302-rls.sql passes bare string literals (has_role('organization', 'organization', id) at :223, :235, :239, :266), and an unknown literal resolves to text in preference to a user-defined enum, so a surviving text overload would silently bind every RLS predicate back to string comparison with nothing turning red.
SELECT hasnt_function(
  'public', 'has_role', ARRAY['text', 'text', 'uuid'],
  'no text-typed has_role overload survives (an unknown literal binds to text in preference to a user-defined enum, so a surviving overload would silently reinstate string comparison at every RLS call site)'
);

-- =====================================================================
-- nominations.election_round lower bound
-- =====================================================================

SELECT reset_role();

-- a zeroth round is rejected by the constraint, not merely discouraged by a comment
SELECT throws_ok(
  format(
    $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round)
      VALUES ('%s', '%s', '%s', '%s', 0)$$,
    test_id('project_a'),
    test_id('candidate_a2'),
    test_id('election_a'),
    test_id('constituency_a')
  ),
  '23514',
  NULL,
  'nominations rejects election_round = 0 with a check violation (the column carries DEFAULT 1, so before the constraint a zeroth round inserted cleanly)'
);

-- The constraint carries the name the schema declares. 104-nominations.sql names it explicitly and 156-DISPOSITIONS.md Record B cites that name; without this the name is only a comment, and a rename would go unnoticed until a throws_ok matching on it failed somewhere else.
SELECT is(
  (
    SELECT pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conrelid = 'public.nominations'::regclass
      AND conname = 'nominations_election_round_check'
  ),
  'CHECK ((election_round >= 1))',
  'the election_round lower bound is carried by a constraint actually named nominations_election_round_check (the name is declared in 104-nominations.sql, not merely PostgreSQL''s generated default)'
);

-- a negative round is rejected by the same constraint
SELECT throws_ok(
  format(
    $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round)
      VALUES ('%s', '%s', '%s', '%s', -1)$$,
    test_id('project_a'),
    test_id('candidate_a2'),
    test_id('election_a'),
    test_id('constituency_a')
  ),
  '23514',
  NULL,
  'nominations rejects a negative election_round with a check violation'
);

-- the control: a first round is still accepted, so the constraint is a lower bound and not a blanket rejection
SELECT lives_ok(
  format(
    $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round)
      VALUES ('%s', '%s', '%s', '%s', 1)$$,
    test_id('project_a'),
    test_id('candidate_a2'),
    test_id('election_a'),
    test_id('constituency_a')
  ),
  'nominations accepts election_round = 1 (the lower bound admits the value it bounds at)'
);

-- the limit of the constraint, made observable rather than only written down
SELECT lives_ok(
  format(
    $$INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id, election_round)
      VALUES ('%s', '%s', '%s', '%s', NULL)$$,
    test_id('project_a'),
    test_id('candidate_a2'),
    test_id('election_a'),
    test_id('constituency_a')
  ),
  'nominations accepts a NULL election_round: the constraint bounds the value and does not require its presence (a CHECK passes on NULL, and the column is not NOT NULL)'
);

-- =====================================================================
-- app_settings cascades with its project
-- =====================================================================

SELECT reset_role();

-- the durable form: the referential action read straight out of the catalogue, which holds whether or not a fixture row happens to exist
SELECT is(
  (
    SELECT confdeltype::text
    FROM pg_constraint
    WHERE conrelid = 'public.app_settings'::regclass
      AND contype = 'f'
      AND confrelid = 'public.projects'::regclass
  ),
  'c',
  'the app_settings project foreign key deletes with CASCADE (it was the only one of the thirteen references to projects carrying no referential action, so a project delete raised a foreign-key violation)'
);

-- the behavioural form. Three statements, because "no foreign-key violation was raised" and "the child row was removed" are different claims and only the second is the cascade. The pre-state assertion is what stops the post-state one being vacuous: 0 after proves nothing unless it was not 0 before.
SELECT is(
  (SELECT count(*)::integer FROM app_settings WHERE project_id = test_id('project_a')),
  1,
  'project_a has its app_settings row before the delete (create_test_data inserts app_settings_a), so the post-delete count below is an observation and not a coincidence'
);

-- This DELETE removes project_a and everything under it, so it is the last assertion in the file; pgTAP rolls the whole file back afterwards.
SELECT lives_ok(
  format(
    $$DELETE FROM projects WHERE id = '%s'$$,
    test_id('project_a')
  ),
  'deleting a project cascades to its app_settings row instead of raising a foreign-key violation'
);

SELECT is(
  (SELECT count(*)::integer FROM app_settings WHERE project_id = test_id('project_a')),
  0,
  'the app_settings row is gone after the project delete (the cascade is observed firing, not merely inferred from the absence of an error)'
);

-- =====================================================================
-- Cleanup
-- =====================================================================

SELECT reset_role();

SELECT * FROM finish();
ROLLBACK;
