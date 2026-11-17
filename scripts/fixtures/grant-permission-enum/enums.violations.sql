-- FIXTURE — the SEEDED half of the self-test pair for scripts/assert-grant-permission-enum.mjs.
-- Byte-for-byte the clean fixture, with FOUR deliberate defects, one per failure class the guard
-- claims to catch. Each is marked below. The guard must produce exactly the findings committed in
-- expected.violations — no more, no fewer.
--
--   1. 'entity.confirm' is misspelled as the near neighbour 'entity.confrim'. This is the class a
--      cardinality check cannot see: the member count is unchanged.
--   2. 'nomination.create_parent' is DELETED. The canon-side direction of the comparison is what
--      reports it.
--   3. 'suggestion.review' is ADDED — a suggestion verb, which D-01 forbids because no suggestion
--      store is built.
--   4. 'owner' is ADDED to grant_role_type — the third role level D-02 refused.
--
-- Defects 1 and 3 cancel out in a count, which is why the comparison reports both directions
-- separately rather than a single "the sets differ".
-- This file is under .prettierignore via scripts/fixtures/, so it is safe from reformatting.
CREATE TYPE public.entity_type AS ENUM('candidate', 'organization', 'faction', 'alliance');

CREATE TYPE public.grant_scope_type AS ENUM('global', 'account', 'project', 'entity');

-- SEEDED DEFECT 4: a third role level.
CREATE TYPE public.grant_role_type AS ENUM('admin', 'editor', 'owner');

CREATE TYPE public.grant_permission AS ENUM(
  'feedback.read',
  'feedback.manage',
  'account.edit_settings',
  'account.manage_projects',
  'account.manage_admins',
  'project.manage_editors',
  'project.edit_project_settings',
  'project.edit_app_settings',
  'project.edit_structure',
  'project.edit_questions',
  'project.read_structure',
  'project.edit_entities',
  'project.edit_nominations',
  'project.read_entities',
  'entity.edit_answers',
  'entity.read_answers',
  'entity.edit_immutable',
  'entity.invite_children',
  'entity.confrim',
  'suggestion.review',
  'nomination.edit',
  'nomination.read',
  'nomination.confirm'
);
