-- Email helper functions for transactional email template variable resolution
--
-- Depends on:
-- - 010-utility-functions.sql (get_localized)
-- - 100-tenancy.sql (projects)
-- - 101-elections.sql (elections, constituencies)
-- - 102-entities.sql (candidates, organizations)
-- - 104-nominations.sql (nominations)
-- - 300-auth-tables.sql (grants)
-- - 301-auth-functions.sql (private.entity_project_id)
--------------------------------------------------------------------------------
-- resolve_email_variables: resolve template variables for a set of users
--
-- For each user_id, looks up their entity context in the grant map and resolves template variable paths like "candidate.first_name", "organization.name", "nomination.constituency.name", "nomination.election.name".
--
-- Returns a row per user with their email, preferred_locale, and a flat JSONB object of resolved variables.
--
-- p_project_id is required and carries no DEFAULT: every entity lookup below is qualified by it, so a caller that omits it gets an undefined_function error rather than another project's names rendered into an email.
--
-- SECURITY DEFINER: it reads auth.users, which regular authenticated users cannot read.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_email_variables (
  p_project_id uuid,
  p_user_ids uuid[],
  p_template_body text DEFAULT '',
  p_template_subject text DEFAULT ''
) RETURNS TABLE (
  user_id uuid,
  email text,
  preferred_locale text,
  variables jsonb
) LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  uid uuid;
  u_email text;
  u_locale text;
  u_entity_kind public.entity_type;
  u_scope_id uuid;
  vars jsonb;
  -- Candidate fields
  c_first_name text;
  c_last_name text;
  -- Organization fields
  org_name text;
  -- Nomination fields
  nom_constituency_name text;
  nom_election_name text;
BEGIN
  -- p_template_body and p_template_subject are part of the published four-argument signature: PostgREST resolves overloads by named argument, the send-email Edge Function passes all four by name, and the grants below name the four-argument form. They do not narrow the resolved variables: the only caller passes empty strings, so filtering by template text would return no variables for any recipient. This PERFORM reads them so plpgsql_check does not report them unused.
  PERFORM p_template_body, p_template_subject;

  FOREACH uid IN ARRAY p_user_ids
  LOOP
    -- The user's email and preferred locale. auth.users has no project column; the grant test below bounds recipients to the project.
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

    -- Recipients are bounded to the project: a user id is returned only when that user holds a grant whose target resolves to p_project_id (the project itself, the account that owns it, or an entity in it). Without this, a send-email caller, who supplies the id list, could mail or, with `dry_run`, read back the address of any user in the instance. A global grant targets no project and does not qualify. An id that fails the test is skipped like an unknown id, so the result does not distinguish the two.
    IF NOT EXISTS (
      SELECT 1
      FROM public.grants g
      WHERE g.user_id = uid
        AND (
          (g.scope = 'project' AND g.target_id = p_project_id)
          OR (g.scope = 'account' AND g.target_id = (SELECT pr.account_id FROM public.projects pr WHERE pr.id = p_project_id))
          OR (g.scope = 'entity' AND private.entity_project_id (g.target_type, g.target_id) = p_project_id)
        )
    ) THEN
      CONTINUE;
    END IF;

    -- Initialize empty variables
    vars := '{}'::jsonb;

    -- The user's first candidate or organization entity grant. public.grants has no project_id column, so the project predicate is applied to the entity rows target_id points at.
    --
    -- Only candidate and organization grants are resolved. The grant map also admits faction and alliance grants; this function ignores them, so their holders get no entity variables.
    --
    -- A user holding both kinds gets the candidate's variables. The grant map permits both rows for one user, but neither the seed nor the pgTAP fixture creates such a user, so no test pins this order.
    SELECT g.target_type, g.target_id
    INTO u_entity_kind, u_scope_id
    FROM public.grants g
    WHERE g.user_id = uid
      AND g.scope = 'entity'
      AND g.target_type IN ('candidate', 'organization')
    ORDER BY
      CASE g.target_type
        WHEN 'candidate' THEN 1
        WHEN 'organization' THEN 2
      END
    LIMIT 1;

    IF u_entity_kind = 'candidate' AND u_scope_id IS NOT NULL THEN
      -- Candidate fields. The project predicate is an unconditional equality rather than an `IS NULL OR` shape: there is no every-project case.
      SELECT c.first_name, c.last_name
      INTO c_first_name, c_last_name
      FROM public.candidates c
      WHERE c.id = u_scope_id
        AND c.project_id = p_project_id;

      IF c_first_name IS NOT NULL THEN
        vars := vars || jsonb_build_object(
          'candidate.first_name', c_first_name,
          'candidate.last_name', c_last_name
        );
      END IF;

      -- The nomination context (constituency, election and nominating organization), from the first nomination found for this candidate. The project predicate is on the nomination: the constituency and election are reached through it, and validate_nomination keeps them in the nomination's project. Which nomination supplies the names is whichever one LIMIT 1 returns; the pick is not deterministic.
      --
      -- The organization is the one on the parent nomination. Both parent joins are LEFT joins: a candidate nomination with no parent is legal, and an inner join would drop the constituency and election names along with the organization. A candidate with no nomination emits no organization key.
      SELECT
        public.get_localized(con.name, u_locale),
        public.get_localized(el.name, u_locale),
        public.get_localized(parent_org.name, u_locale)
      INTO nom_constituency_name, nom_election_name, org_name
      FROM public.nominations n
      JOIN public.constituencies con ON con.id = n.constituency_id
      JOIN public.elections el ON el.id = n.election_id
      LEFT JOIN public.nominations parent_nom ON parent_nom.id = n.parent_nomination_id
      LEFT JOIN public.organizations parent_org ON parent_org.id = parent_nom.organization_id
        AND parent_org.project_id = p_project_id
      WHERE n.candidate_id = u_scope_id
        AND n.project_id = p_project_id
      LIMIT 1;

      IF nom_constituency_name IS NOT NULL THEN
        vars := vars || jsonb_build_object('nomination.constituency.name', nom_constituency_name);
      END IF;

      IF nom_election_name IS NOT NULL THEN
        vars := vars || jsonb_build_object('nomination.election.name', nom_election_name);
      END IF;

      IF org_name IS NOT NULL THEN
        vars := vars || jsonb_build_object('organization.name', org_name);
      END IF;

    ELSIF u_entity_kind = 'organization' AND u_scope_id IS NOT NULL THEN
      -- Resolve organization fields for the organization-scoped grantee
      SELECT public.get_localized(o.name, u_locale)
      INTO org_name
      FROM public.organizations o
      WHERE o.id = u_scope_id
        AND o.project_id = p_project_id;

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

-- service_role only. The function is SECURITY DEFINER, reads auth.users and checks nothing about its caller, so any role that can EXECUTE it can read the email address of any user id it names, and user ids are readable from a public column (nominations.created_by). Its one caller, the send-email Edge Function, calls it through a service-role client after its own authority check. Supabase's default privileges grant EXECUTE on every new public function to anon and authenticated, so the REVOKE names them as well as PUBLIC.
REVOKE
EXECUTE ON FUNCTION public.resolve_email_variables (uuid, uuid[], text, text)
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
EXECUTE ON FUNCTION public.resolve_email_variables (uuid, uuid[], text, text) TO service_role;
