-- 00-helpers.test.sql: Shared test helpers, fixtures, and constants
--
-- This file runs first (alphabetical ordering) and creates persistent
-- helper functions that subsequent test files depend on:
--   set_test_user()     - simulate an authenticated or anon user with JWT claims
--   reset_role()        - switch back to postgres superuser for fixture insertion
--   test_user_id()      - predictable UUID for a named test user
--   test_user_roles()   - JWT user_roles claim array for a named test user
--   test_id()           - predictable UUID for a named test entity
--   create_test_data()  - create a complete multi-tenant test dataset
--
-- Architecture: Function definitions are COMMITted (persisted for other test
-- files to use). Smoke tests run in a separate BEGIN/ROLLBACK transaction.
-- The `supabase db reset` between test runs removes these functions.
--
-- Each subsequent test file calls create_test_data() after BEGIN, then
-- ROLLBACK at end, getting a fresh dataset each time.

-- ======================================================================
-- Phase 1: Create persistent helper functions (outside transaction)
-- ======================================================================

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

--------------------------------------------------------------------------------
-- Predictable UUID constants
--------------------------------------------------------------------------------

-- Accounts
-- Account A: 11111111-1111-1111-1111-111111111111
-- Account B: 22222222-2222-2222-2222-222222222222

-- Projects
-- Project A: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- Project B: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb

-- Users
-- admin_a:          cccccccc-cccc-cccc-cccc-000000000001
-- admin_b:          cccccccc-cccc-cccc-cccc-000000000002
-- candidate_a:      cccccccc-cccc-cccc-cccc-000000000003
-- candidate_b:      cccccccc-cccc-cccc-cccc-000000000004
-- party_a:          cccccccc-cccc-cccc-cccc-000000000005
-- super_admin:      cccccccc-cccc-cccc-cccc-000000000006
-- account_admin_a:  cccccccc-cccc-cccc-cccc-000000000007
-- candidate_a2:     cccccccc-cccc-cccc-cccc-000000000008

-- Entities (elections, orgs, candidates, etc.)
-- election_a:              dddddddd-dddd-dddd-dddd-000000000001
-- election_b:              dddddddd-dddd-dddd-dddd-000000000002
-- org_a:                   dddddddd-dddd-dddd-dddd-000000000003
-- org_b:                   dddddddd-dddd-dddd-dddd-000000000004
-- cand_a:                  dddddddd-dddd-dddd-dddd-000000000005
-- cand_b:                  dddddddd-dddd-dddd-dddd-000000000006
-- constituency_group_a:    dddddddd-dddd-dddd-dddd-000000000007
-- constituency_group_b:    dddddddd-dddd-dddd-dddd-000000000008
-- constituency_a:          dddddddd-dddd-dddd-dddd-000000000009
-- constituency_b:          dddddddd-dddd-dddd-dddd-000000000010
-- question_category_a:     dddddddd-dddd-dddd-dddd-000000000013
-- question_category_b:     dddddddd-dddd-dddd-dddd-000000000014
-- question_a:              dddddddd-dddd-dddd-dddd-000000000015
-- question_b:              dddddddd-dddd-dddd-dddd-000000000016
-- nomination_org_a:        dddddddd-dddd-dddd-dddd-000000000017
-- nomination_cand_a:       dddddddd-dddd-dddd-dddd-000000000018
-- nomination_org_b:        dddddddd-dddd-dddd-dddd-000000000019
-- nomination_cand_b:       dddddddd-dddd-dddd-dddd-000000000020
-- faction_a:               dddddddd-dddd-dddd-dddd-000000000021
-- faction_b:               dddddddd-dddd-dddd-dddd-000000000022
-- alliance_a:              dddddddd-dddd-dddd-dddd-000000000023
-- alliance_b:              dddddddd-dddd-dddd-dddd-000000000024
-- app_settings_a:          dddddddd-dddd-dddd-dddd-000000000025
-- app_settings_b:          dddddddd-dddd-dddd-dddd-000000000026
-- cand_a2:                 dddddddd-dddd-dddd-dddd-000000000027
-- feedback_a:              dddddddd-dddd-dddd-dddd-000000000028
-- feedback_b:              dddddddd-dddd-dddd-dddd-000000000029
-- admin_job_a:             dddddddd-dddd-dddd-dddd-000000000030

--------------------------------------------------------------------------------
-- test_user_id: map user name to predictable UUID
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION test_user_id(user_name text)
RETURNS uuid
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE user_name
    WHEN 'admin_a'         THEN 'cccccccc-cccc-cccc-cccc-000000000001'::uuid
    WHEN 'admin_b'         THEN 'cccccccc-cccc-cccc-cccc-000000000002'::uuid
    WHEN 'candidate_a'     THEN 'cccccccc-cccc-cccc-cccc-000000000003'::uuid
    WHEN 'candidate_b'     THEN 'cccccccc-cccc-cccc-cccc-000000000004'::uuid
    WHEN 'party_a'         THEN 'cccccccc-cccc-cccc-cccc-000000000005'::uuid
    WHEN 'super_admin'     THEN 'cccccccc-cccc-cccc-cccc-000000000006'::uuid
    WHEN 'account_admin_a' THEN 'cccccccc-cccc-cccc-cccc-000000000007'::uuid
    WHEN 'candidate_a2'    THEN 'cccccccc-cccc-cccc-cccc-000000000008'::uuid
    ELSE NULL
  END;
$$;

--------------------------------------------------------------------------------
-- test_id: map entity name to predictable UUID
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION test_id(entity_name text)
RETURNS uuid
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE entity_name
    -- Accounts
    WHEN 'account_a'            THEN '11111111-1111-1111-1111-111111111111'::uuid
    WHEN 'account_b'            THEN '22222222-2222-2222-2222-222222222222'::uuid
    -- Projects
    WHEN 'project_a'            THEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
    WHEN 'project_b'            THEN 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
    -- Elections
    WHEN 'election_a'           THEN 'dddddddd-dddd-dddd-dddd-000000000001'::uuid
    WHEN 'election_b'           THEN 'dddddddd-dddd-dddd-dddd-000000000002'::uuid
    -- Organizations
    WHEN 'org_a'                THEN 'dddddddd-dddd-dddd-dddd-000000000003'::uuid
    WHEN 'org_b'                THEN 'dddddddd-dddd-dddd-dddd-000000000004'::uuid
    -- Candidates
    WHEN 'candidate_a'          THEN 'dddddddd-dddd-dddd-dddd-000000000005'::uuid
    WHEN 'candidate_b'          THEN 'dddddddd-dddd-dddd-dddd-000000000006'::uuid
    WHEN 'candidate_a2'         THEN 'dddddddd-dddd-dddd-dddd-000000000027'::uuid
    -- Constituency groups
    WHEN 'constituency_group_a' THEN 'dddddddd-dddd-dddd-dddd-000000000007'::uuid
    WHEN 'constituency_group_b' THEN 'dddddddd-dddd-dddd-dddd-000000000008'::uuid
    -- Constituencies
    WHEN 'constituency_a'       THEN 'dddddddd-dddd-dddd-dddd-000000000009'::uuid
    WHEN 'constituency_b'       THEN 'dddddddd-dddd-dddd-dddd-000000000010'::uuid
    -- Question categories
    WHEN 'question_category_a'  THEN 'dddddddd-dddd-dddd-dddd-000000000013'::uuid
    WHEN 'question_category_b'  THEN 'dddddddd-dddd-dddd-dddd-000000000014'::uuid
    -- Questions
    WHEN 'question_a'           THEN 'dddddddd-dddd-dddd-dddd-000000000015'::uuid
    WHEN 'question_b'           THEN 'dddddddd-dddd-dddd-dddd-000000000016'::uuid
    -- Nominations
    WHEN 'nomination_org_a'     THEN 'dddddddd-dddd-dddd-dddd-000000000017'::uuid
    WHEN 'nomination_cand_a'    THEN 'dddddddd-dddd-dddd-dddd-000000000018'::uuid
    WHEN 'nomination_org_b'     THEN 'dddddddd-dddd-dddd-dddd-000000000019'::uuid
    WHEN 'nomination_cand_b'    THEN 'dddddddd-dddd-dddd-dddd-000000000020'::uuid
    -- Factions
    WHEN 'faction_a'            THEN 'dddddddd-dddd-dddd-dddd-000000000021'::uuid
    WHEN 'faction_b'            THEN 'dddddddd-dddd-dddd-dddd-000000000022'::uuid
    -- Alliances
    WHEN 'alliance_a'           THEN 'dddddddd-dddd-dddd-dddd-000000000023'::uuid
    WHEN 'alliance_b'           THEN 'dddddddd-dddd-dddd-dddd-000000000024'::uuid
    -- App settings
    WHEN 'app_settings_a'       THEN 'dddddddd-dddd-dddd-dddd-000000000025'::uuid
    WHEN 'app_settings_b'       THEN 'dddddddd-dddd-dddd-dddd-000000000026'::uuid
    -- Feedback
    WHEN 'feedback_a'           THEN 'dddddddd-dddd-dddd-dddd-000000000028'::uuid
    WHEN 'feedback_b'           THEN 'dddddddd-dddd-dddd-dddd-000000000029'::uuid
    -- Admin jobs
    WHEN 'admin_job_a'          THEN 'dddddddd-dddd-dddd-dddd-000000000030'::uuid
    ELSE NULL
  END;
$$;

--------------------------------------------------------------------------------
-- test_user_roles: map user name to JWT user_roles claim array
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION test_user_roles(user_name text)
RETURNS jsonb
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE user_name
    WHEN 'admin_a' THEN
      jsonb_build_array(jsonb_build_object(
        'role', 'project_admin',
        'scope_type', 'project',
        'scope_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      ))
    WHEN 'admin_b' THEN
      jsonb_build_array(jsonb_build_object(
        'role', 'project_admin',
        'scope_type', 'project',
        'scope_id', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
      ))
    WHEN 'candidate_a' THEN
      jsonb_build_array(jsonb_build_object(
        'role', 'candidate',
        'scope_type', 'candidate',
        'scope_id', 'dddddddd-dddd-dddd-dddd-000000000005'
      ))
    WHEN 'candidate_b' THEN
      jsonb_build_array(jsonb_build_object(
        'role', 'candidate',
        'scope_type', 'candidate',
        'scope_id', 'dddddddd-dddd-dddd-dddd-000000000006'
      ))
    WHEN 'candidate_a2' THEN
      jsonb_build_array(jsonb_build_object(
        'role', 'candidate',
        'scope_type', 'candidate',
        'scope_id', 'dddddddd-dddd-dddd-dddd-000000000027'
      ))
    WHEN 'party_a' THEN
      jsonb_build_array(jsonb_build_object(
        'role', 'party',
        'scope_type', 'party',
        'scope_id', 'dddddddd-dddd-dddd-dddd-000000000003'
      ))
    WHEN 'super_admin' THEN
      jsonb_build_array(jsonb_build_object(
        'role', 'super_admin',
        'scope_type', 'global',
        'scope_id', NULL
      ))
    WHEN 'account_admin_a' THEN
      jsonb_build_array(jsonb_build_object(
        'role', 'account_admin',
        'scope_type', 'account',
        'scope_id', '11111111-1111-1111-1111-111111111111'
      ))
    ELSE '[]'::jsonb
  END;
$$;

--------------------------------------------------------------------------------
-- set_test_user: simulate a Supabase user with JWT claims
--
-- For 'anon': sets role to anon, clears JWT claims
-- For 'authenticated': sets role to authenticated, builds full JWT claims
--   with sub, role, and user_roles fields
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_test_user(
  p_role text,
  p_user_id uuid DEFAULT NULL,
  p_user_roles jsonb DEFAULT '[]'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  claims text;
BEGIN
  IF p_role = 'anon' THEN
    PERFORM set_config('role', 'anon', true);
    PERFORM set_config('request.jwt.claims', '', true);
    PERFORM set_config('request.jwt.claim.sub', '', true);
    RETURN;
  END IF;

  -- Build JWT claims JSON
  claims := json_build_object(
    'sub', p_user_id::text,
    'role', 'authenticated',
    'user_roles', p_user_roles
  )::text;

  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', claims, true);
  PERFORM set_config('request.jwt.claim.sub', p_user_id::text, true);
END;
$$;

--------------------------------------------------------------------------------
-- reset_role: switch back to postgres superuser for fixture operations
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reset_role()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('role', 'postgres', true);
END;
$$;

--------------------------------------------------------------------------------
-- create_test_data: create a complete multi-tenant test dataset
--
-- Creates:
--   2 accounts, 2 projects
--   8 auth.users
--   Corresponding user_roles entries
--   Full entity hierarchy in each project
--   Project A data: published=true, Project B data: published=false
--
-- MUST be called while in the postgres role (the default at test start).
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_test_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- ===== Auth users =====
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, aud, role, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
  VALUES
    (test_user_id('admin_a'),         '00000000-0000-0000-0000-000000000000', 'admin_a@test.com',         crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (test_user_id('admin_b'),         '00000000-0000-0000-0000-000000000000', 'admin_b@test.com',         crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (test_user_id('candidate_a'),     '00000000-0000-0000-0000-000000000000', 'candidate_a@test.com',     crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (test_user_id('candidate_b'),     '00000000-0000-0000-0000-000000000000', 'candidate_b@test.com',     crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (test_user_id('candidate_a2'),    '00000000-0000-0000-0000-000000000000', 'candidate_a2@test.com',    crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (test_user_id('party_a'),         '00000000-0000-0000-0000-000000000000', 'party_a@test.com',         crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (test_user_id('super_admin'),     '00000000-0000-0000-0000-000000000000', 'super_admin@test.com',     crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (test_user_id('account_admin_a'), '00000000-0000-0000-0000-000000000000', 'account_admin_a@test.com', crypt('testpass', gen_salt('bf')), 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

  -- ===== Accounts =====
  INSERT INTO accounts (id, name) VALUES
    (test_id('account_a'), 'Account A'),
    (test_id('account_b'), 'Account B');

  -- ===== Projects =====
  INSERT INTO projects (id, account_id, name) VALUES
    (test_id('project_a'), test_id('account_a'), 'Project A'),
    (test_id('project_b'), test_id('account_b'), 'Project B');

  -- ===== User roles =====
  INSERT INTO user_roles (user_id, role, scope_type, scope_id) VALUES
    (test_user_id('admin_a'),         'project_admin', 'project',   test_id('project_a')),
    (test_user_id('admin_b'),         'project_admin', 'project',   test_id('project_b')),
    (test_user_id('candidate_a'),     'candidate',     'candidate', test_id('candidate_a')),
    (test_user_id('candidate_b'),     'candidate',     'candidate', test_id('candidate_b')),
    (test_user_id('candidate_a2'),    'candidate',     'candidate', test_id('candidate_a2')),
    (test_user_id('party_a'),         'party',         'party',     test_id('org_a')),
    (test_user_id('super_admin'),     'super_admin',   'global',    NULL),
    (test_user_id('account_admin_a'), 'account_admin', 'account',   test_id('account_a'));

  -- ===== Elections =====
  INSERT INTO elections (id, project_id, name, published) VALUES
    (test_id('election_a'), test_id('project_a'), '{"en":"Election A"}'::jsonb, true),
    (test_id('election_b'), test_id('project_b'), '{"en":"Election B"}'::jsonb, false);

  -- ===== Constituency groups =====
  INSERT INTO constituency_groups (id, project_id, name, published) VALUES
    (test_id('constituency_group_a'), test_id('project_a'), '{"en":"CG A"}'::jsonb, true),
    (test_id('constituency_group_b'), test_id('project_b'), '{"en":"CG B"}'::jsonb, false);

  -- ===== Constituencies =====
  INSERT INTO constituencies (id, project_id, name, published) VALUES
    (test_id('constituency_a'), test_id('project_a'), '{"en":"Constituency A"}'::jsonb, true),
    (test_id('constituency_b'), test_id('project_b'), '{"en":"Constituency B"}'::jsonb, false);

  -- ===== Join tables =====
  INSERT INTO constituency_group_constituencies (constituency_group_id, constituency_id) VALUES
    (test_id('constituency_group_a'), test_id('constituency_a')),
    (test_id('constituency_group_b'), test_id('constituency_b'));

  INSERT INTO election_constituency_groups (election_id, constituency_group_id) VALUES
    (test_id('election_a'), test_id('constituency_group_a')),
    (test_id('election_b'), test_id('constituency_group_b'));

  -- ===== Organizations =====
  INSERT INTO organizations (id, project_id, auth_user_id, name, published) VALUES
    (test_id('org_a'), test_id('project_a'), test_user_id('party_a'), '{"en":"Org A"}'::jsonb, true),
    (test_id('org_b'), test_id('project_b'), NULL,                    '{"en":"Org B"}'::jsonb, false);

  -- ===== Candidates (no answers to avoid trigger complications) =====
  INSERT INTO candidates (id, project_id, auth_user_id, first_name, last_name, organization_id, published) VALUES
    (test_id('candidate_a'),  test_id('project_a'), test_user_id('candidate_a'),  'Alice', 'Alpha',   test_id('org_a'), true),
    (test_id('candidate_b'),  test_id('project_b'), test_user_id('candidate_b'),  'Bob',   'Bravo',   test_id('org_b'), false),
    (test_id('candidate_a2'), test_id('project_a'), test_user_id('candidate_a2'), 'Carol', 'Charlie', test_id('org_a'), true);

  -- ===== Factions =====
  INSERT INTO factions (id, project_id, name, published) VALUES
    (test_id('faction_a'), test_id('project_a'), '{"en":"Faction A"}'::jsonb, true),
    (test_id('faction_b'), test_id('project_b'), '{"en":"Faction B"}'::jsonb, false);

  -- ===== Alliances =====
  INSERT INTO alliances (id, project_id, name, published) VALUES
    (test_id('alliance_a'), test_id('project_a'), '{"en":"Alliance A"}'::jsonb, true),
    (test_id('alliance_b'), test_id('project_b'), '{"en":"Alliance B"}'::jsonb, false);

  -- ===== Question categories =====
  INSERT INTO question_categories (id, project_id, name, published) VALUES
    (test_id('question_category_a'), test_id('project_a'), '{"en":"Category A"}'::jsonb, true),
    (test_id('question_category_b'), test_id('project_b'), '{"en":"Category B"}'::jsonb, false);

  -- ===== Questions =====
  INSERT INTO questions (id, project_id, type, category_id, name, choices, published) VALUES
    (test_id('question_a'), test_id('project_a'), 'singleChoiceOrdinal', test_id('question_category_a'), '{"en":"Question A"}'::jsonb, '[{"id":1,"label":{"en":"Agree"}},{"id":2,"label":{"en":"Disagree"}}]'::jsonb, true),
    (test_id('question_b'), test_id('project_b'), 'singleChoiceOrdinal', test_id('question_category_b'), '{"en":"Question B"}'::jsonb, '[{"id":1,"label":{"en":"Agree"}},{"id":2,"label":{"en":"Disagree"}}]'::jsonb, false);

  -- ===== Nominations (org nomination first, then candidate under it) =====
  INSERT INTO nominations (id, project_id, organization_id, election_id, constituency_id, election_round, published) VALUES
    (test_id('nomination_org_a'), test_id('project_a'), test_id('org_a'), test_id('election_a'), test_id('constituency_a'), 1, true);

  INSERT INTO nominations (id, project_id, candidate_id, election_id, constituency_id, election_round, parent_nomination_id, published) VALUES
    (test_id('nomination_cand_a'), test_id('project_a'), test_id('candidate_a'), test_id('election_a'), test_id('constituency_a'), 1, test_id('nomination_org_a'), true);

  INSERT INTO nominations (id, project_id, organization_id, election_id, constituency_id, election_round, published) VALUES
    (test_id('nomination_org_b'), test_id('project_b'), test_id('org_b'), test_id('election_b'), test_id('constituency_b'), 1, false);

  INSERT INTO nominations (id, project_id, candidate_id, election_id, constituency_id, election_round, parent_nomination_id, published) VALUES
    (test_id('nomination_cand_b'), test_id('project_b'), test_id('candidate_b'), test_id('election_b'), test_id('constituency_b'), 1, test_id('nomination_org_b'), false);

  -- ===== App settings =====
  INSERT INTO app_settings (id, project_id, settings) VALUES
    (test_id('app_settings_a'), test_id('project_a'), '{"theme":"light"}'::jsonb),
    (test_id('app_settings_b'), test_id('project_b'), '{"theme":"dark"}'::jsonb);

  -- ===== Feedback =====
  -- Insert as superuser (bypasses RLS and rate limiting trigger context)
  INSERT INTO feedback (id, project_id, rating, description, date, created_at) VALUES
    (test_id('feedback_a'), test_id('project_a'), 5, 'Great app!',  now(), now()),
    (test_id('feedback_b'), test_id('project_b'), 3, 'Decent app.', now(), now());

  -- ===== Admin jobs =====
  INSERT INTO admin_jobs (id, project_id, job_id, job_type, election_id, author, end_status, start_time, end_time, input, output, messages, metadata) VALUES
    (test_id('admin_job_a'), test_id('project_a'), 'job-001', 'QuestionInfoGeneration', test_id('election_a'), 'admin_a@test.com', 'completed', now() - interval '10 minutes', now(), '{"param":"value"}'::jsonb, '{"result":"ok"}'::jsonb, '[{"text":"Processing..."}]'::jsonb, '{"questionsProcessed":5}'::jsonb);

END;
$$;

-- ======================================================================
-- Phase 2: Smoke tests (in a transaction that rolls back)
-- ======================================================================

BEGIN;

SET search_path = public, extensions;

SELECT no_plan();

SELECT ok(true, 'pgTAP loaded successfully');

-- Test create_test_data
SELECT create_test_data();

SELECT ok(
  (SELECT count(*) FROM accounts WHERE id = test_id('account_a'))::integer = 1,
  'Account A created'
);

SELECT ok(
  (SELECT count(*) FROM accounts WHERE id = test_id('account_b'))::integer = 1,
  'Account B created'
);

SELECT ok(
  (SELECT count(*) FROM projects WHERE id = test_id('project_a'))::integer = 1,
  'Project A created'
);

SELECT ok(
  (SELECT count(*) FROM candidates WHERE id = test_id('candidate_a'))::integer = 1,
  'Candidate A created'
);

-- Test set_test_user round-trip
SELECT set_test_user(
  'authenticated',
  test_user_id('admin_a'),
  test_user_roles('admin_a')
);

SELECT is(
  (SELECT auth.uid())::text,
  test_user_id('admin_a')::text,
  'auth.uid() returns admin_a UUID after set_test_user'
);

SELECT ok(
  (SELECT auth.jwt() -> 'user_roles') IS NOT NULL,
  'auth.jwt() user_roles is not null after set_test_user'
);

-- Test anon mode
SELECT set_test_user('anon');

SELECT is(
  current_setting('role', true),
  'anon',
  'set_test_user(anon) sets role to anon'
);

-- Reset to postgres for cleanup
SELECT reset_role();

SELECT * FROM finish();
ROLLBACK;
