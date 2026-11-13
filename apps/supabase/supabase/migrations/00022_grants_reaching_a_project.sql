--------------------------------------------------------------------------------
-- One reach rule for the grants that count in a project, and the caller's own such grants for the frontend's app-entry gates
--
-- WHAT IT CHANGES. Adds private.grant_reaches_project, the rule whether one grant reaches a project, and public.get_user_project_grants, which answers the caller's own grants that reach a project and which `authenticated` alone may execute. private.email_holds_grant_in_project asks the new rule in place of its own copy of it; what it answers is unchanged.
--
-- WHAT IT LEAVES. Every table, policy and other function, and the signature, volatility, search_path and privileges of private.email_holds_grant_in_project.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- grant_reaches_project: does one grant reach a project?
--
-- The reach rule, stated once for the questions that ask which of a user's grants count in a project: private.email_holds_grant_in_project in 506-invitation-rpcs.sql, which decides whether a mail may go to an address, and get_user_project_grants below, which the frontend's app-entry gates read.
--
-- True for a project-scope grant on p_project_id, an entity-scope grant on one of its entities, any global-scope grant, and an account-scope grant on the account p_project_id belongs to, whatever the grant's role. An account grant on another account and a grant on another project or on one of its entities answer false.
--
-- It runs as its caller. Both callers are definer functions, so no API role holds EXECUTE: the grant on the `private` schema above does not reach a function defined after it, and the REVOKE takes away the EXECUTE PostgreSQL gives PUBLIC on every new function.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.grant_reaches_project (
  p_scope public.grant_scope_type,
  p_target_type public.entity_type,
  p_target_id uuid,
  p_project_id uuid
) RETURNS boolean LANGUAGE sql STABLE
SET
  search_path = '' AS $$
  SELECT
    (p_scope = 'project' AND p_target_id = p_project_id)
    OR (p_scope = 'entity' AND private.entity_project_id(p_target_type, p_target_id) = p_project_id)
    OR p_scope = 'global'
    OR (
      p_scope = 'account'
      AND EXISTS (
        SELECT 1
        FROM public.projects p
        WHERE p.id = p_project_id
          AND p.account_id = p_target_id
      )
    );
$$;

REVOKE
EXECUTE ON FUNCTION private.grant_reaches_project (public.grant_scope_type, public.entity_type, uuid, uuid)
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- get_user_project_grants: which of the caller's grants count in a project?
--
-- Returns the caller's own rows of public.grants that reach p_project_id by private.grant_reaches_project, as one jsonb array whose entries have the keys and the order of custom_access_token_hook's `grants` claim: `scope`, `target_type`, `target_id` and `role`. An empty array for a caller with no such grant, for a caller that is not signed in and for a null project.
--
-- The frontend's app-entry gates read it to decide which app a signed-in user is shown in this project. The token's claim cannot answer that: it lists every grant of the user, and it does not say which account a project belongs to or which project an entity is in. It reads the table, keyed on (SELECT auth.uid()), as user_can does, so a grant counts from the moment it is written and a deleted grant at once. It decides no authority: row-level security still decides what the caller may read or write.
--
-- SECURITY DEFINER because public.grants is revoked from every API role and the reach hops read public.projects and the entity tables, which the caller's own row-level security would filter. `authenticated` alone holds EXECUTE: it answers only about the caller's own rows, and anon has none.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_project_grants (p_project_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'scope', g.scope::text,
      'target_type', g.target_type::text,
      'target_id', g.target_id,
      'role', g.role::text
    )
    ORDER BY g.scope, g.target_type, g.target_id, g.role
  ), '[]'::jsonb)
  FROM public.grants g
  WHERE g.user_id = (SELECT auth.uid())
    AND p_project_id IS NOT NULL
    AND private.grant_reaches_project(g.scope, g.target_type, g.target_id, p_project_id);
$$;

REVOKE
EXECUTE ON FUNCTION public.get_user_project_grants (uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_user_project_grants (uuid) TO authenticated;

--------------------------------------------------------------------------------
-- email_holds_grant_in_project: does a user with this confirmed address hold a grant that reaches the project?
--
-- The grant-holder test, stated once for the two functions that decide whether a mail may go to an address: invitation_link_request and recovery_link_request.
--
-- True when a user whose address equals p_email and is confirmed holds a project-scope grant on p_project_id, an entity-scope grant on one of its entities, any global-scope grant, or an account-scope grant on the account p_project_id belongs to, whatever the grant's role. An account grant on another account, a grant in another project only and an unconfirmed address answer false. The reach of one grant is private.grant_reaches_project's, in 301-auth-functions.sql, which the frontend's app-entry gates read through get_user_project_grants.
--
-- The stored address is trimmed and lower-cased before it is compared. p_email is compared as given, so the callers pass it trimmed and lower-cased.
--
-- It runs as its caller. The two callers are definer functions, so no API role holds EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.email_holds_grant_in_project (p_project_id uuid, p_email text) RETURNS boolean LANGUAGE sql STABLE
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE lower(btrim(u.email)) = p_email
      AND u.email_confirmed_at IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.grants g
        WHERE g.user_id = u.id
          AND private.grant_reaches_project(g.scope, g.target_type, g.target_id, p_project_id)
      )
  );
$$;

REVOKE
EXECUTE ON FUNCTION private.email_holds_grant_in_project (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;
