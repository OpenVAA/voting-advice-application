-- The grant model: `public.grants`, its constraints, its index, its RLS and the access-token hook's schema access.
--
-- Depends on:
-- - 100-tenancy.sql (accounts, projects)
-- - 000-enums.sql (grant_scope_type, grant_role_type, entity_type)
--------------------------------------------------------------------------------
-- grants table
--------------------------------------------------------------------------------
-- The grant map: one row per privilege held, keyed by user, scope, target and role.
CREATE TABLE public.grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  -- How wide the grant is: global, or one account, project or entity.
  scope grant_scope_type NOT NULL,
  -- The entity kind of an entity-scope grant, reusing the entity_type vocabulary; null on every other scope, as the CHECK below requires.
  target_type entity_type,
  -- No foreign key, because the target may be an account, a project or any of the four entity tables; cleanup_grants_on_delete removes a grant when its target is deleted.
  target_id uuid,
  -- `admin` or `editor` on the target; user_can maps the role and scope to permissions.
  role grant_role_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- NULLS NOT DISTINCT because target_type is null on every non-entity grant: a plain UNIQUE would admit two identical grants, and revoking one would leave the privilege standing. It needs PostgreSQL 15, as in 104-nominations.sql.
  CONSTRAINT grants_user_scope_target_role_key UNIQUE NULLS NOT DISTINCT (user_id, scope, target_type, target_id, role),
  -- The entity kind is present exactly when the scope is entity. Both sides are non-null booleans, so a NULL cannot pass the check. Named so a pgTAP `throws_ok` can match it.
  CONSTRAINT grants_entity_scope_target_type_check CHECK ((target_type IS NOT NULL) = (scope = 'entity')),
  -- A global grant has no target, and an account, project or entity grant must have one. Named for the same reason.
  CONSTRAINT grants_target_id_scope_check CHECK ((target_id IS NULL) = (scope = 'global'))
);

-- The reverse lookup, who holds a grant on this target, which editor administration needs and the UNIQUE cannot serve because it leads with user_id. No index on user_id alone: the UNIQUE leads with it, which covers the foreign key for lint-schema.mjs's unindexed-foreign-key advisor, and a second index would cost every write.
CREATE INDEX idx_grants_scope_target ON public.grants (scope, target_type, target_id);

--------------------------------------------------------------------------------
-- RLS on grants — critical to prevent circular RLS with the auth hook
--------------------------------------------------------------------------------
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;

-- The only statement in the schema that gives the access-token hook its schema access. Without it every token is issued with no authority, an outage that looks like a permission problem; 24-legacy-removal.test.sql asserts it with has_schema_privilege.
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- SELECT only: the hook only reads the grant map to build the claim, and its one policy here is a SELECT policy.
GRANT
SELECT
  ON TABLE public.grants TO supabase_auth_admin;

CREATE POLICY "auth_admin_read_grants" ON public.grants FOR
SELECT
  TO supabase_auth_admin USING (true);

-- Service role (Edge Functions) can manage grants
CREATE POLICY "service_role_manage_grants" ON public.grants FOR ALL TO service_role USING (true)
WITH
  CHECK (true);

-- Prevent regular users from accessing grants directly: a new table in the public schema is exposed through PostgREST by default, and these rows say who may do what to whom across every account and project in the instance.
REVOKE ALL ON TABLE public.grants
FROM
  authenticated,
  anon,
  public;

--------------------------------------------------------------------------------
-- cleanup_grants_on_delete: a grant does not outlive its target
--
-- `target_id` has no foreign key: it points into one of six tables depending on `scope` and `target_type`. Without these triggers a deleted target's grants would stay: they would still be projected into the holder's tokens, would be invisible to administration by target, and would attach to a recreated row that reused the id through an import. These AFTER DELETE triggers delete the grants naming the deleted row, on the six tables a grant can target.
--
-- The trigger arguments carry the scope and, for the entity scope, the target type, so one function serves all six tables and names none of them.
--
-- SECURITY DEFINER because the deleting caller -- a project admin removing a candidate through row-level security -- holds no privilege on public.grants at all (it is REVOKEd from every API role). search_path is pinned as on every definer function here. A project delete cascades to its entities first, so their grants go with them; the project's own grants go with the project row.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_grants_on_delete () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  IF TG_ARGV[0] = 'entity' THEN
    DELETE FROM public.grants g
    WHERE g.scope = 'entity'
      AND g.target_type = TG_ARGV[1]::public.entity_type
      AND g.target_id = OLD.id;
  ELSE
    DELETE FROM public.grants g
    WHERE g.scope = TG_ARGV[0]::public.grant_scope_type
      AND g.target_id = OLD.id;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER cleanup_grants_on_delete
AFTER DELETE ON public.accounts FOR EACH ROW
EXECUTE FUNCTION public.cleanup_grants_on_delete ('account');

CREATE TRIGGER cleanup_grants_on_delete
AFTER DELETE ON public.projects FOR EACH ROW
EXECUTE FUNCTION public.cleanup_grants_on_delete ('project');

CREATE TRIGGER cleanup_grants_on_delete
AFTER DELETE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.cleanup_grants_on_delete ('entity', 'candidate');

CREATE TRIGGER cleanup_grants_on_delete
AFTER DELETE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_grants_on_delete ('entity', 'organization');

CREATE TRIGGER cleanup_grants_on_delete
AFTER DELETE ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.cleanup_grants_on_delete ('entity', 'faction');

CREATE TRIGGER cleanup_grants_on_delete
AFTER DELETE ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.cleanup_grants_on_delete ('entity', 'alliance');
