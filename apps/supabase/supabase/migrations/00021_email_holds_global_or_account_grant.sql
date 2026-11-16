--------------------------------------------------------------------------------
-- Any global grant, or an account grant on the project's account, makes a confirmed address eligible for a sign-in or a recovery mail
--
-- WHAT IT CHANGES. private.email_holds_grant_in_project, the grant-holder test invitation_link_request and recovery_link_request share, answers true for a confirmed address whose user holds any global-scope grant, or an account-scope grant on the account the project belongs to, whatever the grant's role, besides a project-scope grant on the project and an entity-scope grant on one of its entities.
--
-- WHAT IT LEAVES. The function's signature, volatility, search_path and privileges, both callers, the slots they take and every table and policy.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- email_holds_grant_in_project: does a user with this confirmed address hold a grant that reaches the project?
--
-- The grant-holder test, stated once for the two functions that decide whether a mail may go to an address: invitation_link_request and recovery_link_request.
--
-- True when a user whose address equals p_email and is confirmed holds a project-scope grant on p_project_id, an entity-scope grant on one of its entities, any global-scope grant, or an account-scope grant on the account p_project_id belongs to, whatever the grant's role. An account grant on another account, a grant in another project only and an unconfirmed address answer false.
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
          AND (
            (g.scope = 'project' AND g.target_id = p_project_id)
            OR (g.scope = 'entity' AND private.entity_project_id(g.target_type, g.target_id) = p_project_id)
            OR g.scope = 'global'
            OR (
              g.scope = 'account'
              AND EXISTS (
                SELECT 1
                FROM public.projects p
                WHERE p.id = p_project_id
                  AND p.account_id = g.target_id
              )
            )
          )
      )
  );
$$;

REVOKE
EXECUTE ON FUNCTION private.email_holds_grant_in_project (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;
