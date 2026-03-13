-- Migration: Enable Row Level Security on all tables with placeholder deny-all policies
-- Phase 9 Plan 02 Task 2
--
-- Every table (including join tables) gets RLS enabled with a deny-all placeholder.
-- This ensures:
-- 1. `supabase db lint` shows no RLS warnings
-- 2. All tables are locked down by default
-- 3. service_role bypasses RLS automatically in Supabase
-- 4. Phase 10 will DROP these placeholder policies and CREATE real role-based ones

--------------------------------------------------------------------------------
-- accounts
--------------------------------------------------------------------------------
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_deny_all" ON accounts
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- projects
--------------------------------------------------------------------------------
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_deny_all" ON projects
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- elections
--------------------------------------------------------------------------------
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "elections_deny_all" ON elections
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- constituency_groups
--------------------------------------------------------------------------------
ALTER TABLE constituency_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "constituency_groups_deny_all" ON constituency_groups
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- constituencies
--------------------------------------------------------------------------------
ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "constituencies_deny_all" ON constituencies
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- constituency_group_constituencies (join table)
--------------------------------------------------------------------------------
ALTER TABLE constituency_group_constituencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "constituency_group_constituencies_deny_all" ON constituency_group_constituencies
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- election_constituency_groups (join table)
--------------------------------------------------------------------------------
ALTER TABLE election_constituency_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "election_constituency_groups_deny_all" ON election_constituency_groups
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- organizations
--------------------------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_deny_all" ON organizations
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- candidates
--------------------------------------------------------------------------------
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidates_deny_all" ON candidates
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- factions
--------------------------------------------------------------------------------
ALTER TABLE factions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "factions_deny_all" ON factions
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- alliances
--------------------------------------------------------------------------------
ALTER TABLE alliances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alliances_deny_all" ON alliances
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- question_templates
--------------------------------------------------------------------------------
ALTER TABLE question_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "question_templates_deny_all" ON question_templates
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- question_categories
--------------------------------------------------------------------------------
ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "question_categories_deny_all" ON question_categories
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- questions
--------------------------------------------------------------------------------
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_deny_all" ON questions
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- nominations
--------------------------------------------------------------------------------
ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nominations_deny_all" ON nominations
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- app_settings
--------------------------------------------------------------------------------
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings_deny_all" ON app_settings
  FOR ALL
  USING (false);

--------------------------------------------------------------------------------
-- answers
--------------------------------------------------------------------------------
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "answers_deny_all" ON answers
  FOR ALL
  USING (false);
