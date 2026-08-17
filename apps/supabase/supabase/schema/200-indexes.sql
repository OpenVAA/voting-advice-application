-- B-tree indexes on RLS-referenced and commonly filtered columns

--------------------------------------------------------------------------------
-- project_id indexes (every content table)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_elections_project_id ON public.elections (project_id);
CREATE INDEX IF NOT EXISTS idx_constituency_groups_project_id ON public.constituency_groups (project_id);
CREATE INDEX IF NOT EXISTS idx_constituencies_project_id ON public.constituencies (project_id);
CREATE INDEX IF NOT EXISTS idx_organizations_project_id ON public.organizations (project_id);
CREATE INDEX IF NOT EXISTS idx_candidates_project_id ON public.candidates (project_id);
CREATE INDEX IF NOT EXISTS idx_factions_project_id ON public.factions (project_id);
CREATE INDEX IF NOT EXISTS idx_alliances_project_id ON public.alliances (project_id);
CREATE INDEX IF NOT EXISTS idx_question_categories_project_id ON public.question_categories (project_id);
CREATE INDEX IF NOT EXISTS idx_questions_project_id ON public.questions (project_id);
CREATE INDEX IF NOT EXISTS idx_nominations_project_id ON public.nominations (project_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_project_id ON public.app_settings (project_id);

--------------------------------------------------------------------------------
-- FK reference column indexes
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_projects_account_id ON public.projects (account_id);
CREATE INDEX IF NOT EXISTS idx_candidates_organization_id ON public.candidates (organization_id);
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON public.questions (category_id);
CREATE INDEX IF NOT EXISTS idx_constituencies_parent_id ON public.constituencies (parent_id);

-- Nomination FK indexes
CREATE INDEX IF NOT EXISTS idx_nominations_candidate_id ON public.nominations (candidate_id);
CREATE INDEX IF NOT EXISTS idx_nominations_organization_id ON public.nominations (organization_id);
CREATE INDEX IF NOT EXISTS idx_nominations_faction_id ON public.nominations (faction_id);
CREATE INDEX IF NOT EXISTS idx_nominations_alliance_id ON public.nominations (alliance_id);
CREATE INDEX IF NOT EXISTS idx_nominations_election_id ON public.nominations (election_id);
CREATE INDEX IF NOT EXISTS idx_nominations_constituency_id ON public.nominations (constituency_id);
CREATE INDEX IF NOT EXISTS idx_nominations_parent_nomination_id ON public.nominations (parent_nomination_id);

--------------------------------------------------------------------------------
-- auth_user_id indexes (columns defined in 003-entities.sql)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_candidates_auth_user_id ON public.candidates (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_auth_user_id ON public.organizations (auth_user_id);

-- feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_project_id ON public.feedback (project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback (created_at);

-- admin_jobs indexes
CREATE INDEX IF NOT EXISTS idx_admin_jobs_project_id ON public.admin_jobs (project_id);
CREATE INDEX IF NOT EXISTS idx_admin_jobs_election_id ON public.admin_jobs (election_id);
CREATE INDEX IF NOT EXISTS idx_admin_jobs_job_type ON public.admin_jobs (job_type);
