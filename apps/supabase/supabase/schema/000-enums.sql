-- Enum type definitions
--
-- All enum types used across the schema: question_type   - question answer value types entity_type     - nomination entity discriminator category_type   - question category classification grant_scope_type - grant scope vocabulary grant_role_type - grant role levels grant_permission - the permission verbs user_can is written in storage_verb - the read/write split storage_path_can maps to two different permissions nomination_shape - which of section 6.2's three nomination flows an election runs, and the type elections.election_type takes
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

-- The four grant scopes of 162-IMPLEMENTATION-BRIEF.md section 3.1, ordered from widest to narrowest; public.grants.scope takes this type and the two CHECK constraints on that table tie target_type and target_id to it.
CREATE TYPE public.grant_scope_type AS ENUM('global', 'account', 'project', 'entity');

-- Exactly two role levels and deliberately not three (D-02, 162-IMPLEMENTATION-BRIEF.md section 8.1(a)): the eight user types of 162-USER-RIGHTS.md span only admin and editor, editor management is the permission project.manage_editors with entity.invite_children as its entity-scope equivalent, so a third level would be an untested member of a security enum rather than a capability anything grants.
CREATE TYPE public.grant_role_type AS ENUM('admin', 'editor');

-- The 23 permission verbs of user_can, canonical in 162-IMPLEMENTATION-BRIEF.md section 3.2 and restated in 162-SPEC.md section 4, declared here in that table's order because it is also the order of the section 3.3 capability matrix and enum ordinals are persisted; scripts/assert-grant-permission-enum.mjs holds the same list as a committed canon and reddens lint:check if this declaration or the generated types drift from it.
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

-- The verb a storage policy is asking about, and the argument that makes read and write SEPARABLE at the storage layer rather than merely differently named.
--
-- v2.15-OPERATOR-DECISIONS-2026-08-29.md section K2's amendment requires the verb argument of user_can to be HONOURED by the storage policies and not discarded. Two helper functions named for read and for write would satisfy that sentence's letter while discarding the argument, and would make the split a property of which function a policy happened to call rather than one the function guarantees. A declared argument that public.storage_path_can branches on makes separability structural: the same call with a different verb resolves to a DIFFERENT permission, and a body that ignored it would redden the two read-but-not-write identities in 20-storage-authority.test.sql.
--
-- An enum rather than text, for the reason K3 gives about settings columns: a typo in a text literal inside a policy predicate denies silently, where a typo in an enum literal fails to apply.
CREATE TYPE public.storage_verb AS ENUM('read', 'write');

-- The three nomination flows of 162-IMPLEMENTATION-BRIEF.md section 6.2, as 162-USER-RIGHTS.md names them. Named for the CONCEPT rather than for the column that holds it, following grant_scope_type, which is the type of grants.scope and is likewise named for what it means.
--
-- This is the type elections.election_type takes under D-16: that column keeps its name and takes a new meaning, and the values it used to hold are DELETED rather than deprecated. They are deliberately not members here, which makes them unrepresentable rather than merely unused -- a row carrying one is a PostgreSQL error, not a stored string. A member kept "for compatibility" would be exactly the second mechanism this phase exists to end, and no database has been published that could still be carrying one.
CREATE TYPE public.nomination_shape AS ENUM(
  'organization_only',
  'candidate_only',
  'organization_list'
);
