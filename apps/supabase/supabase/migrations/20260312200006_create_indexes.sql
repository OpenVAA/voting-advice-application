-- Migration: Create B-tree indexes on all RLS-referenced and commonly filtered columns
-- Phase 9 Plan 02 Task 2
--
-- These indexes support:
-- 1. RLS policies that filter by project_id (Phase 10)
-- 2. Common query patterns (FK lookups, entity resolution)
-- 3. Efficient seed data and answer validation joins
--
-- Uses CREATE INDEX IF NOT EXISTS for resilience (safe to re-run).

--------------------------------------------------------------------------------
-- project_id indexes (every content table)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_elections_project_id
  ON elections (project_id);

CREATE INDEX IF NOT EXISTS idx_constituency_groups_project_id
  ON constituency_groups (project_id);

CREATE INDEX IF NOT EXISTS idx_constituencies_project_id
  ON constituencies (project_id);

CREATE INDEX IF NOT EXISTS idx_organizations_project_id
  ON organizations (project_id);

CREATE INDEX IF NOT EXISTS idx_candidates_project_id
  ON candidates (project_id);

CREATE INDEX IF NOT EXISTS idx_factions_project_id
  ON factions (project_id);

CREATE INDEX IF NOT EXISTS idx_alliances_project_id
  ON alliances (project_id);

CREATE INDEX IF NOT EXISTS idx_question_templates_project_id
  ON question_templates (project_id);

CREATE INDEX IF NOT EXISTS idx_question_categories_project_id
  ON question_categories (project_id);

CREATE INDEX IF NOT EXISTS idx_questions_project_id
  ON questions (project_id);

CREATE INDEX IF NOT EXISTS idx_nominations_project_id
  ON nominations (project_id);

CREATE INDEX IF NOT EXISTS idx_app_settings_project_id
  ON app_settings (project_id);

CREATE INDEX IF NOT EXISTS idx_answers_project_id
  ON answers (project_id);

--------------------------------------------------------------------------------
-- FK reference column indexes
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_projects_account_id
  ON projects (account_id);

CREATE INDEX IF NOT EXISTS idx_candidates_organization_id
  ON candidates (organization_id);

CREATE INDEX IF NOT EXISTS idx_questions_category_id
  ON questions (category_id);

CREATE INDEX IF NOT EXISTS idx_questions_template_id
  ON questions (template_id);

CREATE INDEX IF NOT EXISTS idx_nominations_election_id
  ON nominations (election_id);

CREATE INDEX IF NOT EXISTS idx_nominations_constituency_id
  ON nominations (constituency_id);

CREATE INDEX IF NOT EXISTS idx_nominations_entity_id
  ON nominations (entity_id);

CREATE INDEX IF NOT EXISTS idx_nominations_parent_nomination_id
  ON nominations (parent_nomination_id);

CREATE INDEX IF NOT EXISTS idx_constituencies_parent_id
  ON constituencies (parent_id);

CREATE INDEX IF NOT EXISTS idx_answers_entity_id
  ON answers (entity_id);

CREATE INDEX IF NOT EXISTS idx_answers_question_id
  ON answers (question_id);
