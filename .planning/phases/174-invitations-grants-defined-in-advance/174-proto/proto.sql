-- Phase 174 prototype. Applied ONLY to the private throwaway database (port 55432).
-- Names are provisional; the planner owns them.

--------------------------------------------------------------------------------
-- Code normalisation, hashing and generation (no extension: sha256() and gen_random_uuid() are core)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.normalise_invitation_code (p_code text) RETURNS text LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  -- Upper-case, drop everything that is not a letter or digit, fold the look-alikes onto the digit the alphabet keeps.
  SELECT translate(regexp_replace(upper(coalesce(p_code, '')), '[^0-9A-Z]', '', 'g'), 'OIL', '011');
$$;

CREATE OR REPLACE FUNCTION private.invitation_code_hash (p_code text) RETURNS text LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT encode(sha256(convert_to(private.normalise_invitation_code(p_code), 'UTF8')), 'hex');
$$;

-- 12 symbols of the 32-symbol Crockford alphabet = 60 bits. Each symbol takes the low five bits of one byte of a v4 uuid;
-- bytes 6 and 8 carry the version and variant bits and are not used. 256 is a multiple of 32, so the mask is unbiased.
CREATE OR REPLACE FUNCTION private.generate_invitation_code () RETURNS text LANGUAGE plpgsql VOLATILE
SET
  search_path = '' AS $$
DECLARE
  v_alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_bytes bytea := uuid_send(gen_random_uuid());
  v_positions constant int[] := ARRAY[0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14];
  v_code text := '';
  v_pos int;
BEGIN
  FOREACH v_pos IN ARRAY v_positions LOOP
    v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, v_pos) & 31) + 1, 1);
  END LOOP;
  RETURN v_code;
END;
$$;

--------------------------------------------------------------------------------
-- The table
--------------------------------------------------------------------------------
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  scope public.grant_scope_type NOT NULL,
  target_type public.entity_type,
  target_id uuid,
  role public.grant_role_type NOT NULL,
  email text,
  code_hash text,
  pending_email text,
  pending_email_at timestamptz,
  expires_at timestamptz,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  claimed_at timestamptz,
  CONSTRAINT invitations_entity_scope_target_type_check CHECK ((target_type IS NOT NULL) = (scope = 'entity')),
  CONSTRAINT invitations_target_id_scope_check CHECK ((target_id IS NULL) = (scope = 'global')),
  -- An invitation is project-scoped: an account or the instance is nothing a project owns.
  CONSTRAINT invitations_scope_check CHECK (scope IN ('project', 'entity')),
  -- A project-scope promise names its own project.
  CONSTRAINT invitations_project_target_check CHECK (scope <> 'project' OR target_id = project_id),
  -- A promise of a grant that confers nothing is refused for every caller, the service role included.
  CONSTRAINT invitations_role_confers_check CHECK (
    cardinality(public.grant_role_permissions (scope, role, target_type)) > 0
  ),
  CONSTRAINT invitations_binding_check CHECK (num_nonnulls(email, code_hash) = 1),
  CONSTRAINT invitations_email_normalised_check CHECK (email = lower(btrim(email)) AND email <> ''),
  CONSTRAINT invitations_code_hash_format_check CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT invitations_pending_email_check CHECK (
    pending_email IS NULL
    OR (code_hash IS NOT NULL AND pending_email = lower(btrim(pending_email)) AND pending_email <> '')
  ),
  CONSTRAINT invitations_claimed_by_needs_claimed_at_check CHECK (claimed_by IS NULL OR claimed_at IS NOT NULL)
);

-- INV-02, email: one address is promised one target once, whatever the role. NULLS NOT DISTINCT because target_type is null on a project-scope row.
CREATE UNIQUE INDEX invitations_email_target_key ON public.invitations (project_id, email, scope, target_type, target_id) NULLS NOT DISTINCT
WHERE
  email IS NOT NULL;

-- INV-02, code: a code is looked up without a target, so it names one row of the project.
CREATE UNIQUE INDEX invitations_code_hash_key ON public.invitations (project_id, code_hash)
WHERE
  code_hash IS NOT NULL;

CREATE INDEX idx_invitations_project_id ON public.invitations (project_id);
CREATE INDEX idx_invitations_scope_target ON public.invitations (scope, target_type, target_id);
CREATE INDEX idx_invitations_created_by ON public.invitations (created_by);
CREATE INDEX idx_invitations_claimed_by ON public.invitations (claimed_by);
CREATE INDEX idx_invitations_pending_email ON public.invitations (project_id, pending_email)
WHERE
  pending_email IS NOT NULL;

--------------------------------------------------------------------------------
-- The authority map (D-09 / J3), one function, asked by the INSERT, SELECT and DELETE policies
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.caller_may_promise (
  p_project_id uuid,
  p_scope public.grant_scope_type,
  p_target_type public.entity_type,
  p_target_id uuid,
  p_role public.grant_role_type
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    CASE
      WHEN p_scope = 'entity' AND p_role = 'editor' THEN
        private.entity_project_id(p_target_type, p_target_id) = p_project_id
        AND public.user_can('project', p_project_id, 'project.edit_entities')
      WHEN p_scope = 'project' AND p_role = 'editor' THEN
        p_target_id = p_project_id
        AND public.user_can('project', p_project_id, 'project.manage_editors')
      WHEN p_scope = 'project' AND p_role = 'admin' THEN
        p_target_id = p_project_id
        AND public.user_can(
          'account',
          (SELECT p.account_id FROM public.projects p WHERE p.id = p_project_id),
          'account.manage_admins'
        )
      ELSE false
    END,
    false
  );
$$;

--------------------------------------------------------------------------------
-- BEFORE INSERT: server-side columns. A trigger may set columns the caller holds no INSERT privilege on.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prepare_invitation () RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  v_code text;
BEGIN
  IF current_user = 'authenticated' THEN
    -- Nothing an API caller sends reaches these columns; the column grants refuse them first, this is the second line.
    NEW.created_by := (SELECT auth.uid());
    NEW.created_at := now();
    NEW.claimed_by := NULL;
    NEW.claimed_at := NULL;
    NEW.pending_email := NULL;
    NEW.pending_email_at := NULL;
    NEW.code_hash := NULL;
  END IF;
  IF NEW.email IS NULL AND NEW.code_hash IS NULL THEN
    v_code := private.generate_invitation_code();
    NEW.code_hash := private.invitation_code_hash(v_code);
    -- Handed to create_invitations inside this transaction only; a direct insert ends its transaction with the request.
    PERFORM set_config('openvaa.invitation_code', v_code, true);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prepare_invitation
BEFORE INSERT ON public.invitations FOR EACH ROW
EXECUTE FUNCTION public.prepare_invitation ();

--------------------------------------------------------------------------------
-- RLS and privileges
--------------------------------------------------------------------------------
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.invitations
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
SELECT
  (id, project_id, scope, target_type, target_id, role, email, expires_at, created_by, created_at, claimed_by, claimed_at) ON public.invitations TO authenticated;

GRANT INSERT (project_id, scope, target_type, target_id, role, email, expires_at) ON public.invitations TO authenticated;

GRANT DELETE ON public.invitations TO authenticated;

CREATE POLICY "admin_select_invitations" ON public.invitations FOR
SELECT
  TO authenticated USING (
    (
      SELECT
        private.caller_may_promise (project_id, scope, target_type, target_id, role)
    )
  );

CREATE POLICY "admin_insert_invitations" ON public.invitations FOR INSERT TO authenticated
WITH
  CHECK (
    (
      SELECT
        private.caller_may_promise (project_id, scope, target_type, target_id, role)
    )
  );

CREATE POLICY "admin_delete_invitations" ON public.invitations FOR DELETE TO authenticated USING (
  claimed_at IS NULL
  AND (
    SELECT
      private.caller_may_promise (project_id, scope, target_type, target_id, role)
  )
);

--------------------------------------------------------------------------------
-- An invitation does not outlive its target
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_invitations_on_delete () RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
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

--------------------------------------------------------------------------------
-- create_invitations: SECURITY INVOKER over the policies above; one transaction
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_invitations (p_project_id uuid, p_invitations jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  v_item jsonb;
  v_scope public.grant_scope_type;
  v_role public.grant_role_type;
  v_target_type public.entity_type;
  v_target_id uuid;
  v_email text;
  v_id uuid;
  v_code text;
  v_out jsonb := '[]'::jsonb;
BEGIN
  IF p_invitations IS NULL OR jsonb_typeof(p_invitations) <> 'array' THEN
    RAISE EXCEPTION 'p_invitations must be a JSON array' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_invitations)
  LOOP
    v_scope := COALESCE(v_item ->> 'scope', 'entity')::public.grant_scope_type;
    v_role := COALESCE(v_item ->> 'role', 'editor')::public.grant_role_type;
    v_target_type := (v_item ->> 'target_type')::public.entity_type;
    v_target_id := (v_item ->> 'target_id')::uuid;
    v_email := NULLIF(lower(btrim(v_item ->> 'email')), '');

    IF v_scope = 'project' THEN
      v_target_id := COALESCE(v_target_id, p_project_id);
    ELSIF v_scope = 'entity' AND v_target_id IS NULL AND v_item ? 'external_id' THEN
      -- Resolved under the caller's own row-level security, inside the named project only.
      v_target_id := CASE v_target_type
        WHEN 'candidate' THEN (SELECT e.id FROM public.candidates e WHERE e.project_id = p_project_id AND e.external_id = v_item ->> 'external_id')
        WHEN 'organization' THEN (SELECT e.id FROM public.organizations e WHERE e.project_id = p_project_id AND e.external_id = v_item ->> 'external_id')
        WHEN 'faction' THEN (SELECT e.id FROM public.factions e WHERE e.project_id = p_project_id AND e.external_id = v_item ->> 'external_id')
        WHEN 'alliance' THEN (SELECT e.id FROM public.alliances e WHERE e.project_id = p_project_id AND e.external_id = v_item ->> 'external_id')
      END;
      IF v_target_id IS NULL THEN
        RAISE EXCEPTION 'Invitation target not found: % with external_id %', v_target_type, v_item ->> 'external_id'
          USING ERRCODE = 'no_data_found';
      END IF;
    END IF;

    PERFORM set_config('openvaa.invitation_code', '', true);
    INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email, expires_at)
    VALUES (p_project_id, v_scope, v_target_type, v_target_id, v_role, v_email, (v_item ->> 'expires_at')::timestamptz)
    RETURNING id INTO v_id;
    v_code := NULLIF(current_setting('openvaa.invitation_code', true), '');
    PERFORM set_config('openvaa.invitation_code', '', true);

    -- INV-05: inviting vouches for a named entity. The UPDATE runs as the caller, so enforce_entity_immutability asks entity.confirm.
    IF v_scope = 'entity' THEN
      CASE v_target_type
        WHEN 'candidate' THEN
          UPDATE public.candidates e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed
            AND btrim(e.first_name) <> '' AND btrim(e.last_name) <> '';
        WHEN 'organization' THEN
          UPDATE public.organizations e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed AND private.localized_has_text(e.name);
        WHEN 'faction' THEN
          UPDATE public.factions e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed AND private.localized_has_text(e.name);
        WHEN 'alliance' THEN
          UPDATE public.alliances e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed AND private.localized_has_text(e.name);
      END CASE;
    END IF;

    v_out := v_out || jsonb_build_object(
      'id', v_id,
      'scope', v_scope,
      'target_type', v_target_type,
      'target_id', v_target_id,
      'role', v_role,
      'email', v_email,
      'code', CASE WHEN v_code IS NULL THEN NULL
                   ELSE substr(v_code, 1, 4) || '-' || substr(v_code, 5, 4) || '-' || substr(v_code, 9, 4) END
    );
  END LOOP;

  RETURN v_out;
END;
$$;

CREATE OR REPLACE FUNCTION private.localized_has_text (p_val jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT jsonb_typeof(p_val) = 'object'
    AND EXISTS (SELECT 1 FROM jsonb_each_text(p_val) AS t WHERE btrim(t.value) <> '');
$$;

REVOKE
EXECUTE ON FUNCTION public.create_invitations (uuid, jsonb)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.create_invitations (uuid, jsonb) TO authenticated,
service_role;

--------------------------------------------------------------------------------
-- claim_invitations: the caller's own confirmed address, read from auth.users
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_invitations (p_project_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_email text;
  v_row public.invitations%ROWTYPE;
  v_spec jsonb;
  v_constraint text;
  v_claimed jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
BEGIN
  IF v_uid IS NOT NULL THEN
    SELECT lower(btrim(u.email)) INTO v_email
    FROM auth.users u
    WHERE u.id = v_uid
      AND u.email_confirmed_at IS NOT NULL
      AND NULLIF(btrim(u.email), '') IS NOT NULL;
  END IF;
  IF v_email IS NULL OR p_project_id IS NULL THEN
    RETURN jsonb_build_object('claimed', v_claimed, 'skipped', v_skipped);
  END IF;

  FOR v_row IN
    SELECT i.*
    FROM public.invitations i
    WHERE i.project_id = p_project_id
      AND i.claimed_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND (i.email = v_email OR (i.code_hash IS NOT NULL AND i.pending_email = v_email))
    ORDER BY i.created_at, i.id
    FOR UPDATE
  LOOP
    v_spec := jsonb_build_object('scope', v_row.scope, 'target_type', v_row.target_type, 'target_id', v_row.target_id, 'role', v_row.role);

    -- No foreign key holds the target: re-ask, at claim time, that it is still an entity of this project.
    IF v_row.scope = 'entity'
       AND private.entity_project_id(v_row.target_type, v_row.target_id) IS DISTINCT FROM v_row.project_id THEN
      v_skipped := v_skipped || (v_spec || jsonb_build_object('reason', 'target_not_in_project'));
      CONTINUE;
    END IF;

    BEGIN
      INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES (v_uid, v_row.scope, v_row.target_type, v_row.target_id, v_row.role);
    EXCEPTION
      WHEN unique_violation THEN
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        IF v_constraint = 'grants_user_scope_target_role_key' THEN
          -- The caller already holds exactly this grant: the promise is fulfilled.
          NULL;
        ELSIF v_constraint = 'idx_grants_one_candidate_editor' THEN
          v_skipped := v_skipped || (v_spec || jsonb_build_object('reason', 'candidate_has_editor'));
          CONTINUE;
        ELSE
          RAISE;
        END IF;
    END;

    UPDATE public.invitations i
    SET claimed_by = v_uid, claimed_at = now(), pending_email = NULL, pending_email_at = NULL
    WHERE i.id = v_row.id;
    v_claimed := v_claimed || v_spec;
  END LOOP;

  RETURN jsonb_build_object('claimed', v_claimed, 'skipped', v_skipped);
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.claim_invitations (uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.claim_invitations (uuid) TO authenticated;

--------------------------------------------------------------------------------
-- Service-role helpers behind the Edge Function (in public so supabase-js can reach them; not executable by API users)
--------------------------------------------------------------------------------
CREATE TABLE private.invitation_throttle (
  -- 'link:<project>:<sha256 of address>', 'code:<project>:<code hash>' or 'caller:<project>:<key>'
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private.invitation_throttle ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.invitation_throttle
FROM
  PUBLIC,
  anon,
  authenticated,
  service_role;

-- True when the key is within its budget, counting this attempt.
CREATE OR REPLACE FUNCTION private.invitation_throttle_take (p_key text, p_max integer, p_window interval) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_count integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('invitation_throttle:' || p_key));
  INSERT INTO private.invitation_throttle AS t (key, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE
    SET count = CASE WHEN t.window_start + p_window <= now() THEN 1 ELSE t.count + 1 END,
        window_start = CASE WHEN t.window_start + p_window <= now() THEN now() ELSE t.window_start END
  RETURNING t.count INTO v_count;
  RETURN v_count <= p_max;
END;
$$;

REVOKE
EXECUTE ON FUNCTION private.invitation_throttle_take (text, integer, interval)
FROM
  PUBLIC,
  anon,
  authenticated;

-- valid | used | unknown, and nothing else.
CREATE OR REPLACE FUNCTION public.invitation_code_status (p_project_id uuid, p_code text) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT CASE
        WHEN i.claimed_at IS NOT NULL THEN 'used'
        WHEN i.expires_at IS NOT NULL AND i.expires_at <= now() THEN 'unknown'
        ELSE 'valid'
      END
      FROM public.invitations i
      WHERE i.project_id = p_project_id
        AND i.code_hash = private.invitation_code_hash(p_code)
    ),
    'unknown'
  );
$$;

-- Decides whether a sign-in link may be mailed to p_email, binds the address onto a valid code when one is presented,
-- and takes the per-address slot. Answers one boolean: send or do nothing.
CREATE OR REPLACE FUNCTION public.invitation_link_request (p_project_id uuid, p_email text, p_code text DEFAULT NULL) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
  v_eligible boolean := false;
  v_bound integer := 0;
BEGIN
  IF v_email IS NULL OR p_project_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_code IS NOT NULL THEN
    UPDATE public.invitations i
    SET pending_email = v_email, pending_email_at = now()
    WHERE i.project_id = p_project_id
      AND i.code_hash = private.invitation_code_hash(p_code)
      AND i.claimed_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now());
    GET DIAGNOSTICS v_bound = ROW_COUNT;
    v_eligible := v_bound > 0;
  ELSE
    v_eligible :=
      EXISTS (
        SELECT 1 FROM public.invitations i
        WHERE i.project_id = p_project_id AND i.email = v_email
          AND i.claimed_at IS NULL AND (i.expires_at IS NULL OR i.expires_at > now())
      )
      OR EXISTS (
        SELECT 1
        FROM auth.users u
        JOIN public.grants g ON g.user_id = u.id
        WHERE lower(btrim(u.email)) = v_email
          AND u.email_confirmed_at IS NOT NULL
          AND (
            (g.scope = 'project' AND g.target_id = p_project_id)
            OR (g.scope = 'entity' AND private.entity_project_id(g.target_type, g.target_id) = p_project_id)
          )
      );
  END IF;

  IF NOT v_eligible THEN
    RETURN false;
  END IF;

  -- One mail per address per 60 seconds. The slot is taken only for an address a mail would go to, and the answer the
  -- anonymous caller sees does not depend on it.
  RETURN private.invitation_throttle_take(
    'link:' || p_project_id::text || ':' || encode(sha256(convert_to(v_email, 'UTF8')), 'hex'),
    1,
    interval '60 seconds'
  );
END;
$$;

-- For code sign-in: the claimant's address for a used code, or NULL. Counts the attempt against the code.
CREATE OR REPLACE FUNCTION public.invitation_code_claimant_email (p_project_id uuid, p_code text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_hash text := private.invitation_code_hash(p_code);
  v_email text;
BEGIN
  SELECT u.email INTO v_email
  FROM public.invitations i
  JOIN auth.users u ON u.id = i.claimed_by
  WHERE i.project_id = p_project_id AND i.code_hash = v_hash AND i.claimed_at IS NOT NULL;

  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;
  -- Ten password attempts per used code per fifteen minutes; over budget answers as an unknown code does.
  IF NOT private.invitation_throttle_take('code:' || p_project_id::text || ':' || v_hash, 10, interval '15 minutes') THEN
    RETURN NULL;
  END IF;
  RETURN v_email;
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.invitation_code_status (uuid, text),
public.invitation_link_request (uuid, text, text),
public.invitation_code_claimant_email (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
EXECUTE ON FUNCTION public.invitation_code_status (uuid, text),
public.invitation_link_request (uuid, text, text),
public.invitation_code_claimant_email (uuid, text) TO service_role;
