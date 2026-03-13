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
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accounts_deny_all" ON accounts;

-- Authenticated: account_admin for their account or super_admin
CREATE POLICY "authenticated_select_accounts" ON accounts FOR SELECT TO authenticated
  USING (
    (SELECT has_role('account_admin', 'account', id))
    OR (SELECT has_role('super_admin'))
  );

-- Super admin only: insert
CREATE POLICY "admin_insert_accounts" ON accounts FOR INSERT TO authenticated
  WITH CHECK ((SELECT has_role('super_admin')));

-- Super admin only: update
CREATE POLICY "admin_update_accounts" ON accounts FOR UPDATE TO authenticated
  USING ((SELECT has_role('super_admin')))
  WITH CHECK ((SELECT has_role('super_admin')));

-- Super admin only: delete
CREATE POLICY "admin_delete_accounts" ON accounts FOR DELETE TO authenticated
  USING ((SELECT has_role('super_admin')));

-- =====================================================================
-- projects (has account_id, no published flag)
-- =====================================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_deny_all" ON projects;

-- Authenticated: project access or account_admin or super_admin
CREATE POLICY "authenticated_select_projects" ON projects FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(id))
    OR (SELECT has_role('account_admin', 'account', account_id))
    OR (SELECT has_role('super_admin'))
  );

-- Insert: account_admin for the account or super_admin
CREATE POLICY "admin_insert_projects" ON projects FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT has_role('account_admin', 'account', account_id))
    OR (SELECT has_role('super_admin'))
  );

-- Update: project access (project_admin, account_admin, super_admin)
CREATE POLICY "admin_update_projects" ON projects FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(id)))
  WITH CHECK ((SELECT can_access_project(id)));

-- Delete: project access (project_admin, account_admin, super_admin)
CREATE POLICY "admin_delete_projects" ON projects FOR DELETE TO authenticated
  USING ((SELECT can_access_project(id)));

-- =====================================================================
-- elections (project_id, published)
-- =====================================================================
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "elections_deny_all" ON elections;

CREATE POLICY "anon_select_elections" ON elections FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_elections" ON elections FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_elections" ON elections FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_elections" ON elections FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_elections" ON elections FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- constituency_groups (project_id, published)
-- =====================================================================
ALTER TABLE constituency_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "constituency_groups_deny_all" ON constituency_groups;

CREATE POLICY "anon_select_constituency_groups" ON constituency_groups FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_constituency_groups" ON constituency_groups FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_constituency_groups" ON constituency_groups FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_constituency_groups" ON constituency_groups FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_constituency_groups" ON constituency_groups FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- constituencies (project_id, published)
-- =====================================================================
ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "constituencies_deny_all" ON constituencies;

CREATE POLICY "anon_select_constituencies" ON constituencies FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_constituencies" ON constituencies FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_constituencies" ON constituencies FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_constituencies" ON constituencies FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_constituencies" ON constituencies FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- constituency_group_constituencies (join table, no project_id)
-- =====================================================================
ALTER TABLE constituency_group_constituencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "constituency_group_constituencies_deny_all" ON constituency_group_constituencies;

-- Anon: structural data, always readable
CREATE POLICY "anon_select_constituency_group_constituencies" ON constituency_group_constituencies FOR SELECT TO anon
  USING (true);

-- Authenticated: always readable
CREATE POLICY "authenticated_select_constituency_group_constituencies" ON constituency_group_constituencies FOR SELECT TO authenticated
  USING (true);

-- Admin insert: check access via parent constituency_group
CREATE POLICY "admin_insert_constituency_group_constituencies" ON constituency_group_constituencies FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM constituency_groups cg
      WHERE cg.id = constituency_group_id
        AND (SELECT can_access_project(cg.project_id))
    )
  );

-- Admin delete: check access via parent constituency_group
CREATE POLICY "admin_delete_constituency_group_constituencies" ON constituency_group_constituencies FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM constituency_groups cg
      WHERE cg.id = constituency_group_id
        AND (SELECT can_access_project(cg.project_id))
    )
  );

-- =====================================================================
-- election_constituency_groups (join table, no project_id)
-- =====================================================================
ALTER TABLE election_constituency_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "election_constituency_groups_deny_all" ON election_constituency_groups;

-- Anon: structural data, always readable
CREATE POLICY "anon_select_election_constituency_groups" ON election_constituency_groups FOR SELECT TO anon
  USING (true);

-- Authenticated: always readable
CREATE POLICY "authenticated_select_election_constituency_groups" ON election_constituency_groups FOR SELECT TO authenticated
  USING (true);

-- Admin insert: check access via parent election
CREATE POLICY "admin_insert_election_constituency_groups" ON election_constituency_groups FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM elections e
      WHERE e.id = election_id
        AND (SELECT can_access_project(e.project_id))
    )
  );

-- Admin delete: check access via parent election
CREATE POLICY "admin_delete_election_constituency_groups" ON election_constituency_groups FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM elections e
      WHERE e.id = election_id
        AND (SELECT can_access_project(e.project_id))
    )
  );

-- =====================================================================
-- organizations (project_id, published, auth_user_id)
-- =====================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "organizations_deny_all" ON organizations;

CREATE POLICY "anon_select_organizations" ON organizations FOR SELECT TO anon
  USING (published = true);

-- Authenticated: project access, own record, or published
CREATE POLICY "authenticated_select_organizations" ON organizations FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', id))
    OR published = true
  );

-- Admin insert
CREATE POLICY "admin_insert_organizations" ON organizations FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Party admin self-update: party role holder can update their party
CREATE POLICY "party_update_own_organizations" ON organizations FOR UPDATE TO authenticated
  USING (
    auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', id))
  )
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', id))
  );

-- Admin update
CREATE POLICY "admin_update_organizations" ON organizations FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Admin delete
CREATE POLICY "admin_delete_organizations" ON organizations FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- candidates (project_id, published, auth_user_id)
-- Answers stored as JSONB column -- covered by these policies.
-- =====================================================================
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "candidates_deny_all" ON candidates;

CREATE POLICY "anon_select_candidates" ON candidates FOR SELECT TO anon
  USING (published = true);

-- Authenticated: project access, own record, party admin for their party's candidates, or published
CREATE POLICY "authenticated_select_candidates" ON candidates FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR auth_user_id = (SELECT auth.uid())
    OR (SELECT has_role('party', 'party', organization_id))
    OR published = true
  );

-- Admin insert
CREATE POLICY "admin_insert_candidates" ON candidates FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Candidate self-update: can update own record
-- Structural field protection (project_id, auth_user_id, organization_id) enforced
-- via column-level REVOKE in 013-auth-rls.sql
CREATE POLICY "candidate_update_own" ON candidates FOR UPDATE TO authenticated
  USING (auth_user_id = (SELECT auth.uid()))
  WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- Admin update
CREATE POLICY "admin_update_candidates" ON candidates FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Admin delete
CREATE POLICY "admin_delete_candidates" ON candidates FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- factions (project_id, published)
-- =====================================================================
ALTER TABLE factions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "factions_deny_all" ON factions;

CREATE POLICY "anon_select_factions" ON factions FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_factions" ON factions FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_factions" ON factions FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_factions" ON factions FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_factions" ON factions FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- alliances (project_id, published)
-- =====================================================================
ALTER TABLE alliances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "alliances_deny_all" ON alliances;

CREATE POLICY "anon_select_alliances" ON alliances FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_alliances" ON alliances FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_alliances" ON alliances FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_alliances" ON alliances FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_alliances" ON alliances FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- question_templates (project_id, NO published flag -- admin-only)
-- =====================================================================
ALTER TABLE question_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "question_templates_deny_all" ON question_templates;

-- No anon access
CREATE POLICY "authenticated_select_question_templates" ON question_templates FOR SELECT TO authenticated
  USING ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_insert_question_templates" ON question_templates FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_question_templates" ON question_templates FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_question_templates" ON question_templates FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- question_categories (project_id, published)
-- =====================================================================
ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "question_categories_deny_all" ON question_categories;

CREATE POLICY "anon_select_question_categories" ON question_categories FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_question_categories" ON question_categories FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_question_categories" ON question_categories FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_question_categories" ON question_categories FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_question_categories" ON question_categories FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- questions (project_id, published)
-- =====================================================================
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "questions_deny_all" ON questions;

CREATE POLICY "anon_select_questions" ON questions FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_questions" ON questions FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_questions" ON questions FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_questions" ON questions FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_questions" ON questions FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- nominations (project_id, published)
-- =====================================================================
ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nominations_deny_all" ON nominations;

CREATE POLICY "anon_select_nominations" ON nominations FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "authenticated_select_nominations" ON nominations FOR SELECT TO authenticated
  USING (
    (SELECT can_access_project(project_id))
    OR published = true
  );

CREATE POLICY "admin_insert_nominations" ON nominations FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_nominations" ON nominations FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_nominations" ON nominations FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- app_settings (project_id, no published flag -- anon needs read for voter app)
-- =====================================================================
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_settings_deny_all" ON app_settings;

-- Anon: always readable (voter app needs settings)
CREATE POLICY "anon_select_app_settings" ON app_settings FOR SELECT TO anon
  USING (true);

-- Authenticated: always readable
CREATE POLICY "authenticated_select_app_settings" ON app_settings FOR SELECT TO authenticated
  USING (true);

-- Admin CRUD
CREATE POLICY "admin_insert_app_settings" ON app_settings FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_update_app_settings" ON app_settings FOR UPDATE TO authenticated
  USING ((SELECT can_access_project(project_id)))
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_app_settings" ON app_settings FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- =====================================================================
-- RELATIONAL ANSWERS TABLE (uncomment if using alternatives/answers-relational.sql)
-- =====================================================================
-- If using the relational answer storage approach instead of JSONB columns on
-- candidates/organizations, uncomment the following policies. The relational
-- answers table has project_id and entity_id columns.
--
-- ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "answers_deny_all" ON answers;
--
-- -- Anon: read answers for published entities
-- CREATE POLICY "anon_select_answers" ON answers FOR SELECT TO anon
--   USING (
--     EXISTS (
--       SELECT 1 FROM candidates c
--       WHERE c.id = answers.entity_id AND c.published = true AND answers.entity_type = 'candidate'
--     ) OR EXISTS (
--       SELECT 1 FROM organizations o
--       WHERE o.id = answers.entity_id AND o.published = true AND answers.entity_type = 'organization'
--     )
--   );
--
-- -- Authenticated: read own project answers or own answers
-- CREATE POLICY "authenticated_select_answers" ON answers FOR SELECT TO authenticated
--   USING (
--     (SELECT can_access_project(project_id))
--     OR (entity_type = 'candidate' AND EXISTS (
--       SELECT 1 FROM candidates c WHERE c.id = answers.entity_id AND c.auth_user_id = (SELECT auth.uid())
--     ))
--   );
--
-- -- Candidate: insert own answers
-- CREATE POLICY "candidate_insert_own_answers" ON answers FOR INSERT TO authenticated
--   WITH CHECK (
--     entity_type = 'candidate' AND EXISTS (
--       SELECT 1 FROM candidates c WHERE c.id = answers.entity_id AND c.auth_user_id = (SELECT auth.uid())
--     )
--   );
--
-- -- Candidate: update own answers
-- CREATE POLICY "candidate_update_own_answers" ON answers FOR UPDATE TO authenticated
--   USING (
--     entity_type = 'candidate' AND EXISTS (
--       SELECT 1 FROM candidates c WHERE c.id = answers.entity_id AND c.auth_user_id = (SELECT auth.uid())
--     )
--   )
--   WITH CHECK (
--     entity_type = 'candidate' AND EXISTS (
--       SELECT 1 FROM candidates c WHERE c.id = answers.entity_id AND c.auth_user_id = (SELECT auth.uid())
--     )
--   );
--
-- -- Admin: full CRUD
-- CREATE POLICY "admin_insert_answers" ON answers FOR INSERT TO authenticated
--   WITH CHECK ((SELECT can_access_project(project_id)));
--
-- CREATE POLICY "admin_update_answers" ON answers FOR UPDATE TO authenticated
--   USING ((SELECT can_access_project(project_id)))
--   WITH CHECK ((SELECT can_access_project(project_id)));
--
-- CREATE POLICY "admin_delete_answers" ON answers FOR DELETE TO authenticated
--   USING ((SELECT can_access_project(project_id)));
