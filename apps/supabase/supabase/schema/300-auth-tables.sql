-- Auth tables: user_roles, auth_user_id columns, published flags
--
-- Depends on: 001-tenancy.sql (accounts, projects)
--             003-entities.sql (candidates, organizations)
--             All voter-facing content tables

--------------------------------------------------------------------------------
-- user_roles table
--------------------------------------------------------------------------------
CREATE TABLE public.user_roles (
  id         uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       user_role_type NOT NULL,
  scope_type text           NOT NULL,  -- 'candidate', 'party', 'project', 'account', 'global'
  scope_id   uuid,                     -- NULL for super_admin (global scope)
  created_at timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, scope_type, scope_id)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles (user_id);

--------------------------------------------------------------------------------
-- RLS on user_roles — critical to prevent circular RLS with the auth hook
--------------------------------------------------------------------------------
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Auth admin must read roles (used by Custom Access Token Hook)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.user_roles TO supabase_auth_admin;
CREATE POLICY "auth_admin_read_user_roles"
  ON public.user_roles FOR SELECT
  TO supabase_auth_admin
  USING (true);

-- Service role (Edge Functions) can manage roles
CREATE POLICY "service_role_manage_user_roles"
  ON public.user_roles FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Prevent regular users from accessing user_roles directly
REVOKE ALL ON TABLE public.user_roles FROM authenticated, anon, public;

--------------------------------------------------------------------------------
-- Published columns on voter-facing tables
-- (Using ALTER TABLE since the base tables are defined in earlier schema files)
--------------------------------------------------------------------------------
ALTER TABLE public.elections ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.candidates ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.organizations ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.questions ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.question_categories ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.nominations ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.constituencies ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.constituency_groups ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.factions ADD COLUMN published boolean NOT NULL DEFAULT false;
ALTER TABLE public.alliances ADD COLUMN published boolean NOT NULL DEFAULT false;

--------------------------------------------------------------------------------
-- Partial indexes on published for efficient anon RLS
-- (Must be in this file, after the columns are added above)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_elections_published ON public.elections (published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_candidates_published ON public.candidates (published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_organizations_published ON public.organizations (published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_questions_published ON public.questions (published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_nominations_published ON public.nominations (published) WHERE published = true;
