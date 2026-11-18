--------------------------------------------------------------------------------
-- Row-level security reads the grant table: user_can and user_has_account_grant answer from the caller's rows of public.grants
--
-- WHAT IT CHANGES. The two functions every row-level-security authority decision reaches read the caller's rows of public.grants, keyed on (SELECT auth.uid()), and no longer the token's `grants` claim. A grant counts from the moment it is written, and a deleted grant is denied at once, for a read and for a write made with the same token.
--
-- WHAT IT LEAVES. Every policy, every other function, the privileges of both functions and every index: the unique key `grants_user_scope_target_role_key` leads with `user_id` and serves the lookup. custom_access_token_hook still writes the claim, which the frontend's app-entry gates read.
--------------------------------------------------------------------------------

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
