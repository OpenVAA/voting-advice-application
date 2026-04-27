-- Row Level Security: role-based access control policies
--
-- Replaces deny-all placeholders with real per-operation policies.
-- Uses helper functions from 012-auth-hooks.sql:
--   can_access_project(project_id)  - project_admin, account_admin, super_admin
--   has_role(role, scope_type, scope_id) - check specific role assignment
--   is_candidate_self(auth_user_id) - candidate owns the row
--
-- Policy rules:
--   SELECT  = USING only
--   INSERT  = WITH CHECK only
--   UPDATE  = USING + WITH CHECK
--   DELETE  = USING only
--   Always specify TO anon or TO authenticated
--   Always use (SELECT auth.uid()) and (SELECT auth.jwt()) for optimizer caching

-- =====================================================================
-- accounts (no project_id, no published flag)
-- =====================================================================
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accounts_deny_all" ON public.accounts;

-- Authenticated: account_admin for their account or super_admin
CREATE POLICY "authenticated_select_accounts" ON public.accounts FOR SELECT TO authenticated
  USING (
    (SELECT has_role('account_admin', 'account', id))
    OR (SELECT has_role('super_admin'))
  );

-- Super admin only: insert
CREATE POLICY "admin_insert_accounts" ON public.accounts FOR INSERT TO authenticated
  WITH CHECK ((SELECT has_role('super_admin')));

-- Super admin only: update
CREATE POLICY "admin_update_accounts" ON public.accounts FOR UPDATE TO authenticated
  USING ((SELECT has_role('super_admin')))
  WITH CHECK ((SELECT has_role('super_admin')));

-- Super admin only: delete
CREATE POLICY "admin_delete_accounts" ON public.accounts FOR DELETE TO authenticated
  USING ((SELECT has_role('super_admin')));

-- =====================================================================
-- projects (has account_id, no published flag)
-- =====================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_deny_all" ON public.projects;

-- Authenticated: project access or account_admin or super_admin
CREATE POLICY "authenticated_select_projects" ON public.projects FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(id))
    OR (SELECT has_role('account_admin', 'account', account_id))
    OR (SELECT has_role('super_admin'))
  );

-- Insert: account_admin for the account or super_admin
CREATE POLICY "admin_insert_projects" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT has_role('account_admin', 'account', account_id))
    OR (SELECT has_role('super_admin'))
  );

-- Update: project access (project_admin, account_admin, super_admin)
CREATE POLICY "admin_update_projects" ON public.projects FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(id)))
  WITH CHECK ((SELECT can_access_project(id)));

-- Delete: project access (project_admin, account_admin, super_admin)
CREATE POLICY "admin_delete_projects" ON public.projects FOR DELETE TO authenticated
  USING ((SELECT can_access_project(id)));

-- =====================================================================
-- elections (project_id, published)
-- =====================================================================
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "elections_deny_all" ON public.elections;

CREATE POLICY "anon_select_elections" ON public.elections FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_elections" ON public.elections FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_elections" ON public.elections FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_elections" ON public.elections FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_elections" ON public.elections FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- constituency_groups (project_id, published)
-- =====================================================================
ALTER TABLE public.constituency_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "constituency_groups_deny_all" ON public.constituency_groups;

CREATE POLICY "anon_select_constituency_groups" ON public.constituency_groups FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_constituency_groups" ON public.constituency_groups FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_constituency_groups" ON public.constituency_groups FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_constituency_groups" ON public.constituency_groups FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_constituency_groups" ON public.constituency_groups FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- constituencies (project_id, published)
-- =====================================================================
ALTER TABLE public.constituencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "constituencies_deny_all" ON public.constituencies;

CREATE POLICY "anon_select_constituencies" ON public.constituencies FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_constituencies" ON public.constituencies FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_constituencies" ON public.constituencies FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_constituencies" ON public.constituencies FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_constituencies" ON public.constituencies FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- constituency_group_constituencies (join table, no project_id)
-- =====================================================================
ALTER TABLE public.constituency_group_constituencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "constituency_group_constituencies_deny_all" ON public.constituency_group_constituencies;

-- Anon: structural data, always readable
CREATE POLICY "anon_select_constituency_group_constituencies" ON public.constituency_group_constituencies FOR SELECT TO anon
  USING (true);

-- Authenticated: always readable
CREATE POLICY "authenticated_select_constituency_group_constituencies" ON public.constituency_group_constituencies FOR SELECT TO authenticated
  USING (true);

-- Admin insert: check access via parent constituency_group
CREATE POLICY "admin_insert_constituency_group_constituencies" ON public.constituency_group_constituencies FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.constituency_groups cg
      WHERE cg.id = constituency_group_id
        AND (SELECT can_access_project(cg.project_id))
    )
  );

-- Admin delete: check access via parent constituency_group
CREATE POLICY "admin_delete_constituency_group_constituencies" ON public.constituency_group_constituencies FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.constituency_groups cg
      WHERE cg.id = constituency_group_id
        AND (SELECT can_access_project(cg.project_id))
    )
  );

-- =====================================================================
-- election_constituency_groups (join table, no project_id)
-- =====================================================================
ALTER TABLE public.election_constituency_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "election_constituency_groups_deny_all" ON public.election_constituency_groups;

-- Anon: structural data, always readable
CREATE POLICY "anon_select_election_constituency_groups" ON public.election_constituency_groups FOR SELECT TO anon
  USING (true);

-- Authenticated: always readable
CREATE POLICY "authenticated_select_election_constituency_groups" ON public.election_constituency_groups FOR SELECT TO authenticated
  USING (true);

-- Admin insert: check access via parent election
CREATE POLICY "admin_insert_election_constituency_groups" ON public.election_constituency_groups FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.elections e
      WHERE e.id = election_id
        AND (SELECT can_access_project(e.project_id))
    )
  );

-- Admin delete: check access via parent election
CREATE POLICY "admin_delete_election_constituency_groups" ON public.election_constituency_groups FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.elections e
      WHERE e.id = election_id
        AND (SELECT can_access_project(e.project_id))
    )
  );

-- =====================================================================
-- organizations (project_id, published, auth_user_id)
-- =====================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "organizations_deny_all" ON public.organizations;

CREATE POLICY "anon_select_organizations" ON public.organizations FOR SELECT TO anon
  USING (published = true);

-- Authenticated: project access, own record, or published
CREATE POLICY "authenticated_select_organizations" ON public.organizations FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', id))
    OR published = true
  );

-- Admin insert
CREATE POLICY "admin_insert_organizations" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Party admin self-update: party role holder can update their party
CREATE POLICY "party_update_own_organizations" ON public.organizations FOR UPDATE TO authenticated
  USING (
    auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', id))
  )
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', id))
  );

-- Admin update
CREATE POLICY "admin_update_organizations" ON public.organizations FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Admin delete
CREATE POLICY "admin_delete_organizations" ON public.organizations FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- candidates (project_id, published, auth_user_id)
-- Answers stored as JSONB column -- covered by these policies.
-- =====================================================================
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "candidates_deny_all" ON public.candidates;

CREATE POLICY "anon_select_candidates" ON public.candidates FOR SELECT TO anon
  USING (published = true);

-- Authenticated: project access, own record, party admin for their party's candidates, or published
CREATE POLICY "authenticated_select_candidates" ON public.candidates FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', organization_id))
    OR published = true
  );

-- Admin insert
CREATE POLICY "admin_insert_candidates" ON public.candidates FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Candidate self-update: can update own record
-- Structural field protection (project_id, auth_user_id, organization_id) enforced
-- via column-level REVOKE in 013-auth-rls.sql
CREATE POLICY "candidate_update_own" ON public.candidates FOR UPDATE TO authenticated
  USING (auth_user_id = (SELECT auth.uid()))
  WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- Admin update
CREATE POLICY "admin_update_candidates" ON public.candidates FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Admin delete
CREATE POLICY "admin_delete_candidates" ON public.candidates FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- factions (project_id, published)
-- =====================================================================
ALTER TABLE public.factions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "factions_deny_all" ON public.factions;

CREATE POLICY "anon_select_factions" ON public.factions FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_factions" ON public.factions FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_factions" ON public.factions FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_factions" ON public.factions FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_factions" ON public.factions FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- alliances (project_id, published)
-- =====================================================================
ALTER TABLE public.alliances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "alliances_deny_all" ON public.alliances;

CREATE POLICY "anon_select_alliances" ON public.alliances FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_alliances" ON public.alliances FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_alliances" ON public.alliances FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_alliances" ON public.alliances FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_alliances" ON public.alliances FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- question_categories (project_id, published)
-- =====================================================================
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "question_categories_deny_all" ON public.question_categories;

CREATE POLICY "anon_select_question_categories" ON public.question_categories FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_question_categories" ON public.question_categories FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_question_categories" ON public.question_categories FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_question_categories" ON public.question_categories FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_question_categories" ON public.question_categories FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- questions (project_id, published)
-- =====================================================================
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "questions_deny_all" ON public.questions;

CREATE POLICY "anon_select_questions" ON public.questions FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_questions" ON public.questions FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_questions" ON public.questions FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_questions" ON public.questions FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_questions" ON public.questions FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- nominations (project_id, published)
-- =====================================================================
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nominations_deny_all" ON public.nominations;

CREATE POLICY "anon_select_nominations" ON public.nominations FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_nominations" ON public.nominations FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_nominations" ON public.nominations FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_nominations" ON public.nominations FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_nominations" ON public.nominations FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- app_settings (project_id, no published flag -- anon needs read for voter app)
-- =====================================================================
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_settings_deny_all" ON public.app_settings;

-- Anon: always readable (voter app needs settings)
CREATE POLICY "anon_select_app_settings" ON public.app_settings FOR SELECT TO anon
  USING (true);

-- Authenticated: always readable
CREATE POLICY "authenticated_select_app_settings" ON public.app_settings FOR SELECT TO authenticated
  USING (true);

-- Admin CRUD
CREATE POLICY "admin_insert_app_settings" ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_app_settings" ON public.app_settings FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_app_settings" ON public.app_settings FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- feedback (anon insert-only; admin select/delete)
-- =====================================================================
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anonymous: insert only (rate limiting trigger handles spam prevention)
CREATE POLICY "anon_insert_feedback" ON public.feedback
  FOR INSERT TO anon
  WITH CHECK (true);

-- Admin: read feedback for their project
CREATE POLICY "admin_select_feedback" ON public.feedback
  FOR SELECT TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- Admin: delete feedback for their project
CREATE POLICY "admin_delete_feedback" ON public.feedback
  FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- No UPDATE policy (feedback is immutable after insert -- locked decision)
-- No anon SELECT policy (voters cannot read their own or others' feedback)

-- =====================================================================
-- admin_jobs (project_id, no published flag -- admin-only)
-- =====================================================================
ALTER TABLE public.admin_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_admin_jobs" ON public.admin_jobs
  FOR SELECT TO authenticated
  USING ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_insert_admin_jobs" ON public.admin_jobs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_admin_jobs" ON public.admin_jobs
  FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));
