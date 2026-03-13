-- Auth hooks: Custom Access Token Hook and RLS helper functions
--
-- Depends on: 011-auth-tables.sql (user_roles table)
--             001-tenancy.sql (projects table for can_access_project)
--
-- Functions:
--   custom_access_token_hook(jsonb)  - Injects user_roles into JWT claims
--   has_role(text, text, uuid)       - Check if current user has a specific role
--   can_access_project(uuid)         - Check if current user can access a project
--   is_candidate_self(uuid)          - Check if current user owns a candidate row

--------------------------------------------------------------------------------
-- Custom Access Token Hook
-- Called by Supabase Auth on every token refresh/issue.
-- Reads user_roles and injects them into the JWT claims.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_roles_claim jsonb;
BEGIN
  claims := event->'claims';

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'role', ur.role::text,
      'scope_type', ur.scope_type,
      'scope_id', ur.scope_id
    )
  ), '[]'::jsonb)
  INTO user_roles_claim
  FROM public.user_roles ur
  WHERE ur.user_id = (event->>'user_id')::uuid;

  claims := jsonb_set(claims, '{user_roles}', user_roles_claim);
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant execute to auth admin (required for the hook to work)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

--------------------------------------------------------------------------------
-- has_role: check if the current JWT contains a specific role assignment
--
-- Usage in RLS policies:
--   has_role('super_admin')                             -- any super_admin role
--   has_role('project_admin', 'project', project_id)    -- project_admin for specific project
--   has_role('candidate', 'candidate', candidate_id)    -- candidate for specific record
--
-- SECURITY DEFINER with empty search_path to prevent search_path attacks.
-- Uses (SELECT auth.jwt()) to ensure a single evaluation per query.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(
  check_role text,
  check_scope_type text DEFAULT NULL,
  check_scope_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_roles jsonb;
  role_entry jsonb;
BEGIN
  user_roles := (SELECT auth.jwt() -> 'user_roles');
  IF user_roles IS NULL THEN RETURN false; END IF;

  FOR role_entry IN SELECT * FROM jsonb_array_elements(user_roles)
  LOOP
    IF role_entry->>'role' = check_role THEN
      -- super_admin has global access, no scope check needed
      IF check_role = 'super_admin' THEN RETURN true; END IF;
      -- If no scope filter requested, any matching role suffices
      IF check_scope_type IS NULL THEN RETURN true; END IF;
      -- Check exact scope match
      IF role_entry->>'scope_type' = check_scope_type
         AND role_entry->>'scope_id' = check_scope_id::text THEN
        RETURN true;
      END IF;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;

--------------------------------------------------------------------------------
-- can_access_project: check if current user can access a project
--
-- Returns true if user has:
--   - super_admin role (any scope)
--   - project_admin role scoped to this project
--   - account_admin role scoped to the project's account
--
-- SECURITY DEFINER with empty search_path.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_project(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_roles jsonb;
  role_entry jsonb;
  p_account_id uuid;
BEGIN
  user_roles := (SELECT auth.jwt() -> 'user_roles');
  IF user_roles IS NULL THEN RETURN false; END IF;

  FOR role_entry IN SELECT * FROM jsonb_array_elements(user_roles)
  LOOP
    IF role_entry->>'role' = 'super_admin' THEN RETURN true; END IF;

    IF role_entry->>'role' = 'project_admin'
       AND role_entry->>'scope_type' = 'project'
       AND role_entry->>'scope_id' = p_project_id::text THEN
      RETURN true;
    END IF;

    IF role_entry->>'role' = 'account_admin' THEN
      SELECT account_id INTO p_account_id FROM public.projects WHERE id = p_project_id;
      IF role_entry->>'scope_type' = 'account'
         AND role_entry->>'scope_id' = p_account_id::text THEN
        RETURN true;
      END IF;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;

--------------------------------------------------------------------------------
-- is_candidate_self: check if the current user owns a candidate row
--
-- Usage: is_candidate_self(candidates.auth_user_id) in RLS policies
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_candidate_self(row_auth_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT row_auth_user_id = (SELECT auth.uid());
$$;
