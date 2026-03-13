-- Row Level Security: deny-all placeholder policies
--
-- Phase 10 will DROP these placeholders and CREATE real role-based policies.

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_deny_all" ON accounts FOR ALL USING (false);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_deny_all" ON projects FOR ALL USING (false);

ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "elections_deny_all" ON elections FOR ALL USING (false);

ALTER TABLE constituency_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "constituency_groups_deny_all" ON constituency_groups FOR ALL USING (false);

ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "constituencies_deny_all" ON constituencies FOR ALL USING (false);

ALTER TABLE constituency_group_constituencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "constituency_group_constituencies_deny_all" ON constituency_group_constituencies FOR ALL USING (false);

ALTER TABLE election_constituency_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "election_constituency_groups_deny_all" ON election_constituency_groups FOR ALL USING (false);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizations_deny_all" ON organizations FOR ALL USING (false);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "candidates_deny_all" ON candidates FOR ALL USING (false);

ALTER TABLE factions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "factions_deny_all" ON factions FOR ALL USING (false);

ALTER TABLE alliances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alliances_deny_all" ON alliances FOR ALL USING (false);

ALTER TABLE question_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "question_templates_deny_all" ON question_templates FOR ALL USING (false);

ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "question_categories_deny_all" ON question_categories FOR ALL USING (false);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_deny_all" ON questions FOR ALL USING (false);

ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nominations_deny_all" ON nominations FOR ALL USING (false);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings_deny_all" ON app_settings FOR ALL USING (false);
