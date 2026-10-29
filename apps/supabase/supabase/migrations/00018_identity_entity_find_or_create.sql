--------------------------------------------------------------------------------
-- The entity an identity provider's user registered, found or created in one transaction under a lock on the user
--
-- WHAT IT ADDS. public.identity_entity_find_or_create, a SECURITY DEFINER function the service role alone may execute. It takes an advisory transaction lock on the user, reads the user's registered-entities record inside the lock, and answers `found`, `gone` or `created`; for `created` it writes the entity, the user's editor grant on it and the record in the same transaction.
--
-- WHAT IT LEAVES. Every table, policy and other function.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- identity_entity_find_or_create: the entity an identity provider's user registered in a project, found or created
--
-- WHAT IT TRUSTS. Its arguments, as the identity-callback Edge Function sends them: p_user_id is the account the verified identity resolved to, p_project_id and p_entity_type are the project and the type that function checked against the project's registration-mode matrix, and the two names are the ones the provider's assertion carries. It takes no claim value and no address, and it reads and writes nothing about any account but p_user_id's.
--
-- WHAT IT READS. The user's registered-entities record, `registered_entities` of auth.users.raw_app_meta_data, which only the service role writes: `{"<project id>": {"<entity type>": "<entity id>"}}`. The entry for the project and the type names the entity this identity registered there.
--
-- WHAT IT ANSWERS. `{"result", "entity_id", "registered_entities"}`, the last being the user's whole record as stored when the call returns:
-- - `found`, with the recorded id, when the user still holds the `(entity, <type>, <id>, editor)` grant on the recorded entity and the entity is still a row of the project;
-- - `gone`, with a null id, when the record names an entity and its grant or its row is gone. Nothing is created: an administrator who removed either has decided that the identity no longer edits that entity, and identifying again does not undo that;
-- - `created`, with the new entity's id, when the record names no entity for the project and the type.
--
-- WHAT IT WRITES, for `created` only: one entity, either a candidate with the given names, written confirmed because the strong identity check behind the call vouches for those names, or an organization without a name, written unconfirmed because an identity provider never proves that a person speaks for a party; the user's editor grant on that entity; and the entity's entry in the record, set with jsonb_set, every other entry kept. Nothing else of auth.users is changed.
--
-- WHY THE LOCK. Two first sign-ins of one identity can arrive at once. pg_advisory_xact_lock on a key of the user id holds the second call until the first one's transaction has ended, and the record is read after the lock is taken and written before the transaction ends, so the second call reads the first one's record and answers `found` instead of creating a second entity.
--
-- REFUSALS, each with nothing written: SQLSTATE 22023 for a null argument, an entity type other than candidate and organization, and a user id that names no user; 22000 for metadata whose record is present and malformed (not an object of objects of uuid strings), which is neither read as no record nor overwritten.
--
-- SECURITY DEFINER because it reads and writes auth.users and writes the entity tables and public.grants, in one transaction. It trusts its arguments, so the service role alone may execute it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.identity_entity_find_or_create (
  p_user_id uuid,
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_first_name text,
  p_last_name text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_metadata jsonb;
  v_record jsonb;
  v_recorded jsonb;
  v_entity_id uuid;
BEGIN
  IF p_user_id IS NULL
     OR p_project_id IS NULL
     OR p_entity_type IS NULL
     OR p_first_name IS NULL
     OR p_last_name IS NULL THEN
    RAISE EXCEPTION 'identity_entity_find_or_create: every argument is required'
      USING ERRCODE = '22023';
  END IF;

  IF p_entity_type NOT IN ('candidate', 'organization') THEN
    RAISE EXCEPTION 'identity_entity_find_or_create: the entity type must be candidate or organization'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('identity-entity:' || p_user_id::text));

  SELECT u.raw_app_meta_data INTO v_metadata
  FROM auth.users u
  WHERE u.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'identity_entity_find_or_create: p_user_id names no user'
      USING ERRCODE = '22023';
  END IF;

  IF v_metadata IS NOT NULL AND jsonb_typeof(v_metadata) <> 'object' THEN
    RAISE EXCEPTION 'identity_entity_find_or_create: the registered-entities record is malformed'
      USING ERRCODE = '22000';
  END IF;

  v_record := COALESCE(v_metadata -> 'registered_entities', '{}'::jsonb);

  IF jsonb_typeof(v_record) <> 'object' OR EXISTS (
    SELECT 1
    FROM jsonb_each(v_record) AS p (project_id, entries)
    WHERE CASE
      WHEN jsonb_typeof(p.entries) <> 'object' THEN true
      ELSE EXISTS (
        SELECT 1
        FROM jsonb_each(p.entries) AS e (entity_type, entity_id)
        WHERE jsonb_typeof(e.entity_id) <> 'string'
          OR (e.entity_id #>> '{}') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      )
    END
  ) THEN
    RAISE EXCEPTION 'identity_entity_find_or_create: the registered-entities record is malformed'
      USING ERRCODE = '22000';
  END IF;

  v_recorded := v_record -> p_project_id::text -> p_entity_type::text;

  IF v_recorded IS NOT NULL THEN
    v_entity_id := (v_recorded #>> '{}')::uuid;

    IF EXISTS (
      SELECT 1
      FROM public.grants g
      WHERE g.user_id = p_user_id
        AND g.scope = 'entity'
        AND g.target_type = p_entity_type
        AND g.target_id = v_entity_id
        AND g.role = 'editor'
    ) AND (
      CASE p_entity_type
        WHEN 'candidate' THEN EXISTS (
          SELECT 1 FROM public.candidates c WHERE c.id = v_entity_id AND c.project_id = p_project_id
        )
        ELSE EXISTS (
          SELECT 1 FROM public.organizations o WHERE o.id = v_entity_id AND o.project_id = p_project_id
        )
      END
    ) THEN
      RETURN jsonb_build_object('result', 'found', 'entity_id', v_entity_id, 'registered_entities', v_record);
    END IF;

    RETURN jsonb_build_object('result', 'gone', 'entity_id', NULL::uuid, 'registered_entities', v_record);
  END IF;

  IF p_entity_type = 'candidate' THEN
    INSERT INTO public.candidates (project_id, first_name, last_name, confirmed)
    VALUES (p_project_id, p_first_name, p_last_name, true)
    RETURNING id INTO v_entity_id;
  ELSE
    INSERT INTO public.organizations (project_id, confirmed)
    VALUES (p_project_id, false)
    RETURNING id INTO v_entity_id;
  END IF;

  INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
  VALUES (p_user_id, 'entity', p_entity_type, v_entity_id, 'editor');

  v_record := jsonb_set(
    v_record,
    ARRAY[p_project_id::text],
    COALESCE(v_record -> p_project_id::text, '{}'::jsonb) || jsonb_build_object(p_entity_type::text, v_entity_id::text)
  );

  UPDATE auth.users u
  SET raw_app_meta_data = jsonb_set(COALESCE(u.raw_app_meta_data, '{}'::jsonb), '{registered_entities}', v_record)
  WHERE u.id = p_user_id;

  RETURN jsonb_build_object('result', 'created', 'entity_id', v_entity_id, 'registered_entities', v_record);
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.identity_entity_find_or_create (uuid, uuid, public.entity_type, text, text)
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
EXECUTE ON FUNCTION public.identity_entity_find_or_create (uuid, uuid, public.entity_type, text, text) TO service_role;
