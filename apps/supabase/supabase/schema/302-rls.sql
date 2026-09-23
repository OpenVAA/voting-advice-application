-- Row Level Security: role-based access control policies
--
-- Replaces deny-all placeholders with real per-operation policies.
-- Uses helper functions from 301-auth-functions.sql:
--   user_can(scope, target_id, permission) - MAY THIS CALLER DO THIS VERB TO THIS OBJECT. The predicate a converted policy delegates its whole authority decision to; it answers reach x verb over the section 3.3 matrix and nothing else. project_open_for_voters(project_id) AND confirmed AND entity_has_confirmed_nomination(entity_type, id, project_id) - is this entity row publicly visible; ASSEMBLED in each of the eight entity SELECT policies from two helpers that are each defined ONCE (D-36, superseding V-6(A) and D-35)
--
-- Policy rules:
--   SELECT  = USING only INSERT  = WITH CHECK only UPDATE  = USING + WITH CHECK DELETE  = USING only Always specify TO anon or TO authenticated Always use (SELECT auth.uid()) and (SELECT auth.jwt()) for optimizer caching
-- =====================================================================
-- accounts (no project_id, no project scope at all)
-- =====================================================================
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accounts_deny_all" ON public.accounts;

-- Authenticated read: GRANT EXISTENCE, not a permission literal. 162-CHECKPOINT-DECISIONS.md section 1's NOTE under S-3 rules "account read = any role on account or its projects", which user_can cannot express because user_can takes a permission and this asks whether a grant exists. It is therefore the one predicate on these seven tables that is not a user_can call, and it is a NAMED exception in the routing assertion rather than a discovered one -- the other two are the join-table delegations. See public.user_has_account_grant for the ruling, the reason the enum is not widened, and the THIRD POPULATION CHANGE this carries: a project admin now reads the row of the account its project belongs to.
--
-- This is why `accounts` is NOT exempt from ROADMAP criterion 2 after all. The plan expected this SELECT and the UPDATE below to name the same literal and to be excluded from the read/write rule by name; under the ruling they name different things, the exclusion is WITHDRAWN, and 162-17's collapse allow-list loses `accounts`.
CREATE POLICY "authenticated_select_accounts" ON public.accounts FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_has_account_grant (id)
    )
  );

-- Insert: asked at GLOBAL scope with a NULL target, and the scope is the point. A WITH CHECK on an account insert evaluates against the NEW row, so an account-scope ask would be answered by whatever grant the caller happens to hold on the uuid they chose -- and grants.target_id carries no foreign key to accounts, so a grant on an id no account uses yet is a legal row. An account admin pre-granted on an unused uuid could then create that account and own it. The global form has no such path and is 162-05's own translation of the root-admin check. Do not "simplify" this to account scope.
CREATE POLICY "admin_insert_accounts" ON public.accounts FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('global', NULL::uuid, 'account.edit_settings')
    )
  );

-- Update: `account.edit_settings` at account scope. WIDENS -- P-1 ratified (A) on 2026-09-16 -- from the root admin alone to the root admin plus that account's OWN admin, which is what section 3.3's cell grants. The row is named by its own id, so the tenancy is in the target and not in a role name.
CREATE POLICY "admin_update_accounts" ON public.accounts
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('account', id, 'account.edit_settings')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('account', id, 'account.edit_settings')
    )
  );

-- Delete: global scope with a NULL target, for the same reason the insert above uses it, and unchanged in population.
CREATE POLICY "admin_delete_accounts" ON public.accounts FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('global', NULL::uuid, 'account.edit_settings')
  )
);

-- =====================================================================
-- projects (has account_id; openness to voters lives on the row itself)
-- =====================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_deny_all" ON public.projects;

-- Authenticated: 162-IMPLEMENTATION-BRIEF.md section 3.4 row 2, "any auth user can always read their project". The whole authority decision is delegated to user_can and the predicate re-derives nothing: a disjunction keeping a second project-access predicate alongside it would have hidden exactly the regression 162-04 exists to expose. Its UPDATE twin below was converted separately, by 162-09 — the pair is ROADMAP criterion 2's read/write collapse, and separating them was what made the collapse visible and assertable.
CREATE POLICY "authenticated_select_projects" ON public.projects FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', id, 'project.read_structure')
    )
  );

-- Insert: `account.manage_projects`, asked at account scope against the new row's account. Section 3.3 puts project creation in the Account group. Population unchanged: the legacy pair admitted exactly the account admin of that account and the root admin, which is exactly who holds this verb at this scope.
CREATE POLICY "admin_insert_projects" ON public.projects FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('account', account_id, 'account.manage_projects')
    )
  );

-- Update: `project.edit_project_settings` — brief section 11.1's settings split, and ROADMAP criterion 2's remaining half (D-09). 162-04 converted the SELECT twin above and deliberately left this one on the legacy predicate so the read/write collapse stayed visible in the diff; this is where it is separated. The two predicates now name DIFFERENT permissions, and 17-project-structure-authority.test.sql asserts each names its own literal and NOT the other's — a test that only checked the two strings differ stays green when both are converted onto one verb, which is the failure the criterion is specified to catch. NARROWER than the legacy predicate in one direction that matters: a project EDITOR holds project.edit_structure and not this, so an editor may reshape the project's elections and may not rename the project.
CREATE POLICY "admin_update_projects" ON public.projects
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', id, 'project.edit_project_settings')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', id, 'project.edit_project_settings')
    )
  );

-- Delete: `account.manage_projects` at ACCOUNT scope, which is where section 3.3 puts project deletion. NARROWS -- P-1 ratified (A) on 2026-09-16 -- from every holder of project access to the account tier: A PROJECT ADMIN CAN NO LONGER DELETE ITS OWN PROJECT. The diff shows a permission literal and not a role set, so the change is stated here in words as well; 17-project-structure-authority.test.sql asserts it in both directions, and asserts alongside it that the same project admin may still UPDATE that project, so the pair differs in the permission and not in the caller's general authority.
CREATE POLICY "admin_delete_projects" ON public.projects FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('account', account_id, 'account.manage_projects')
  )
);

-- =====================================================================
-- elections (project_id)
-- =====================================================================
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "elections_deny_all" ON public.elections;

CREATE POLICY "anon_select_elections" ON public.elections FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Authenticated read: a TWO-TERM disjunction of two DIFFERENT questions, deliberately not one call. `user_can` answers "may this caller" — the matrix — and `project_open_for_voters` answers "is this row public" — row state, which 162-04 task 2 Q3 ratified belongs to the policy and never to the matrix. The public term is the SAME helper 162-08 gave the anon twin above, so the anon and the authenticated answer cannot drift apart; it replaces the per-row publication flag 162-16 deleted from the schema. Q3 = (A), ratified 2026-09-16: dropping the public term would make a logged-in caller holding no grant see strictly LESS than a logged-out one — including a freshly-identified user between the identity callback and their grant row — and would break sign-up, which reads structure before any grant exists. `project.read_structure` and NOT `project.edit_structure`: the write twins below name the other verb, and that separation is asserted as a rule across all three structure tables.
CREATE POLICY "authenticated_select_elections" ON public.elections FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_structure')
    )
    OR (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Insert: `project.edit_structure`, the same verb as the update above and NOT the read verb the SELECT names.
CREATE POLICY "admin_insert_elections" ON public.elections FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Update: `project.edit_structure`, the WRITE verb of the pair whose READ verb is above. ROADMAP criterion 2's behavioural sentence lands here: candidate_a holds project.read_structure through its entity grant and does NOT hold project.edit_structure, so it reads this project's elections and cannot edit them. WIDENS by the project editor, who holds edit_structure and whom the legacy predicate refused.
CREATE POLICY "admin_update_elections" ON public.elections
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Delete: `project.edit_structure`.
CREATE POLICY "admin_delete_elections" ON public.elections FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_structure')
  )
);

-- =====================================================================
-- constituency_groups (project_id)
-- =====================================================================
ALTER TABLE public.constituency_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "constituency_groups_deny_all" ON public.constituency_groups;

CREATE POLICY "anon_select_constituency_groups" ON public.constituency_groups FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Authenticated read: the same two-term disjunction the elections SELECT carries, reproduced rather than re-derived so the three structure tables cannot drift apart. `user_can` answers the matrix question, 162-08's `project_open_for_voters` answers the row-state one, and the public term is what stops a logged-in caller holding no grant seeing strictly LESS than a logged-out one (Q3 = A). It replaces the per-row publication flag 162-16 deleted from the schema.
CREATE POLICY "authenticated_select_constituency_groups" ON public.constituency_groups FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_structure')
    )
    OR (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Insert: `project.edit_structure`, not the read verb the SELECT above names.
CREATE POLICY "admin_insert_constituency_groups" ON public.constituency_groups FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Update: `project.edit_structure`. WIDENS by the project editor, who holds this verb and whom the legacy predicate refused.
CREATE POLICY "admin_update_constituency_groups" ON public.constituency_groups
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Delete: `project.edit_structure`.
CREATE POLICY "admin_delete_constituency_groups" ON public.constituency_groups FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_structure')
  )
);

-- =====================================================================
-- constituencies (project_id)
-- =====================================================================
ALTER TABLE public.constituencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "constituencies_deny_all" ON public.constituencies;

CREATE POLICY "anon_select_constituencies" ON public.constituencies FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Authenticated read: the same two-term disjunction the elections SELECT carries, reproduced rather than re-derived so the three structure tables cannot drift apart. `user_can` answers the matrix question, 162-08's `project_open_for_voters` answers the row-state one, and the public term is what stops a logged-in caller holding no grant seeing strictly LESS than a logged-out one (Q3 = A). It replaces the per-row publication flag 162-16 deleted from the schema.
CREATE POLICY "authenticated_select_constituencies" ON public.constituencies FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_structure')
    )
    OR (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Insert: `project.edit_structure`, not the read verb the SELECT above names.
CREATE POLICY "admin_insert_constituencies" ON public.constituencies FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Update: `project.edit_structure`. WIDENS by the project editor, who holds this verb and whom the legacy predicate refused.
CREATE POLICY "admin_update_constituencies" ON public.constituencies
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Delete: `project.edit_structure`.
CREATE POLICY "admin_delete_constituencies" ON public.constituencies FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_structure')
  )
);

-- =====================================================================
-- constituency_group_constituencies (join table, no project_id)
-- =====================================================================
ALTER TABLE public.constituency_group_constituencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "constituency_group_constituencies_deny_all" ON public.constituency_group_constituencies;

-- Anon: the join row is visible exactly when its constituency group is. This table carries no project_id of its own, so rather than re-deriving the gate it DELEGATES to `anon_select_constituency_groups`: the sub-select below is evaluated under the anon caller's own row-level security, so it resolves to "the group is anon-visible" -- that policy answering, not a second copy of the rule. This is the one place an inline sub-select is correct, and it is correct precisely because it delegates instead of re-deriving. There is no cycle, because the group's own policy does not reference this table; measured in a rolled-back transaction before it was written.
CREATE POLICY "anon_select_constituency_group_constituencies" ON public.constituency_group_constituencies FOR
SELECT
  TO anon USING (
    EXISTS (
      SELECT
        1
      FROM
        public.constituency_groups cg
      WHERE
        cg.id = constituency_group_id
    )
  );

-- Authenticated: the IDENTICAL delegation the anon twin above carries, character for character, so the two roles cannot answer differently. It leaves the ungated `USING (true)` form, which made every join row of every tenant readable by every authenticated caller. THE NARROWING IS SILENT IF IT IS WRONG: supabaseDataProvider.ts reaches this table only as a PostgREST EMBEDDED RESOURCE (`constituency_groups` selected with `constituency_group_constituencies(constituency_id)`), and a denial on an embed returns an EMPTY ARRAY rather than an error — a constituency group renders with no constituencies and nothing anywhere reports it.
CREATE POLICY "authenticated_select_constituency_group_constituencies" ON public.constituency_group_constituencies FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.constituency_groups cg
      WHERE
        cg.id = constituency_group_id
    )
  );

-- Admin insert: one `user_can` call whose target is the SECURITY DEFINER hop, not a sub-select the caller's own row-level security filters. The hop returns NULL for a group that does not exist and user_can denies a NULL target at project scope, so an absent parent is refused BY THE PERMISSION PREDICATE.
CREATE POLICY "admin_insert_constituency_group_constituencies" ON public.constituency_group_constituencies FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can (
          'project',
          private.constituency_group_project_id (constituency_group_id),
          'project.edit_structure'
        )
    )
  );

-- Admin delete: the same hop, the same verb.
CREATE POLICY "admin_delete_constituency_group_constituencies" ON public.constituency_group_constituencies FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can (
        'project',
        private.constituency_group_project_id (constituency_group_id),
        'project.edit_structure'
      )
  )
);

-- =====================================================================
-- election_constituency_groups (join table, no project_id)
-- =====================================================================
ALTER TABLE public.election_constituency_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "election_constituency_groups_deny_all" ON public.election_constituency_groups;

-- Anon: the join row is visible exactly when its constituency group is. This table carries no project_id of its own, so rather than re-deriving the gate it DELEGATES to `anon_select_constituency_groups`: the sub-select below is evaluated under the anon caller's own row-level security, so it resolves to "the group is anon-visible" -- that policy answering, not a second copy of the rule. This is the one place an inline sub-select is correct, and it is correct precisely because it delegates instead of re-deriving. There is no cycle, because the group's own policy does not reference this table; measured in a rolled-back transaction before it was written.
CREATE POLICY "anon_select_election_constituency_groups" ON public.election_constituency_groups FOR
SELECT
  TO anon USING (
    EXISTS (
      SELECT
        1
      FROM
        public.constituency_groups cg
      WHERE
        cg.id = constituency_group_id
    )
  );

-- Authenticated: the IDENTICAL delegation the anon twin above carries, character for character, so the two roles cannot answer differently and a later change to the group's visibility reaches this table without anyone remembering to make it. It leaves the ungated `USING (true)` form, which made every join row of every tenant readable by every authenticated caller. THE NARROWING IS SILENT IF IT IS WRONG: supabaseDataProvider.ts reaches this table only as a PostgREST EMBEDDED RESOURCE (`elections` selected with `election_constituency_groups(constituency_group_id)`), and a denial on an embed returns an EMPTY ARRAY rather than an error — an election renders with no constituency groups and nothing anywhere reports it. That is why the full E2E suite is an instrument on this policy and not a formality.
CREATE POLICY "authenticated_select_election_constituency_groups" ON public.election_constituency_groups FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.constituency_groups cg
      WHERE
        cg.id = constituency_group_id
    )
  );

-- Admin insert: one `user_can` call whose target is the SECURITY DEFINER hop, not a sub-select. The read policy above delegates to the parent's policy on purpose; a WRITE must not, because a sub-select the caller's own row-level security filters makes the answer depend on the caller's READ access to the parent as well as on their authority over it. election_project_id returns NULL for an election that does not exist, and user_can denies a NULL target at project scope — so a join row naming an absent parent is refused BY THE PERMISSION PREDICATE rather than by three-valued logic, and that path is asserted directly.
CREATE POLICY "admin_insert_election_constituency_groups" ON public.election_constituency_groups FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can (
          'project',
          private.election_project_id (election_id),
          'project.edit_structure'
        )
    )
  );

-- Admin delete: the same hop as the insert above, the same verb.
CREATE POLICY "admin_delete_election_constituency_groups" ON public.election_constituency_groups FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can (
        'project',
        private.election_project_id (election_id),
        'project.edit_structure'
      )
  )
);

-- =====================================================================
-- THE FOUR ENTITY TABLES -- organizations, candidates, factions, alliances -- ONE SHAPE, FIVE POLICIES EACH
-- =====================================================================
-- Read this once; the twenty policies below are four copies of it, and the ONLY differences between the four copies are the table name and the entity-type literal. 18-entity-policies.test.sql asserts that as a STRUCTURAL property: each verb family's four expressions, normalised for those two things, are the same string. D-21 is an instruction with a checkable consequence, and four identical tables are where it is checkable.
--
-- THE VERB MAP (162-IMPLEMENTATION-BRIEF.md section 3.3, the four rows that bear on entity tables):
--   project.read_entities  - the SELECT policies' project disjunct. Root/Account/ProjAdmin/ProjEditor only.
--   project.edit_entities  - the INSERT, admin UPDATE and DELETE policies. Same four columns.
--   entity.read_answers    - the SELECT policies' own-row disjunct. `own` for an entity grant.
--   entity.edit_answers    - the self-update policies. `own` for an entity grant.
-- An entity grantee holds NEITHER project verb, so it reaches no other entity in its project through a project-scope call. That is the same-type same-project denial, and it is a property of the matrix rather than of these predicates -- which is why the predicates can be this short.
--
-- `own` IS NOT A THIRD MECHANISM. For an entity grant, user_can's reach rule is equality with the granted entity, so "is this row mine" needs no column comparison. The six inline `auth_user_id = auth.uid()` clauses this block used to carry, and the never-called helper predicate that duplicated them, are gone: 162-10 derived the count as exactly six before the first edit and exactly zero after it.
--
-- THE PARENT'S REACH TO A CHILD NOMINEE IS NOT A ROW DISJUNCT HERE, AND IT MUST NOT BECOME ONE (162-REVIEW CR-02).
-- SPEC section 7 row 3 and the A-2(D) ruling give a parent entity its child nominee's nomination and BASIC data, never the child's answers. Row-level security cannot say "basic data": once a SELECT policy admits a row, every column of it is returned -- `answers`, `auth_user_id`, `terms_of_use_accepted` and `custom_data` included. The `user_can ('entity', id, 'nomination.read')` disjunct these four policies carried until CR-02 therefore disclosed an unconfirmed child's private answers to its parent's editor while `user_can (..., 'entity.read_answers')` answered false for the same caller.
-- The reach now lives in `public.get_entity_basic_data` (503-entity-rpcs.sql): a SECURITY DEFINER function gated on the same `user_can ('entity', <id>, 'nomination.read')` call -- whose named branch 2 is is_child_nominee, unchanged -- that returns an ALLOW-LISTED column projection. The nominations table keeps its own `nomination.read` disjunct, because a nomination row carries no answers. 18-entity-policies.test.sql asserts the parent cannot SELECT the child's row and that the function returns basic data without `answers`.
--
-- WHAT IS NOT A CONJUNCT OF THE GRANT DISJUNCTS, DELIBERATELY. user_can answers "may this role do this verb to this object", not "is this object in a state that admits the verb" (162-04 task 2 Q3). So `confirmed`, `open_for_voters` and the terms-of-use timestamps live in the PUBLIC disjunct
-- -- and nowhere else. An entity grantee reads and edits their own UNCONFIRMED row, which is exactly what makes the sign-up flow possible. Name immutability on a confirmed entity is a trigger, and it is 162-13's.
--
-- THE PUBLICATION TERM IS GONE RATHER THAN PENDING REMOVAL (D-11b), on the same reasoning 162-08 applied to the anon half: 162-16 deleted the ten columns, and there was nothing left in these predicates for it to strip. The visible consequence is real and is asserted rather than absorbed -- an authenticated caller with no grant in the project now sees exactly the id set an anon caller sees, so an unnominated entity is no longer visible to it. 18-entity-policies.test.sql states that superset relation per table, as an equality of counts AND of id sets.
--
-- ⚠ THE PUBLIC DISJUNCT IS ASSEMBLED IN EIGHT PLACES, BY RULING, AND 162-17 OWES THE GUARD THAT HOLDS THEM IDENTICAL (D-36, 2026-09-17, superseding V-6(A) and D-35). 162-10 composed "is this entity publicly visible" into one `public.entity_is_anon_visible (entity_type, id)` called by all eight entity SELECT policies. That composition is GONE. The reason is DEPTH and it was measured, not argued: a SECURITY DEFINER function can never be inlined by the planner, so a SECURITY DEFINER composition that internally calls two SECURITY DEFINER helpers pays a depth-2 per-row call. On 5000 anon-visible candidates, identical fixture and md5-fingerprinted bodies -- composed 271.9 ms anon / 351.9 ms auth; these eight direct assemblies 39.4 / 30.0; and the two flattenings that were built and rejected 111.5 (four-arm CASE) and 79.6 (UNION ALL dispatch), neither reaching the 2.0 budget.
--
-- WHAT IS DUPLICATED IS THE ASSEMBLY, NOT THE SUB-RULES, and that is why this shape was chosen over flattening. `project_open_for_voters` and `entity_has_confirmed_nomination` remain the SINGLE definition of each sub-rule and are called directly from every one of the eight quals; flattening would have copied their BODIES, which is the more drift-prone kind. What repeats is the conjunction pattern. Until 162-17's clause lands, nothing in the estate reports a drift between the eight -- and the D-35 investigation measured that the four behavioural guards for the `open_for_voters` conjunct all live in 16-anon-visibility.test.sql, so `03-anon-read.test.sql` and `18-entity-policies.test.sql` must not be assumed to cover it.
--
-- V-6 THEREFORE SITS AT ITS OWN OPTION (C), NOT (A), and the recorded cost of that is D-21's normalised-identity assertion no longer covering the SELECT family: `candidates` alone carries the two terms-of-use conjuncts, so the four authenticated SELECT predicates are TWO expressions modulo the table name rather than one. 18-entity-policies.test.sql states that as what remains true instead of re-deriving the withdrawn claim.
--
-- `admin_*` IS NOW A MISNOMER AND IS DELIBERATELY NOT RENAMED. Under D-07 a ProjectEditor also holds `project.edit_entities`, so the actor segment reads as "the project-scope actor" rather than "an administrator". Renaming it would cut across the identical names 162-09, 162-11 and 162-12 carry on their own tables, which makes it a phase-wide convention change and not this plan's. Flagged, not absorbed.
-- =====================================================================
-- organizations (project_id, confirmed, auth_user_id)
-- =====================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_deny_all" ON public.organizations;

CREATE POLICY "anon_select_organizations" ON public.organizations FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
    AND confirmed
    AND (
      SELECT
        private.entity_has_confirmed_nomination (
          'organization'::public.entity_type,
          id,
          project_id
        )
    )
  );

-- ⚠ DISJUNCT ORDER IS A MEASURED CHOICE (162.1 D-01, variant B). Project authority comes first so an admin exits on it; the public assembly comes second, token for token the sibling `anon_select_organizations` qual, so a publicly visible row never pays the SECURITY DEFINER entity `user_can` calls; entity authority comes last. PostgreSQL evaluates an OR left to right and stops at the first TRUE, so the order changes cost and never the answer: spike 028 proved it row-identical to the previous order (visible sets EXCEPT ALL in both directions and a 2,120-probe truth grid, 0 differences) and measured a signed-in candidate's whole-municipal read going from 7.15 s to 4.65 s against the 8 s timeout, admins unchanged at 1.30 s. 29-authenticated-disjunct-order.test.sql fails on any other order.
CREATE POLICY "authenticated_select_organizations" ON public.organizations FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_entities')
    )
    OR (
      (
        SELECT
          project_open_for_voters (project_id)
      )
      AND confirmed
      AND (
        SELECT
          private.entity_has_confirmed_nomination (
            'organization'::public.entity_type,
            id,
            project_id
          )
      )
    )
    OR (
      SELECT
        user_can ('entity', id, 'entity.read_answers')
    )
  );

CREATE POLICY "admin_insert_organizations" ON public.organizations FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

CREATE POLICY "entity_update_own_organizations" ON public.organizations
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('entity', id, 'entity.edit_answers')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('entity', id, 'entity.edit_answers')
    )
  );

CREATE POLICY "admin_update_organizations" ON public.organizations
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

CREATE POLICY "admin_delete_organizations" ON public.organizations FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_entities')
  )
);

-- =====================================================================
-- candidates (project_id, auth_user_id) Answers stored as JSONB column -- covered by these policies.
-- =====================================================================
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "candidates_deny_all" ON public.candidates;

-- The five conjuncts of the anon rule are stated HERE, each independently load-bearing and each flipped alone against an otherwise-visible row in 16-anon-visibility.test.sql. The project must be open for voters (162-IMPLEMENTATION-BRIEF.md section 3.4); the candidate must itself be confirmed (D-10); a nomination that is not unconfirmed must link this candidate IN THIS PROJECT, which is the transitive half of section 11.2 and the reason an admin cannot publish a placeholder identity by confirming its nomination alone; and the two terms-of-use guards are unchanged and in their existing order -- `IS NOT NULL` hides a candidate who has never accepted, `< now()` hides future-dated acceptances (a test-seeding edge case, and defensive against client/server clock skew).
--
-- The two helper calls are wrapped `(SELECT fn (...))` per this file's optimizer convention, and each is SECURITY DEFINER because the inline form of either lookup was measured not to work: the projects probe is blind to every anon caller, and the entity/nomination pair written inline raises `infinite recursion detected in policy for relation "candidates"`.
CREATE POLICY "anon_select_candidates" ON public.candidates FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
    AND confirmed
    AND (
      SELECT
        private.entity_has_confirmed_nomination ('candidate'::public.entity_type, id, project_id)
    )
    AND terms_of_use_accepted IS NOT NULL
    AND terms_of_use_accepted < now()
  );

-- The parent-to-child-nominee reach is deliberately ABSENT from this policy: a row policy returns the whole row, answers included, so the SPEC section 7 basic-data reach is served by `public.get_entity_basic_data` instead (162-REVIEW CR-02; see the header of this block).
--
-- ⚠ DISJUNCT ORDER IS A MEASURED CHOICE (162.1 D-01, variant B). Project authority comes first so an admin exits on it; the public assembly comes second, token for token the sibling `anon_select_candidates` qual, so a publicly visible row never pays the SECURITY DEFINER entity `user_can` calls; entity authority comes last. PostgreSQL evaluates an OR left to right and stops at the first TRUE, so the order changes cost and never the answer: spike 028 proved it row-identical to the previous order (visible sets EXCEPT ALL in both directions and a 2,120-probe truth grid, 0 differences) and measured a signed-in candidate's whole-municipal read going from 7.15 s to 4.65 s against the 8 s timeout, admins unchanged at 1.30 s. 29-authenticated-disjunct-order.test.sql fails on any other order.
CREATE POLICY "authenticated_select_candidates" ON public.candidates FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_entities')
    )
    OR (
      (
        SELECT
          project_open_for_voters (project_id)
      )
      AND confirmed
      AND (
        SELECT
          private.entity_has_confirmed_nomination ('candidate'::public.entity_type, id, project_id)
      )
      AND terms_of_use_accepted IS NOT NULL
      AND terms_of_use_accepted < now()
    )
    OR (
      SELECT
        user_can ('entity', id, 'entity.read_answers')
    )
  );

CREATE POLICY "admin_insert_candidates" ON public.candidates FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

-- Entity self-update: whoever holds `entity.edit_answers` ON THIS ROW may update it.
--
-- THE QUESTION "IS THIS ROW MINE" IS NO LONGER A COLUMN COMPARISON. Section 3.3 gives `entity.edit_answers` as `own` to the Candidate grant, and for an entity grant user_can's reach rule is equality with the granted entity -- so `own` falls out of reach and needs neither `auth_user_id` nor a second predicate. The two `auth_user_id = auth.uid()` clauses this replaces, and the retired helper predicate that duplicated them, were the same question asked in three spellings.
--
-- THE SCOPE LITERAL IS THE WHOLE SAFETY ARGUMENT. Written `'entity'` this asks about THIS ROW; written `'project'` it would ask about the row's project and would let any entity editor in the project rewrite every candidate in it -- with every pre-existing assertion in the estate still green, because none of them pairs a same-type same-project allow with its denial. 18-entity-policies.test.sql asserts that pair, and its deny half was observed RED against exactly that mis-written predicate before this one was accepted.
--
-- RENAMED under D-21's naming clause (162-CHECKPOINT-DECISIONS.md section 8 item C-6, 2026-09-16): the actor segment must not be an entity type where the predicate takes one as an argument. `candidate_update_own` became `entity_update_own_candidates`, and this expression is now table-independent.
--
-- Structural field protection (project_id, auth_user_id, external_id, ...) is a COLUMN grant, not a row predicate: see the REVOKE UPDATE / GRANT UPDATE (...) pair for this table in 303-column-grants.sql. RLS is row-level and cannot admit a row while withholding a column.
CREATE POLICY "entity_update_own_candidates" ON public.candidates
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('entity', id, 'entity.edit_answers')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('entity', id, 'entity.edit_answers')
    )
  );

CREATE POLICY "admin_update_candidates" ON public.candidates
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

CREATE POLICY "admin_delete_candidates" ON public.candidates FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_entities')
  )
);

-- =====================================================================
-- factions (project_id, confirmed)
-- =====================================================================
ALTER TABLE public.factions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "factions_deny_all" ON public.factions;

CREATE POLICY "anon_select_factions" ON public.factions FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
    AND confirmed
    AND (
      SELECT
        private.entity_has_confirmed_nomination ('faction'::public.entity_type, id, project_id)
    )
  );

-- ⚠ DISJUNCT ORDER IS A MEASURED CHOICE (162.1 D-01, variant B). Project authority comes first so an admin exits on it; the public assembly comes second, token for token the sibling `anon_select_factions` qual, so a publicly visible row never pays the SECURITY DEFINER entity `user_can` calls; entity authority comes last. PostgreSQL evaluates an OR left to right and stops at the first TRUE, so the order changes cost and never the answer: spike 028 proved it row-identical to the previous order (visible sets EXCEPT ALL in both directions and a 2,120-probe truth grid, 0 differences) and measured a signed-in candidate's whole-municipal read going from 7.15 s to 4.65 s against the 8 s timeout, admins unchanged at 1.30 s. 29-authenticated-disjunct-order.test.sql fails on any other order.
CREATE POLICY "authenticated_select_factions" ON public.factions FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_entities')
    )
    OR (
      (
        SELECT
          project_open_for_voters (project_id)
      )
      AND confirmed
      AND (
        SELECT
          private.entity_has_confirmed_nomination ('faction'::public.entity_type, id, project_id)
      )
    )
    OR (
      SELECT
        user_can ('entity', id, 'entity.read_answers')
    )
  );

CREATE POLICY "admin_insert_factions" ON public.factions FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

-- NEW. Section 3.3 grants `entity.edit_answers` as `own` to the Faction grant and D-07 maps FactionEditor to a real grant row, but no UPDATE policy on this table admitted a non-admin -- D-11a's "a permission nobody can exercise". Ratified as 162-CHECKPOINT-DECISIONS.md section 5 item P-3, option (a), 2026-09-16, which also makes the four entity tables one shape and so makes D-21's structural claim checkable across all five verb families rather than four. `user_can` can express for a faction what no column on this table could.
--
-- RECORDED HONESTLY: this is a change in the PERMISSIVE direction on a table that has never had a non-admin write path, and its beneficiary population today is ZERO -- nothing in seed.sql, in dev-seed or in the E2E fixtures grants a faction editor. It is therefore unobservable by any pre-existing test, which is why its COLUMN BOUND lands in the same commit (303-column-grants.sql) rather than deferring to 162-13, and why the bound is asserted as a number in both directions instead of being exercised.
CREATE POLICY "entity_update_own_factions" ON public.factions
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('entity', id, 'entity.edit_answers')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('entity', id, 'entity.edit_answers')
    )
  );

CREATE POLICY "admin_update_factions" ON public.factions
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

CREATE POLICY "admin_delete_factions" ON public.factions FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_entities')
  )
);

-- =====================================================================
-- alliances (project_id, confirmed)
-- =====================================================================
ALTER TABLE public.alliances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alliances_deny_all" ON public.alliances;

CREATE POLICY "anon_select_alliances" ON public.alliances FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
    AND confirmed
    AND (
      SELECT
        private.entity_has_confirmed_nomination ('alliance'::public.entity_type, id, project_id)
    )
  );

-- ⚠ DISJUNCT ORDER IS A MEASURED CHOICE (162.1 D-01, variant B). Project authority comes first so an admin exits on it; the public assembly comes second, token for token the sibling `anon_select_alliances` qual, so a publicly visible row never pays the SECURITY DEFINER entity `user_can` calls; entity authority comes last. PostgreSQL evaluates an OR left to right and stops at the first TRUE, so the order changes cost and never the answer: spike 028 proved it row-identical to the previous order (visible sets EXCEPT ALL in both directions and a 2,120-probe truth grid, 0 differences) and measured a signed-in candidate's whole-municipal read going from 7.15 s to 4.65 s against the 8 s timeout, admins unchanged at 1.30 s. 29-authenticated-disjunct-order.test.sql fails on any other order.
CREATE POLICY "authenticated_select_alliances" ON public.alliances FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_entities')
    )
    OR (
      (
        SELECT
          project_open_for_voters (project_id)
      )
      AND confirmed
      AND (
        SELECT
          private.entity_has_confirmed_nomination ('alliance'::public.entity_type, id, project_id)
      )
    )
    OR (
      SELECT
        user_can ('entity', id, 'entity.read_answers')
    )
  );

CREATE POLICY "admin_insert_alliances" ON public.alliances FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

-- NEW, on the same ratification and with the same recorded cost as `entity_update_own_factions` above (P-3(a)): a matrix cell section 3.3 grants and no policy consulted, a permissive-direction change with no beneficiary today, and a column bound written in this same commit rather than deferred.
CREATE POLICY "entity_update_own_alliances" ON public.alliances
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('entity', id, 'entity.edit_answers')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('entity', id, 'entity.edit_answers')
    )
  );

CREATE POLICY "admin_update_alliances" ON public.alliances
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_entities')
    )
  );

CREATE POLICY "admin_delete_alliances" ON public.alliances FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_entities')
  )
);

-- =====================================================================
-- question_categories (project_id)
-- =====================================================================
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "question_categories_deny_all" ON public.question_categories;

CREATE POLICY "anon_select_question_categories" ON public.question_categories FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Authenticated read: the same TWO-TERM disjunction of two DIFFERENT questions the structure tables carry, reproduced rather than re-derived so the content tables cannot drift from them. `user_can` answers the matrix question -- and `project.read_structure` is ✓ in all seven columns of section 3.3, so with 162-04's project-read branch the call means exactly "the caller holds SOME grant in this project", an entity grantee included. 162-08's `project_open_for_voters` answers the row-state one, and it is a SECURITY DEFINER helper over the typed column rather than an inline lookup: `public.projects` carries row-level security of its own, so an inline `EXISTS … FROM public.projects` inside a policy returns zero rows for every caller (162-08 measured it). D-15 put the flag on `projects` precisely because RLS reads it.
--
-- BOTH ARMS ARE LOAD-BEARING AND WERE MEASURED SO. With the disjunct removed, an authenticated caller holding no grant in an OPEN project sees nothing -- strictly less than a logged-out one -- and 22-content-policies.test.sql's cell 3 reddened on all three content tables. With the authority call removed, a CLOSED project went dark to its own grantees and cell 4 reddened on all three. The two variants redden DISJOINT cells.
--
-- The publication term is GONE rather than pending removal (D-11b): these predicates were written once in their end state, so 162-16 found nothing left to strip here.
CREATE POLICY "authenticated_select_question_categories" ON public.question_categories FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_structure')
    )
    OR (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Insert: `project.edit_questions`, and NOT the read verb the SELECT above names. Section 3.3 grants this verb to Root, Account, ProjAdmin and ProjEditor and to none of the four entity columns, so it WIDENS by exactly the project editor and the read/write collapse on this table ends here.
CREATE POLICY "admin_insert_question_categories" ON public.question_categories FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Update: `project.edit_questions`. Paired in 22-content-policies.test.sql against `candidate_a`, an ENTITY grantee of the SAME project, which holds project.read_structure and not this verb -- so the pair differs in the permission and in nothing else.
CREATE POLICY "admin_update_question_categories" ON public.question_categories
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Delete: `project.edit_questions`.
CREATE POLICY "admin_delete_question_categories" ON public.question_categories FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_questions')
  )
);

-- =====================================================================
-- questions (project_id)
-- =====================================================================
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "questions_deny_all" ON public.questions;

CREATE POLICY "anon_select_questions" ON public.questions FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Authenticated read: the IDENTICAL two-term disjunction its category twin above carries, and the reason for repeating it rather than abstracting it is the same. THIS IS THE VOTER AND CANDIDATE APPS' ENTIRE QUESTION SURFACE: `get_questions` (505-question-rpcs.sql) is SECURITY INVOKER and its own header says the reads run with the caller's permissions, so this policy and the category one are the whole gate, and a predicate one term too narrow renders no product rather than failing a test. The full E2E suite is the second instrument on it.
--
-- The publication term is GONE rather than pending removal (D-11b).
CREATE POLICY "authenticated_select_questions" ON public.questions FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_structure')
    )
    OR (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Insert: `project.edit_questions`, the same verb as its category twin and NOT the read verb the SELECT above names.
CREATE POLICY "admin_insert_questions" ON public.questions FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Update: `project.edit_questions`. ⚠ THIS POLICY HAS A LIVE RUNTIME CALLER AND IT IS NOT A TEST. `merge_question_custom_data` (504-admin-rpcs.sql) is SECURITY INVOKER, and both admin job features reach it through a client carrying the INITIATING ADMIN'S OWN bearer token ($lib/supabase/job.ts -- the token rides on global.headers, so RLS evaluates the job as that admin for its whole run). An admin who loses `project.edit_questions` loses both features silently. Every role holding the legacy predicate today holds this verb, and one role more.
CREATE POLICY "admin_update_questions" ON public.questions
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Delete: `project.edit_questions`.
CREATE POLICY "admin_delete_questions" ON public.questions FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_questions')
  )
);

-- =====================================================================
-- nominations (project_id, confirmed) -- the retired publication term left this table's policies in 162-12 and its COLUMN left the schema in 162-16
-- =====================================================================
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nominations_deny_all" ON public.nominations;

-- Anon visibility is an ALL-OF rule with three conjuncts. The project must be open for voters; the nomination must itself be confirmed; and every entity the nomination links must be anon-readable in full, terms of use included, so that this policy and the entity policies give one answer rather than two that differ on one table (task 2 Q3 = A).
--
-- The confirmation conjunct is read BARE as of 162-12 (D-11c). It used to be `NOT COALESCE(unconfirmed, false)`, null-safe because the column was nullable; the column is now `confirmed boolean NOT NULL`, so there is no null to compensate for and the wrapper is gone rather than renamed.
--
-- The publication term is GONE rather than pending removal (D-11b), and the transitive conjunct is what replaces the work it used to do.
CREATE POLICY "anon_select_nominations" ON public.nominations FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
    AND confirmed
    AND (
      SELECT
        private.nomination_entities_confirmed (id)
    )
  );

-- Authenticated read: three disjuncts, converted by 162-12 and put in their present evaluation order by 162.1 D-01.
--
--   1. The PROJECT read permission. Section 3.4's second row -- any auth user can read the project they hold a grant in.
--   2. The PUBLIC-VISIBILITY disjunct, which REPLACES the per-row publication term rather than deleting it.
--   3. The NOMINATION read permission on the row's OWN entity, resolved by coalescing the four entity foreign keys (D-21), so no entity type is named and one predicate serves all four. ⚠ THIS IS ALSO THE PARENT HOP, AND IT IS REACHED THROUGH `user_can` RATHER THAN AROUND IT: an organization reading its child candidate's nomination is `user_can`'s child-nominee branch, which 162-04 task 2 ratified as gating `nomination.read` -- OPTION (D), and NOT `entity.read_answers`. The policy calls `user_can`, `user_can` calls `is_child_nominee`, and ROADMAP criterion 3's *used wherever policy allows that control* is satisfied by that chain. There is no second `nominations` hop here and no re-derivation of that function's shape.
--
-- ⚠ THE PUBLIC-VISIBILITY DISJUNCT IS NOT AN OPTIMISATION AND MUST NOT BE DROPPED. The term it replaces was the retired `OR published = true`, and that is what let a SIGNED-IN reader see a project they hold no grant in. Removing it without a replacement would make a logged-in candidate browsing the voter application see NOTHING AT ALL -- and nothing in the anonymous policies would cover them, because those apply to a different role. The failure would present as an empty voter app for logged-in users only, which no anon-read test covers. It is therefore asserted directly: a grantee of one project sees another project's public nominations and not its unconfirmed ones.
--
-- It is the SAME three conjuncts `anon_select_nominations` carries, through the same two helpers, ASSEMBLED here rather than composed into a third function -- D-36, which superseded D-35 and V-6(A) on measurement: a SECURITY DEFINER function can never be inlined by the planner, so composing definer helpers inside a third makes every per-row call deeper, and on 5000 anon-visible nominations the composed form cost 654.5 ms against 291.0 ms. The rule still exists ONCE per helper; what repeats is the assembly, and 162-17 owes the guard that holds the assemblies identical.
--
-- The publication term is GONE from this table's policies entirely as of 162-12, so 162-16 removed ten columns and FIVE partial indexes -- five, not the ten the brief states; only elections, candidates, organizations, questions and nominations ever carried one -- and found NOTHING left to strip in any policy. That is a discharged obligation rather than a note.
--
-- ⚠ DISJUNCT ORDER IS A MEASURED CHOICE (162.1 D-01, variant B). Project authority comes first so an admin exits on it; the public assembly comes second, token for token the sibling `anon_select_nominations` qual, so a publicly visible row never pays the SECURITY DEFINER entity `user_can` calls; entity authority comes last. PostgreSQL evaluates an OR left to right and stops at the first TRUE, so the order changes cost and never the answer: spike 028 proved it row-identical to the previous order (visible sets EXCEPT ALL in both directions and a 2,120-probe truth grid, 0 differences) and measured a signed-in candidate's whole-municipal read going from 7.15 s to 4.65 s against the 8 s timeout, admins unchanged at 1.30 s. 29-authenticated-disjunct-order.test.sql fails on any other order.
CREATE POLICY "authenticated_select_nominations" ON public.nominations FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_entities')
    )
    OR (
      (
        SELECT
          project_open_for_voters (project_id)
      )
      AND confirmed
      AND (
        SELECT
          private.nomination_entities_confirmed (id)
      )
    )
    OR (
      SELECT
        user_can (
          'entity',
          COALESCE(
            candidate_id,
            organization_id,
            faction_id,
            alliance_id
          ),
          'nomination.read'
        )
    )
  );

-- Admin insert: `project.edit_nominations` at project scope, in place of the legacy project predicate. Converted by 162-12.
CREATE POLICY "admin_insert_nominations" ON public.nominations FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_nominations')
    )
  );

-- Entity insert of its OWN nomination -- NEW IN 162-12. The same two conjuncts as the entity UPDATE policy below, plus the confirmation conjunct: an entity user creates their own nomination UNCONFIRMED and an admin confirms it.
--
-- ⚠ PROJECT AGREEMENT (162-REVIEW CR-03). The row's entity AND its election must belong to the row's `project_id`, the same conjunct `entity_insert_parent_nominations` carries below. Without it a candidate grantee of project A inserted a nomination into project B's contest -- `nomination.edit` is asked of the ENTITY, which is in A, and nothing compared that with the row. The constituency's project is checked by `validate_nomination`, which also re-checks the election for every writer.
--
-- The confirmation conjunct here is the BRACES; the belt is the INSERT column grant in 303-column-grants.sql, which does not name the column at all, so a caller cannot set it and the declared default supplies `false`. The two fail DIFFERENTLY -- the grant refuses at privilege level before any policy is consulted, this refuses the row -- and 23-nominations-write.test.sql asserts them SEPARATELY, because neither is allowed to stand for the other.
CREATE POLICY "entity_insert_nominations" ON public.nominations FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          COALESCE(
            candidate_id,
            organization_id,
            faction_id,
            alliance_id
          ),
          'nomination.edit'
        )
    )
    AND NOT (
      SELECT
        private.project_nominations_locked (project_id)
    )
    AND NOT confirmed
    AND (
      SELECT
        private.entity_project_id (
          COALESCE(
            candidate_id,
            organization_id,
            faction_id,
            alliance_id
          )
        )
    ) = project_id
    AND (
      SELECT
        private.election_project_id (election_id)
    ) = project_id
  );

-- Entity insert of a PARENT organization nomination -- section 11.5, and the sharpest surface in this file.
--
-- A child nominee whose party has no nomination at their contest may create one, unconfirmed, for an admin to resolve. The insert is NOT on their own row: it is on an ORGANIZATION's, which under section 3.3 is by definition not theirs. That is why `nomination.create_parent` is its own verb rather than a widening of `nomination.edit` -- folding it in would mean widening `own` to "own, plus any organization nomination I claim to belong to", which is the re-derivation-inside-a-policy this phase exists to end. It also makes the capability independently revocable and independently testable, and 23-nominations-write.test.sql's PERM assertion is what shows that.
--
-- ⚠ THIS IS A DELIBERATE HOLE IN `own`, AND HOLES LEAK. Any one of the five guards missing turns a convenience into a way for any authenticated candidate to write rows into the public nomination table, and a policy that admits a row it should have refused REDDENS NOTHING. Each guard is therefore REMOVED IN TURN and watched to turn an assertion green; the five counts are the evidence, and the green run that follows is not.
--
--   guard 1  the inserted row is an ORGANIZATION nomination. One non-null test suffices because the table's CHECK requires exactly one entity FK per row.
--   guard 2  it is created UNCONFIRMED (the braces again; the belt is the column grant).
--   guard 3  NO nomination exists for that organization at that election, constituency and round. NOT the uniqueness constraint -- that key includes the parent, so an organization already nominated under an ALLIANCE does not collide with a null-parent insert. The constraint decides the RACE; this decides the case.
--   guard 4  the project's nomination lock is OFF. A locked project must not be writable through a side door.
--   guard 5  the caller ALREADY HOLDS a nomination at that contest whose entity gives them this verb. Section 11.5's first clause -- "in the same transaction" -- is not expressible in a row-level check and is moot in the direction the flow runs; ratified at task 2 Q3.
--
-- Plus two conjuncts that are not guards:
--   the CAP (task 2 Q1 = A, value 10). Section 8.9 asks for it because the operator ticked "any organization in the project", which leaves a candidate able to create placeholders for parties they have nothing to do with. A literal with its reason beside it rather than a setting: D-15's homes are for values row-level security reads PER PROJECT, and nothing has asked for a per-project knob. The refusal that NAMES the value is `enforce_nomination_confirmation`'s, because a policy refusal names the policy and not the number.
--   the PROJECT AGREEMENT between the row's entity and the row. D-12b grants a candidate any organization IN THE PROJECT, and no constraint on this table forces a nomination's entity to share its project.
--
--     ⚠ ITS ARGUMENT IS THE COALESCED ENTITY AND NOT `organization_id`, AND THAT IS A MEASURED CORRECTION RATHER THAN A STYLE CHOICE. Written against `organization_id` alone it also does guard 1's job by accident: `entity_project_id(NULL)` is NULL, `NULL = project_id` is NULL, and a policy reads NULL as a refusal -- so every non-organization row was refused HERE and guard 1 never fired. MEASURED: removing guard 1 from this policy reddened ZERO assertions, which is precisely the "a guard whose removal reddens nothing is a guard that is not there" failure this plan's removal sweep exists to catch. Against the coalesced entity the agreement binds whatever entity the row names -- which is what it should always have said -- and guard 1 becomes load-bearing again. ⚠ IT IS SCOPED HERE AND NOT TO THE TABLE ON PURPOSE: 07-rpc-security.test.sql section 9 creates exactly that row deliberately, as the control that makes its entity-join assertions non-vacuous, and a table-wide constraint would void an existing negative control. The admin and service paths keep today's latitude and the general case is recorded as STILL OPEN.
--
-- Every hop is a hardened function and not a sub-select. Three of these guards read `public.nominations` from inside a policy ON `public.nominations` -- a SELF-reference, which is 162-08's recursion finding at its sharpest. Reproduced on this table before these were written: `infinite recursion detected in policy for relation "nominations"`. The inline form is UNAVAILABLE here, not merely unattractive.
CREATE POLICY "entity_insert_parent_nominations" ON public.nominations FOR INSERT TO authenticated
WITH
  CHECK (
    organization_id IS NOT NULL
    AND NOT confirmed
    AND NOT (
      SELECT
        private.nomination_exists_in_contest (
          'organization'::public.entity_type,
          organization_id,
          election_id,
          constituency_id,
          election_round
        )
    )
    AND NOT (
      SELECT
        private.project_nominations_locked (project_id)
    )
    AND (
      SELECT
        private.caller_nominated_in_contest (
          election_id,
          constituency_id,
          election_round,
          'nomination.create_parent'
        )
    )
    AND (
      SELECT
        private.caller_unconfirmed_originated_count ()
    ) < 10
    AND (
      SELECT
        private.entity_project_id (
          COALESCE(
            organization_id,
            candidate_id,
            faction_id,
            alliance_id
          )
        )
    ) = project_id
  );

-- Admin update: `project.edit_nominations` at project scope, in place of the legacy project predicate. Converted by 162-12.
CREATE POLICY "admin_update_nominations" ON public.nominations
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_nominations')
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_nominations')
    )
  );

-- Entity update of OWN nomination -- NEW IN 162-12, AND THE FIRST NON-ADMIN WRITE PATH THIS TABLE HAS EVER HAD. Fact 19 records that `nominations` was admin-only to write, so there was no policy here to rename; this is a permission surface written from nothing, which is where the permissive failure lives.
--
-- Two conjuncts, and each is asserted in BOTH directions in 23-nominations-write.test.sql because a policy that admits a row it should have refused reddens nothing:
--
--   1. `nomination.edit` on the row's OWN entity, resolved by COALESCING the four entity foreign keys. The scope argument comes from the ROW, never from the policy's name (D-21), so this one predicate serves candidates, organizations, factions and alliances and no entity type is written down. The table's CHECK requires exactly one of the four to be non-null, which is what makes the coalesce total.
--   2. The project's nomination lock OFF -- section 3.3's `own, unless locked`. 162-07 shipped `projects.lock_nominations` INERT and said so in its own comment; this is its FIRST AND ONLY READER, which means an error in its declaration surfaces here rather than there. The hop is a hardened helper rather than an inline sub-select over public.projects, for the reason 162-08 measured: a policy reading a table its own policy guards raises `infinite recursion detected in policy for relation`, reproduced on THIS table before these were written.
--
-- The lock is a CONJUNCT rather than a matrix member because 162-04 task 2 Q3 ratified that row state is not a permission: `user_can` answers "may this role do this verb to this object", not "is this object in a state that admits the verb".
--
-- The WITH CHECK also carries the PROJECT-AGREEMENT conjunct of the insert policy above (162-REVIEW CR-03): `election_id` is in the UPDATE column grant, so without it an existing nomination could be MOVED into another project's election.
--
-- What is NOT here: any clause about the confirmation flag. An entity user may edit a CONFIRMED nomination -- what they may not do is keep it confirmed, and that is `enforce_nomination_confirmation`'s rule 2, a trigger, because a policy can refuse a row but cannot rewrite one.
CREATE POLICY "entity_update_nominations" ON public.nominations
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'entity',
          COALESCE(
            candidate_id,
            organization_id,
            faction_id,
            alliance_id
          ),
          'nomination.edit'
        )
    )
    AND NOT (
      SELECT
        private.project_nominations_locked (project_id)
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          COALESCE(
            candidate_id,
            organization_id,
            faction_id,
            alliance_id
          ),
          'nomination.edit'
        )
    )
    AND NOT (
      SELECT
        private.project_nominations_locked (project_id)
    )
    AND (
      SELECT
        private.entity_project_id (
          COALESCE(
            candidate_id,
            organization_id,
            faction_id,
            alliance_id
          )
        )
    ) = project_id
    AND (
      SELECT
        private.election_project_id (election_id)
    ) = project_id
  );

-- Admin delete: `project.edit_nominations` at project scope, in place of the legacy project predicate. Converted by 162-12.
CREATE POLICY "admin_delete_nominations" ON public.nominations FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_nominations')
  )
);

-- =====================================================================
-- app_settings (project_id, no per-row public flag -- anon needs read for voter app)
-- =====================================================================
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_deny_all" ON public.app_settings;

-- Anon: the project must be open for voters. Settings are the FIRST item in 162-IMPLEMENTATION-BRIEF.md section 3.4's list of what an anon reader may see WHEN the project is open, so this policy stops being ungated -- an ungated anon policy alongside twelve gated ones is the second visibility mechanism this phase exists to end.
--
-- ⚠ CONSEQUENCE THE VOTER APPLICATION OWNS, ratified by the operator at 162-08 task 2 Q4: a CLOSED project now returns the anon caller NO SETTINGS ROW AT ALL, and the frontend has to be able to render that state. Nothing in this tree will catch it -- every project in every seed is open (162-07) -- so it is recorded here and handed on in 162-08-SUMMARY.md rather than discovered later.
CREATE POLICY "anon_select_app_settings" ON public.app_settings FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Authenticated read: the same two-term disjunction the two content tables above carry. It STOPS BEING UNGATED -- `USING (true)` made every project's configuration readable by every authenticated caller in the database, which is the second visibility mechanism this phase exists to end, and the narrowing is measured by cell 5 of 22-content-policies.test.sql's read grid.
--
-- ⚠ THE TOO-STRICT DIRECTION HERE IS AN OUTAGE, NOT AN EMPTY RENDER. `_getAppSettings` and `_getAppCustomization` read this table through `scopedFrom(...).select(...).maybeSingle()`, so zero rows reaches the adapter's null branch: `_getAppSettings` then asks `project_open_for_voters` and, when the project is closed, returns `voterApp: false`, which renders the voter maintenance page (162.1 D-06, D-16). For a grant holder the too-strict direction is still an outage, because a grant holder whose row disappeared would be shown that maintenance page instead of the preview (162.1 D-17), which is why the `user_can` disjunct must stay, and 30-closed-project.test.sql asserts it for a project admin and an entity editor. The project-open disjunct is the authenticated mirror of the rule 162-08 wrote for anon and is what keeps a logged-in non-grantee of an OPEN project reading it; removing it reddened cell 3 on this table, and the existing `'app_settings is always readable (by design)'` assertion in 01-tenant-isolation.test.sql with it. That assertion now passes because project A is open, not because this policy is ungated.
CREATE POLICY "authenticated_select_app_settings" ON public.app_settings FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.read_structure')
    )
    OR (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Insert: `project.edit_app_settings` — section 11.1, the same verb as the UPDATE below. The block comment that used to read "Admin CRUD" is gone with it: a PROJECT EDITOR holds this verb, so `admin_` in these three policy names is now inaccurate. The names are deliberately left alone -- a naming convention over 80 policies is a phase-level decision and three sibling plans are converting the other policies against the names they have -- and the inaccuracy is recorded for 162-17 rather than fixed unilaterally here.
CREATE POLICY "admin_insert_app_settings" ON public.app_settings FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can (
          'project',
          project_id,
          'project.edit_app_settings'
        )
    )
  );

-- Update: `project.edit_app_settings` — 162-IMPLEMENTATION-BRIEF.md section 11.1's settings split, the half 162-09 could not write. D-09 splits one settings permission in two along the line "does a policy read this value": `project.edit_project_settings` governs `projects` and is ADMIN-ONLY, this one governs `app_settings` and a project EDITOR holds it too. The editor keeps the app's face; the admin keeps the project's shape. WIDENS by exactly one role -- the project editor, whom the legacy predicate refused.
--
-- THE TWO PERMISSIONS ARE COEXTENSIVE IN SIX OF SECTION 3.3'S SEVEN COLUMNS, so a test run as an admin passes whichever literal is written here and a test run as a candidate fails whichever is written. `create_test_data ()` carries no project editor, so nothing in the tree could tell the two apart; 22-content-policies.test.sql mints one, and its editor allow-case was observed RED against this policy gated on `project.edit_project_settings` -- two reddened assertions where an always-true predicate reddens four, which is what distinguishes a split from a rename.
CREATE POLICY "admin_update_app_settings" ON public.app_settings
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'project',
          project_id,
          'project.edit_app_settings'
        )
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'project',
          project_id,
          'project.edit_app_settings'
        )
    )
  );

-- Delete: `project.edit_app_settings` — section 11.1.
CREATE POLICY "admin_delete_app_settings" ON public.app_settings FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can (
        'project',
        project_id,
        'project.edit_app_settings'
      )
  )
);

-- =====================================================================
-- feedback (anon insert-only; admin select/delete)
-- =====================================================================
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anonymous: insert only (rate limiting trigger handles spam prevention)
CREATE POLICY "anon_insert_feedback" ON public.feedback FOR INSERT TO anon
WITH
  CHECK (true);

-- Authenticated: insert only (candidate app also submits feedback; rate-limit trigger + CHECK constraint gate the insert regardless of role)
CREATE POLICY "authenticated_insert_feedback" ON public.feedback FOR INSERT TO authenticated
WITH
  CHECK (true);

-- Read: `feedback.read`. ⚠ TWO DIFFERENT MEMBERS OF SECTION 3.2 GOVERN THIS TABLE -- this policy takes `feedback.read` and the DELETE below takes `feedback.manage` -- and section 3.3 grants both to exactly the same four roles (Root, Account, ProjAdmin, ProjEditor) and to none of the four entity columns. NO BEHAVIOURAL TEST IN THIS ESTATE CAN TELL THEM APART, and exchanging the two literals was measured to redden ZERO behavioural assertions. DO NOT HELPFULLY COLLAPSE THEM ONTO ONE VERB: the structural policy-to-permission map in 22-content-policies.test.sql is the only instrument that sees the difference, and a later role holding one and not the other is what the distinction is for.
--
-- The second disjunct is the ORPHAN CLAUSE. `feedback.project_id` is ON DELETE SET NULL (107-feedback.sql, the operator's P-4 note), and a NULL project id makes the first disjunct NULL, which is not `true` -- so without this term a retained row would be readable by NOBODY. The global-scope admin is 162-11's stated ASSUMPTION for who that one identity should be, recorded as such in 162-11-SUMMARY.md and overrulable in one edit.
CREATE POLICY "admin_select_feedback" ON public.feedback FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'feedback.read')
    )
    OR (
      project_id IS NULL
      AND (
        SELECT
          user_can ('global', NULL::uuid, 'feedback.read')
      )
    )
  );

-- Delete: `feedback.manage`, which is NOT the literal the SELECT above names. See that policy's note for why the two are kept apart and what measures the difference. The orphan clause is the same one, on the same permission as this policy's own.
CREATE POLICY "admin_delete_feedback" ON public.feedback FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'feedback.manage')
  )
  OR (
    project_id IS NULL
    AND (
      SELECT
        user_can ('global', NULL::uuid, 'feedback.manage')
    )
  )
);

-- No UPDATE policy (feedback is immutable after insert -- locked decision) No anon SELECT policy (voters cannot read their own or others' feedback)
-- =====================================================================
-- admin_jobs (project_id, no per-row public flag -- admin-only)
-- =====================================================================
ALTER TABLE public.admin_jobs ENABLE ROW LEVEL SECURITY;

-- ALL THREE POLICIES ON THIS TABLE TAKE `project.edit_questions`, ratified by the operator on 2026-09-16 (162-CHECKPOINT-DECISIONS.md section 1 item S-4, option (a), the one box ticked). `admin_jobs` is governed by NO member of section 3.2 -- the enum was transcribed from a rights list naming Feedback, Account, Project, Entity and Nomination and nothing about job records -- and section 3.2 is canonical and cannot be extended by a plan, so the table is mapped onto an existing member by ratification rather than by a planner's choice. The jobs exist to edit questions and both features terminate in the question custom-data RPC, so whoever may write a question's custom data may record and read the job that wrote it. Holder set Root / Account / ProjAdmin / ProjEditor: one project editor wider than today, and ✗ in all four entity columns.
--
-- READ AND WRITE ARE DELIBERATELY NOT SPLIT HERE, against the pattern this phase installs on every other table, and the reason is written down rather than left to look like an oversight: the enum's only read-shaped member is `project.read_structure`, which is ✓ in all four entity columns of section 3.3. Using it on this SELECT would hand every candidate and organization editor in the project the initiating operator's address in `author` and the LLM job's prompt, response and progress in `input`, `output` and `messages` -- and would redden the estate's existing `candidate_a cannot SELECT admin_jobs (admin-only table)` assertion, which is how you would find out. 162-17's matrix conformance work inherits this mapping; 162-SPEC.md records it.
CREATE POLICY "admin_select_admin_jobs" ON public.admin_jobs FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Insert: the same ratified verb. `SupabaseAdminWriter.insertJobResult` reaches this policy through the initiating admin's own bearer token, so it is evaluated for a real runtime principal.
CREATE POLICY "admin_insert_admin_jobs" ON public.admin_jobs FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Delete: the same ratified verb. This table has no UPDATE policy, so deletion is the ONLY way to alter the record of who ran an LLM job over a project's questions; keeping delete in the same holder set as the capability being recorded is what stops the audit trail being wider to erase than to write.
CREATE POLICY "admin_delete_admin_jobs" ON public.admin_jobs FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_questions')
  )
);
