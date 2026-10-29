-- Auth hooks: Custom Access Token Hook and RLS helper functions
--
-- Depends on: 300-auth-tables.sql (grants table), 106-app-settings.sql (app_settings table), auth.users (Supabase Auth)
--
-- Functions:
-- - custom_access_token_hook(jsonb) - projects public.grants into the JWT `grants` claim
-- - send_email_hook(jsonb) - takes every mail the auth service would send and sends none
-- - grant_role_permissions(grant_scope_type, grant_role_type, entity_type) - the role x permission matrix
-- - private.entity_project_id(entity_type, uuid) - resolves an entity to its project
-- - private.election_project_id(uuid) - resolves an election id to its project
-- - private.constituency_group_project_id(uuid) - resolves a constituency-group id to its project
-- - private.is_child_nominee(entity_type, uuid, entity_type, uuid) - whether an entity is nominated under a nomination of the parent
-- - project_open_for_voters(uuid) - the project-level term of public visibility
-- - private.entity_has_confirmed_nomination(entity_type, uuid, uuid) - the entity-level term of public visibility
-- - private.nomination_entities_confirmed(uuid) - whether the entity a nomination links is anon-readable
-- - user_can(grant_scope_type, uuid, grant_permission, entity_type) - may the caller do this verb to this object; the one predicate the RLS policies delegate their authority decision to
-- - user_has_account_grant(uuid) - whether the caller holds any role on an account or on one of its projects
-- - private.project_nominations_locked(uuid) - whether a project's nomination editing is locked
-- - private.project_answers_locked(uuid) - whether a project's answers are locked
-- - private.nomination_exists_in_contest(entity_type, uuid, uuid, uuid, integer) - whether an entity is already nominated at a contest
-- - private.nomination_id_in_contest(entity_type, uuid, uuid, uuid, integer) - the id of an entity's nomination at a contest
-- - private.caller_nominated_in_contest(uuid, uuid, integer, grant_permission, entity_type[]) - whether the caller holds a permission on an entity of one of the named types nominated at a contest
-- - private.caller_unconfirmed_originated_count() - how many unconfirmed organization and alliance nominations the caller has originated
-- - private.caller_entity_ids(uuid, entity_type) - the entities of one type, in one project, the caller holds an editor grant on; called by get_user_entities and get_entity_user_data
-- - private.user_password_set(uuid) - whether an account holds a password; executable by no API role
-- - private.caller_password_set() - whether the caller's own account holds a password; called by get_user_entities
-- - private.caller_pending_email_taken() - whether the address the caller's own account is changing to is another account's; called by get_user_entities
-- - private.registration_mode_allowed_in(jsonb, text, text) - the registration-mode rule over stored settings; reads no table
-- - private.registration_mode_allowed(uuid, text, text) - the rule over one project's settings row; executable by no API role
--
-- The two public-visibility terms are each defined once here and called directly by the eight entity SELECT policies.
--------------------------------------------------------------------------------
-- The `private` schema: SECURITY DEFINER helpers for policies and INVOKER functions
--
-- Every SECURITY DEFINER function in `public` is published by PostgREST as `/rest/v1/rpc/<name>`, and Supabase's default privileges make it executable by `anon` and `authenticated`. The hierarchy and visibility hops below answer questions row-level security would refuse the caller directly, such as which project an arbitrary entity id belongs to, so published as RPCs they would be cross-tenant oracles.
--
-- Revoking EXECUTE is not the fix, because a policy expression runs with the querying role's privileges and would fail with `permission denied`. The helpers therefore live in `private`, which is not in PostgREST's exposed schemas (config.toml `[api] schemas`), while the API roles keep USAGE and EXECUTE so policies and SECURITY INVOKER functions, which both run as the caller, can call them. Every call site qualifies the name, so no search_path decides which function runs.
--
-- What stays in `public`: `user_can` (the Edge Functions call it over RPC) and `user_has_account_grant`, which answer only about the caller's own claim; `grant_role_permissions` (the matrix, no row data); `project_open_for_voters` (the frontend calls it); `contestant_app_public_config` in 106-app-settings.sql (the frontend calls it, and it returns five fixed settings values and never a row: whether the Contestant app is accessible, whether answers are locked, the entity types it serves, its registration modes and whether usage events are tracked); and the two storage path helpers (caller-scoped or public by definition). 07-rpc-security.test.sql holds a census of every anon- and authenticated-executable SECURITY DEFINER function in `public`, so a new one has to be added there on purpose.
--------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

GRANT USAGE ON SCHEMA private TO anon,
authenticated,
service_role;

--------------------------------------------------------------------------------
-- Custom Access Token Hook: called by Supabase Auth on every token refresh/issue, it projects each public.grants row into the JWT's `grants` claim, the only authority claim it emits.
--
-- No row-level-security decision reads the claim: user_can and user_has_account_grant read the caller's rows of public.grants. The claim is read by the frontend's app-entry gates, which decide which app a signed-in user is shown.
--
-- The per-entry keys are the column names of public.grants minus id, user_id and created_at, which the app-entry gates read. 14-grants-migration.test.sql asserts the emitted array set-equal to test_grants_claim, in both directions and with equal cardinality.
--
-- COALESCE gives a user with no grant rows an empty array rather than NULL or a missing key, the state a grant-less identity should carry.
--
-- The ORDER BY makes two tokens for one user identical, so they can be diffed. Correctness does not depend on it: jsonb_agg defines no element order, so the test compares the array as a set.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.custom_access_token_hook (p_event jsonb) RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  claims jsonb;
  grants_claim jsonb;
BEGIN
  claims := p_event->'claims';

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'scope', g.scope::text,
      'target_type', g.target_type::text,
      'target_id', g.target_id,
      'role', g.role::text
    )
    ORDER BY g.scope, g.target_type, g.target_id, g.role
  ), '[]'::jsonb)
  INTO grants_claim
  FROM public.grants g
  WHERE g.user_id = (p_event->>'user_id')::uuid;

  claims := jsonb_set(claims, '{grants}', grants_claim);
  RETURN jsonb_set(p_event, '{claims}', claims);
END;
$$;

-- Grant execute to auth admin (required for the hook to work)
GRANT
EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- And to nobody else, per Supabase's guidance for auth hooks: only the auth server calls this function. Without the REVOKE it would stay harmless only because it is SECURITY INVOKER and `grants` is revoked from the API roles.
REVOKE
EXECUTE ON FUNCTION public.custom_access_token_hook
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- Send Email Hook: called by Supabase Auth in place of sending a mail, for every mail the service would send (a one-time code, a recovery, a change of address, an invitation). It sends none and returns an empty object, which the service reads as success.
--
-- It reads nothing of the event, which holds an address and a token, writes nothing and logs nothing. Every mail of the application is sent by the account-access Edge Function, behind its own checks, throttle and texts. The hook stops the service's mail and nothing else: what the service answers to a request is unchanged.
--
-- config.toml `[auth.hook.send_email]` names it; `yarn assert:auth-signup-closed` requires that table. 07-rpc-security.test.sql asserts it executable by supabase_auth_admin and by no API role.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_email_hook (event jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT '{}'::jsonb;
$$;

GRANT
EXECUTE ON FUNCTION public.send_email_hook TO supabase_auth_admin;

REVOKE
EXECUTE ON FUNCTION public.send_email_hook
FROM
  PUBLIC,
  anon,
  authenticated,
  service_role;

--------------------------------------------------------------------------------
-- grant_role_permissions: the role x permission matrix, encoded once
--
-- This is the only function body that holds the matrix, so its permission literals can be found in one place and compared against the rights table without executing a permission check. user_can asks it for the verb and computes only reach.
--
-- Reads no table, so it is IMMUTABLE and not SECURITY DEFINER. search_path is pinned anyway, because the enum types it names are resolved at call time.
--
-- The fall-through arm returns the empty set for the shapes 300-auth-tables.sql's CHECK constraints admit but the matrix does not map (entity+admin, global+editor, account+editor), so user_can answers false for every permission on them.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_role_permissions (
  p_scope public.grant_scope_type,
  p_role public.grant_role_type,
  p_target_type public.entity_type
) RETURNS public.grant_permission[] LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT CASE
    -- Root: every verb.
    WHEN (p_scope, p_role) = ('global', 'admin') THEN ARRAY[
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
    ]::public.grant_permission[]

    -- Account: every verb, within the account.
    WHEN (p_scope, p_role) = ('account', 'admin') THEN ARRAY[
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
    ]::public.grant_permission[]

    -- ProjAdmin: every verb but the three account.* verbs.
    WHEN (p_scope, p_role) = ('project', 'admin') THEN ARRAY[
      'feedback.read',
      'feedback.manage',
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
    ]::public.grant_permission[]

    -- ProjEditor: ProjAdmin minus project.manage_editors, project.edit_project_settings and nomination.confirm, which stay with admins. The editor keeps the app's face (app_settings); the admin keeps the project's shape (projects).
    WHEN (p_scope, p_role) = ('project', 'editor') THEN ARRAY[
      'feedback.read',
      'feedback.manage',
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
      'nomination.create_parent'
    ]::public.grant_permission[]

    -- OrganizationEditor: the entity set, plus entity.invite_children, which only this role holds. nomination.create_parent is in it because an organization creates the nomination of the alliance it stands under.
    WHEN (p_scope, p_role, p_target_type) = ('entity', 'editor', 'organization') THEN ARRAY[
      'project.read_structure',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.invite_children',
      'nomination.edit',
      'nomination.read',
      'nomination.create_parent'
    ]::public.grant_permission[]

    -- Candidate, FactionEditor and AllianceEditor share one row, nomination.create_parent included. Their nomination rights hold only while the project is unlocked, but the lock is row state, so the nomination policies check it and the matrix does not. Which row a holder of nomination.create_parent may create is likewise the parent policy's question: it pairs the row's type with the caller's, and no row's type admits an alliance's editor.
    WHEN p_scope = 'entity' AND p_role = 'editor'
      AND p_target_type IN ('candidate', 'faction', 'alliance') THEN ARRAY[
      'project.read_structure',
      'entity.edit_answers',
      'entity.read_answers',
      'nomination.edit',
      'nomination.read',
      'nomination.create_parent'
    ]::public.grant_permission[]

    -- Everything else, including global+editor, account+editor and entity+admin: the empty set.
    ELSE ARRAY[]::public.grant_permission[]
  END;
$$;

--------------------------------------------------------------------------------
-- entity_project_id: resolve an entity to its project
--
-- Returns the project_id of the row with this id in the one table the entity type names, or NULL when that table holds no such row or the type is NULL. NULL is a denial at every call site, never a match.
--
-- The type is required because the four entity tables have independent primary keys: one uuid can name a candidate in one project and an organization in another, so only the pair of type and id names one entity.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.entity_project_id (
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT CASE p_entity_type
    WHEN 'candidate' THEN (SELECT project_id FROM public.candidates WHERE id = p_entity_id)
    WHEN 'organization' THEN (SELECT project_id FROM public.organizations WHERE id = p_entity_id)
    WHEN 'faction' THEN (SELECT project_id FROM public.factions WHERE id = p_entity_id)
    WHEN 'alliance' THEN (SELECT project_id FROM public.alliances WHERE id = p_entity_id)
  END;
$$;

--------------------------------------------------------------------------------
-- election_project_id: resolve an election uuid to its project
--
-- Used by the two `election_constituency_groups` write policies. That table has no project_id of its own and its read policy delegates to the parent group's policy, but a write must not: a sub-select filtered by the caller's own row-level security would make the answer depend on the caller's read access as well as on their authority. SECURITY DEFINER moves the lookup out of the caller's view and leaves `user_can` the only thing deciding.
--
-- Returns NULL when the election does not exist, and user_can denies a NULL target at every scope but global. 17-project-structure-authority.test.sql asserts that path.
--
-- This and constituency_group_project_id are two named functions rather than one generic one, because elections and constituency_groups are two tables with no enum relating them, and a generic version would need dynamic SQL inside a security predicate.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.election_project_id (p_election_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT project_id FROM public.elections WHERE id = p_election_id;
$$;

--------------------------------------------------------------------------------
-- constituency_group_project_id: resolve a constituency-group uuid to its project
--
-- The same hop for the two `constituency_group_constituencies` write policies, for the reason given on election_project_id above. Returns NULL when the group does not exist, which user_can denies.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.constituency_group_project_id (p_constituency_group_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT project_id FROM public.constituency_groups WHERE id = p_constituency_group_id;
$$;

--------------------------------------------------------------------------------
-- is_child_nominee: is the child entity nominated under a nomination of the parent entity?
--
-- One hop only: a grandchild (a candidate nominated under a faction nomination whose own parent is the organization's nomination) is false when asked against the organization, and 12-user-can.test.sql asserts that.
--
-- Both sides take a type: nominations carries four nullable entity FKs with a CHECK requiring exactly one, and its generated entity_type column names the one that is set (104-nominations.sql). Each side's type selects the column its id is compared with, so a nomination of another entity type that shares the uuid never matches. 33-entity-type-collision.test.sql asserts that.
--
-- Called by user_can's child-nominee branch.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_child_nominee (
  p_parent_type public.entity_type,
  p_parent_id uuid,
  p_child_type public.entity_type,
  p_child_id uuid
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations child
    JOIN public.nominations parent ON parent.id = child.parent_nomination_id
    WHERE child.entity_type = p_child_type
      AND CASE p_child_type
            WHEN 'candidate' THEN child.candidate_id
            WHEN 'organization' THEN child.organization_id
            WHEN 'faction' THEN child.faction_id
            WHEN 'alliance' THEN child.alliance_id
          END = p_child_id
      AND parent.entity_type = p_parent_type
      AND CASE p_parent_type
            WHEN 'candidate' THEN parent.candidate_id
            WHEN 'organization' THEN parent.organization_id
            WHEN 'faction' THEN parent.faction_id
            WHEN 'alliance' THEN parent.alliance_id
          END = p_parent_id
  );
$$;

--------------------------------------------------------------------------------
-- project_open_for_voters: is this project open to the anonymous reader?
--
-- The project-level term of public visibility, carried by every `TO anon` SELECT policy in 302-rls.sql. public.projects has RLS enabled and no anon policy, so an inline `EXISTS (SELECT 1 FROM public.projects ...)` in an anon policy returns no rows for any caller; SECURITY DEFINER is what lets the policy read the flag.
--
-- Denies when the project does not exist: COALESCE over a primary-key probe returns false, never NULL.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.project_open_for_voters (p_project_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (SELECT p.open_for_voters FROM public.projects p WHERE p.id = p_project_id),
    false
  );
$$;

-- The frontend adapter calls this function over PostgREST, as anon and as authenticated, to tell a closed project from an open project with no settings row, so the grant is declared here rather than inherited from default privileges. 30-closed-project.test.sql asserts both rights.
GRANT
EXECUTE ON FUNCTION public.project_open_for_voters (uuid) TO anon,
authenticated;

--------------------------------------------------------------------------------
-- entity_has_confirmed_nomination: is this entity publicly nominated in this project?
--
-- The entity-level term of public visibility, called by the entity tables' anon SELECT policies. It asks whether an entity has a confirmed nomination at all, where is_child_nominee asks whether it is nominated under a named parent, so the two do not share a body. No policy holds a nominations sub-select of its own.
--
-- SECURITY DEFINER also breaks a policy cycle: an entity policy with an inline nominations sub-select, beside a nominations policy with an inline entity sub-select, raises `infinite recursion detected in policy`. The owner-rights read relies on relforcerowsecurity being false on the projects, nominations and four entity tables, which 16-anon-visibility.test.sql asserts.
--
-- The project argument is required because public.nominations carries its own project_id and no constraint forces it to agree with the entity's; 07-rpc-security.test.sql section 9 creates such a row. Without it, an entity in an open project would be published by a nomination in a closed one.
--
-- p_entity_type is an argument rather than four near-identical predicates, and it is matched against the generated entity_type column as well as the four FK columns. `confirmed` is NOT NULL, so it is read bare.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.entity_has_confirmed_nomination (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_project_id uuid
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations n
    WHERE n.project_id = p_project_id
      AND n.entity_type = p_entity_type
      AND (
        n.candidate_id = p_entity_id
        OR n.organization_id = p_entity_id
        OR n.faction_id = p_entity_id
        OR n.alliance_id = p_entity_id
      )
      AND n.confirmed
  );
$$;

--------------------------------------------------------------------------------
-- nomination_entities_confirmed: is every entity this nomination links anon-readable?
--
-- The transitive conjunct of anon_select_nominations, called by nothing else. A nomination links exactly one entity (the CHECK on public.nominations), so the hop is one level deep; a parent nomination naming an unconfirmed organization fails its own policy, because every nomination is judged by the same conjuncts.
--
-- Anon-readable means the entity policy's own predicate, so both policies give one answer. Each arm restates its table's anon SELECT policy, and the biconditional assertion in 16-anon-visibility.test.sql (no nomination visible to anon whose linked entity is not) fails when the two disagree.
--
-- Each arm calls project_open_for_voters and entity_has_confirmed_nomination directly rather than through a composing helper, because a SECURITY DEFINER function is never inlined and every added layer is another per-row call. The same assembly repeats in the eight entity SELECT policies, and 25-matrix-conformance.test.sql holds those eight identical.
--
-- It does not require the linked entity to belong to the nomination's own project. No constraint declares that, and 07-rpc-security.test.sql section 9 uses a project-A nomination naming project B's candidate as a negative control.
--
-- Denies when the nomination does not exist, and when no FK is set at all.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.nomination_entities_confirmed (p_nomination_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT CASE
        WHEN n.candidate_id IS NOT NULL THEN EXISTS (
          SELECT 1
          FROM public.candidates e
          WHERE e.id = n.candidate_id
            AND e.confirmed
            AND public.project_open_for_voters (e.project_id)
            AND private.entity_has_confirmed_nomination ('candidate'::public.entity_type, e.id, e.project_id)
        )
        WHEN n.organization_id IS NOT NULL THEN EXISTS (
          SELECT 1
          FROM public.organizations e
          WHERE e.id = n.organization_id
            AND e.confirmed
            AND public.project_open_for_voters (e.project_id)
            AND private.entity_has_confirmed_nomination ('organization'::public.entity_type, e.id, e.project_id)
        )
        WHEN n.faction_id IS NOT NULL THEN EXISTS (
          SELECT 1
          FROM public.factions e
          WHERE e.id = n.faction_id
            AND e.confirmed
            AND public.project_open_for_voters (e.project_id)
            AND private.entity_has_confirmed_nomination ('faction'::public.entity_type, e.id, e.project_id)
        )
        WHEN n.alliance_id IS NOT NULL THEN EXISTS (
          SELECT 1
          FROM public.alliances e
          WHERE e.id = n.alliance_id
            AND e.confirmed
            AND public.project_open_for_voters (e.project_id)
            AND private.entity_has_confirmed_nomination ('alliance'::public.entity_type, e.id, e.project_id)
        )
        ELSE false
      END
      FROM public.nominations n
      WHERE n.id = p_nomination_id
    ),
    false
  );
$$;

--------------------------------------------------------------------------------
-- user_can: may the caller do this verb to this object?
--
-- The predicate the RLS policies delegate their authority decision to. It checks one grant at a time, and a grant says yes only when both halves say yes:
--
-- 1. VERB: p_permission is a member of grant_role_permissions(...) for the grant's scope, role and target type.
-- 2. REACH: the grant's target contains, or equals, the asked object. For an entity grant that is equality of both type and id, which is what an `own` cell of the matrix means.
--
-- At entity scope the object is the pair p_target_type, p_target_id, and a NULL type denies. The four entity tables have independent primary keys, so one uuid can name a candidate in one project and an organization in another; every entity-scope hop below therefore resolves the id together with its type. At every other scope p_target_type is ignored, and its NULL default lets project- and account-scope callers pass three arguments. 33-entity-type-collision.test.sql asserts a shared id across two tables and two projects.
--
-- Grants union: the first grant satisfying both halves answers true, no grant can subtract, and the order of the rows does not matter.
--
-- It answers "may this role do this verb to this object", not "is the object in a state that admits the verb". The nominations lock, open_for_voters and the confirmation flags are conjuncts of the policies that call it, not members of the matrix.
--
-- It reads the caller's rows of public.grants, keyed on (SELECT auth.uid()), in every branch, and never the token's `grants` claim. So a grant counts from the moment it is written, and a deleted grant is denied at once: the next statement of a session whose token still carries it is refused, for a read and for a write alike. custom_access_token_hook still writes the claim, for the frontend's app-entry gates. A session with no caller id, such as anon, reads no row and is denied. The table's enum columns and its two CHECK constraints hold every row to the declared vocabularies and shapes, so no row needs to be skipped.
--
-- SECURITY DEFINER because public.grants is revoked from every API role, and because the reach hops read public.projects and the entity tables, which the caller's own row-level security would filter. search_path is empty because a mutable search_path on a SECURITY DEFINER function is a privilege-escalation primitive.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_can (
  p_scope public.grant_scope_type,
  p_target_id uuid,
  p_permission public.grant_permission,
  p_target_type public.entity_type DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  g record;
  g_permissions public.grant_permission[];
  v_project_id uuid;
  v_account_id uuid;
BEGIN
  IF p_scope IS NULL OR p_permission IS NULL THEN RETURN false; END IF;

  -- A NULL target is meaningful only at global scope, where there is no object to name. At every other scope it is a degenerate input and denies.
  IF p_target_id IS NULL AND p_scope <> 'global' THEN RETURN false; END IF;

  -- An entity is named by its type and id together, so an entity-scope question without a type denies.
  IF p_scope = 'entity' AND p_target_type IS NULL THEN RETURN false; END IF;

  -- The caller's own rows. A NULL caller id matches no row, so the loop does not run and the answer is false.
  FOR g IN
    SELECT gr.scope, gr.role, gr.target_type, gr.target_id
    FROM public.grants gr
    WHERE gr.user_id = (SELECT auth.uid())
  LOOP
    -- Half 1: the verb. This is the only place user_can consults the matrix.
    g_permissions := public.grant_role_permissions(g.scope, g.role, g.target_type);
    CONTINUE WHEN g_permissions IS NULL OR NOT (p_permission = ANY (g_permissions));

    -- Half 2: reach. Downward-or-equal from the grant's own target, plus the two named branches below. Every hop denies when it finds no row; no branch treats a NULL comparison result as a match.
    IF g.scope = 'global' THEN
      -- Reaches everything that exists. The existence check is deliberate: an entity that resolves to no project is not an object any grant reaches, and a global grant must not be the one branch that says otherwise because its lookup was skipped.
      CONTINUE WHEN p_scope = 'entity' AND private.entity_project_id(p_target_type, p_target_id) IS NULL;
      RETURN true;
    END IF;

    IF g.scope = 'account' THEN
      IF p_scope = 'account' AND p_target_id = g.target_id THEN RETURN true; END IF;
      IF p_scope = 'project' THEN
        SELECT account_id INTO v_account_id FROM public.projects WHERE id = p_target_id;
        IF v_account_id IS NOT NULL AND v_account_id = g.target_id THEN RETURN true; END IF;
      END IF;
      IF p_scope = 'entity' THEN
        v_project_id := private.entity_project_id(p_target_type, p_target_id);
        IF v_project_id IS NOT NULL THEN
          SELECT account_id INTO v_account_id FROM public.projects WHERE id = v_project_id;
          IF v_account_id IS NOT NULL AND v_account_id = g.target_id THEN RETURN true; END IF;
        END IF;
      END IF;
      CONTINUE;
    END IF;

    IF g.scope = 'project' THEN
      IF p_scope = 'project' AND p_target_id = g.target_id THEN RETURN true; END IF;
      IF p_scope = 'entity' THEN
        v_project_id := private.entity_project_id(p_target_type, p_target_id);
        IF v_project_id IS NOT NULL AND v_project_id = g.target_id THEN RETURN true; END IF;
      END IF;
      CONTINUE;
    END IF;

    -- g.scope = 'entity'. Reach is equality with the granted entity, type and id both, which is what an `own` matrix cell means, plus the named branches below.
    IF p_scope = 'entity' AND g.target_type = p_target_type AND p_target_id = g.target_id THEN RETURN true; END IF;

    -- NAMED BRANCH 1, the project-read branch: an entity grantee may read the structure of its entity's project. The permission is a literal so the hop cannot widen to another verb; a general upward-reach rule would also answer yes to entity.edit_answers at account scope.
    IF p_scope = 'project' AND p_permission = 'project.read_structure' THEN
      v_project_id := private.entity_project_id(g.target_type, g.target_id);
      IF v_project_id IS NOT NULL AND v_project_id = p_target_id THEN RETURN true; END IF;
    END IF;

    -- NAMED BRANCH 2, the child-nominee branch: an entity grantee may read the nominations of an entity nominated under one of its own entity's nominations, but not that entity's answers. Like branch 1, the permission is a literal so the hop cannot widen to another verb.
    IF p_scope = 'entity' AND p_permission = 'nomination.read'
       AND private.is_child_nominee(g.target_type, g.target_id, p_target_type, p_target_id) THEN
      RETURN true;
    END IF;

    CONTINUE;
  END LOOP;

  RETURN false;
END;
$$;

--------------------------------------------------------------------------------
-- user_has_account_grant: does the caller hold ANY role on this account or on one of its projects?
--
-- Not a user_can call, because it asks whether a grant exists rather than whether a role holds a permission. It is the `accounts` read rule, so an account's read and its write (`account.edit_settings`) name different things.
--
-- The project disjunct lets a project admin read the row of the account its project belongs to. The disclosure is bounded: an `accounts` row is `id, name, created_at, updated_at`, so what widens is the account's name, to someone who already administers one of its projects. 04-admin-crud.test.sql asserts that such a caller sees exactly its own account.
--
-- SECURITY DEFINER because public.grants is revoked from every API role, and because the project disjunct reads public.projects, which has row-level security enabled; an inline read would also ask whether the caller can see the project. search_path is pinned as on every definer function here.
--
-- It reads the caller's rows of public.grants, keyed on (SELECT auth.uid()), as user_can does, and never the token's `grants` claim, which custom_access_token_hook still writes for the frontend's app-entry gates. So a deleted grant is denied at once, and a session with no caller id reads no row and is denied.
--
-- The global admin is a disjunct here rather than a separate policy term, so the `accounts` SELECT stays a single call.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_account_grant (p_account_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.grants g
    WHERE g.user_id = (SELECT auth.uid())
      AND (
        (g.scope = 'global' AND g.role = 'admin')
        OR (g.scope = 'account' AND g.target_id = p_account_id)
        OR (g.scope = 'project' AND EXISTS (
              SELECT 1
              FROM public.projects p
              WHERE p.id = g.target_id
                AND p.account_id = p_account_id))
      )
  );
$$;

--------------------------------------------------------------------------------
-- project_nominations_locked: is this project's nomination editing locked?
--
-- The lock is the app setting `access.nominationsLocked`, stored in the project's row of public.app_settings. It is a stored setting rather than a member of the permission matrix, so it is a conjunct of the nomination policies and this function is the hop they call.
--
-- It answers at two levels. The outer one returns true (locked) when the project row is not found, so a missing project never unlocks anything; project_open_for_voters denies with false because its sense is the other way round. The inner one returns false (unlocked) when the project has no settings row or the row does not hold the key, which is the shipped default of the setting.
--
-- Only the JSON boolean true locks. The value is compared as jsonb, so the string "true", a number, a JSON null and an `access` member that is not an object are all unlocked; a comparison of the extracted text would read the string as locked.
--
-- SECURITY DEFINER because public.projects and public.app_settings both have row-level security enabled, and an inline read would also ask whether the caller can see the project and its settings row.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.project_nominations_locked (p_project_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT COALESCE(
        (SELECT s.settings #> '{access,nominationsLocked}' = 'true'::jsonb
           FROM public.app_settings s
          WHERE s.project_id = p.id),
        false
      )
      FROM public.projects p
      WHERE p.id = p_project_id
    ),
    true
  );
$$;

--------------------------------------------------------------------------------
-- project_answers_locked: are this project's answers locked?
--
-- The lock is the app setting `access.answersLocked`, stored in the project's row of public.app_settings. While it holds, an entity's own editor writes nothing of the entity: it is a conjunct of the entity self-update policies of the four entity tables and of the four entity-scope nomination policies, `upsert_answers` and `set_entity_nominations` refuse an entity's editor with SQLSTATE 42501, and `storage_path_can` (400-storage.sql) refuses an entity-scope write, reading the same key itself. The project-scope policies do not read it, so a project editor and a project admin still write while answers are locked.
--
-- It reads as project_nominations_locked does. A missing project reads as locked, so a missing project never unlocks anything; a project with no settings row, or a row that does not hold the key, reads as unlocked. Only the JSON boolean true locks: the value is compared as jsonb, so the string "true", a number and a JSON null are unlocked.
--
-- SECURITY DEFINER because public.projects and public.app_settings both have row-level security enabled, and an inline read would also ask whether the caller can see the project and its settings row.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.project_answers_locked (p_project_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT COALESCE(
        (SELECT s.settings #> '{access,answersLocked}' = 'true'::jsonb
           FROM public.app_settings s
          WHERE s.project_id = p.id),
        false
      )
      FROM public.projects p
      WHERE p.id = p_project_id
    ),
    true
  );
$$;

--------------------------------------------------------------------------------
-- nomination_exists_in_contest: is this entity already nominated at this contest?
--
-- This is not the uniqueness constraint. `nominations_entity_parent_contest_key` includes `parent_nomination_id`, so an organization already nominated under an alliance does not collide with a candidate-created parent that has no parent of its own; this asks whether there is any nomination of the entity at this election, constituency and round. 23-nominations-write.test.sql's G3-race pair shows the two predicates differ.
--
-- The constraint still decides a race: two candidates of one party submitting at once both see no parent here, and the database rejects the second insert. This helper gives the fast path and the better error.
--
-- Takes the entity type as an argument and matches it against the generated entity_type column, and the entity id against the four foreign keys, so a nomination of another type that shares the uuid does not match. Returns false when no row is found, so a missing row never fabricates an occupant; the consuming policy inverts the answer.
--
-- A round that is not stored is round 1, on either side of the comparison, as the application reads it: the column is nullable, and `=` against a NULL round would answer "no occupant" for every such row.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.nomination_exists_in_contest (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_election_id uuid,
  p_constituency_id uuid,
  p_election_round integer
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations n
    WHERE n.entity_type = p_entity_type
      AND (
        n.candidate_id = p_entity_id
        OR n.organization_id = p_entity_id
        OR n.faction_id = p_entity_id
        OR n.alliance_id = p_entity_id
      )
      AND n.election_id = p_election_id
      AND n.constituency_id = p_constituency_id
      AND COALESCE(n.election_round, 1) = COALESCE(p_election_round, 1)
  );
$$;

--------------------------------------------------------------------------------
-- nomination_id_in_contest: which nomination does this entity hold at this contest?
--
-- Answers the id of the entity's nomination at this election, constituency and round, by the match of `nomination_exists_in_contest`: the entity type against the generated entity_type column, the entity id against the four foreign keys, and a round that is not stored as round 1. A writer that points a child's nomination at its parent's asks it for the parent's id.
--
-- SECURITY DEFINER because the caller may be unable to read the row. A parent's nomination the caller has just created through `entity_insert_parent_nominations` nominates an entity the caller holds no `nomination.read` on, so neither `INSERT ... RETURNING` nor a `SELECT` of the caller's own gives its id.
--
-- Returns NULL when the entity holds no nomination at the contest.
--
-- An entity can hold several nominations at one contest, because the uniqueness key includes the parent: an organization may stand there on its own and under an alliance, or under two alliances. The answer is then the nomination with no parent first, then the oldest by created_at, then the lowest id. 23-nominations-write.test.sql pins each step of that order.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.nomination_id_in_contest (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_election_id uuid,
  p_constituency_id uuid,
  p_election_round integer
) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT n.id
  FROM public.nominations n
  WHERE n.entity_type = p_entity_type
    AND (
      n.candidate_id = p_entity_id
      OR n.organization_id = p_entity_id
      OR n.faction_id = p_entity_id
      OR n.alliance_id = p_entity_id
    )
    AND n.election_id = p_election_id
    AND n.constituency_id = p_constituency_id
    AND COALESCE(n.election_round, 1) = COALESCE(p_election_round, 1)
  ORDER BY (n.parent_nomination_id IS NOT NULL), n.created_at, n.id
  LIMIT 1;
$$;

--------------------------------------------------------------------------------
-- caller_nominated_in_contest: does the caller hold a named permission on an entity of one of the named types that is nominated at this contest?
--
-- Asks whether there is a nomination at this contest whose entity is of one of p_caller_types and on which the caller holds p_permission. A round that is not stored is round 1, as in `nomination_exists_in_contest`. The permission's answer comes from `user_can`, so no cell of the matrix is written down a second time. The entity is named by the nomination's generated entity_type and its one set foreign key.
--
-- p_caller_types is what pairs a row with the caller that may create it. `entity_insert_parent_nominations` passes the types of entity that stand under the row being inserted, so holding the permission on an entity of another type nominated at the contest does not answer yes. A NULL or empty array answers false.
--
-- A row-level WITH CHECK sees only the row being inserted, so "the caller is inserting their own nomination in the same transaction" cannot be expressed here. The order of the three statements a child writes makes that moot: its own nomination with no parent, then the parent's nomination, then its own nomination pointed at the parent's. Where the election's type requires the child's nomination to have a parent, `validate_nomination_parent_required` judges the first row when the transaction ends, after the third statement has given it one.
--
-- Denies (returns false) when no row is found.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.caller_nominated_in_contest (
  p_election_id uuid,
  p_constituency_id uuid,
  p_election_round integer,
  p_permission public.grant_permission,
  p_caller_types public.entity_type[]
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations n
    WHERE n.election_id = p_election_id
      AND n.constituency_id = p_constituency_id
      AND COALESCE(n.election_round, 1) = COALESCE(p_election_round, 1)
      AND n.entity_type = ANY (p_caller_types)
      AND public.user_can(
            'entity',
            COALESCE(n.candidate_id, n.organization_id, n.faction_id, n.alliance_id),
            p_permission,
            n.entity_type
          )
  );
$$;

--------------------------------------------------------------------------------
-- caller_unconfirmed_originated_count: how many unconfirmed organization and alliance nominations has this caller originated?
--
-- The subject of the cap: rows with `created_by = auth.uid()` that nominate an organization or an alliance and are still unconfirmed. Those are the two kinds of row `entity_insert_parent_nominations` admits. Whose entity a row nominates is not asked, so an unconfirmed nomination the caller inserted for an organization or an alliance it edits counts as a placeholder for another's does. A confirmed row leaves the count, so the cap bounds the queue rather than a lifetime total.
--
-- `count(*)` returns 0, never NULL, when nothing matches; a NULL would make the policy's `< cap` comparison NULL and bar every caller.
--
-- A caller with no token has `auth.uid() IS NULL` and counts the rows whose originator is NULL, which is every seeded and owner-inserted row. That is harmless because both consumers run only for `authenticated` callers: the nomination insert policy is `TO authenticated`, and the cap check in `enforce_nomination_confirmation()` tests `current_user`.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.caller_unconfirmed_originated_count () RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT count(*)::integer
  FROM public.nominations n
  WHERE n.created_by IS NOT DISTINCT FROM (SELECT auth.uid())
    AND (n.organization_id IS NOT NULL OR n.alliance_id IS NOT NULL)
    AND NOT n.confirmed;
$$;

--------------------------------------------------------------------------------
-- caller_entity_ids: which entities of this type, in this project, does the caller edit?
--
-- Returns the target ids of the caller's own `(entity, <type>, <id>, editor)` rows in public.grants whose entity lies in p_project_id. get_user_entities calls it to list the caller's entities and get_entity_user_data to decide whether one entity is the caller's. It reads the table rather than the caller's token, so a grant written after the token was issued already counts.
--
-- Only the `editor` role is read and `user_can` is not called: user_can answers yes for project, account and global admins, and an entity-scope `admin` grant confers nothing, so neither names an entity the caller is.
--
-- SECURITY DEFINER because public.grants is revoked from every API role. The entity's project is probed inline, one EXISTS per entity table, rather than through entity_project_id, because a SECURITY DEFINER function is never inlined and nesting one inside another pays that per-row cost twice.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.caller_entity_ids (
  p_project_id uuid,
  p_entity_type public.entity_type
) RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT g.target_id
  FROM public.grants g
  WHERE g.user_id = (SELECT auth.uid())
    AND g.scope = 'entity'
    AND g.role = 'editor'
    AND g.target_type = p_entity_type
    AND CASE p_entity_type
      WHEN 'candidate' THEN EXISTS (SELECT 1 FROM public.candidates e WHERE e.id = g.target_id AND e.project_id = p_project_id)
      WHEN 'organization' THEN EXISTS (SELECT 1 FROM public.organizations e WHERE e.id = g.target_id AND e.project_id = p_project_id)
      WHEN 'faction' THEN EXISTS (SELECT 1 FROM public.factions e WHERE e.id = g.target_id AND e.project_id = p_project_id)
      WHEN 'alliance' THEN EXISTS (SELECT 1 FROM public.alliances e WHERE e.id = g.target_id AND e.project_id = p_project_id)
    END;
$$;

-- Policies and SECURITY INVOKER functions evaluate as the querying role, so the API roles need EXECUTE on the private helpers; PostgREST cannot reach them because `private` is not an exposed schema. Stated explicitly rather than inherited from PostgreSQL's default PUBLIC grant, so the dependency is visible here. The statement reaches only the functions defined before it.
GRANT
EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO anon,
authenticated,
service_role;

-- The grant above also reaches `private.feedback_client_ip` (107-feedback.sql). No policy calls it; only the SECURITY DEFINER trigger `check_feedback_rate_limit` does, so the API roles get no EXECUTE on it.
REVOKE
EXECUTE ON FUNCTION private.feedback_client_ip (json, boolean)
FROM
  anon,
  authenticated,
  service_role;

--------------------------------------------------------------------------------
-- user_password_set: does this account hold a password?
--
-- True when the user's `encrypted_password` in auth.users is neither null nor the empty string, false otherwise and for an id that names no user.
--
-- It reads true for accounts whose owner never chose a password: the auth service stores the hash of a generated password for an account created by a service-side `createUser`, for a new account created by a `magiclink` link, and when an `invite` token is verified. True therefore means that the account holds some password, not that its owner chose one; a caller that needs the second has to record it itself.
--
-- It takes the id of any account, so no API role may execute it: published to one, it would say whether somebody else's account has a password. Only definer functions call it, as their owner and for `auth.uid()`: private.caller_password_set below and claim_invitations in 506-invitation-rpcs.sql. It is defined after the grant on the `private` schema above, which therefore does not reach it, and the REVOKE takes away the EXECUTE PostgreSQL gives PUBLIC on every new function.
--
-- SECURITY DEFINER because no API role can read auth.users.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.user_password_set (p_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (SELECT NULLIF(u.encrypted_password, '') IS NOT NULL FROM auth.users u WHERE u.id = p_user_id),
    false
  );
$$;

REVOKE
EXECUTE ON FUNCTION private.user_password_set (uuid)
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- caller_password_set: does the caller's own account hold a password?
--
-- Answers private.user_password_set for `auth.uid()`. It takes no argument, so it answers for nobody else: there is nothing a caller could pass to point it at another account. get_user_entities in 503-entity-rpcs.sql calls it for its `password_set` key.
--
-- It returns null for a caller that is not signed in: with no account to read there is no fact, and null is neither "set" nor "not set".
--
-- `authenticated` alone holds EXECUTE, stated here because the grant on the `private` schema above does not reach a function defined after it. get_user_entities runs with its caller's rights, so the role that may call it must be able to call this one.
--
-- SECURITY DEFINER because it reads auth.users, which no API role can.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.caller_password_set () RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT CASE
    WHEN (SELECT auth.uid()) IS NOT NULL THEN private.user_password_set((SELECT auth.uid()))
  END;
$$;

REVOKE
EXECUTE ON FUNCTION private.caller_password_set ()
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.caller_password_set () TO authenticated;

--------------------------------------------------------------------------------
-- caller_pending_email_taken: is the address the caller's account is changing to already another account's?
--
-- True when the caller's row of auth.users, the row `auth.uid()` names, holds a non-empty pending address (`email_change`) and another row's address equals it, both compared trimmed and lower-cased. False otherwise, for a caller with no pending address, and where no caller is signed in. get_user_entities in 503-entity-rpcs.sql calls it for its `pending_email_taken` key.
--
-- It answers for the caller alone. It takes no argument and reads one pending address, the caller's own, so each answer is about the one address the caller's account is changing to and never about an address the caller merely names: to ask about another address, a caller has to make it its own pending address first, which the application does only through the address-confirmation request that public.address_confirmation_request limits per account.
--
-- `authenticated` alone holds EXECUTE, stated here because the grant on the `private` schema above does not reach a function defined after it. get_user_entities runs with its caller's rights, so the role that may call it must be able to call this one.
--
-- SECURITY DEFINER because it reads auth.users, which no API role can.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.caller_pending_email_taken () RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT EXISTS (
        SELECT 1
        FROM auth.users other
        WHERE other.id <> me.id
          AND lower(btrim(other.email)) = lower(btrim(me.email_change))
      )
      FROM auth.users me
      WHERE me.id = (SELECT auth.uid())
        AND NULLIF(btrim(me.email_change), '') IS NOT NULL
    ),
    false
  );
$$;

REVOKE
EXECUTE ON FUNCTION private.caller_pending_email_taken ()
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.caller_pending_email_taken () TO authenticated;

--------------------------------------------------------------------------------
-- registration_mode_allowed_in: may entities of this type register with this mode, under these stored settings?
--
-- The registration-mode rule, as a function of the stored settings alone. It reads `contestantApp.entityTypes` and `contestantApp.registrationModes` of p_settings and no table:
-- - the entity type must be `candidate` or `organization` and the mode one of `identity_provider`, `email` and `code`;
-- - the type must be served: listed in the stored list of entity types when that list is an array naming at least one of the two types, and otherwise `candidate` alone is served;
-- - the stored matrix must be an object, the type's row in it an array, and the array must hold the mode.
-- Everything else is false: settings that are null or store nothing, a matrix or a row of another JSON type, a row for a type that is not served, and a null argument.
--
-- `isRegistrationModeAllowed` in @openvaa/app-shared is the same rule for the screens. 45-registration-mode-matrix.test.sql holds one table of rows that this function is asserted against, and a unit test asserts the TypeScript accessor against the same rows.
--
-- Only private.registration_mode_allowed below calls it, as its owner, so no API role holds EXECUTE: the REVOKE takes away the EXECUTE PostgreSQL gives PUBLIC on every new function, and the grant on the `private` schema above does not reach a function defined after it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.registration_mode_allowed_in (p_settings jsonb, p_entity_type text, p_mode text) RETURNS boolean LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT COALESCE(
    p_entity_type IN ('candidate', 'organization')
    AND p_mode IN ('identity_provider', 'email', 'code')
    AND CASE
      WHEN jsonb_typeof(c.entity_types) = 'array' AND (c.entity_types ? 'candidate' OR c.entity_types ? 'organization')
        THEN c.entity_types ? p_entity_type
      ELSE p_entity_type = 'candidate'
    END
    AND jsonb_typeof(c.modes) = 'object'
    AND jsonb_typeof(c.modes -> p_entity_type) = 'array'
    AND (c.modes -> p_entity_type) ? p_mode,
    false
  )
  FROM (
    SELECT
      p_settings #> '{contestantApp,entityTypes}' AS entity_types,
      p_settings #> '{contestantApp,registrationModes}' AS modes
  ) c;
$$;

REVOKE
EXECUTE ON FUNCTION private.registration_mode_allowed_in (jsonb, text, text)
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- registration_mode_allowed: does this project allow this registration mode for this entity type?
--
-- Answers private.registration_mode_allowed_in for the settings of p_project_id's row in public.app_settings, and false when the project has no row. private.invitation_mode_allowed in 506-invitation-rpcs.sql calls it for an invitation's project, target type and mode.
--
-- No API role holds EXECUTE: it answers for any project, a closed one included, and only definer functions call it, as their owner.
--
-- SECURITY DEFINER because it reads app_settings of a project the caller may not read.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.registration_mode_allowed (
  p_project_id uuid,
  p_entity_type text,
  p_mode text
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT private.registration_mode_allowed_in(s.settings, p_entity_type, p_mode)
      FROM public.app_settings s
      WHERE s.project_id = p_project_id
    ),
    false
  );
$$;

REVOKE
EXECUTE ON FUNCTION private.registration_mode_allowed (uuid, text, text)
FROM
  PUBLIC,
  anon,
  authenticated;
