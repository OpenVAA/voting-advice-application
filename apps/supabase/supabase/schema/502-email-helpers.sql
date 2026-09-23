-- Email helper functions for transactional email template variable resolution
--
-- Depends on: 102-entities.sql (candidates, organizations)
--             104-nominations.sql (nominations) 101-elections.sql (elections, constituencies) 300-auth-tables.sql (grants) 010-utility-functions.sql (get_localized)
--------------------------------------------------------------------------------
-- resolve_email_variables: resolve template variables for a set of users
--
-- For each user_id, looks up their entity context in the grant map and resolves template variable paths like "candidate.first_name", "organization.name", "nomination.constituency.name", "nomination.election.name".
--
-- Returns a row per user with their email, preferred_locale, and a flat JSONB object of resolved variables.
--
-- p_project_id is required and carries no DEFAULT: every entity lookup below is qualified by it, so a caller that forgot it gets an undefined_function error rather than another project's candidate, organization, constituency and election names rendered into an email.
--
-- SECURITY DEFINER: needs to read auth.users which is not accessible to regular authenticated users.
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
  -- p_template_body and p_template_subject are read here and nowhere else, deliberately. They belong to this RPC's published four-argument signature: PostgREST resolves overloads by named argument, apps/supabase/supabase/functions/send-email/index.ts passes all four by name, and the two GRANT statements that follow name the four-argument form - so the parameters cannot be dropped without a coordinated change across the Edge Function, the generated types in packages/supabase-types and the pgTAP suite. They are deliberately NOT used to narrow the resolved variable set: the only caller passes an empty string for both, so filtering the output by template text would return an empty variables object for every recipient and silently break personalisation. Consuming them here keeps them read rather than dead for plpgsql_check without changing a single value this function returns.
  PERFORM p_template_body, p_template_subject;

  FOREACH uid IN ARRAY p_user_ids
  LOOP
    -- Get user email and preferred locale from auth.users. auth.users carries no project column; the recipient set is bounded to the project by the grant test below rather than here.
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

    -- RECIPIENTS ARE BOUNDED TO THE PROJECT (162-REVIEW WR-02). A user id is returned only when that user holds a grant whose target resolves to p_project_id: the project itself, the account that owns it, or an entity in it. Without this the send-email Edge Function -- whose caller supplies the id list -- could mail, or with `dry_run` simply read back, the address of ANY user in the instance, other tenants' admins included. A global grant targets no project and does not qualify. An id that fails the test is skipped exactly like an unknown id, so the answer does not distinguish the two.
    IF NOT EXISTS (
      SELECT 1
      FROM public.grants g
      WHERE g.user_id = uid
        AND (
          (g.scope = 'project' AND g.target_id = p_project_id)
          OR (g.scope = 'account' AND g.target_id = (SELECT pr.account_id FROM public.projects pr WHERE pr.id = p_project_id))
          OR (g.scope = 'entity' AND private.entity_project_id (g.target_id) = p_project_id)
        )
    ) THEN
      CONTINUE;
    END IF;

    -- Initialize empty variables
    vars := '{}'::jsonb;

    -- Get the first relevant entity-scope grant (candidate or organization) for this user. public.grants has no project_id column, so this lookup carries no project predicate; the scoping happens on the entity rows target_id points at, which is where the project-scoped data actually lives.
    --
    -- DELIBERATELY TWO ENTITY KINDS AND NOT FOUR (162-15 task 2 Q3, ratified `approved`). The grant map's discriminator admits `faction` and `alliance` as well, and this function ignores both -- exactly as its predecessor did, which had no vocabulary member for either and so could never resolve one. Widening the filter here would change what a live email renders inside a commit whose gate is a removal; 162-IMPLEMENTATION-BRIEF.md section 6.1 owns organization, faction and alliance onboarding and owns closing the gap.
    --
    -- The preference order is candidate before organization, preserved verbatim from the lookup this replaced. MEASURED at 162-15: it decides nothing on any identity this repository creates -- zero identities in the seed and zero in the pgTAP fixture hold BOTH a candidate-kind and an organization-kind entity grant, so reversing the two arms is a no-op and reddens nothing. It is kept because the population it arbitrates is reachable (the grant map permits both rows for one user) and because changing it would be a behaviour change smuggled inside a removal, not because a test currently holds it in place.
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
      -- Resolve candidate fields. The project predicate is an unconditional equality rather than an `IS NULL OR` shape, because there is no "every project" case: a caller without a project is a caller that should not be resolving anybody's name.
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

      -- Resolve nomination context (constituency + election + nominating organization) for this candidate Takes the first nomination found for this candidate. The predicate is on the nomination rather than on the constituency and election it joins, because those two are reached THROUGH the nomination and a nomination belonging to this project cannot name another project's election without violating validate_nomination. Which nomination supplies the names is still whichever one LIMIT 1 happens to return, exactly as before: narrowing the candidate set by project does not make that pick deterministic, and making it deterministic is a product question about which nomination is "the" one.
      --
      -- 162-07b ADDED THE ORGANIZATION TO THIS WALK rather than giving it a second round trip. It used to be read off `candidates.organization_id`, a column that stated the candidate-to-organization association a second time; the authoritative statement is the `parent_nomination_id` edge, so the name is now one more column on a query this branch already ran. The two parent joins are LEFT joins on purpose: a candidate nomination with no parent is legal, and an inner join would silently drop the constituency and election names along with the organization. A candidate with no nomination at all emits no organization key, exactly as a candidate with no organization did before.
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

-- service_role ONLY. The function is SECURITY DEFINER, reads auth.users and carries no authority check of its own, so any role that can EXECUTE it can read the email address of any user id it names -- and user ids are harvestable from public columns (candidates.auth_user_id). Its one caller, the send-email Edge Function, reaches it through a service-role client after its own authority gate. Supabase's default privileges grant EXECUTE on every new public function to anon and authenticated, so the REVOKE has to name them as well as PUBLIC (162-REVIEW CR-01).
REVOKE
EXECUTE ON FUNCTION public.resolve_email_variables (uuid, uuid[], text, text)
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
EXECUTE ON FUNCTION public.resolve_email_variables (uuid, uuid[], text, text) TO service_role;
