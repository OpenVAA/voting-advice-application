-- generate-shared-data.sql
--
-- Generate shared benchmark data: accounts, projects, elections, constituencies,
-- constituency groups, question templates, question categories, and questions.
--
-- Usage: psql $DB_URL -v scale=1000 -f generate-shared-data.sql
--
-- The `scale` variable determines candidate counts (handled by generate-candidates-*.sql).
-- This script creates the shared infrastructure that both schema variants need.
--
-- UUID patterns (predictable for pgbench variable binding):
--   Accounts:            00000000-0000-0000-0000-{lpad(n,12,'0')} for n=1..5
--   Projects:            00000000-0000-0000-0001-{lpad(n,12,'0')} for n=1..5
--   Constituencies:      00000000-0000-0000-0002-{lpad(n,12,'0')} for n=1..50 (10 per project)
--   Questions:           00000000-0000-0000-0003-{lpad(n,12,'0')} for n=1..250 (50 per project)
--   Elections:           00000000-0000-0000-0004-{lpad(n,12,'0')} for n=1..5
--   Constituency groups: 00000000-0000-0000-0005-{lpad(n,12,'0')} for n=1..5
--   Question templates:  00000000-0000-0000-0006-{lpad(n,12,'0')} for n=1..5
--   Question categories: 00000000-0000-0000-0007-{lpad(n,12,'0')} for n=1..25 (5 per project)

BEGIN;

--------------------------------------------------------------------------------
-- Clean up prior benchmark data (idempotent)
--------------------------------------------------------------------------------
-- Delete in reverse dependency order. CASCADE on project_id handles most children.
-- First remove app_settings that may reference seed/benchmark projects (FK constraint).
DELETE FROM app_settings WHERE project_id IN (
  SELECT ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid
  FROM generate_series(1, 5) AS n
);
DELETE FROM app_settings WHERE project_id IN (
  SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid
  FROM generate_series(1, 5) AS n
);
-- Remove seed user_roles and auth.users that reference seed project/candidates
DELETE FROM user_roles WHERE scope_id IN (
  SELECT ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid
  FROM generate_series(1, 50) AS n
);
DELETE FROM auth.users WHERE id IN (
  SELECT ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid
  FROM generate_series(1, 50) AS n
);
-- Now safe to delete projects (seed project uses 0000- pattern, benchmark uses 0001-)
DELETE FROM projects WHERE id IN (
  SELECT ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid
  FROM generate_series(1, 5) AS n
);
DELETE FROM projects WHERE id IN (
  SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid
  FROM generate_series(1, 5) AS n
);
DELETE FROM accounts WHERE id IN (
  SELECT ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid
  FROM generate_series(1, 5) AS n
);

--------------------------------------------------------------------------------
-- Accounts (5)
--------------------------------------------------------------------------------
INSERT INTO accounts (id, name)
SELECT
  ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  'Benchmark Account ' || n
FROM generate_series(1, 5) AS n
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- Projects (5, one per account)
--------------------------------------------------------------------------------
INSERT INTO projects (id, account_id, name, default_locale)
SELECT
  ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid,
  ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  'Benchmark Project ' || n,
  'fi'
FROM generate_series(1, 5) AS n
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- Elections (1 per project = 5 total)
--------------------------------------------------------------------------------
INSERT INTO elections (id, project_id, name, election_date, election_type, published)
SELECT
  ('00000000-0000-0000-0004-' || lpad(n::text, 12, '0'))::uuid,
  ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid,
  jsonb_build_object(
    'fi', 'Benchmarkvaalit ' || n,
    'sv', 'Benchmarkval ' || n,
    'en', 'Benchmark Election ' || n
  ),
  '2026-06-01',
  'parliamentary',
  true
FROM generate_series(1, 5) AS n
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- Constituency groups (1 per election = 5 total)
--------------------------------------------------------------------------------
INSERT INTO constituency_groups (id, project_id, name, published)
SELECT
  ('00000000-0000-0000-0005-' || lpad(n::text, 12, '0'))::uuid,
  ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid,
  jsonb_build_object(
    'fi', 'Vaalipiiriryhmä ' || n,
    'sv', 'Valkretsar ' || n,
    'en', 'Constituency Group ' || n
  ),
  true
FROM generate_series(1, 5) AS n
ON CONFLICT DO NOTHING;

-- Link constituency groups to elections
INSERT INTO election_constituency_groups (election_id, constituency_group_id)
SELECT
  ('00000000-0000-0000-0004-' || lpad(n::text, 12, '0'))::uuid,
  ('00000000-0000-0000-0005-' || lpad(n::text, 12, '0'))::uuid
FROM generate_series(1, 5) AS n
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- Constituencies (10 per project = 50 total)
-- Numbering: project 1 gets constituencies 1-10, project 2 gets 11-20, etc.
--------------------------------------------------------------------------------
INSERT INTO constituencies (id, project_id, name, published)
SELECT
  ('00000000-0000-0000-0002-' || lpad(c_num::text, 12, '0'))::uuid,
  ('00000000-0000-0000-0001-' || lpad(p_num::text, 12, '0'))::uuid,
  jsonb_build_object(
    'fi', 'Vaalipiiri ' || c_num,
    'sv', 'Valkrets ' || c_num,
    'en', 'Constituency ' || c_num
  ),
  true
FROM generate_series(1, 5) AS p_num,
     generate_series(1, 10) AS c_idx,
     LATERAL (SELECT (p_num - 1) * 10 + c_idx AS c_num) AS x
ON CONFLICT DO NOTHING;

-- Link constituencies to their constituency groups
INSERT INTO constituency_group_constituencies (constituency_group_id, constituency_id)
SELECT
  ('00000000-0000-0000-0005-' || lpad(p_num::text, 12, '0'))::uuid,
  ('00000000-0000-0000-0002-' || lpad(((p_num - 1) * 10 + c_idx)::text, 12, '0'))::uuid
FROM generate_series(1, 5) AS p_num,
     generate_series(1, 10) AS c_idx
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- Question templates (1 per project = 5 total)
-- singleChoiceOrdinal with 5 default_choices (Likert scale)
--------------------------------------------------------------------------------
INSERT INTO question_templates (id, project_id, type, name, default_choices)
SELECT
  ('00000000-0000-0000-0006-' || lpad(n::text, 12, '0'))::uuid,
  ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid,
  'singleChoiceOrdinal'::question_type,
  jsonb_build_object(
    'fi', 'Likert-asteikko',
    'sv', 'Likert-skala',
    'en', 'Likert Scale'
  ),
  jsonb_build_array(
    jsonb_build_object('id', 1, 'label', jsonb_build_object('fi', 'Täysin eri mieltä', 'sv', 'Helt av annan åsikt', 'en', 'Strongly disagree')),
    jsonb_build_object('id', 2, 'label', jsonb_build_object('fi', 'Jokseenkin eri mieltä', 'sv', 'Delvis av annan åsikt', 'en', 'Disagree')),
    jsonb_build_object('id', 3, 'label', jsonb_build_object('fi', 'Ei samaa eikä eri mieltä', 'sv', 'Varken eller', 'en', 'Neutral')),
    jsonb_build_object('id', 4, 'label', jsonb_build_object('fi', 'Jokseenkin samaa mieltä', 'sv', 'Delvis av samma åsikt', 'en', 'Agree')),
    jsonb_build_object('id', 5, 'label', jsonb_build_object('fi', 'Täysin samaa mieltä', 'sv', 'Helt av samma åsikt', 'en', 'Strongly agree'))
  )
FROM generate_series(1, 5) AS n
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- Question categories (5 per project = 25 total)
-- Numbering: project 1 gets categories 1-5, project 2 gets 6-10, etc.
--------------------------------------------------------------------------------
INSERT INTO question_categories (id, project_id, category_type, name, published)
SELECT
  ('00000000-0000-0000-0007-' || lpad(cat_num::text, 12, '0'))::uuid,
  ('00000000-0000-0000-0001-' || lpad(p_num::text, 12, '0'))::uuid,
  'opinion'::category_type,
  jsonb_build_object(
    'fi', 'Kategoria ' || cat_idx,
    'sv', 'Kategori ' || cat_idx,
    'en', 'Category ' || cat_idx
  ),
  true
FROM generate_series(1, 5) AS p_num,
     generate_series(1, 5) AS cat_idx,
     LATERAL (SELECT (p_num - 1) * 5 + cat_idx AS cat_num) AS x
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- Questions (50 per project = 250 total, 10 per category)
-- Numbering: project 1 gets questions 1-50, project 2 gets 51-100, etc.
-- Each question references its project's template and one of the 5 categories.
--------------------------------------------------------------------------------
INSERT INTO questions (id, project_id, type, category_id, template_id, name, published)
SELECT
  ('00000000-0000-0000-0003-' || lpad(q_num::text, 12, '0'))::uuid,
  ('00000000-0000-0000-0001-' || lpad(p_num::text, 12, '0'))::uuid,
  'singleChoiceOrdinal'::question_type,
  -- Category: questions 1-10 -> cat 1, 11-20 -> cat 2, etc.
  ('00000000-0000-0000-0007-' || lpad(((p_num - 1) * 5 + ((q_idx - 1) / 10) + 1)::text, 12, '0'))::uuid,
  ('00000000-0000-0000-0006-' || lpad(p_num::text, 12, '0'))::uuid,
  jsonb_build_object(
    'fi', 'Kysymys ' || q_idx || ' (Projekti ' || p_num || ')',
    'sv', 'Fråga ' || q_idx || ' (Projekt ' || p_num || ')',
    'en', 'Question ' || q_idx || ' (Project ' || p_num || ')'
  ),
  true
FROM generate_series(1, 5) AS p_num,
     generate_series(1, 50) AS q_idx,
     LATERAL (SELECT (p_num - 1) * 50 + q_idx AS q_num) AS x
ON CONFLICT DO NOTHING;

COMMIT;

-- Report summary
SELECT 'Shared data generation complete' AS status,
  (SELECT count(*) FROM accounts WHERE id IN (
    SELECT ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid FROM generate_series(1, 5) AS n
  )) AS accounts,
  (SELECT count(*) FROM projects WHERE id IN (
    SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid FROM generate_series(1, 5) AS n
  )) AS projects,
  (SELECT count(*) FROM elections WHERE id IN (
    SELECT ('00000000-0000-0000-0004-' || lpad(n::text, 12, '0'))::uuid FROM generate_series(1, 5) AS n
  )) AS elections,
  (SELECT count(*) FROM constituencies WHERE project_id IN (
    SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid FROM generate_series(1, 5) AS n
  )) AS constituencies,
  (SELECT count(*) FROM questions WHERE project_id IN (
    SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid FROM generate_series(1, 5) AS n
  )) AS questions;
