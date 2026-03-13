-- B-tree indexes on RLS-referenced and commonly filtered columns

--------------------------------------------------------------------------------
-- project_id indexes (every content table)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_elections_project_id ON elections (project_id);
CREATE INDEX IF NOT EXISTS idx_constituency_groups_project_id ON constituency_groups (project_id);
CREATE INDEX IF NOT EXISTS idx_constituencies_project_id ON constituencies (project_id);
CREATE INDEX IF NOT EXISTS idx_organizations_project_id ON organizations (project_id);
CREATE INDEX IF NOT EXISTS idx_candidates_project_id ON candidates (project_id);
CREATE INDEX IF NOT EXISTS idx_factions_project_id ON factions (project_id);
CREATE INDEX IF NOT EXISTS idx_alliances_project_id ON alliances (project_id);
CREATE INDEX IF NOT EXISTS idx_question_templates_project_id ON question_templates (project_id);
CREATE INDEX IF NOT EXISTS idx_question_categories_project_id ON question_categories (project_id);
CREATE INDEX IF NOT EXISTS idx_questions_project_id ON questions (project_id);
CREATE INDEX IF NOT EXISTS idx_nominations_project_id ON nominations (project_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_project_id ON app_settings (project_id);

--------------------------------------------------------------------------------
-- FK reference column indexes
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_projects_account_id ON projects (account_id);
CREATE INDEX IF NOT EXISTS idx_candidates_organization_id ON candidates (organization_id);
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions (category_id);
CREATE INDEX IF NOT EXISTS idx_questions_template_id ON questions (template_id);
CREATE INDEX IF NOT EXISTS idx_constituencies_parent_id ON constituencies (parent_id);

-- Nomination FK indexes
CREATE INDEX IF NOT EXISTS idx_nominations_candidate_id ON nominations (candidate_id);
CREATE INDEX IF NOT EXISTS idx_nominations_organization_id ON nominations (organization_id);
CREATE INDEX IF NOT EXISTS idx_nominations_faction_id ON nominations (faction_id);
CREATE INDEX IF NOT EXISTS idx_nominations_alliance_id ON nominations (alliance_id);
CREATE INDEX IF NOT EXISTS idx_nominations_election_id ON nominations (election_id);
CREATE INDEX IF NOT EXISTS idx_nominations_constituency_id ON nominations (constituency_id);
CREATE INDEX IF NOT EXISTS idx_nominations_parent_nomination_id ON nominations (parent_nomination_id);

--------------------------------------------------------------------------------
-- auth_user_id indexes (columns defined in 003-entities.sql)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_candidates_auth_user_id ON candidates (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_auth_user_id ON organizations (auth_user_id);
