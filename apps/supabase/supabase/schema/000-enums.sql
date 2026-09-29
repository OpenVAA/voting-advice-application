-- Enum type definitions
--
-- All enum types used across the schema:
-- - question_type - question answer value types
-- - entity_type - nomination entity discriminator
-- - category_type - question category classification
-- - grant_scope_type - grant scope vocabulary
-- - grant_role_type - grant role levels
-- - grant_permission - the permission verbs user_can is written in
-- - storage_verb - the read/write split storage_path_can maps to two different permissions
-- - nomination_shape - which of the three nomination flows an election runs; the type of elections.election_type
CREATE TYPE public.question_type AS ENUM(
  'text',
  'number',
  'boolean',
  'image',
  'date',
  'multipleText',
  'singleChoiceOrdinal',
  'singleChoiceCategorical',
  'multipleChoiceCategorical'
);

CREATE TYPE public.entity_type AS ENUM(
  'candidate',
  'organization',
  'faction',
  'alliance'
);

CREATE TYPE public.category_type AS ENUM('info', 'opinion', 'default');

-- The grant scopes, ordered from widest to narrowest. public.grants.scope takes this type, and the two CHECK constraints on that table tie target_type and target_id to it.
CREATE TYPE public.grant_scope_type AS ENUM('global', 'account', 'project', 'entity');

-- Exactly two role levels: every supported user type is an admin or an editor of some scope. Managing editors is the permission project.manage_editors, with entity.invite_children as its entity-scope equivalent, so a third level would be a security enum member that nothing grants.
CREATE TYPE public.grant_role_type AS ENUM('admin', 'editor');

-- The permission verbs of user_can, in capability-matrix order. Enum ordinals are persisted, so the order is part of the type: scripts/assert-grant-permission-enum.mjs holds the same list in the same order and fails lint:check if this declaration or the generated types drift from it.
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
  'entity.confirm',
  'nomination.edit',
  'nomination.read',
  'nomination.confirm',
  'nomination.create_parent'
);

-- The verb a storage policy asks about. public.storage_path_can branches on it, so the same call with a different verb resolves to a different permission, and read and write are separable at the storage layer rather than merely differently named. A body that ignored the verb would fail the two read-but-not-write identities in 20-storage-authority.test.sql.
--
-- An enum rather than text: a typo in a text literal inside a policy predicate denies silently, where a typo in an enum literal fails to apply.
CREATE TYPE public.storage_verb AS ENUM('read', 'write');

-- The three nomination flows an election can run. It is the type of elections.election_type, and like grant_scope_type it is named for what it means rather than for the column that holds it.
--
-- The members are exactly the three flows, so any other value in elections.election_type is a PostgreSQL error rather than a stored string.
CREATE TYPE public.nomination_shape AS ENUM(
  'organization_only',
  'candidate_only',
  'organization_list'
);
