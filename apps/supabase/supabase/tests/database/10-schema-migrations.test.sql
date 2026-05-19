-- 10-schema-migrations.test.sql: Phase 22 + Phase 27 schema migration tests
--
-- Verifies all four SCHM requirements + ADMN requirements:
--   SCHM-01: customization JSONB column on app_settings
--   SCHM-02: feedback table with CHECK constraint, RLS, and rate limiting
--   SCHM-03: terms_of_use_accepted timestamptz column on candidates
--   SCHM-04: upsert_answers RPC (merge/overwrite modes, null stripping, RLS)
--   ADMN-01: merge_custom_data RPC for question custom_data JSONB merge
--   ADMN-02: admin_jobs table with admin-only RLS
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)

BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT plan(65);

-- Create test fixture data
SELECT create_test_data();

-- =====================================================================
-- SCHM-01: customization column on app_settings
-- =====================================================================

-- 1. Column exists
SELECT has_column(
  'public', 'app_settings', 'customization',
  'app_settings has customization column'
);

-- 2. Column type is jsonb
SELECT col_type_is(
  'public', 'app_settings', 'customization', 'jsonb',
  'customization column is jsonb type'
);

-- 3. Anon can SELECT customization from app_settings
SELECT set_test_user('anon');
SELECT ok(
  (SELECT customization IS NOT NULL FROM app_settings WHERE id = test_id('app_settings_a')),
  'anon can SELECT customization from app_settings (not null after insert)'
);

-- 4. Admin can UPDATE customization on own project app_settings
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

-- 5. Admin from project_b cannot UPDATE app_settings of project_a
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
-- SCHM-02: feedback table
-- =====================================================================

-- 8. Table exists
SELECT has_table('public', 'feedback', 'feedback table exists');

-- 9-16. Column existence checks
SELECT has_column('public', 'feedback', 'id',          'feedback has id column');
SELECT has_column('public', 'feedback', 'project_id',  'feedback has project_id column');
SELECT has_column('public', 'feedback', 'rating',      'feedback has rating column');
SELECT has_column('public', 'feedback', 'description', 'feedback has description column');
SELECT has_column('public', 'feedback', 'date',        'feedback has date column');
SELECT has_column('public', 'feedback', 'url',         'feedback has url column');
SELECT has_column('public', 'feedback', 'user_agent',  'feedback has user_agent column');
SELECT has_column('public', 'feedback', 'created_at',  'feedback has created_at column');

-- 17. Anon can INSERT feedback with rating only (description NULL)
SELECT set_test_user('anon');
SELECT lives_ok(
  format(
    $$INSERT INTO feedback (project_id, rating, date, created_at) VALUES ('%s', 5, now(), now())$$,
    test_id('project_a')
  ),
  'anon can INSERT feedback with rating only (description NULL)'
);

-- 18. Anon can INSERT feedback with description only (rating NULL)
SELECT lives_ok(
  format(
    $$INSERT INTO feedback (project_id, description, date, created_at) VALUES ('%s', 'Some feedback', now(), now())$$,
    test_id('project_a')
  ),
  'anon can INSERT feedback with description only (rating NULL)'
);

-- 19. Anon INSERT with both rating AND description NULL throws CHECK violation
SELECT throws_ok(
  format(
    $$INSERT INTO feedback (project_id, date, created_at) VALUES ('%s', now(), now())$$,
    test_id('project_a')
  ),
  '23514',
  NULL,
  'anon INSERT feedback with both rating and description NULL throws CHECK violation'
);

-- 20. Anon cannot SELECT feedback (0 rows returned, RLS silently hides)
SELECT is(
  (SELECT count(*) FROM feedback)::integer,
  0,
  'anon cannot SELECT feedback (0 rows returned, RLS silently hides)'
);

-- 21. Anon cannot UPDATE feedback (no UPDATE policy -- silently affects 0 rows)
SELECT lives_ok(
  format(
    $$UPDATE feedback SET rating = 1 WHERE id = '%s'$$,
    test_id('feedback_a')
  ),
  'anon UPDATE on feedback does not raise error (but affects 0 rows due to RLS)'
);

-- 22. Admin_a can SELECT feedback for project_a
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT ok(
  (SELECT count(*) FROM feedback WHERE project_id = test_id('project_a'))::integer >= 1,
  'admin_a can SELECT feedback for project_a'
);

-- 23. Admin_b cannot SELECT feedback for project_a (cross-project isolation)
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

-- 24. Admin_a can DELETE feedback for project_a
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

-- 25. Rate limiting: 6th insert from same IP raises exception
-- Reset to postgres to clear rate limit counter, then switch to anon
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
-- SCHM-03: terms_of_use_accepted column on candidates
-- =====================================================================

SELECT reset_role();

-- 26. Column exists
SELECT has_column(
  'public', 'candidates', 'terms_of_use_accepted',
  'candidates has terms_of_use_accepted column'
);

-- 27. Column type is timestamptz
SELECT col_type_is(
  'public', 'candidates', 'terms_of_use_accepted',
  'timestamp with time zone',
  'terms_of_use_accepted is timestamptz type'
);

-- 28. Column is nullable
SELECT col_is_null(
  'public', 'candidates', 'terms_of_use_accepted',
  'terms_of_use_accepted is nullable'
);

-- 29. Candidate_a can UPDATE terms_of_use_accepted on own row
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

-- 30. Candidate_a cannot UPDATE terms_of_use_accepted on candidate_b's row
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
-- SCHM-04: upsert_answers RPC
-- =====================================================================

-- 33. Function exists
SELECT has_function(
  'public', 'upsert_answers', ARRAY['uuid', 'jsonb', 'boolean'],
  'upsert_answers(uuid, jsonb, boolean) function exists'
);

-- 34. SECURITY INVOKER (not DEFINER)
SELECT ok(
  NOT (SELECT prosecdef FROM pg_proc WHERE proname = 'upsert_answers'),
  'upsert_answers is SECURITY INVOKER (not DEFINER)'
);

-- 35. Candidate_a calling with overwrite=true and empty '{}' returns '{}'
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

-- 36. Candidate_a calling with overwrite=false and empty '{}' returns '{}'
SELECT is(
  (SELECT upsert_answers(test_id('candidate_a'), '{}'::jsonb, false)),
  '{}'::jsonb,
  'upsert_answers with overwrite=false and empty answers returns {}'
);

-- 37. Candidate_a cannot call upsert_answers for candidate_b's id
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

-- Set up a valid answer on candidate_a for merge testing
-- question_a is singleChoiceOrdinal in project_a
UPDATE candidates SET answers = jsonb_build_object(
  test_id('question_a')::text, '{"value": 1}'::jsonb
) WHERE id = test_id('candidate_a');

-- Switch back to candidate_a
SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

-- 38. Merge mode: overwrite=false merges new answers with existing
-- Add a text question for a simpler merge test
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

-- 39. Overwrite mode: overwrite=true replaces all answers
SELECT is(
  (SELECT upsert_answers(
    test_id('candidate_a'),
    jsonb_build_object('eeeeeeee-eeee-eeee-eeee-000000000301', '{"value": "only answer"}'::jsonb),
    true
  )) ? test_id('question_a')::text,
  false,
  'overwrite mode (overwrite=true) replaces existing answers (old key gone)'
);

-- 40. Null stripping: null values are removed from merged result
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
-- ADMN-02: admin_jobs table
-- =====================================================================

SELECT reset_role();

-- 41. Table exists
SELECT has_table('public', 'admin_jobs', 'admin_jobs table exists');

-- 42-53. Column existence checks
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

-- 54. Admin_a can SELECT admin_jobs for project_a
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT ok(
  (SELECT count(*) FROM admin_jobs WHERE project_id = test_id('project_a'))::integer >= 1,
  'admin_a can SELECT admin_jobs for project_a'
);

-- 55. Admin_b cannot SELECT admin_jobs for project_a (cross-project isolation)
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

-- 56. Candidate cannot SELECT admin_jobs (admin-only)
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

-- 57. Anon cannot SELECT admin_jobs
SELECT set_test_user('anon');

SELECT is(
  (SELECT count(*) FROM admin_jobs)::integer,
  0,
  'anon cannot SELECT admin_jobs'
);

-- =====================================================================
-- ADMN-01: merge_custom_data RPC
-- =====================================================================

SELECT reset_role();

-- 58. Function exists
SELECT has_function(
  'public', 'merge_custom_data', ARRAY['uuid', 'jsonb'],
  'merge_custom_data(uuid, jsonb) function exists'
);

-- 59. SECURITY INVOKER (not DEFINER)
SELECT ok(
  NOT (SELECT prosecdef FROM pg_proc WHERE proname = 'merge_custom_data'),
  'merge_custom_data is SECURITY INVOKER (not DEFINER)'
);

-- 60. Admin_a can merge custom_data on question in own project
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT ok(
  (SELECT merge_custom_data(test_id('question_a'), '{"arguments": [{"en": "test"}]}'::jsonb)) IS NOT NULL,
  'admin_a can call merge_custom_data on own project question'
);

-- 61. Verify the merge result contains the new key
SELECT reset_role();
SELECT ok(
  (SELECT custom_data ? 'arguments' FROM questions WHERE id = test_id('question_a')),
  'question_a custom_data now has arguments key after merge'
);

-- 62. Merge preserves existing keys when adding new ones
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT ok(
  (SELECT merge_custom_data(test_id('question_a'), '{"terms": [{"en": "term1"}]}'::jsonb)) ? 'arguments',
  'merge_custom_data preserves existing keys (arguments still present after adding terms)'
);

-- 63. Admin_b cannot call merge_custom_data on project_a question
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_b'),
  test_user_roles('admin_b')
);

SELECT throws_ok(
  format(
    $$SELECT merge_custom_data('%s', '{"hacked": true}'::jsonb)$$,
    test_id('question_a')
  ),
  NULL,
  NULL,
  'admin_b cannot call merge_custom_data on project_a question (throws error)'
);

-- 64. Candidate cannot call merge_custom_data
SELECT set_test_user(
  'authenticated',
  test_user_id('candidate_a'),
  test_user_roles('candidate_a')
);

SELECT throws_ok(
  format(
    $$SELECT merge_custom_data('%s', '{"hacked": true}'::jsonb)$$,
    test_id('question_a')
  ),
  NULL,
  NULL,
  'candidate_a cannot call merge_custom_data (throws error)'
);

-- 65. merge_custom_data handles NULL custom_data (COALESCE)
SELECT reset_role();
UPDATE questions SET custom_data = NULL WHERE id = test_id('question_a');

SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT ok(
  (SELECT merge_custom_data(test_id('question_a'), '{"video": {"en": "url"}}'::jsonb)) ? 'video',
  'merge_custom_data handles NULL custom_data via COALESCE'
);

-- =====================================================================
-- Cleanup
-- =====================================================================

SELECT reset_role();

SELECT * FROM finish();
ROLLBACK;
