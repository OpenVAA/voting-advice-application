-- Auth hooks: Custom Access Token Hook and RLS helper functions
--
-- Depends on: 300-auth-tables.sql (grants table)
--
-- Functions:
-- - custom_access_token_hook(jsonb) - projects public.grants into the JWT `grants` claim
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
-- - private.nomination_exists_in_contest(entity_type, uuid, uuid, uuid, integer) - whether an entity is already nominated at a contest
-- - private.caller_nominated_in_contest(uuid, uuid, integer, grant_permission) - whether the caller holds a permission on an entity nominated at a contest
-- - private.caller_unconfirmed_originated_count() - how many unconfirmed parent nominations the caller has originated
--
-- The two public-visibility terms are each defined once here and called directly by the eight entity SELECT policies.
--------------------------------------------------------------------------------
-- The `private` schema: policy-only SECURITY DEFINER helpers
--
-- Every SECURITY DEFINER function in `public` is published by PostgREST as `/rest/v1/rpc/<name>`, and Supabase's default privileges make it executable by `anon` and `authenticated`. The hierarchy and visibility hops below answer questions row-level security would refuse the caller directly, such as which project an arbitrary entity id belongs to, so published as RPCs they would be cross-tenant oracles.
--
-- Revoking EXECUTE is not the fix, because a policy expression runs with the querying role's privileges and would fail with `permission denied`. The helpers therefore live in `private`, which is not in PostgREST's exposed schemas (config.toml `[api] schemas`), while the API roles keep USAGE and EXECUTE so policies can call them. Every call site qualifies the name, so no search_path decides which function runs.
--
-- What stays in `public`: `user_can` (the Edge Functions call it over RPC) and `user_has_account_grant`, which answer only about the caller's own claim; `grant_role_permissions` (the matrix, no row data); `project_open_for_voters` (the frontend calls it); and the two storage path helpers (caller-scoped or public by definition). 07-rpc-security.test.sql holds a census of every anon- and authenticated-executable SECURITY DEFINER function in `public`, so a new one has to be added there on purpose.
--------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

GRANT USAGE ON SCHEMA private TO anon,
authenticated,
service_role;

--------------------------------------------------------------------------------
-- Custom Access Token Hook: called by Supabase Auth on every token refresh/issue, it projects each public.grants row into the JWT's `grants` claim, the only authority claim it emits.
--
-- The per-entry keys are the column names of public.grants minus id, user_id and created_at. user_can reads exactly these four, and a key-name or key-set mismatch is not an error anywhere: it is an empty permission set, which denies every caller. 14-grants-migration.test.sql asserts the emitted array set-equal to test_grants_claim, in both directions and with equal cardinality.
--
-- COALESCE gives a user with no grant rows an empty array rather than NULL or a missing key. user_can treats both alike, but the empty array is the state a grant-less identity should carry.
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

    -- OrganizationEditor: the entity set minus nomination.create_parent (an organization has no parent to create), plus entity.invite_children, which only this role holds.
    WHEN (p_scope, p_role, p_target_type) = ('entity', 'editor', 'organization') THEN ARRAY[
      'project.read_structure',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.invite_children',
      'nomination.edit',
      'nomination.read'
    ]::public.grant_permission[]

    -- Candidate, FactionEditor and AllianceEditor share one row, nomination.create_parent included. Their nomination rights hold only while the project is unlocked, but the lock is row state, so the nomination policies check it and the matrix does not.
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
-- Anon-readable means the entity policy's own predicate, terms of use included, so both policies give one answer. The terms-of-use rule is therefore written in two places, and the biconditional assertion in 16-anon-visibility.test.sql (no nomination visible to anon whose linked entity is not) fails when the two disagree.
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
            AND e.terms_of_use_accepted IS NOT NULL
            AND e.terms_of_use_accepted < now()
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
-- Grants union: the first grant satisfying both halves answers true, no grant can subtract, and the order of entries in the claim does not matter.
--
-- It answers "may this role do this verb to this object", not "is the object in a state that admits the verb". lock_nominations, open_for_voters and the confirmation flags are conjuncts of the policies that call it, not members of the matrix.
--
-- It reads only the caller's JWT `grants` claim, in every branch. Claim fields are compared as text against the enum literals rather than cast: a cast throws on an unexpected value, and an exception inside a policy predicate is a query-time error, whereas an unrecognised entry that is skipped denies by default. A claim of garbage alongside one valid grant answers exactly as the valid grant alone.
--
-- SECURITY DEFINER because the reach hops read public.projects and the entity tables, which the caller's own row-level security would filter. search_path is empty because a mutable search_path on a SECURITY DEFINER function is a privilege-escalation primitive.
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
  grants_claim jsonb;
  grant_entry jsonb;
  g_scope text;
  g_role text;
  g_target_type text;
  g_target_id uuid;
  g_permissions public.grant_permission[];
  v_project_id uuid;
  v_account_id uuid;
BEGIN
  IF p_scope IS NULL OR p_permission IS NULL THEN RETURN false; END IF;

  -- A NULL target is meaningful only at global scope, where there is no object to name. At every other scope it is a degenerate input and denies.
  IF p_target_id IS NULL AND p_scope <> 'global' THEN RETURN false; END IF;

  -- An entity is named by its type and id together, so an entity-scope question without a type denies.
  IF p_scope = 'entity' AND p_target_type IS NULL THEN RETURN false; END IF;

  grants_claim := (SELECT auth.jwt() -> 'grants');
  -- NULL covers the anon session and a token without the claim; a non-array covers a malformed claim. Both deny rather than raise.
  IF grants_claim IS NULL OR jsonb_typeof(grants_claim) <> 'array' THEN RETURN false; END IF;

  FOR grant_entry IN SELECT * FROM jsonb_array_elements(grants_claim)
  LOOP
    g_scope := grant_entry ->> 'scope';
    g_role := grant_entry ->> 'role';
    g_target_type := grant_entry ->> 'target_type';

    -- Skip anything outside the declared vocabularies rather than casting it.
    CONTINUE WHEN g_scope IS NULL OR g_scope NOT IN ('global', 'account', 'project', 'entity');
    CONTINUE WHEN g_role IS NULL OR g_role NOT IN ('admin', 'editor');
    CONTINUE WHEN g_target_type IS NOT NULL
      AND g_target_type NOT IN ('candidate', 'organization', 'faction', 'alliance');

    g_target_id := NULL;
    IF grant_entry ->> 'target_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      g_target_id := (grant_entry ->> 'target_id')::uuid;
    END IF;

    -- 300-auth-tables.sql's two CHECK constraints, restated over the claim: a global grant has no target, every other scope has one, and the entity discriminator is present exactly when the scope is entity.
    CONTINUE WHEN g_target_id IS NULL AND g_scope <> 'global';
    CONTINUE WHEN g_target_id IS NOT NULL AND g_scope = 'global';
    CONTINUE WHEN (g_target_type IS NOT NULL) <> (g_scope = 'entity');

    -- Half 1: the verb. This is the only place user_can consults the matrix.
    g_permissions := public.grant_role_permissions(
      g_scope::public.grant_scope_type,
      g_role::public.grant_role_type,
      g_target_type::public.entity_type
    );
    CONTINUE WHEN g_permissions IS NULL OR NOT (p_permission = ANY (g_permissions));

    -- Half 2: reach. Downward-or-equal from the grant's own target, plus the two named branches below. Every hop denies when it finds no row; no branch treats a NULL comparison result as a match.
    IF g_scope = 'global' THEN
      -- Reaches everything that exists. The existence check is deliberate: an entity that resolves to no project is not an object any grant reaches, and a global grant must not be the one branch that says otherwise because its lookup was skipped.
      CONTINUE WHEN p_scope = 'entity' AND private.entity_project_id(p_target_type, p_target_id) IS NULL;
      RETURN true;
    END IF;

    IF g_scope = 'account' THEN
      IF p_scope = 'account' AND p_target_id = g_target_id THEN RETURN true; END IF;
      IF p_scope = 'project' THEN
        SELECT account_id INTO v_account_id FROM public.projects WHERE id = p_target_id;
        IF v_account_id IS NOT NULL AND v_account_id = g_target_id THEN RETURN true; END IF;
      END IF;
      IF p_scope = 'entity' THEN
        v_project_id := private.entity_project_id(p_target_type, p_target_id);
        IF v_project_id IS NOT NULL THEN
          SELECT account_id INTO v_account_id FROM public.projects WHERE id = v_project_id;
          IF v_account_id IS NOT NULL AND v_account_id = g_target_id THEN RETURN true; END IF;
        END IF;
      END IF;
      CONTINUE;
    END IF;

    IF g_scope = 'project' THEN
      IF p_scope = 'project' AND p_target_id = g_target_id THEN RETURN true; END IF;
      IF p_scope = 'entity' THEN
        v_project_id := private.entity_project_id(p_target_type, p_target_id);
        IF v_project_id IS NOT NULL AND v_project_id = g_target_id THEN RETURN true; END IF;
      END IF;
      CONTINUE;
    END IF;

    -- g_scope = 'entity'. Reach is equality with the granted entity, type and id both, which is what an `own` matrix cell means, plus the named branches below.
    IF p_scope = 'entity' AND g_target_type = p_target_type::text AND p_target_id = g_target_id THEN RETURN true; END IF;

    -- NAMED BRANCH 1, the project-read branch: an entity grantee may read the structure of its entity's project. The permission is a literal so the hop cannot widen to another verb; a general upward-reach rule would also answer yes to entity.edit_answers at account scope.
    IF p_scope = 'project' AND p_permission = 'project.read_structure' THEN
      v_project_id := private.entity_project_id(g_target_type::public.entity_type, g_target_id);
      IF v_project_id IS NOT NULL AND v_project_id = p_target_id THEN RETURN true; END IF;
    END IF;

    -- NAMED BRANCH 2, the child-nominee branch: an entity grantee may read the nominations of an entity nominated under one of its own entity's nominations, but not that entity's answers. Like branch 1, the permission is a literal so the hop cannot widen to another verb.
    IF p_scope = 'entity' AND p_permission = 'nomination.read'
       AND private.is_child_nominee(g_target_type::public.entity_type, g_target_id, p_target_type, p_target_id) THEN
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
-- SECURITY DEFINER because the project disjunct reads public.projects, which has row-level security enabled; an inline read would also ask whether the caller can see the project. search_path is pinned as on every definer function here.
--
-- Claim fields are compared as text rather than cast, as in user_can: `p.id::text = (g ->> 'target_id')` never casts the claim, so an unexpected value denies instead of raising.
--
-- The global admin is a disjunct here rather than a separate policy term, so the `accounts` SELECT stays a single call.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_account_grant (p_account_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof((SELECT auth.jwt() -> 'grants')) = 'array'
           THEN (SELECT auth.jwt() -> 'grants')
           ELSE '[]'::jsonb END
    ) AS g
    WHERE ((g ->> 'scope') = 'global' AND (g ->> 'role') = 'admin')
       OR ((g ->> 'scope') = 'account' AND (g ->> 'target_id') = p_account_id::text)
       OR ((g ->> 'scope') = 'project' AND EXISTS (
             SELECT 1
             FROM public.projects p
             WHERE p.id::text = (g ->> 'target_id')
               AND p.account_id = p_account_id))
  );
$$;

--------------------------------------------------------------------------------
-- project_nominations_locked: is this project's nomination editing locked?
--
-- The lock is row state rather than a member of the permission matrix, so it is a conjunct of the nomination policies and this function is the hop they call.
--
-- It returns true (locked) when the project row is not found, so a missing project never unlocks anything. project_open_for_voters denies with false because its sense is the other way round.
--
-- SECURITY DEFINER because public.projects has row-level security enabled, and an inline read would also ask whether the caller can see the project.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.project_nominations_locked (p_project_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (SELECT p.lock_nominations FROM public.projects p WHERE p.id = p_project_id),
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
-- `election_round` is compared with IS NOT DISTINCT FROM because the column is nullable, and `=` against a NULL round would answer "no occupant" for every such row.
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
      AND n.election_round IS NOT DISTINCT FROM p_election_round
  );
$$;

--------------------------------------------------------------------------------
-- caller_nominated_in_contest: does the caller hold a named permission on an entity nominated at this contest?
--
-- Asks whether there is a nomination at this contest whose entity the caller holds p_permission on. The answer comes from `user_can`, so no cell of the matrix is written down a second time. The entity is named by the nomination's generated entity_type and its one set foreign key.
--
-- A row-level WITH CHECK sees only the row being inserted, so "the caller is inserting their own nomination in the same transaction" cannot be expressed here. Insertion order makes that moot: a candidate first creates their own nomination with no parent (which `validate_nomination` admits), then the parent, then repoints their nomination at it.
--
-- Denies (returns false) when no row is found.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.caller_nominated_in_contest (
  p_election_id uuid,
  p_constituency_id uuid,
  p_election_round integer,
  p_permission public.grant_permission
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations n
    WHERE n.election_id = p_election_id
      AND n.constituency_id = p_constituency_id
      AND n.election_round IS NOT DISTINCT FROM p_election_round
      AND public.user_can(
            'entity',
            COALESCE(n.candidate_id, n.organization_id, n.faction_id, n.alliance_id),
            p_permission,
            n.entity_type
          )
  );
$$;

--------------------------------------------------------------------------------
-- caller_unconfirmed_originated_count: how many unconfirmed parent nominations has this caller originated?
--
-- The subject of the cap: rows with `created_by = auth.uid()` that are organization nominations and still unconfirmed, i.e. placeholder parents awaiting an admin. A confirmed row leaves the count, so the cap bounds the queue rather than a lifetime total.
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
    AND n.organization_id IS NOT NULL
    AND NOT n.confirmed;
$$;

-- Policies evaluate as the querying role, so the API roles need EXECUTE on the private helpers; PostgREST cannot reach them because `private` is not an exposed schema. Stated explicitly rather than inherited from PostgreSQL's default PUBLIC grant, so the dependency is visible here.
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
