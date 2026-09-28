-- FIXTURE — the CLEAN half of the self-test pair for scripts/assert-grant-permission-enum.mjs.
-- A miniature enums file whose three grant declarations match the guard's canon exactly, including
-- order. The guard must report ZERO findings over it. Without this leg a comparator that reports
-- nothing would pass the seeded fixture's "expected but not produced" check by producing nothing at
-- all, so the clean leg is what makes the seeded leg mean something.
--
-- It carries an unrelated declaration ahead of the grant types on purpose: the parser must find the
-- three it is looking for by name rather than by position.
-- This file is under .prettierignore via scripts/fixtures/, so it is safe from reformatting.
CREATE TYPE public.entity_type AS ENUM('candidate', 'organization', 'faction', 'alliance');

CREATE TYPE public.grant_scope_type AS ENUM('global', 'account', 'project', 'entity');

CREATE TYPE public.grant_role_type AS ENUM('admin', 'editor');

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
