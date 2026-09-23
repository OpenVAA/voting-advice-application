-- Auth hooks: Custom Access Token Hook and RLS helper functions
--
-- Depends on: 300-auth-tables.sql (grants table)
--
-- Functions:
--   custom_access_token_hook(jsonb)  - Projects public.grants into the JWT claims user_can(grant_scope_type, uuid, grant_permission) - MAY THIS CALLER DO THIS VERB TO THIS OBJECT: the one predicate the RLS policies delegate their authority decision project_open_for_voters(uuid), entity_has_confirmed_nomination(entity_type, uuid, uuid) - the two sub-rules of public visibility, each defined ONCE here and called DIRECTLY from the eight entity SELECT policies (D-36; the entity_is_anon_visible composition V-6(A) briefly interposed is gone, because the nesting cost 271.9 ms against 39.4)
--------------------------------------------------------------------------------
-- The `private` schema: policy-only SECURITY DEFINER helpers (162-REVIEW WR-01)
--
-- Every SECURITY DEFINER function in `public` is published by PostgREST as `/rest/v1/rpc/<name>`, and Supabase's default privileges make it executable by `anon` and `authenticated`. The hierarchy and visibility hops below exist to be called from POLICY expressions, where they answer questions row-level security would refuse the caller directly -- which project an arbitrary entity id belongs to, whether a candidate is nominated under a party before publication, whether an unconfirmed nomination exists in a closed project's contest. Published as RPCs, each became a cross-tenant oracle.
--
-- A plain REVOKE is not the fix: a policy expression runs with the QUERYING role's privileges, so revoking EXECUTE from anon and authenticated would turn every policy that calls a helper into `permission denied`. The helpers therefore live in `private`, which is NOT in PostgREST's exposed schemas (config.toml `[api] schemas`), and the API roles keep USAGE on the schema and EXECUTE on its functions -- enough for a policy to call them, never enough for a request to name them. Every call site qualifies the name, so no search_path decides which function runs.
--
-- What stays in `public`, deliberately: `user_can` (the Edge Functions ask it over RPC, and it answers only about the caller's own claim), `user_has_account_grant` (likewise caller-only), `grant_role_permissions` (the matrix itself, no row data), `project_open_for_voters` (the frontend calls it), and the two storage path helpers (caller-scoped or public-by-definition). 07-rpc-security.test.sql holds a census of every anon- and authenticated-executable SECURITY DEFINER function left in `public`, so a new one has to be added there on purpose.
--------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

GRANT USAGE ON SCHEMA private TO anon,
authenticated,
service_role;

--------------------------------------------------------------------------------
-- Custom Access Token Hook Called by Supabase Auth on every token refresh/issue.
-- Reads public.grants and projects each row into the JWT's `grants` claim.
--
-- ONE VOCABULARY, NOT TWO. The retired claim key is not emitted alongside this one. A claim outliving its table is the second authority mechanism this phase exists to end (K1), and a reader with a fallback to the retired key would be a third.
--
-- THE PER-ENTRY KEYS ARE THE COLUMN NAMES OF public.grants, minus id, user_id and created_at. user_can reads exactly these four, and a key-name or key-set disagreement across this boundary is not an error anywhere: it is an empty permission set, which reads as a total denial for every caller. 14-grants-migration.test.sql asserts the emitted array SET-EQUAL, in both directions and with equal cardinality, to test_grants_claim -- the projection helper 162-04 installed for exactly this comparison.
--
-- COALESCE keeps a user with no grant rows at an EMPTY ARRAY rather than a NULL or a missing key. user_can treats a missing key and an empty array identically today, but they are different states and only one of them is what a grant-less identity should carry.
--
-- The ORDER BY makes two calls for one user answer identically, so a diff of two captured tokens is readable. It is not what makes the projection correct: jsonb_agg defines no element order and the equality above is therefore asserted as a SET, so a reordering that means nothing cannot redden it.
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

-- And to nobody else (162-REVIEW IN-01, Supabase's own guidance for auth hooks). Only the auth server calls this function; as a public RPC it is harmless today only because it is SECURITY INVOKER and `grants` is revoked from the API roles, which is two unrelated facts holding a door shut.
REVOKE
EXECUTE ON FUNCTION public.custom_access_token_hook
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- grant_role_permissions: the role x permission matrix, encoded once
--
-- 162-IMPLEMENTATION-BRIEF.md section 3.3 exists in exactly one function body in this codebase, and this is it. Splitting it out from user_can is what makes "encoded once" checkable: 162-17's structural non-collapse guard can look for the matrix's permission literals and find them in one place, and the matrix can be diffed against the brief by machine without executing a permission check. user_can is then purely REACH and carries no cell of the matrix.
--
-- Reads no table, so it is IMMUTABLE and deliberately NOT SECURITY DEFINER — it needs no owner rights. search_path is pinned anyway, because the enum types it names are resolved at call time.
--
-- The fall-through arm is not decoration. A grant of scope `entity` with role `admin`, and grants of scope `global` or `account` with role `editor`, are shapes 300-auth-tables.sql's CHECK constraints admit and section 3.1 does not map; without the fall-through they would inherit whichever arm a CASE happened to land in. They carry the empty set, so user_can answers false for all 23.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_role_permissions (
  p_scope public.grant_scope_type,
  p_role public.grant_role_type,
  p_target_type public.entity_type
) RETURNS public.grant_permission[] LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT CASE
    -- Root: every verb. 162-IMPLEMENTATION-BRIEF.md section 3.3, column "Root".
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

    -- Account: every verb, within the account. Column "Account".
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

    -- ProjAdmin: all but the three account.* verbs. Column "ProjAdmin", 20.
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

    -- ProjEditor: ProjAdmin minus project.manage_editors, minus project.edit_project_settings (section 11.1's split) and minus nomination.confirm, which USER-RIGHTS restricts to admins. This row is what satisfies K4's "level-1 permissions short of full". Column "ProjEditor", 17. The editor keeps the app's face (app_settings), the admin keeps the project's shape (projects).
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

    -- OrganizationEditor: the entity set, minus nomination.create_parent (an organization has no parent to create) and plus entity.invite_children, which section 3.3 grants only here, as "own (org -> cand)". Column "OrgEditor", 6.
    WHEN (p_scope, p_role, p_target_type) = ('entity', 'editor', 'organization') THEN ARRAY[
      'project.read_structure',
      'entity.edit_answers',
      'entity.read_answers',
      'entity.invite_children',
      'nomination.edit',
      'nomination.read'
    ]::public.grant_permission[]

    -- Candidate, FactionEditor and AllianceEditor share one row: section 3.3 prints the Candidate and Faction/Alliance columns identically, including nomination.create_parent (section 11.5). Their `own, unless locked` cells read as `own` here; the AND NOT locked conjunct is 162-12's policy's, because projects.lock_nominations does not exist until 162-07 and row state is not a member of this matrix (162-04 task 2 Q3). Columns "Candidate" and "Faction/Alliance", 6 each.
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
-- entity_project_id: resolve an entity uuid to its project
--
-- All four entity tables carry project_id uuid NOT NULL, so the hop is one primary-key probe against whichever of the four holds the id and needs no entity-type argument. Returns NULL when the id is in none of them — which is a DENY at every call site, never a match.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.entity_project_id (p_entity_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT project_id FROM public.candidates WHERE id = p_entity_id
  UNION ALL
  SELECT project_id FROM public.organizations WHERE id = p_entity_id
  UNION ALL
  SELECT project_id FROM public.factions WHERE id = p_entity_id
  UNION ALL
  SELECT project_id FROM public.alliances WHERE id = p_entity_id
  LIMIT 1;
$$;

--------------------------------------------------------------------------------
-- election_project_id: resolve an election uuid to its project
--
-- The hop the two `election_constituency_groups` WRITE policies need. That table carries no project_id of its own, only election_id, and its READ policy delegates to the parent group's policy — but a WRITE must not, because a sub-select the caller's own row-level security filters makes the answer depend on the caller's READ access to the parent as well as on their authority over it, which is two questions where this phase wants one. SECURITY DEFINER moves the lookup out of the caller's view and leaves `user_can` the only thing deciding.
--
-- Returns NULL when the election does not exist, and NULL IS THE DENIAL: user_can answers false for a NULL target at project scope (301's `p_target_id IS NULL AND p_scope <> 'global'` guard), so a join row naming an election that is in no row is refused by the permission predicate rather than by three-valued logic. 17-project-structure-authority.test.sql asserts that path directly.
--
-- Same shape, same hardening and same deny-on-no-row posture as entity_project_id above; two named functions rather than one generic one, because elections and constituency_groups are two tables with two primary keys and no enum relating them — the generic alternative is dynamic SQL inside a security predicate. Not a D-21 violation: D-21 forbids naming a single ENTITY TYPE where the policy could take one as an argument, and the nine structure write predicates this plan writes name no table at all.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.election_project_id (p_election_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT project_id FROM public.elections WHERE id = p_election_id;
$$;

--------------------------------------------------------------------------------
-- constituency_group_project_id: resolve a constituency-group uuid to its project
--
-- The same hop for `constituency_group_constituencies`, whose two WRITE policies need it for the same reason election_project_id exists: that table carries no project_id, its READ policy delegates to the parent group's own policy, and a write must not, because a sub-select the caller's own row-level security filters asks about the caller's READ access to the parent as well as about their authority over it.
--
-- Returns NULL when the group does not exist, and NULL IS THE DENIAL by way of user_can's NULL-target guard at project scope.
--
-- TWO NAMED FUNCTIONS RATHER THAN ONE GENERIC ONE. `elections` and `constituency_groups` are two tables with two primary keys and no enum relating them, so there is no argument a generic version could take short of dynamic SQL inside a security predicate. D-21 asks that no policy name a single ENTITY TYPE where it could take one as an argument — entity types are a four-member enum with a shared shape — and that generalisation IS applied where it applies: the nine structure write predicates name no table at all.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.constituency_group_project_id (p_constituency_group_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT project_id FROM public.constituency_groups WHERE id = p_constituency_group_id;
$$;

--------------------------------------------------------------------------------
-- is_child_nominee: is p_child_id nominated under a nomination of the parent?
--
-- ONE HOP AND NO MORE (D4(a)). No recursive CTE, no second join: a grandchild — a candidate nominated under a faction nomination whose own parent is the organization's nomination — is FALSE when asked against the organization, and 12-user-can.test.sql asserts exactly that. A transitive version is 162-CONTEXT.md's deferred item and that assertion is what keeps it deferred.
--
-- The parent side needs a type argument and the child side does not: nominations carries four nullable entity FKs with a CHECK requiring exactly one, so a child id is matched against all four at once while the parent's type selects which column to compare (104-nominations.sql).
--
-- A published interface, not an internal detail: 162-08's anon entity policy reuses this nominations lookup rather than adding a second one, and 162-12's nomination policies call it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_child_nominee (
  p_parent_type public.entity_type,
  p_parent_id uuid,
  p_child_id uuid
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations child
    JOIN public.nominations parent ON parent.id = child.parent_nomination_id
    WHERE (
        child.candidate_id = p_child_id
        OR child.organization_id = p_child_id
        OR child.faction_id = p_child_id
        OR child.alliance_id = p_child_id
      )
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
-- The PROJECT-LEVEL term of 162-IMPLEMENTATION-BRIEF.md section 3.4, and the conjunct every one of the thirteen `TO anon` SELECT policies in 302-rls.sql carries. It reads public.projects, which has RLS enabled and NO anon policy at all: an inline `EXISTS (SELECT 1 FROM public.projects ...)` written into an anon policy therefore returns ZERO ROWS FOR EVERY CALLER and denies everything. Measured in a rolled-back transaction before this function was written -- inline 0 rows, this form the whole table -- which is why SECURITY DEFINER here is a requirement rather than an optimisation.
--
-- Denies when the project does not exist: COALESCE over a primary-key probe, never a NULL that a policy would read as a deny it did not intend to express.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.project_open_for_voters (p_project_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (SELECT p.open_for_voters FROM public.projects p WHERE p.id = p_project_id),
    false
  );
$$;

-- The frontend adapter calls this function over PostgREST, as anon and as authenticated, to tell a closed project from an open project with no settings row (162.1 D-06), so the dependency is declared here rather than inherited from default privileges; 30-closed-project.test.sql asserts both rights.
GRANT
EXECUTE ON FUNCTION public.project_open_for_voters (uuid) TO anon,
authenticated;

--------------------------------------------------------------------------------
-- entity_has_confirmed_nomination: is this entity publicly nominated in this project?
--
-- The ENTITY-LEVEL nomination hop of section 3.4, called by the four entity tables' anon SELECT policies. It answers a different question from is_child_nominee -- that one asks whether an entity is nominated UNDER a named parent, this one whether it is nominated at all, publicly -- so the two cannot share a body, and 162-04 task 2 ratified is_child_nominee's three-argument signature as a published interface that cannot be widened. The reuse section 5 asks for is therefore STRUCTURAL: the same file, the same four-FK matching expression, the same hardening, and NO policy anywhere holding a nominations sub-select of its own.
--
-- SECURITY DEFINER for a second measured reason. An entity policy holding an inline `EXISTS ... FROM public.nominations` alongside a nominations policy holding an inline `EXISTS ... FROM public.candidates` raises `infinite recursion detected in policy for relation "candidates"` on the first anon SELECT -- reproduced deliberately before this function was written. The helper's owner-rights read of both tables is what breaks the cycle, and it rests on relforcerowsecurity being false on all six tables, which 16-anon-visibility.test.sql asserts by name.
--
-- THE THIRD ARGUMENT IS LOAD-BEARING. public.nominations carries a project_id of its own and no composite constraint forces it to agree with its entity's; 07-rpc-security.test.sql section 9 creates exactly that row on purpose. Without the argument an entity in an open project would be published by a nomination living in a closed one.
--
-- p_entity_type is an ARGUMENT rather than a fact baked into four near-identical predicates (D-21), and it is matched against the generated entity_type column as well as against the four FK columns.
--
-- THE CONFIRMATION COLUMN IS READ BARE, and its bareness is the assertion. 162-12 (D-11c) renamed `nominations.unconfirmed` to `confirmed` and made it `NOT NULL DEFAULT false`, so the null-coalescing wrapper this expression used to carry -- `NOT COALESCE(n.unconfirmed, false)`, needed because the spelling `n.unconfirmed = false` would silently drop every NULL row -- is not merely unnecessary, it is REMOVABLE. 162-12 asserts that no such wrapper survives anywhere in schema/, which is a stronger statement than asserting that the remaining ones are correct. MEASURED: this file carried ONE such call site, not the three 162-08 predicted.
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
-- The TRANSITIVE conjunct of section 11.2, called by anon_select_nominations and by nothing else. The CHECK on public.nominations requires exactly one entity FK per row, so "every entity that nomination links" is ONE entity and the hop is one level deep (task 2 Q2 = A). Transitivity still holds per row rather than per chain: a parent nomination naming an unconfirmed organization fails its own policy and is invisible, because every nomination is judged by the same three conjuncts.
--
-- "READABLE" MEANS FULLY ANON-READABLE, TERMS OF USE INCLUDED (task 2 Q3 = A). The expression below is the entity policy's own predicate, so the nomination policy and the entity policy give one answer rather than two that differ on one table. The accepted cost is that the terms-of-use rule is written in two places; the mitigation is the biconditional assertion in 16-anon-visibility.test.sql -- zero nominations visible to anon whose linked entity is not -- which fails when the two expressions DISAGREE rather than merely when they differ.
--
-- ⚠ THIS IS THE PRE-162-10 BODY, RESTORED BY D-36 (2026-09-17), WHICH SUPERSEDES BOTH V-6(A) AND D-35. 162-10 replaced these four arms with four calls to a `public.entity_is_anon_visible` composition; that composition is gone and this function is the shape it had before. The reason is DEPTH, measured rather than argued: a SECURITY DEFINER function can never be inlined by the planner, so composing two SECURITY DEFINER helpers inside a third makes every per-row call a depth-2 call, and this function -- itself SECURITY DEFINER, called once per nomination row -- made it depth 3. On 5000 anon-visible nominations the composed form cost 654.5 ms against 291.0 ms for this one, same fixture, same instrument. The two helpers below remain the SINGLE definition of each sub-rule; what repeats is the assembly, here and in the eight entity SELECT policies, and 162-17 owes the guard that holds those eight identical.
--
-- It deliberately does NOT require the linked entity to belong to the nomination's own project. No composite constraint declares that, and 07-rpc-security.test.sql section 9 creates a project-A nomination naming project B's candidate as the control that makes its entity-join assertions non-vacuous; tightening here would void an existing negative control. The gap is 162-12's, which owns this table's constraints.
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
-- The predicate the RLS policies of waves 3, 4 and 5 delegate their whole authority decision to. It answers one grant at a time, and a grant says yes only when BOTH halves say yes:
--
--   1. VERB  — is p_permission a member of grant_role_permissions(...)?
--   2. REACH — does the grant's target contain, or equal, the asked object?
--
-- Grants UNION: the first grant satisfying both halves answers true, no grant can subtract, and the answer therefore does not depend on the order of entries in the claim.
--
-- It answers "may this role do this verb to this object", NOT "is this object currently in a state that admits the verb". lock_nominations, open_for_voters and the confirmation flags are conjuncts of the POLICIES that call this (162-08, 162-12), not members of the matrix — ratified as 162-04 task 2 Q3, and forced in wave 1 anyway because none of those columns exists until 162-07.
--
-- The `own` qualifier of 162-IMPLEMENTATION-BRIEF.md section 3.3 is not a third mechanism: for an entity grant, reach is exactly equality with the granted entity, so `own` falls out of the reach rule.
--
-- It reads the caller's own JWT `grants` claim and nothing else, in any branch or fallback. The claim key and the authority table this phase retired are both gone; a fallback to either would have made this answer two different questions depending on which claim the session happened to carry.
--
-- Claim fields are compared AS TEXT against the enum literals rather than cast to the enum type: a cast throws on an unexpected value, and an exception raised inside a policy predicate is a query-time error in 97 places, whereas an unrecognised entry that is simply skipped denies by default and is assertable. A claim of garbage alongside one valid grant answers exactly as the valid grant alone.
--
-- Hardened exactly as user_can is, and for the same reason: a mutable search_path on a SECURITY DEFINER function that reads tables the caller may not read is a privilege-escalation primitive, not a style issue.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_can (
  p_scope public.grant_scope_type,
  p_target_id uuid,
  p_permission public.grant_permission
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

  grants_claim := (SELECT auth.jwt() -> 'grants');
  -- NULL covers both the anon session and every real JWT until 162-06 emits the claim; a non-array covers a malformed one. Neither is an error here.
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

    -- Half 1: the verb. The matrix lives in exactly one function body and this is the only place user_can consults it.
    g_permissions := public.grant_role_permissions(
      g_scope::public.grant_scope_type,
      g_role::public.grant_role_type,
      g_target_type::public.entity_type
    );
    CONTINUE WHEN g_permissions IS NULL OR NOT (p_permission = ANY (g_permissions));

    -- Half 2: reach. Downward-or-equal from the grant's own target, plus the two NAMED exceptions below. Every hop denies when it finds no row; no branch treats a NULL comparison result as a match.
    IF g_scope = 'global' THEN
      -- Reaches everything that exists. The existence check is deliberate: an entity id that resolves to no project is not an object any grant reaches, and a global grant must not be the one branch that says otherwise because its lookup was skipped.
      CONTINUE WHEN p_scope = 'entity' AND private.entity_project_id(p_target_id) IS NULL;
      RETURN true;
    END IF;

    IF g_scope = 'account' THEN
      IF p_scope = 'account' AND p_target_id = g_target_id THEN RETURN true; END IF;
      IF p_scope = 'project' THEN
        SELECT account_id INTO v_account_id FROM public.projects WHERE id = p_target_id;
        IF v_account_id IS NOT NULL AND v_account_id = g_target_id THEN RETURN true; END IF;
      END IF;
      IF p_scope = 'entity' THEN
        v_project_id := private.entity_project_id(p_target_id);
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
        v_project_id := private.entity_project_id(p_target_id);
        IF v_project_id IS NOT NULL AND v_project_id = g_target_id THEN RETURN true; END IF;
      END IF;
      CONTINUE;
    END IF;

    -- g_scope = 'entity'. Reach is equality with the granted entity — which is what section 3.3's `own` means — plus the named branches below.
    IF p_scope = 'entity' AND p_target_id = g_target_id THEN RETURN true; END IF;

    -- NAMED BRANCH 1, the project-read branch. 162-IMPLEMENTATION-BRIEF.md section 3.4 row 2: "any auth user can always read their project". The permission is written in as a literal deliberately. A general "reach upward through the hierarchy" rule would also let an entity grantee ask entity.edit_answers at ACCOUNT scope and be told yes, because that verb is in the entity column — a fail-open with no caller today and a guaranteed one later.
    IF p_scope = 'project' AND p_permission = 'project.read_structure' THEN
      v_project_id := private.entity_project_id(g_target_id);
      IF v_project_id IS NOT NULL AND v_project_id = p_target_id THEN RETURN true; END IF;
    END IF;

    -- NAMED BRANCH 2, the child-nominee branch. 162-CHECKPOINT-DECISIONS.md section 3 item A-2, answered by the operator 2026-09-16: option (D) — is_child_nominee gates nomination.read, for ANY entity grant, and NOT entity.read_answers. 162-IMPLEMENTATION-BRIEF.md section 3.4's third row and 162-USER-RIGHTS.md's Nomination group both say the child hop grants the parent the child's nomination and BASIC data, never the child's answers — so section 3.3's entity.read_answers cells stay literally `own`, and reading the legend's "where noted" as pointing here rather than at an Entity-group cell is what the operator ratified. 162-08, 162-12 and 162-17 inherit this. Like branch 1, the permission is written in as a literal so the hop can never widen to another verb.
    IF p_scope = 'entity' AND p_permission = 'nomination.read'
       AND private.is_child_nominee(g_target_type::public.entity_type, g_target_id, p_target_id) THEN
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
-- THE ONE PREDICATE IN THIS PHASE THAT IS NOT A user_can CALL, and it is not one because it cannot be: user_can takes a PERMISSION and answers "may this role do this verb", and this rule asks about GRANT EXISTENCE. 162-IMPLEMENTATION-BRIEF.md section 3.2 enumerates no account-read member distinct from `account.edit_settings`, so 162-09 was written expecting the `accounts` SELECT and UPDATE to name the same literal -- reproducing on that one table the read/write collapse ROADMAP criterion 2 exists to end. The operator overruled that in 162-CHECKPOINT-DECISIONS.md section 1, the NOTE under S-3, 2026-09-16, ruling verbatim:
--
--     account read = any role on account or its projects
--
-- The enum is NOT widened -- S-3(A) stands, there is no 24th member -- because grant existence is answerable over the claim without one. And `accounts` is therefore NOT exempt from the criterion-2 rule: its read names a grant and its write names `account.edit_settings`, which are different things. 162-17's C-11 collapse allow-list loses `accounts` as a known-legitimate member.
--
-- THIRD POPULATION CHANGE, sanctioned by the operator on 2026-09-17 after the executor halted on it. The second disjunct -- "or its projects" -- means a PROJECT ADMIN now reads the row of the account its project belongs to, which the account-admin role predicate this phase retired refused. It reddened `04-admin-crud.test.sql`'s `project_admin cannot SELECT accounts` assertion, which is how it was found; that assertion is now the positive, strictly stronger statement that such a caller sees EXACTLY its own account. The disclosure is bounded and is recorded here rather than left to be rediscovered: an `accounts` row is `id, name, created_at, updated_at`, so what widens is the account's NAME, to someone who already administers one of its projects.
--
-- SECURITY DEFINER because the project disjunct reads public.projects, which has row-level security enabled; an inline read would be filtered by the caller's own access to that table and would then answer a second question -- can you SEE the project -- on top of the one asked. search_path is pinned for the reason it is pinned on every other definer function here.
--
-- Claim fields are compared AS TEXT against the literals rather than cast, exactly as user_can does and for the same reason: a cast throws on an unexpected value, and an exception raised inside a policy predicate is a query-time error rather than a denial. `p.id::text = (g ->> 'target_id')` never casts the claim.
--
-- The global-scope admin is a disjunct here rather than a separate policy term, so the `accounts` SELECT stays a single call and the routing assertion can name its three exceptions rather than discover them.
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
-- project_nominations_locked: is this project's nomination editing locked? (162-12)
--
-- The `unless locked` half of section 3.3's `own, unless locked` cells. 162-04 task 2 Q3 ratified that ROW STATE is not a member of the permission matrix -- user_can answers "may this role do this verb to this object", never "is this object currently in a state that admits the verb" -- so the lock is a CONJUNCT of the policies that call this, and this function is where the hop lives.
--
-- ⚠ IT DENIES BY RETURNING **LOCKED** WHEN THE PROJECT ROW IS NOT FOUND. The inversion is deliberate and is the reason this reads awkwardly: a helper that returned `false` for a missing project would UNLOCK every project that does not exist, which is the one direction a missing row must never take a permission surface. `project_open_for_voters` above denies by returning false because its sense is the other way up; both deny, and neither lets an absent row fabricate a permission.
--
-- SECURITY DEFINER for the reason every hop in this file is: it reads public.projects, which has row-level security enabled, and an inline read would be filtered by the caller's own access to that table and would then answer a SECOND question -- can you see the project -- on top of the one asked. 162-08 measured the inline form returning zero rows for every anon caller.
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
-- nomination_exists_in_contest: is this entity ALREADY nominated at this contest? (162-12, section 11.5 guard 3)
--
-- ⚠ IT IS NOT THE UNIQUENESS CONSTRAINT, AND THE DIFFERENCE IS NOT A DETAIL. `nominations_entity_parent_contest_key` includes `parent_nomination_id`, so an organization already nominated UNDER AN ALLIANCE does NOT collide with a candidate-created parent carrying a null parent of its own. This asks the broader question -- is there ANY nomination of this entity at this election, constituency and round -- which is what guard 3 actually says. 23-nominations-write.test.sql's G3-race pair is what shows the two are different predicates; without it this guard would look redundant and a later reader would remove it.
--
-- The constraint is still the thing that decides a RACE (section 11.7): two candidates of one party submitting at the same moment both see no parent here and both proceed, and the database rejects the second. This helper is the fast path and the better error, not the guarantee.
--
-- Takes the entity type as an ARGUMENT rather than naming one (D-21), and matches the entity id against the four foreign keys in the same idiom `is_child_nominee` uses. Denies -- returns false -- when no row is found, so the ABSENCE of a row can never fabricate an occupant; the policy that consumes it inverts the answer, which is exactly why the deny direction has to be false here.
--
-- `election_round` is compared with IS NOT DISTINCT FROM: the column is nullable (`DEFAULT 1` with no NOT NULL), and `=` against a NULL round would silently answer "no occupant" for every such row.
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
-- caller_nominated_in_contest: does the caller hold a named permission on an entity nominated here? (162-12, section 11.5 guard 5)
--
-- Guard 5 AND the permission check in ONE expression, which is the shape worth stating plainly: it asks
-- *is there a nomination at this contest whose entity I hold this permission on*. The permission is an ARGUMENT and the answer comes from `user_can`, so no cell of the section 3.3 matrix is written down a second time -- the matrix still lives in exactly one function body.
--
-- ⚠ THIS IS GUARD 5'S SECOND CLAUSE ONLY, RATIFIED AT 162-12 TASK 2 Q3, AND THE OMISSION IS A RULING RATHER THAN A GAP. Section 11.5 states the guard as "is inserting their own child nomination in the same transaction, OR already has one at that contest". A row-level WITH CHECK sees only the row being inserted, so the same-transaction clause is not expressible in a policy AT ALL -- and insertion order makes it moot in the direction that matters, because the candidate needs the parent's id before they can point at it. The flow that follows is legal today, since `validate_nomination` already admits a candidate nomination with no parent: own nomination with no parent -> the parent -> repoint. SECTION 6.2's INTERFACE INHERITS THIS.
--
-- Denies -- returns false -- when no row is found.
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
            p_permission
          )
  );
$$;

--------------------------------------------------------------------------------
-- caller_unconfirmed_originated_count: how many unconfirmed parent nominations has this caller originated? (162-12, section 8.9)
--
-- The subject of the cap. It counts rows this caller ORIGINATED -- `created_by = auth.uid()` -- that are organization nominations and still unconfirmed, which is exactly the population section 8.9 asks to bound: placeholder parents a candidate created and an admin has not yet resolved. A confirmed row leaves the count, so the cap bounds the QUEUE rather than a lifetime total, which is the queue-noise surface section 8.9 is actually worried about.
--
-- Returns 0 rather than NULL when there is nothing to count -- `count(*)` already does, and it matters: a NULL would make the policy's `< cap` comparison NULL, which a policy reads as a deny it did not intend to express and which would silently bar every caller rather than only the ones at the cap.
--
-- An anon caller, or any caller with no token, has `auth.uid() IS NULL` and counts the rows whose originator is NULL -- every seeded and every owner-inserted row. That is harmless because the ONLY consumer is a policy `TO authenticated`, and it is stated rather than left as a trap for a future caller.
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
