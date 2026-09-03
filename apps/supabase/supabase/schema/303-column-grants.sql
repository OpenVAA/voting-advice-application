-- Column-level protections for structural fields
--
-- Prevents authenticated users (candidates, organization admins) from modifying structural columns via PostgREST. Admin operations that need to update these columns use service_role (Edge Functions), which bypasses column-level grants entirely.
--
-- Approach: REVOKE table-level UPDATE, then GRANT UPDATE only on allowed columns.
-- (Column-level REVOKE is ineffective when table-level UPDATE exists.)
--
-- Depends on: 102-entities.sql (candidates, organizations tables)
--             105-answers.sql (answers column) 300-auth-tables.sql (published column) 302-rls.sql (RLS policies already applied)

-- =====================================================================
-- candidates: restrict updatable columns
-- =====================================================================
-- Protected (admin-only) columns:
--   project_id      - determines project tenancy auth_user_id    - links candidate to auth user, set during invite/registration organization_id - the nominating organization published       - publication status, admin-controlled id              - primary key, immutable is_generated    - system flag for mock/generated data sort_order      - presentation order, admin-controlled created_at      - audit field, maintained by the database updated_at      - audit field, maintained by the set_updated_at trigger
--
-- Allowed columns for candidates (self-edit):
--   short_name, info, color, image, subtype, custom_data, first_name, last_name, answers, terms_of_use_accepted

REVOKE UPDATE ON public.candidates FROM authenticated;
GRANT UPDATE (
  short_name, info, color, image, subtype,
  custom_data, first_name, last_name, answers,
  terms_of_use_accepted
) ON public.candidates TO authenticated;

-- =====================================================================
-- organizations: restrict updatable columns
-- =====================================================================
-- Protected (admin-only) columns:
--   project_id   - determines project tenancy auth_user_id - links organization to auth user published    - publication status, admin-controlled id           - primary key, immutable is_generated - system flag for mock/generated data sort_order   - presentation order, admin-controlled created_at   - audit field, maintained by the database updated_at   - audit field, maintained by the set_updated_at trigger
--
-- Allowed columns for organization admins (self-edit):
--   name, short_name, info, color, image, subtype, custom_data, answers

REVOKE UPDATE ON public.organizations FROM authenticated;
GRANT UPDATE (
  name, short_name, info, color, image, subtype,
  custom_data, answers
) ON public.organizations TO authenticated;
