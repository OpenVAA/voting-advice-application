-- Column-level protections for structural fields
--
-- Prevents authenticated users (candidates, party admins) from modifying
-- structural columns via PostgREST. Admin operations that need to update
-- these columns use service_role (Edge Functions), which bypasses column-level
-- grants entirely.
--
-- Approach: REVOKE table-level UPDATE, then GRANT UPDATE only on allowed columns.
-- (Column-level REVOKE is ineffective when table-level UPDATE exists.)
--
-- Depends on: 003-entities.sql (candidates, organizations tables)
--             006-answers-jsonb.sql (answers column)
--             011-auth-tables.sql (published column)
--             010-rls.sql (RLS policies already applied)

-- =====================================================================
-- candidates: restrict updatable columns
-- =====================================================================
-- Protected (admin-only) columns:
--   project_id      - determines project tenancy
--   auth_user_id    - links candidate to auth user, set during invite/registration
--   organization_id - party assignment
--   published       - publication status, admin-controlled
--   id              - primary key, immutable
--   is_generated    - system flag for mock/generated data
--
-- Allowed columns for candidates (self-edit):
--   name, short_name, info, color, image, sort_order, subtype,
--   custom_data, first_name, last_name, answers, created_at, updated_at

REVOKE UPDATE ON candidates FROM authenticated;
GRANT UPDATE (
  name, short_name, info, color, image, sort_order, subtype,
  custom_data, first_name, last_name, answers, created_at, updated_at
) ON candidates TO authenticated;

-- =====================================================================
-- organizations: restrict updatable columns
-- =====================================================================
-- Protected (admin-only) columns:
--   project_id   - determines project tenancy
--   auth_user_id - links organization to auth user
--   published    - publication status, admin-controlled
--   id           - primary key, immutable
--   is_generated - system flag for mock/generated data
--
-- Allowed columns for party admins (self-edit):
--   name, short_name, info, color, image, sort_order, subtype,
--   custom_data, answers, created_at, updated_at

REVOKE UPDATE ON organizations FROM authenticated;
GRANT UPDATE (
  name, short_name, info, color, image, sort_order, subtype,
  custom_data, answers, created_at, updated_at
) ON organizations TO authenticated;
