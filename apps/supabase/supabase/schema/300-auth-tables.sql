-- The grant model: `public.grants`, its constraints, its index, its RLS and the access-token hook's schema access.
--
-- ⚠ THE FILENAME IS OLDER THAN THE SUBJECT. This file was "auth tables" in the plural sense: it once declared `user_roles` and, by ALTER, the per-row publication column on ten voter-facing content tables. 162-15 deleted the role table and both its enums; 162-16 deleted the publication columns and their five partial indexes, because section 3.4's rule -- project open for voters, nomination confirmed, every entity that nomination links confirmed -- is now the ONLY way to ask whether a row is public, and a second mechanism answering the same question is what ROADMAP criterion 2 exists to end. What is left is ONE concern, and it is the central one of phase 162: `public.grants` is declared here and nowhere else in `apps/supabase/supabase/schema/`. The file was deliberately KEPT rather than deleted for exactly that reason (D-38); it is not an empty shell, and renaming it is a separate change with its own diff.
--
-- Depends on: 100-tenancy.sql (accounts, projects)
--             000-enums.sql (grant_scope_type, grant_role_type, entity_type)
--------------------------------------------------------------------------------
-- grants table
--------------------------------------------------------------------------------
-- The grant map of 162-IMPLEMENTATION-BRIEF.md section 3.1: one row per privilege held, keyed by user, scope, target and role. Every column, constraint and index is declared inside this CREATE TABLE body per D-14a rather than accreted by ALTER, and the table ships empty because 162-06 carries the data migration.
CREATE TABLE public.grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  scope grant_scope_type NOT NULL,
  -- D-05's discriminator reuses the existing entity_type vocabulary rather than declaring a fifth parallel one; it is NULL on every non-entity row, and the CHECK below is what makes it honest rather than advisory.
  target_type entity_type,
  -- Deliberately no FOREIGN KEY: target_id is polymorphic across accounts, projects and the four entity tables by section 3.1's design, so a FK to any one of them would make the other three unrepresentable.
  target_id uuid,
  role grant_role_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- NULLS NOT DISTINCT is load-bearing rather than a style choice: measured on this tree's PostgreSQL 15.8, a plain UNIQUE admits two byte-identical project-scope grants because target_type is NULL on every non-entity row, so deleting one row to revoke a privilege would leave the privilege standing; it is a PostgreSQL 15 feature and config.toml pins major_version = 15, so this constraint pins the version floor with no margin.
  CONSTRAINT grants_user_scope_target_role_key UNIQUE NULLS NOT DISTINCT (user_id, scope, target_type, target_id, role),
  -- D-05: the discriminator is present exactly when the scope is entity. Both sides are non-null booleans, so the constraint is a total function with no NULL-passes hole. Named explicitly rather than left to PostgreSQL's generated name because 162-17 cites it by name in throws_ok, as 104-nominations.sql does for nominations_election_round_check.
  CONSTRAINT grants_entity_scope_target_type_check CHECK ((target_type IS NOT NULL) = (scope = 'entity')),
  -- Section 3.1's target_id column stated as a constraint: a global grant has no target and an account, project or entity grant must have one, so every row of the eight-row user-type mapping is representable and nothing outside it is. Named for the same throws_ok reason as the constraint above.
  CONSTRAINT grants_target_id_scope_check CHECK ((target_id IS NULL) = (scope = 'global'))
);

-- The reverse lookup "who holds a grant on this target", which project.manage_editors administration and 162-06's data migration both need and which the UNIQUE cannot serve because it leads with user_id. There is deliberately no index on user_id alone: the UNIQUE already leads with it and lint-schema.mjs's 0001 advisor matches foreign keys against an index's leading columns, so the FK is covered and a second index would cost every write and buy no read.
CREATE INDEX idx_grants_scope_target ON public.grants (scope, target_type, target_id);

--------------------------------------------------------------------------------
-- RLS on grants — critical to prevent circular RLS with the auth hook
--------------------------------------------------------------------------------
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;

-- THE ONLY STATEMENT IN THE SCHEMA THAT GIVES THE ACCESS-TOKEN HOOK ITS SCHEMA ACCESS. 162-03 issued it here as a deliberate repetition of one that lived beside a table 162-15 has now deleted; recorded there as threat T-162-03-05, on the reasoning that re-granting an existing privilege is a no-op then and the surviving statement now. It is now the surviving statement. Removing it issues every token with no authority at all -- a silent total outage that presents as a permission problem, and that no test would catch through a policy. 24-legacy-removal.test.sql asserts it from has_schema_privilege on the applied database.
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- SELECT and nothing more (162-REVIEW IN-01): the hook only READS the grant map to build the claim, and its only policy here is a SELECT policy, so INSERT, UPDATE and DELETE were privilege the auth server never needed.
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
-- cleanup_grants_on_delete: a grant does not outlive its target (162-REVIEW IN-02)
--
-- `target_id` carries no foreign key -- it points into one of six tables depending on `scope` and `target_type` -- so nothing removed a grant when its target row was deleted. The stale row kept being projected into every token the holder was issued, was invisible to "who holds a grant on this target" administration because the target was gone, and would silently RE-ATTACH to a recreated row that reused the id through an import. These AFTER DELETE triggers delete the grants naming the deleted row, on the six tables a grant can target.
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
