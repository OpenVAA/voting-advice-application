-- Invitations: `public.invitations`, the code functions, the insert trigger, the table's privileges, its three policies and the cleanup triggers.
--
-- A row promises one grant to whoever proves control of its email address or presents its code. The promise is stated in the four columns of `public.grants`, so fulfilling it is one insert of those four values and nothing is derived. A row belongs to one project and is bound to exactly one of a normalised email address and the hash of a server-generated code.
--
-- Depends on:
-- - 000-enums.sql (grant_scope_type, grant_role_type, entity_type)
-- - 100-tenancy.sql (projects)
-- - 102-entities.sql (the four entity tables the cleanup triggers sit on)
-- - 301-auth-functions.sql (grant_role_permissions, user_can, private.entity_project_id)
-- - auth.users and auth.uid() (Supabase Auth)
--------------------------------------------------------------------------------
-- The invitation code: normalise, hash, generate
--
-- A code is twelve symbols of Crockford's base-32 alphabet, shown as `XXXX-XXXX-XXXX`: 60 bits. The alphabet has no `I`, `L`, `O` or `U`, and reading folds the look-alikes onto the digits it keeps, so a code copied from paper matches however it was typed.
--
-- Only the hash is stored. The three functions use the core `sha256` and `gen_random_uuid` and need no extension.
--------------------------------------------------------------------------------
-- Upper-cases, drops every character that is not a digit or a letter, then reads `O` as `0` and `I` and `L` as `1`. The hash, and so every comparison of a code, goes through this one function.
CREATE OR REPLACE FUNCTION private.normalise_invitation_code (p_code text) RETURNS text LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT translate(regexp_replace(upper(coalesce(p_code, '')), '[^0-9A-Z]', '', 'g'), 'OIL', '011');
$$;

-- The lower-case hex `sha256` of the normalised code's UTF-8 bytes: 64 characters, the only form of a code the table holds.
CREATE OR REPLACE FUNCTION private.invitation_code_hash (p_code text) RETURNS text LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT encode(sha256(convert_to(private.normalise_invitation_code(p_code), 'UTF8')), 'hex');
$$;

-- Each symbol is chosen by the low five bits of one byte of a random uuid. 256 is a multiple of 32, so the mask is unbiased. The bytes at offsets 6 and 8 carry the uuid's version and variant bits and are not used; the twelve offsets below are fully random.
CREATE OR REPLACE FUNCTION private.generate_invitation_code () RETURNS text LANGUAGE plpgsql VOLATILE
SET
  search_path = '' AS $$
DECLARE
  v_alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_offsets constant integer[] := ARRAY[0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14];
  v_bytes bytea := uuid_send(gen_random_uuid());
  v_offset integer;
  v_code text := '';
BEGIN
  FOREACH v_offset IN ARRAY v_offsets LOOP
    v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, v_offset) & 31) + 1, 1);
  END LOOP;
  RETURN substr(v_code, 1, 4) || '-' || substr(v_code, 5, 4) || '-' || substr(v_code, 9, 4);
END;
$$;

-- The insert trigger below is SECURITY INVOKER and calls these functions as the inserting role, so `authenticated` and `service_role` need EXECUTE. PostgREST cannot reach them, because `private` is not an exposed schema.
REVOKE
EXECUTE ON FUNCTION private.normalise_invitation_code (text),
private.invitation_code_hash (text),
private.generate_invitation_code ()
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.normalise_invitation_code (text),
private.invitation_code_hash (text),
private.generate_invitation_code () TO authenticated,
service_role;

--------------------------------------------------------------------------------
-- project_account_id: resolve a project to its account
--
-- Returns the account_id of the project, or NULL when no such project exists. NULL is a denial at its call sites, never a match.
--
-- SECURITY DEFINER because public.projects has row-level security enabled, and an inline read in a policy would also ask whether the caller can see the project. search_path is pinned as on every definer function here. `authenticated` keeps EXECUTE because the invitation policies, which evaluate as that role, call it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.project_account_id (p_project_id uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT p.account_id FROM public.projects p WHERE p.id = p_project_id;
$$;

REVOKE
EXECUTE ON FUNCTION private.project_account_id (uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.project_account_id (uuid) TO authenticated;

--------------------------------------------------------------------------------
-- invitations table
--------------------------------------------------------------------------------
-- An invitation is claimed when `claimed_at` is set, never when `claimed_by` is: both user columns go to null with their user, so deleting the claimant cannot reopen a claimed row.
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- The promised grant, in the four columns of public.grants and with their types.
  scope public.grant_scope_type NOT NULL,
  target_type public.entity_type,
  -- No foreign key, as on public.grants: the target is a project or a row of one of the four entity tables. cleanup_invitations_on_delete removes an invitation when its entity is deleted, and a project-scope row goes with its project through project_id.
  target_id uuid,
  role public.grant_role_type NOT NULL,
  -- The invited address, trimmed and lower-cased by the insert trigger. Null on a code row.
  email text,
  -- The hash of the row's code, set by the insert trigger. Null on an email row. No API role can select or insert it.
  code_hash text,
  -- On a code row, the address whose control must be proven before the code's promise is fulfilled, and when it was bound.
  pending_email text,
  pending_email_at timestamptz,
  -- Null means the invitation does not expire.
  expires_at timestamptz,
  created_by uuid DEFAULT auth.uid () REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  claimed_at timestamptz,
  -- The two shape rules of public.grants, under this table's names.
  CONSTRAINT invitations_entity_scope_target_type_check CHECK ((target_type IS NOT NULL) = (scope = 'entity')),
  CONSTRAINT invitations_target_id_scope_check CHECK ((target_id IS NULL) = (scope = 'global')),
  -- An invitation belongs to a project, and no project owns an account or the instance. A CHECK and not a policy, so it binds the service role too.
  CONSTRAINT invitations_scope_check CHECK (scope IN ('project', 'entity')),
  -- A project-scope promise names its own project.
  CONSTRAINT invitations_project_target_check CHECK (
    scope <> 'project'
    OR target_id = project_id
  ),
  -- A promise of a grant that confers nothing, such as an entity-scope admin, is refused for every role. Evaluated when the row is written.
  CONSTRAINT invitations_role_confers_check CHECK (
    cardinality(
      public.grant_role_permissions (scope, role, target_type)
    ) > 0
  ),
  -- Exactly one of an address and a code.
  CONSTRAINT invitations_binding_check CHECK (num_nonnulls (email, code_hash) = 1),
  CONSTRAINT invitations_email_normalised_check CHECK (
    email = lower(btrim(email))
    AND email <> ''
  ),
  CONSTRAINT invitations_code_hash_format_check CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  -- A pending address exists only on a code row, in the same normal form as `email`.
  CONSTRAINT invitations_pending_email_check CHECK (
    pending_email IS NULL
    OR (
      code_hash IS NOT NULL
      AND pending_email = lower(btrim(pending_email))
      AND pending_email <> ''
    )
  ),
  CONSTRAINT invitations_claimed_by_needs_claimed_at_check CHECK (
    claimed_by IS NULL
    OR claimed_at IS NOT NULL
  )
);

-- One address is promised one target once while that promise is open, whatever the role. A claimed row, the row of a claimant since deleted included, does not stop a new invitation for its address and target, so a project editor is promoted by inviting the same address as a project admin. A code's index below covers every row, claimed or not, because a used code is never issued again. NULLS NOT DISTINCT because target_type is null on a project-scope row, where a plain unique index would admit the duplicate.
CREATE UNIQUE INDEX invitations_email_target_key ON public.invitations (project_id, email, scope, target_type, target_id) NULLS NOT DISTINCT
WHERE
  email IS NOT NULL
  AND claimed_at IS NULL;

-- A code is looked up without a target, so within a project it names one row.
CREATE UNIQUE INDEX invitations_code_hash_key ON public.invitations (project_id, code_hash)
WHERE
  code_hash IS NOT NULL;

CREATE INDEX idx_invitations_project_id ON public.invitations (project_id);

-- The lookup by target, which cleanup_invitations_on_delete uses.
CREATE INDEX idx_invitations_scope_target ON public.invitations (scope, target_type, target_id);

CREATE INDEX idx_invitations_created_by ON public.invitations (created_by);

CREATE INDEX idx_invitations_claimed_by ON public.invitations (claimed_by);

CREATE INDEX idx_invitations_pending_email ON public.invitations (project_id, pending_email)
WHERE
  pending_email IS NOT NULL;

--------------------------------------------------------------------------------
-- prepare_invitation: the server-side columns of a new row
--
-- Stores the address trimmed and lower-cased, an empty one as null. A row that arrives with neither an address nor a code hash gets a generated code: its hash goes into `code_hash`, and the code itself into the transaction-local setting `openvaa.generated_invitation_code`, which create_invitations reads back. Every other insert sets that setting to the empty string, so it never holds the code of an earlier row.
--
-- The function never reads a code from the caller. An API caller holds no INSERT privilege on `code_hash` (see the privileges below), and a trigger may set a column its caller cannot, so the only code hash such a caller can cause is one generated here. A direct insert through the API ends its transaction with the request, so it has no later statement in which to read the setting: its code is known to nobody.
--
-- SECURITY INVOKER: it reads no table, and it needs nothing its caller lacks.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prepare_invitation () RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  v_code text;
BEGIN
  NEW.email := NULLIF(lower(btrim(NEW.email)), '');
  IF NEW.email IS NULL AND NEW.code_hash IS NULL THEN
    v_code := private.generate_invitation_code();
    NEW.code_hash := private.invitation_code_hash(v_code);
    PERFORM set_config('openvaa.generated_invitation_code', v_code, true);
  ELSE
    PERFORM set_config('openvaa.generated_invitation_code', '', true);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prepare_invitation
BEFORE INSERT ON public.invitations FOR EACH ROW
EXECUTE FUNCTION public.prepare_invitation ();

--------------------------------------------------------------------------------
-- Privileges on invitations
--
-- Approach: REVOKE every table-level privilege, then GRANT column by column.
-- (A new table in the public schema is granted ALL to anon and authenticated by default, and a column-level grant restricts nothing while the table-level privilege exists.)
--
-- `authenticated` may select every column except `code_hash`, `pending_email` and `pending_email_at`, so `SELECT *` is refused and a query names its columns. It may insert the promise, the address and the expiry and nothing else: an insert that names `code_hash`, `pending_email`, `created_by`, `claimed_by` or `claimed_at` is refused for lack of privilege before any policy is consulted. It may delete. It holds no UPDATE: a row's promise, address and code cannot be changed after the insert, and an invitation is changed by deleting an unclaimed one and creating another. `anon` holds nothing.
--------------------------------------------------------------------------------
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.invitations
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
SELECT
  (
    id,
    project_id,
    scope,
    target_type,
    target_id,
    role,
    email,
    expires_at,
    created_by,
    created_at,
    claimed_by,
    claimed_at
  ) ON TABLE public.invitations TO authenticated;

GRANT INSERT (
  project_id,
  scope,
  target_type,
  target_id,
  role,
  email,
  expires_at
) ON TABLE public.invitations TO authenticated;

GRANT DELETE ON TABLE public.invitations TO authenticated;

--------------------------------------------------------------------------------
-- RLS on invitations: who may promise which grant
--
-- The expression of these three policies is the authority map. A promise of an entity editor's grant needs `project.edit_entities` on the row's project and an entity of that project; a promise of a project editor's grant needs `project.manage_editors` on the project; a promise of a project admin's grant needs `account.manage_admins` on the project's account. Any other shape matches no arm and is refused. A caller therefore cannot promise the level they hold themselves: a project editor cannot promise a project editor's or a project admin's grant, and a project admin cannot promise a project admin's.
--
-- The map is written inline, in one policy per command, because the schema linter (lint-schema.mjs, check 9001) and the enforcement census (25-matrix-conformance.test.sql) read the permission literals out of the policy text. A helper that held the map would hide them from both.
--
-- The map is the INSERT policy's WITH CHECK, so a direct insert into the table meets the same refusals as create_invitations. Reading asks the same map with `project.read_entities` in the entity arm: a caller reads the promises they could make, entity editors and `anon` read none, and the table holds invitees' addresses. Deleting asks the insert map of an unclaimed row; a claimed row is kept. There is no UPDATE policy.
--
-- The service role bypasses these policies. The three CHECK constraints on scope, project target and conferred permissions are what bind it.
--------------------------------------------------------------------------------
CREATE POLICY "admin_select_invitations" ON public.invitations FOR
SELECT
  TO authenticated USING (
    (
      scope = 'entity'
      AND role = 'editor'
      AND (
        SELECT
          private.entity_project_id (target_type, target_id)
      ) = project_id
      AND (
        SELECT
          user_can ('project', project_id, 'project.read_entities')
      )
    )
    OR (
      scope = 'project'
      AND role = 'editor'
      AND target_id = project_id
      AND (
        SELECT
          user_can ('project', project_id, 'project.manage_editors')
      )
    )
    OR (
      scope = 'project'
      AND role = 'admin'
      AND target_id = project_id
      AND (
        SELECT
          user_can (
            'account',
            private.project_account_id (project_id),
            'account.manage_admins'
          )
      )
    )
  );

CREATE POLICY "admin_insert_invitations" ON public.invitations FOR INSERT TO authenticated
WITH
  CHECK (
    (
      scope = 'entity'
      AND role = 'editor'
      AND (
        SELECT
          private.entity_project_id (target_type, target_id)
      ) = project_id
      AND (
        SELECT
          user_can ('project', project_id, 'project.edit_entities')
      )
    )
    OR (
      scope = 'project'
      AND role = 'editor'
      AND target_id = project_id
      AND (
        SELECT
          user_can ('project', project_id, 'project.manage_editors')
      )
    )
    OR (
      scope = 'project'
      AND role = 'admin'
      AND target_id = project_id
      AND (
        SELECT
          user_can (
            'account',
            private.project_account_id (project_id),
            'account.manage_admins'
          )
      )
    )
  );

CREATE POLICY "admin_delete_invitations" ON public.invitations FOR DELETE TO authenticated USING (
  claimed_at IS NULL
  AND (
    (
      scope = 'entity'
      AND role = 'editor'
      AND (
        SELECT
          private.entity_project_id (target_type, target_id)
      ) = project_id
      AND (
        SELECT
          user_can ('project', project_id, 'project.edit_entities')
      )
    )
    OR (
      scope = 'project'
      AND role = 'editor'
      AND target_id = project_id
      AND (
        SELECT
          user_can ('project', project_id, 'project.manage_editors')
      )
    )
    OR (
      scope = 'project'
      AND role = 'admin'
      AND target_id = project_id
      AND (
        SELECT
          user_can (
            'account',
            private.project_account_id (project_id),
            'account.manage_admins'
          )
      )
    )
  )
);

--------------------------------------------------------------------------------
-- cleanup_invitations_on_delete: an invitation does not outlive its entity
--
-- `target_id` has no foreign key. Without these triggers an invitation would survive its entity and attach to a row that reused the id, for instance through an import. These AFTER DELETE triggers delete the invitations naming the deleted row, claimed ones included, on the four entity tables. The trigger argument carries the entity type, so one function serves all four tables and names none of them.
--
-- SECURITY DEFINER because the deleting caller may not hold the authority the invitation's DELETE policy asks, and that policy keeps claimed rows. search_path is pinned as on every definer function here. A project delete removes the project's invitations through the foreign key on `project_id`.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_invitations_on_delete () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  DELETE FROM public.invitations i
  WHERE i.scope = 'entity'
    AND i.target_type = TG_ARGV[0]::public.entity_type
    AND i.target_id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER cleanup_invitations_on_delete
AFTER DELETE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.cleanup_invitations_on_delete ('candidate');

CREATE TRIGGER cleanup_invitations_on_delete
AFTER DELETE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_invitations_on_delete ('organization');

CREATE TRIGGER cleanup_invitations_on_delete
AFTER DELETE ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.cleanup_invitations_on_delete ('faction');

CREATE TRIGGER cleanup_invitations_on_delete
AFTER DELETE ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.cleanup_invitations_on_delete ('alliance');

-- Neither trigger function is an RPC. A trigger fires whatever EXECUTE its function carries, so nothing is lost by revoking it from the API roles.
REVOKE
EXECUTE ON FUNCTION public.prepare_invitation (),
public.cleanup_invitations_on_delete ()
FROM
  PUBLIC,
  anon,
  authenticated;
