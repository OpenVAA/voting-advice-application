-- Email helper functions for transactional email template variable resolution
--
-- Depends on: 003-entities.sql (candidates, organizations)
--             005-nominations.sql (nominations)
--             002-elections.sql (elections, constituencies)
--             011-auth-tables.sql (user_roles)
--             000-functions.sql (get_localized)

--------------------------------------------------------------------------------
-- resolve_email_variables: resolve template variables for a set of users
--
-- For each user_id, looks up their entity context via user_roles and resolves
-- template variable paths like "candidate.first_name", "organization.name",
-- "nomination.constituency.name", "nomination.election.name".
--
-- Returns a row per user with their email, preferred_locale, and a flat JSONB
-- object of resolved variables.
--
-- SECURITY DEFINER: needs to read auth.users which is not accessible to
-- regular authenticated users.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_email_variables(
  p_user_ids uuid[],
  p_template_body text DEFAULT '',
  p_template_subject text DEFAULT ''
)
RETURNS TABLE (
  user_id uuid,
  email text,
  preferred_locale text,
  variables jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid;
  u_email text;
  u_locale text;
  u_role public.user_role_type;
  u_scope_id uuid;
  vars jsonb;
  -- Candidate fields
  c_first_name text;
  c_last_name text;
  c_org_id uuid;
  -- Organization fields
  org_name text;
  -- Nomination fields
  nom_constituency_name text;
  nom_election_name text;
BEGIN
  FOREACH uid IN ARRAY p_user_ids
  LOOP
    -- Get user email and preferred locale from auth.users
    SELECT
      au.email,
      COALESCE(au.raw_user_meta_data->>'preferred_locale', 'en')
    INTO u_email, u_locale
    FROM auth.users au
    WHERE au.id = uid;

    IF u_email IS NULL THEN
      -- User not found, skip
      CONTINUE;
    END IF;

    -- Initialize empty variables
    vars := '{}'::jsonb;

    -- Get the first relevant role (candidate or party) for this user
    SELECT ur.role, ur.scope_id
    INTO u_role, u_scope_id
    FROM public.user_roles ur
    WHERE ur.user_id = uid
      AND ur.role IN ('candidate', 'party')
    ORDER BY
      CASE ur.role
        WHEN 'candidate' THEN 1
        WHEN 'party' THEN 2
      END
    LIMIT 1;

    IF u_role = 'candidate' AND u_scope_id IS NOT NULL THEN
      -- Resolve candidate fields
      SELECT c.first_name, c.last_name, c.organization_id
      INTO c_first_name, c_last_name, c_org_id
      FROM public.candidates c
      WHERE c.id = u_scope_id;

      IF c_first_name IS NOT NULL THEN
        vars := vars || jsonb_build_object(
          'candidate.first_name', c_first_name,
          'candidate.last_name', c_last_name
        );
      END IF;

      -- Resolve organization name for this candidate
      IF c_org_id IS NOT NULL THEN
        SELECT public.get_localized(o.name, u_locale)
        INTO org_name
        FROM public.organizations o
        WHERE o.id = c_org_id;

        IF org_name IS NOT NULL THEN
          vars := vars || jsonb_build_object('organization.name', org_name);
        END IF;
      END IF;

      -- Resolve nomination context (constituency + election) for this candidate
      -- Takes the first nomination found for this candidate
      SELECT
        public.get_localized(con.name, u_locale),
        public.get_localized(el.name, u_locale)
      INTO nom_constituency_name, nom_election_name
      FROM public.nominations n
      JOIN public.constituencies con ON con.id = n.constituency_id
      JOIN public.elections el ON el.id = n.election_id
      WHERE n.candidate_id = u_scope_id
      LIMIT 1;

      IF nom_constituency_name IS NOT NULL THEN
        vars := vars || jsonb_build_object('nomination.constituency.name', nom_constituency_name);
      END IF;

      IF nom_election_name IS NOT NULL THEN
        vars := vars || jsonb_build_object('nomination.election.name', nom_election_name);
      END IF;

    ELSIF u_role = 'party' AND u_scope_id IS NOT NULL THEN
      -- Resolve organization fields for party role
      SELECT public.get_localized(o.name, u_locale)
      INTO org_name
      FROM public.organizations o
      WHERE o.id = u_scope_id;

      IF org_name IS NOT NULL THEN
        vars := vars || jsonb_build_object('organization.name', org_name);
      END IF;
    END IF;

    -- Return row for this user
    user_id := uid;
    email := u_email;
    preferred_locale := u_locale;
    variables := vars;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Grant execute to authenticated (admin-only in practice since the Edge
-- Function verifies admin role before calling this RPC)
GRANT EXECUTE ON FUNCTION public.resolve_email_variables(uuid[], text, text) TO authenticated;
-- Also grant to service_role (used by Edge Functions with service_role key)
GRANT EXECUTE ON FUNCTION public.resolve_email_variables(uuid[], text, text) TO service_role;
