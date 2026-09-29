-- Row Level Security: per-operation access policies for every public table.
--
-- Helper functions, defined in 301-auth-functions.sql:
-- - user_can(scope, target_id, permission, target_type): whether the caller may apply this permission to this object. At entity scope the object is named by its entity type and id together, so every entity-scope call passes the type; at every other scope the type is omitted. Every authority decision in this file delegates to it.
-- - project_open_for_voters(project_id): whether the project is open to voters.
-- - private.entity_has_confirmed_nomination(entity_type, id, project_id): whether the entity has a confirmed nomination in the project.
--
-- An entity row is publicly visible when project_open_for_voters, the row's `confirmed` flag and entity_has_confirmed_nomination all hold. Each entity SELECT policy assembles that conjunction inline from the helpers.
--
-- Policy rules:
-- - SELECT = USING only.
-- - INSERT = WITH CHECK only.
-- - UPDATE = USING + WITH CHECK.
-- - DELETE = USING only.
-- - Always specify TO anon or TO authenticated.
-- - Always use (SELECT auth.uid()) and (SELECT auth.jwt()) for optimizer caching.
-- =====================================================================
-- accounts (no project_id, no project scope at all)
-- =====================================================================
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accounts_deny_all" ON public.accounts;

-- Authenticated read: any grant on the account or on one of its projects, so a project admin can read the account its project belongs to. This asks whether a grant exists rather than whether a permission is held, which user_can cannot express, so it is the one structure-table predicate that is not a user_can call. See public.user_has_account_grant.
CREATE POLICY "authenticated_select_accounts" ON public.accounts FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_has_account_grant (id)
    )
  );

-- Insert: asked at global scope with a NULL target, deliberately. The WITH CHECK sees the new row, whose id the caller chooses, and grants.target_id has no foreign key to accounts, so an account-scope check would let an admin pre-granted on an unused uuid create that account and own it. Do not narrow this to account scope.
CREATE POLICY "admin_insert_accounts" ON public.accounts FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('global', NULL::uuid, 'account.edit_settings')
    )
  );

-- Update: `account.edit_settings` at account scope, which admits the root admin and the account's own admin. The row is named by its own id, so tenancy is carried by the target.
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

-- Delete: global scope with a NULL target, so only the root admin may delete an account.
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

-- Authenticated read: any caller holding a grant in the project may read it. The decision is delegated wholly to user_can; a second project-access disjunct beside it would mask a regression in user_can.
CREATE POLICY "authenticated_select_projects" ON public.projects FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', id, 'project.read_structure')
    )
  );

-- Insert: `account.manage_projects` at account scope, against the new row's account, which admits the account admin and the root admin.
CREATE POLICY "admin_insert_projects" ON public.projects FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('account', account_id, 'account.manage_projects')
    )
  );

-- Update: `project.edit_project_settings`, a different permission from the read policy's `project.read_structure`; 17-project-structure-authority.test.sql asserts each policy names its own literal. A project editor holds `project.edit_structure` but not this permission, so an editor may reshape the project's elections but may not rename the project.
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

-- Delete: `account.manage_projects` at account scope, so deleting a project takes account authority: a project admin may update its own project but may not delete it. 17-project-structure-authority.test.sql asserts both directions.
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

-- Authenticated read: two different questions, kept as two disjuncts. `user_can` asks whether the caller holds `project.read_structure`, and `project_open_for_voters` asks whether the row is public, using the same helper as the anon policy so the two roles cannot drift apart. Without the public term a signed-in caller with no grant would see less than an anon caller, which would break sign-up because it reads structure before any grant exists.
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

-- Insert: `project.edit_structure`, not the read permission the SELECT names.
CREATE POLICY "admin_insert_elections" ON public.elections FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Update: `project.edit_structure`, held by project admins and editors. An entity grantee holds `project.read_structure` but not this permission, so it can read the project's elections but not edit them.
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

-- Authenticated read: the same two-term disjunction as the elections SELECT, repeated so the structure tables cannot drift apart.
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

-- Insert: `project.edit_structure`, not the read permission the SELECT names.
CREATE POLICY "admin_insert_constituency_groups" ON public.constituency_groups FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Update: `project.edit_structure`, held by project admins and editors.
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

-- Authenticated read: the same two-term disjunction as the elections SELECT, repeated so the structure tables cannot drift apart.
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

-- Insert: `project.edit_structure`, not the read permission the SELECT names.
CREATE POLICY "admin_insert_constituencies" ON public.constituencies FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_structure')
    )
  );

-- Update: `project.edit_structure`, held by project admins and editors.
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

-- Anon: a join row is visible exactly when its constituency group is. The table has no project_id, so the sub-select delegates to the group's own policy, which applies because the sub-select runs under the caller's row-level security. There is no policy cycle, because the group's policy does not reference this table.
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

-- Authenticated: the same delegation as the anon policy, character for character, so the two roles cannot answer differently. A wrong denial here is silent: supabaseDataProvider.ts reads this table only as a PostgREST embedded resource of `constituency_groups`, and a denied embed returns an empty array rather than an error.
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

-- Admin insert: `project.edit_structure` on the group's project, resolved by a SECURITY DEFINER helper rather than a sub-select, so a write does not depend on the caller's read access to the parent. The helper returns NULL for a missing group and user_can denies a NULL target at project scope, so an absent parent is refused.
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

-- Admin delete: `project.edit_structure` on the group's project, resolved by the same helper.
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

-- Anon: a join row is visible exactly when its constituency group is. The table has no project_id, so the sub-select delegates to the group's own policy, which applies because the sub-select runs under the caller's row-level security. There is no policy cycle, because the group's policy does not reference this table.
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

-- Authenticated: the same delegation as the anon policy, character for character, so the two roles cannot answer differently and a change to the group's visibility reaches this table too. A wrong denial here is silent: supabaseDataProvider.ts reads this table only as a PostgREST embedded resource of `elections`, and a denied embed returns an empty array rather than an error.
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

-- Admin insert: `project.edit_structure` on the election's project, resolved by a SECURITY DEFINER helper rather than a sub-select, so a write does not depend on the caller's read access to the parent. election_project_id returns NULL for a missing election and user_can denies a NULL target at project scope, so an absent parent is refused by the permission check itself.
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

-- Admin delete: `project.edit_structure` on the election's project, resolved by the same helper.
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
-- The twenty policies below are four copies of one shape, differing only in the table name and the entity-type literal. 18-entity-policies.test.sql asserts this structurally: each policy family's four expressions are one string once those two are normalised away, and for SELECT also the two terms-of-use conjuncts that only candidates carry.
--
-- Permissions used on the entity tables:
-- - project.read_entities: the SELECT policies' project disjunct, held by the root, account and project admins and by project editors.
-- - project.edit_entities: the INSERT, admin UPDATE and DELETE policies, held by the same four.
-- - entity.read_answers: the SELECT policies' own-row disjunct, held on its own row by an entity grant.
-- - entity.edit_answers: the self-update policies, held on its own row by an entity grant.
--
-- An entity grantee holds neither project permission, so it cannot reach another entity of its project through a project-scope call. For an entity grant, user_can's reach is equality with the granted entity, type and id both, so "is this row mine" needs no column comparison. Each entity policy passes its own table's entity type.
--
-- A parent entity's reach to its child nominee is not a row disjunct and must not become one: a SELECT policy returns every column, `answers` and `auth_user_id` included. That reach is served by public.get_entity_basic_data (503-entity-rpcs.sql), which is gated on `nomination.read` and returns an allow-listed projection; 18-entity-policies.test.sql asserts the parent cannot SELECT the child's row.
--
-- Row state (`confirmed`, open for voters, the terms-of-use timestamps) appears only in the public disjunct, never beside a grant, because user_can answers whether a role may apply a permission, not whether the row's state admits it. An entity grantee therefore reads and edits its own unconfirmed row, which the sign-up flow needs; name immutability on a confirmed entity is enforced by a trigger.
--
-- The public disjunct is assembled inline in all eight entity SELECT policies rather than composed into one function: a SECURITY DEFINER function cannot be inlined by the planner, so a composing function adds a per-row call and is several times slower. The two sub-rules keep a single definition each; 25-matrix-conformance.test.sql holds the eight assemblies identical, and 16-anon-visibility.test.sql holds the behavioural guards for the open-for-voters conjunct.
--
-- The `admin_*` policies also admit project editors, who hold project.edit_entities; the prefix is kept because every table's policies share it.
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

-- Disjunct order is deliberate and changes cost, never the answer: project authority first so an admin exits on the first call, then the public assembly, token for token the `anon_select_organizations` qual, so a publicly visible row never pays the entity user_can call, then entity authority. 29-authenticated-disjunct-order.test.sql fails on any other order.
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
        user_can (
          'entity',
          id,
          'entity.read_answers',
          'organization'::public.entity_type
        )
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
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'organization'::public.entity_type
        )
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'organization'::public.entity_type
        )
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
-- candidates (project_id, auth_user_id)
-- =====================================================================
-- Answers are stored in the JSONB `answers` column, so these row policies govern them too.
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "candidates_deny_all" ON public.candidates;

-- Anon: five conjuncts, each load-bearing and each flipped alone against an otherwise-visible row in 16-anon-visibility.test.sql. The project is open for voters; the candidate is confirmed; a confirmed nomination links it in this project, so confirming a nomination alone cannot publish a placeholder identity; terms of use were accepted (`IS NOT NULL`) and not future-dated (`< now()`, which also guards against clock skew).
--
-- Both helpers are SECURITY DEFINER because the inline lookups fail: anon cannot see `projects` rows under that table's own row-level security, and an inline entity/nomination lookup raises `infinite recursion detected in policy for relation "candidates"`.
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

-- Disjunct order is deliberate and changes cost, never the answer: project authority first so an admin exits on the first call, then the public assembly, token for token the `anon_select_candidates` qual, so a publicly visible row never pays the entity user_can call, then entity authority. 29-authenticated-disjunct-order.test.sql fails on any other order.
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
        user_can (
          'entity',
          id,
          'entity.read_answers',
          'candidate'::public.entity_type
        )
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

-- Entity self-update: whoever holds `entity.edit_answers` on this row may update it. For an entity grant user_can's reach is equality with the granted entity, type and id both, so no `auth_user_id` comparison is needed.
--
-- The `'entity'` scope literal is the whole safety argument: written `'project'`, it would let any entity editor in the project rewrite every candidate in it. 18-entity-policies.test.sql asserts that same-type, same-project denial.
--
-- Structural columns (project_id, auth_user_id, external_id, ...) are protected by this table's column grants in 303-column-grants.sql, because row-level security cannot admit a row while withholding a column.
CREATE POLICY "entity_update_own_candidates" ON public.candidates
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'candidate'::public.entity_type
        )
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'candidate'::public.entity_type
        )
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

-- Disjunct order is deliberate and changes cost, never the answer: project authority first so an admin exits on the first call, then the public assembly, token for token the `anon_select_factions` qual, so a publicly visible row never pays the entity user_can call, then entity authority. 29-authenticated-disjunct-order.test.sql fails on any other order.
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
        user_can (
          'entity',
          id,
          'entity.read_answers',
          'faction'::public.entity_type
        )
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

-- Entity self-update: a faction grantee holding `entity.edit_answers` may update its own row, which keeps the four entity tables one shape. The columns it may write are bounded in 303-column-grants.sql.
CREATE POLICY "entity_update_own_factions" ON public.factions
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'faction'::public.entity_type
        )
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'faction'::public.entity_type
        )
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

-- Disjunct order is deliberate and changes cost, never the answer: project authority first so an admin exits on the first call, then the public assembly, token for token the `anon_select_alliances` qual, so a publicly visible row never pays the entity user_can call, then entity authority. 29-authenticated-disjunct-order.test.sql fails on any other order.
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
        user_can (
          'entity',
          id,
          'entity.read_answers',
          'alliance'::public.entity_type
        )
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

-- Entity self-update: an alliance grantee holding `entity.edit_answers` may update its own row. The columns it may write are bounded in 303-column-grants.sql.
CREATE POLICY "entity_update_own_alliances" ON public.alliances
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'alliance'::public.entity_type
        )
    )
  )
WITH
  CHECK (
    (
      SELECT
        user_can (
          'entity',
          id,
          'entity.edit_answers',
          'alliance'::public.entity_type
        )
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

-- Authenticated read: the same two-term disjunction as the structure tables, repeated so the content tables cannot drift from them. Every grant in the project holds `project.read_structure`, entity grants included, so the user_can term means "the caller holds some grant in this project"; `project_open_for_voters` is a SECURITY DEFINER helper because an inline lookup of `public.projects` is filtered by that table's own row-level security.
--
-- Both disjuncts are load-bearing: without the public term a caller with no grant sees less than an anon caller in an open project, and without the user_can term a closed project goes dark to its own grantees. 22-content-policies.test.sql asserts each case (cells 3 and 4).
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

-- Insert: `project.edit_questions`, not the read permission the SELECT names. It is held by the root, account and project admins and by project editors, and by no entity grant.
CREATE POLICY "admin_insert_question_categories" ON public.question_categories FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Update: `project.edit_questions`. 22-content-policies.test.sql pairs it against `candidate_a`, an entity grantee of the same project that holds project.read_structure but not this permission.
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

-- Authenticated read: the same two-term disjunction as question_categories. `get_questions` (505-question-rpcs.sql) is SECURITY INVOKER, so this policy and the category one gate the whole question surface of the voter and candidate apps, and a predicate one term too narrow renders no questions rather than raising an error.
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

-- Insert: `project.edit_questions`, not the read permission the SELECT names.
CREATE POLICY "admin_insert_questions" ON public.questions FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Update: `project.edit_questions`. `merge_question_custom_data` (504-admin-rpcs.sql) is SECURITY INVOKER, and both admin job features call it with the initiating admin's own bearer token ($lib/supabase/job.ts), so an admin without this permission loses those features silently.
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
-- nominations (project_id, confirmed)
-- =====================================================================
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nominations_deny_all" ON public.nominations;

-- Anon: the project is open for voters, the nomination is confirmed, and every entity it links is anon-readable in full, terms of use included, so this policy and the entity policies give one answer.
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

-- Authenticated read: three disjuncts.
-- - `project.read_entities` on the row's project.
-- - The public-visibility assembly, the same three conjuncts as `anon_select_nominations`, assembled inline for the planner-inlining reason given in the entity-table header. It is not an optimisation: without it a signed-in caller with no grant in the project would see no nominations in the voter app, a case no anon test covers.
-- - `nomination.read` on the row's own entity, with the four entity foreign keys coalesced and the row's generated `entity_type` naming the type, so one predicate serves every entity type. This is also the parent hop: an organization reading its child candidate's nomination is admitted by user_can's child-nominee branch (is_child_nominee), not by a lookup here.
--
-- Disjunct order is deliberate and changes cost, never the answer: project authority first so an admin exits on the first call, then the public assembly, token for token the `anon_select_nominations` qual, so a publicly visible row never pays the entity user_can call, then entity authority. 29-authenticated-disjunct-order.test.sql fails on any other order.
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
          'nomination.read',
          entity_type
        )
    )
  );

-- Admin insert: `project.edit_nominations` at project scope.
CREATE POLICY "admin_insert_nominations" ON public.nominations FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_nominations')
    )
  );

-- Entity insert of its own nomination: `nomination.edit` on the row's entity, nominations unlocked, created unconfirmed for an admin to confirm, and the row's entity and election both in the row's project, so a grantee cannot insert into another project's contest. `validate_nomination` checks the constituency's project.
--
-- `NOT confirmed` is backed by the INSERT column grant in 303-column-grants.sql, which omits the column so the default `false` applies. The two fail differently, the grant at privilege level and this policy on the row, and 23-nominations-write.test.sql asserts them separately.
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
          'nomination.edit',
          entity_type
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
          entity_type,
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

-- Entity insert of a parent organization nomination: a child nominee whose party has no nomination at their contest may create one, unconfirmed, for an admin to resolve. `nomination.create_parent` is a separate permission from `nomination.edit`, so the capability can be revoked and tested on its own instead of widening `nomination.edit` beyond the caller's own row.
--
-- This deliberately admits rows that are not the caller's own, so each guard is load-bearing: without any one of them an authenticated candidate could write rows into the public nomination table, and an over-permissive policy fails no read test. 23-nominations-write.test.sql asserts each guard.
-- - Guard 1: the row is an organization nomination; one non-null test suffices because the table's CHECK requires exactly one entity foreign key.
-- - Guard 2: it is created unconfirmed; the column grant is the second line of defence.
-- - Guard 3: no nomination exists for that organization at that election, constituency and round. The unique key includes the parent, so it does not see an organization already nominated under an alliance; the key only settles concurrent inserts.
-- - Guard 4: the project's nominations are not locked.
-- - Guard 5: the caller already holds a nomination at that contest whose entity grants `nomination.create_parent`.
-- - Cap: the caller may have originated at most 10 unconfirmed parent nominations, so a candidate cannot create placeholders for unrelated parties at will. `enforce_nomination_confirmation` raises the error that names the limit, because a policy refusal names only the policy.
-- - Project agreement: the row's entity belongs to the row's project. Its argument is the coalesced entity rather than `organization_id`, so it does not silently do guard 1's job and mask guard 1's removal. It is scoped to this policy rather than the table because 07-rpc-security.test.sql inserts such a row deliberately as a negative control.
--
-- Every lookup is a SECURITY DEFINER helper: three guards read `public.nominations` from a policy on `public.nominations`, and the inline form raises `infinite recursion detected in policy for relation "nominations"`.
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
          entity_type,
          COALESCE(
            organization_id,
            candidate_id,
            faction_id,
            alliance_id
          )
        )
    ) = project_id
  );

-- Admin update: `project.edit_nominations` at project scope.
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

-- Entity update of its own nomination: `nomination.edit` on the row's entity, with the four entity foreign keys coalesced (the table's CHECK makes exactly one non-null) and the row's generated `entity_type` naming the type, and the project's nominations unlocked. 23-nominations-write.test.sql asserts each conjunct in both directions.
--
-- The lock is a conjunct rather than a permission because user_can answers whether a role may apply a permission, not whether the object's state admits it. It is read through a SECURITY DEFINER helper because an inline sub-select over public.projects raises `infinite recursion detected in policy for relation`.
--
-- WITH CHECK also requires the entity and the election to be in the row's project: `election_id` is in the UPDATE column grant, so a nomination could otherwise be moved into another project's election.
--
-- Confirmation is not checked here. An entity may edit a confirmed nomination, and the `enforce_nomination_confirmation` trigger stops it staying confirmed, because a policy can refuse a row but cannot rewrite it.
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
          'nomination.edit',
          entity_type
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
          'nomination.edit',
          entity_type
        )
    )
    AND NOT (
      SELECT
        private.project_nominations_locked (project_id)
    )
    AND (
      SELECT
        private.entity_project_id (
          entity_type,
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

-- Admin delete: `project.edit_nominations` at project scope.
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

-- Anon: the project must be open for voters. A closed project returns no settings row at all, and the voter app renders its maintenance page for that state.
CREATE POLICY "anon_select_app_settings" ON public.app_settings FOR
SELECT
  TO anon USING (
    (
      SELECT
        project_open_for_voters (project_id)
    )
  );

-- Authenticated read: the same two-term disjunction as the content tables. 22-content-policies.test.sql (cell 5 of its read grid) asserts that a grantee of another project cannot read a closed project's row.
--
-- Too strict is an outage here, not an empty render: zero rows reach `_getAppSettings`'s null branch, which shows the voter maintenance page when the project is closed. The user_can term is what shows grant holders the preview instead (30-closed-project.test.sql), and the public term keeps a signed-in non-grantee of an open project reading it.
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

-- Insert: `project.edit_app_settings`. Project editors hold it too, so the `admin_` prefix of these three policy names is inaccurate; it is kept because every table's policies share it.
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

-- Update: `project.edit_app_settings`. Settings permissions split along whether a policy reads the value: `project.edit_project_settings` governs `projects` and is admin-only, while this permission governs `app_settings` and project editors hold it too.
--
-- The two permissions have the same holders except the project editor, so only an editor tells them apart; 22-content-policies.test.sql creates one for that reason.
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

-- Delete: `project.edit_app_settings`.
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
-- feedback (anon and authenticated insert; admin select and delete)
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

-- Read: `feedback.read`, while the DELETE takes `feedback.manage`. Both have the same holders, so no behavioural test tells them apart and only the policy-to-permission map in 22-content-policies.test.sql sees the difference; do not collapse them onto one permission.
--
-- The second disjunct covers orphaned rows: `feedback.project_id` is ON DELETE SET NULL (107-feedback.sql), and a NULL project makes the first disjunct NULL, so without it a retained row would be readable by nobody. Orphaned rows are left to the global-scope (root) admin.
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

-- Delete: `feedback.manage`, kept apart from the read policy's `feedback.read`, with the same orphan clause.
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

-- No UPDATE policy: feedback is immutable after insert.
-- No anon SELECT policy: voters cannot read their own or others' feedback.
-- =====================================================================
-- admin_jobs (project_id, no per-row public flag -- admin-only)
-- =====================================================================
ALTER TABLE public.admin_jobs ENABLE ROW LEVEL SECURITY;

-- All three policies take `project.edit_questions`. No permission covers job records, and the jobs exist to edit questions through the question custom-data RPC, so whoever may write a question's custom data may record and read the job that wrote it.
--
-- Read and write are deliberately not split: the only read-shaped permission, `project.read_structure`, is held by entity grantees, and using it would expose the initiating admin's address in `author` and the LLM job's prompt and output in `input`, `output` and `messages` to every candidate in the project.
CREATE POLICY "admin_select_admin_jobs" ON public.admin_jobs FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Insert: `SupabaseAdminWriter.insertJobResult` reaches this policy with the initiating admin's own bearer token.
CREATE POLICY "admin_insert_admin_jobs" ON public.admin_jobs FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        user_can ('project', project_id, 'project.edit_questions')
    )
  );

-- Delete: this table has no UPDATE policy, so deletion is the only way to alter a job record, and giving it the same holders as insert keeps the audit trail no easier to erase than to write.
CREATE POLICY "admin_delete_admin_jobs" ON public.admin_jobs FOR DELETE TO authenticated USING (
  (
    SELECT
      user_can ('project', project_id, 'project.edit_questions')
  )
);
