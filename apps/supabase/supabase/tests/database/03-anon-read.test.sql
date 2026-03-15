-- 03-anon-read.test.sql: QUAL-03 anonymous read access and write denial
--
-- Verifies that the anon role can SELECT published records from voter-facing
-- tables, sees 0 rows for unpublished data, cannot read admin-only tables,
-- and is completely blocked from INSERT/UPDATE/DELETE on all tables.
--
-- Also verifies that user_roles and storage_config are inaccessible to anon
-- (REVOKE ALL, not just RLS -- even SELECT raises 42501).
--
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.)

BEGIN;

SET search_path = public, extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT plan(56);

-- Create test fixture data
-- Project A: published=true, Project B: published=false
SELECT create_test_data();

-- =====================================================================
-- Section 1: Anon can SELECT published records from voter-facing tables
-- =====================================================================

SELECT set_test_user('anon');

-- Tables with published flag: anon sees rows WHERE published = true
-- Project A data is published, so count >= 1

SELECT ok(
  (SELECT count(*) FROM elections WHERE published = true)::integer >= 1,
  'anon can SELECT published elections'
);

SELECT is(
  (SELECT count(*) FROM elections WHERE published = false)::integer,
  0,
  'anon cannot see unpublished elections'
);

SELECT ok(
  (SELECT count(*) FROM constituency_groups WHERE published = true)::integer >= 1,
  'anon can SELECT published constituency_groups'
);

SELECT is(
  (SELECT count(*) FROM constituency_groups WHERE published = false)::integer,
  0,
  'anon cannot see unpublished constituency_groups'
);

SELECT ok(
  (SELECT count(*) FROM constituencies WHERE published = true)::integer >= 1,
  'anon can SELECT published constituencies'
);

SELECT is(
  (SELECT count(*) FROM constituencies WHERE published = false)::integer,
  0,
  'anon cannot see unpublished constituencies'
);

SELECT ok(
  (SELECT count(*) FROM organizations WHERE published = true)::integer >= 1,
  'anon can SELECT published organizations'
);

SELECT is(
  (SELECT count(*) FROM organizations WHERE published = false)::integer,
  0,
  'anon cannot see unpublished organizations'
);

SELECT ok(
  (SELECT count(*) FROM candidates WHERE published = true)::integer >= 1,
  'anon can SELECT published candidates'
);

SELECT is(
  (SELECT count(*) FROM candidates WHERE published = false)::integer,
  0,
  'anon cannot see unpublished candidates'
);

SELECT ok(
  (SELECT count(*) FROM factions WHERE published = true)::integer >= 1,
  'anon can SELECT published factions'
);

SELECT is(
  (SELECT count(*) FROM factions WHERE published = false)::integer,
  0,
  'anon cannot see unpublished factions'
);

SELECT ok(
  (SELECT count(*) FROM alliances WHERE published = true)::integer >= 1,
  'anon can SELECT published alliances'
);

SELECT is(
  (SELECT count(*) FROM alliances WHERE published = false)::integer,
  0,
  'anon cannot see unpublished alliances'
);

SELECT ok(
  (SELECT count(*) FROM question_categories WHERE published = true)::integer >= 1,
  'anon can SELECT published question_categories'
);

SELECT is(
  (SELECT count(*) FROM question_categories WHERE published = false)::integer,
  0,
  'anon cannot see unpublished question_categories'
);

SELECT ok(
  (SELECT count(*) FROM questions WHERE published = true)::integer >= 1,
  'anon can SELECT published questions'
);

SELECT is(
  (SELECT count(*) FROM questions WHERE published = false)::integer,
  0,
  'anon cannot see unpublished questions'
);

SELECT ok(
  (SELECT count(*) FROM nominations WHERE published = true)::integer >= 1,
  'anon can SELECT published nominations'
);

SELECT is(
  (SELECT count(*) FROM nominations WHERE published = false)::integer,
  0,
  'anon cannot see unpublished nominations'
);

-- =====================================================================
-- Section 2: Anon can read tables without published flag (always readable)
-- =====================================================================

SELECT set_test_user('anon');

-- app_settings: USING (true) -- always readable by anon
SELECT ok(
  (SELECT count(*) FROM app_settings)::integer >= 1,
  'anon can SELECT app_settings (always readable)'
);

-- Join tables: USING (true) -- structural data, always readable
SELECT ok(
  (SELECT count(*) FROM constituency_group_constituencies)::integer >= 1,
  'anon can SELECT constituency_group_constituencies (join table, always readable)'
);

SELECT ok(
  (SELECT count(*) FROM election_constituency_groups)::integer >= 1,
  'anon can SELECT election_constituency_groups (join table, always readable)'
);

-- =====================================================================
-- Section 3: Anon cannot read admin-only tables
-- =====================================================================

SELECT set_test_user('anon');

-- accounts: no anon policy
SELECT is(
  (SELECT count(*) FROM accounts)::integer,
  0,
  'anon cannot see accounts (no anon policy)'
);

-- projects: no anon policy
SELECT is(
  (SELECT count(*) FROM projects)::integer,
  0,
  'anon cannot see projects (no anon policy)'
);

-- =====================================================================
-- Section 4: Anon cannot access user_roles or storage_config
-- These have REVOKE ALL FROM anon -- even SELECT raises 42501
-- =====================================================================

SELECT set_test_user('anon');

SELECT throws_ok(
  'SELECT count(*) FROM user_roles',
  '42501',
  NULL,
  'anon cannot SELECT user_roles (REVOKE ALL)'
);

SELECT throws_ok(
  'SELECT count(*) FROM storage_config',
  '42501',
  NULL,
  'anon cannot SELECT storage_config (REVOKE ALL)'
);

-- =====================================================================
-- Section 5: Anon INSERT denial on all content tables
-- INSERT as anon fails with 42501 (new row violates RLS / no policy)
-- =====================================================================

SELECT set_test_user('anon');

-- accounts: no anon INSERT policy
SELECT throws_ok(
  format('INSERT INTO accounts (id, name) VALUES (gen_random_uuid(), ''Test'')'),
  '42501',
  NULL,
  'anon cannot INSERT into accounts'
);

-- projects: no anon INSERT policy
SELECT throws_ok(
  format('INSERT INTO projects (id, account_id, name) VALUES (gen_random_uuid(), ''%s'', ''Test'')', test_id('account_a')),
  '42501',
  NULL,
  'anon cannot INSERT into projects'
);

-- elections
SELECT throws_ok(
  format('INSERT INTO elections (id, project_id, name) VALUES (gen_random_uuid(), ''%s'', ''{"en":"Test"}''::jsonb)', test_id('project_a')),
  '42501',
  NULL,
  'anon cannot INSERT into elections'
);

-- constituency_groups
SELECT throws_ok(
  format('INSERT INTO constituency_groups (id, project_id, name) VALUES (gen_random_uuid(), ''%s'', ''{"en":"Test"}''::jsonb)', test_id('project_a')),
  '42501',
  NULL,
  'anon cannot INSERT into constituency_groups'
);

-- constituencies
SELECT throws_ok(
  format('INSERT INTO constituencies (id, project_id, name) VALUES (gen_random_uuid(), ''%s'', ''{"en":"Test"}''::jsonb)', test_id('project_a')),
  '42501',
  NULL,
  'anon cannot INSERT into constituencies'
);

-- organizations
SELECT throws_ok(
  format('INSERT INTO organizations (id, project_id, name) VALUES (gen_random_uuid(), ''%s'', ''{"en":"Test"}''::jsonb)', test_id('project_a')),
  '42501',
  NULL,
  'anon cannot INSERT into organizations'
);

-- candidates
SELECT throws_ok(
  format('INSERT INTO candidates (id, project_id, first_name, last_name) VALUES (gen_random_uuid(), ''%s'', ''Test'', ''User'')', test_id('project_a')),
  '42501',
  NULL,
  'anon cannot INSERT into candidates'
);

-- factions
SELECT throws_ok(
  format('INSERT INTO factions (id, project_id, name) VALUES (gen_random_uuid(), ''%s'', ''{"en":"Test"}''::jsonb)', test_id('project_a')),
  '42501',
  NULL,
  'anon cannot INSERT into factions'
);

-- alliances
SELECT throws_ok(
  format('INSERT INTO alliances (id, project_id, name) VALUES (gen_random_uuid(), ''%s'', ''{"en":"Test"}''::jsonb)', test_id('project_a')),
  '42501',
  NULL,
  'anon cannot INSERT into alliances'
);

-- question_categories
SELECT throws_ok(
  format('INSERT INTO question_categories (id, project_id, name) VALUES (gen_random_uuid(), ''%s'', ''{"en":"Test"}''::jsonb)', test_id('project_a')),
  '42501',
  NULL,
  'anon cannot INSERT into question_categories'
);

-- questions
SELECT throws_ok(
  format('INSERT INTO questions (id, project_id, type, category_id, name) VALUES (gen_random_uuid(), ''%s'', ''text'', ''%s'', ''{"en":"Test"}''::jsonb)', test_id('project_a'), test_id('question_category_a')),
  '42501',
  NULL,
  'anon cannot INSERT into questions'
);

-- nominations -- tricky because of validate_nomination trigger, but RLS should block first
SELECT throws_ok(
  format('INSERT INTO nominations (id, project_id, organization_id, election_id, constituency_id, election_round) VALUES (gen_random_uuid(), ''%s'', ''%s'', ''%s'', ''%s'', 1)',
    test_id('project_a'), test_id('org_a'), test_id('election_a'), test_id('constituency_a')),
  '42501',
  NULL,
  'anon cannot INSERT into nominations'
);

-- app_settings
SELECT throws_ok(
  format('INSERT INTO app_settings (id, project_id, settings) VALUES (gen_random_uuid(), ''%s'', ''{}''::jsonb)', test_id('project_a')),
  NULL,
  NULL,
  'anon cannot INSERT into app_settings'
);

-- constituency_group_constituencies (join table)
SELECT throws_ok(
  format('INSERT INTO constituency_group_constituencies (constituency_group_id, constituency_id) VALUES (''%s'', ''%s'')',
    test_id('constituency_group_a'), test_id('constituency_a')),
  NULL,
  NULL,
  'anon cannot INSERT into constituency_group_constituencies'
);

-- election_constituency_groups (join table)
SELECT throws_ok(
  format('INSERT INTO election_constituency_groups (election_id, constituency_group_id) VALUES (''%s'', ''%s'')',
    test_id('election_a'), test_id('constituency_group_a')),
  NULL,
  NULL,
  'anon cannot INSERT into election_constituency_groups'
);

-- =====================================================================
-- Section 6: Anon UPDATE denial on all content tables
-- UPDATE as anon affects 0 rows (RLS WHERE clause filters everything out)
-- We test by attempting UPDATE, then verifying data unchanged
-- =====================================================================

SELECT set_test_user('anon');

-- elections: UPDATE should affect 0 rows (anon has no UPDATE policy)
SELECT lives_ok(
  format('UPDATE elections SET name = ''{"en":"Hacked"}''::jsonb WHERE id = ''%s''', test_id('election_a')),
  'anon UPDATE on elections does not raise error'
);

SELECT reset_role();
SELECT is(
  (SELECT name->>'en' FROM elections WHERE id = test_id('election_a')),
  'Election A',
  'anon UPDATE on elections had no effect'
);

SELECT set_test_user('anon');
SELECT lives_ok(
  format('UPDATE organizations SET name = ''{"en":"Hacked"}''::jsonb WHERE id = ''%s''', test_id('org_a')),
  'anon UPDATE on organizations does not raise error'
);

SELECT reset_role();
SELECT is(
  (SELECT name->>'en' FROM organizations WHERE id = test_id('org_a')),
  'Org A',
  'anon UPDATE on organizations had no effect'
);

SELECT set_test_user('anon');
SELECT lives_ok(
  format('UPDATE candidates SET first_name = ''Hacked'' WHERE id = ''%s''', test_id('candidate_a')),
  'anon UPDATE on candidates does not raise error'
);

SELECT reset_role();
SELECT is(
  (SELECT first_name FROM candidates WHERE id = test_id('candidate_a')),
  'Alice',
  'anon UPDATE on candidates had no effect'
);

SELECT set_test_user('anon');
SELECT lives_ok(
  format('UPDATE app_settings SET settings = ''{"hacked":true}''::jsonb WHERE id = ''%s''', test_id('app_settings_a')),
  'anon UPDATE on app_settings does not raise error'
);

SELECT reset_role();
SELECT is(
  (SELECT settings->>'theme' FROM app_settings WHERE id = test_id('app_settings_a')),
  'light',
  'anon UPDATE on app_settings had no effect'
);

-- =====================================================================
-- Section 7: Anon DELETE denial on all content tables
-- DELETE as anon affects 0 rows (RLS WHERE clause filters everything out)
-- =====================================================================

SELECT set_test_user('anon');

SELECT lives_ok(
  format('DELETE FROM elections WHERE id = ''%s''', test_id('election_a')),
  'anon DELETE on elections does not raise error'
);

SELECT reset_role();
SELECT ok(
  (SELECT count(*) FROM elections WHERE id = test_id('election_a'))::integer = 1,
  'anon DELETE on elections had no effect (record still exists)'
);

SELECT set_test_user('anon');
SELECT lives_ok(
  format('DELETE FROM candidates WHERE id = ''%s''', test_id('candidate_a')),
  'anon DELETE on candidates does not raise error'
);

SELECT reset_role();
SELECT ok(
  (SELECT count(*) FROM candidates WHERE id = test_id('candidate_a'))::integer = 1,
  'anon DELETE on candidates had no effect (record still exists)'
);

SELECT set_test_user('anon');
SELECT lives_ok(
  format('DELETE FROM app_settings WHERE id = ''%s''', test_id('app_settings_a')),
  'anon DELETE on app_settings does not raise error'
);

SELECT reset_role();
SELECT ok(
  (SELECT count(*) FROM app_settings WHERE id = test_id('app_settings_a'))::integer = 1,
  'anon DELETE on app_settings had no effect (record still exists)'
);

-- Reset role for cleanup
SELECT reset_role();

SELECT * FROM finish();
ROLLBACK;
