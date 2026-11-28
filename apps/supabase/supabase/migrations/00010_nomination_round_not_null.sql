--------------------------------------------------------------------------------
-- A nomination's election round is never NULL: round 1 is the only representation of the default round
--
-- WHAT IT CHANGES. Sets `election_round` to 1 on every nomination that stores NULL, then makes public.nominations.election_round NOT NULL. A write that sends an explicit NULL for the column is now refused instead of storing a row that get_nominations' round filter would drop. Recreates public.set_entity_nominations and public.create_invitations so that a new nomination of an election whose current_round is NULL is written at round 1 instead of being refused by the NOT NULL.
--
-- WHAT IT LEAVES. The column's DEFAULT 1, the nominations_election_round_check constraint, the unique key, the two recreated functions' signatures and grants, and every other function, including those that compare `COALESCE(election_round, 1)`.
--------------------------------------------------------------------------------

UPDATE public.nominations
SET
  election_round = 1
WHERE
  election_round IS NULL;

ALTER TABLE public.nominations
ALTER COLUMN election_round
SET NOT NULL;

CREATE OR REPLACE FUNCTION public.set_entity_nominations (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_nominations jsonb,
  p_expected_versions jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  c_requested constant text := 'requestedParentOrganization';
  c_unwritten constant text := 'set_entity_nominations: a nomination could not be written; nominations are locked or the rows are no longer the caller''s';
  v_project_id uuid;
  v_parent_type public.entity_type;
  v_contestant_editing text;
  v_writable jsonb;
  v_plan jsonb := '[]'::jsonb;
  v_item jsonb;
  v_ordinality bigint;
  v_index bigint;
  v_checked jsonb;
  v_stored jsonb;
  v_id uuid;
  v_election_id uuid;
  v_constituency_id uuid;
  v_round integer;
  v_symbol text;
  v_kind text;
  v_parent_entity_id uuid;
  v_name text;
  v_is_new boolean;
  v_named_ids uuid[] := ARRAY[]::uuid[];
  v_kept_ids uuid[] := ARRAY[]::uuid[];
  v_delete_ids uuid[];
  v_rows bigint;
  v_row_id uuid;
  v_stored_symbol text;
  v_stored_parent uuid;
  v_stored_custom jsonb;
  v_target_parent uuid;
  v_target_custom jsonb;
  v_symbol_differs boolean;
  v_parent_differs boolean;
  v_custom_differs boolean;
  v_parent_created boolean;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_deleted integer := 0;
  v_unchanged integer := 0;
  v_parents_created integer := 0;
BEGIN
  IF p_entity_type IS NULL OR p_entity_id IS NULL OR p_nominations IS NULL THEN
    RAISE EXCEPTION 'set_entity_nominations: p_entity_type, p_entity_id and p_nominations must each be stated'
      USING ERRCODE = '22023';
  END IF;

  IF p_entity_type NOT IN ('candidate', 'organization') THEN
    RAISE EXCEPTION 'set_entity_nominations: p_entity_type must be candidate or organization'
      USING ERRCODE = '22023';
  END IF;

  v_project_id := private.entity_project_id(p_entity_type, p_entity_id);

  IF v_project_id IS NULL
     OR NOT COALESCE(public.user_can('entity', p_entity_id, 'nomination.edit', p_entity_type), false) THEN
    RAISE EXCEPTION 'set_entity_nominations: the caller does not hold nomination.edit on the named entity'
      USING ERRCODE = '42501';
  END IF;

  v_contestant_editing := private.project_contestant_editing(v_project_id);
  IF v_contestant_editing <> 'open'
     AND NOT COALESCE(public.user_can('project', v_project_id, 'project.edit_nominations'), false) THEN
    RAISE EXCEPTION USING
      MESSAGE = CASE v_contestant_editing
        WHEN 'nominationsLocked' THEN 'set_entity_nominations: nominations are locked in this project'
        ELSE 'set_entity_nominations: editing is locked in this project'
      END,
      ERRCODE = CASE v_contestant_editing WHEN 'nominationsLocked' THEN 'OV006' ELSE 'OV002' END;
  END IF;

  PERFORM private.nomination_list_checked(p_nominations, 'set_entity_nominations', 'p_nominations');

  IF jsonb_typeof(p_expected_versions) IS DISTINCT FROM 'object'
     OR EXISTS (
       SELECT 1
       FROM jsonb_each(p_expected_versions) AS x (key, value)
       WHERE (
         pg_input_is_valid(x.key, 'uuid')
         AND jsonb_typeof(x.value) = 'string'
         AND pg_input_is_valid(x.value #>> '{}', 'timestamptz')
       ) IS NOT TRUE
     ) THEN
    RAISE EXCEPTION 'set_entity_nominations: p_expected_versions must be a JSON object that maps each nomination id to its updated_at'
      USING ERRCODE = '22023';
  END IF;

  -- A candidate stands under an organization and an organization under an alliance.
  v_parent_type := CASE p_entity_type
    WHEN 'candidate' THEN 'organization'::public.entity_type
    ELSE 'alliance'::public.entity_type
  END;

  -- The writable nominations, keyed by nomination id, read as the caller and with no locking clause.
  SELECT COALESCE(
    jsonb_object_agg(
      n.id::text,
      jsonb_build_object(
        'election_id', n.election_id,
        'constituency_id', n.constituency_id,
        'election_symbol', n.election_symbol,
        'parent_nomination_id', n.parent_nomination_id,
        'custom_data', n.custom_data,
        'updated_at', n.updated_at)),
    '{}'::jsonb)
  INTO v_writable
  FROM public.nominations n
  JOIN public.elections e ON e.id = n.election_id
  WHERE (
      (p_entity_type = 'candidate' AND n.candidate_id = p_entity_id)
      OR (p_entity_type = 'organization' AND n.organization_id = p_entity_id)
    )
    AND private.nomination_writable(n, e, p_entity_type);

  -- The writable nominations the set was computed from must be the ones stored: the same ids, each last updated when the caller read it.
  IF EXISTS (
    SELECT 1
    FROM jsonb_each(v_writable) AS r (key, value)
    FULL JOIN jsonb_each_text(p_expected_versions) AS x (key, value) ON x.key::uuid = r.key::uuid
    WHERE r.key IS NULL
      OR x.key IS NULL
      OR (r.value ->> 'updated_at')::timestamptz IS DISTINCT FROM x.value::timestamptz
  ) THEN
    RAISE EXCEPTION 'set_entity_nominations: the nominations have changed since they were read'
      USING ERRCODE = 'OV003';
  END IF;

  -- Validate every object before anything is written, and note what each one asks for.
  FOR v_item, v_ordinality IN
    SELECT t.item, t.ordinality
    FROM jsonb_array_elements(p_nominations) WITH ORDINALITY AS t (item, ordinality)
  LOOP
    v_index := v_ordinality - 1;

    -- The shape of the object, then the checks that read rows.
    v_checked := private.nomination_object_checked(
      v_item, v_parent_type, 'set_entity_nominations', format('p_nominations[%s]', v_index));
    v_id := (v_checked ->> 'id')::uuid;
    v_election_id := (v_checked ->> 'election_id')::uuid;
    v_constituency_id := (v_checked ->> 'constituency_id')::uuid;
    v_symbol := v_checked ->> 'symbol';
    v_kind := v_checked ->> 'kind';
    v_parent_entity_id := (v_checked ->> 'parent_entity_id')::uuid;
    v_name := v_checked ->> 'name';

    v_stored := NULL;
    v_is_new := true;
    IF v_id IS NOT NULL THEN
      IF v_id = ANY (v_named_ids) THEN
        RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] names an id that another object of the set names', v_index
          USING ERRCODE = '22023';
      END IF;
      v_named_ids := v_named_ids || v_id;

      v_stored := v_writable -> v_id::text;
      IF v_stored IS NULL THEN
        RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] names an id that is no nomination of the entity this function may write', v_index
          USING ERRCODE = '22023';
      END IF;

      IF (v_stored ->> 'election_id')::uuid <> v_election_id THEN
        RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] names an election_id other than its nomination''s', v_index
          USING ERRCODE = '22023';
      END IF;

      -- A changed constituency is a move: the stored row is deleted and a new one inserted.
      v_is_new := (v_stored ->> 'constituency_id')::uuid <> v_constituency_id;
      IF NOT v_is_new THEN
        v_kept_ids := v_kept_ids || v_id;
      END IF;
    END IF;

    SELECT COALESCE(e.current_round, 1) INTO v_round
    FROM public.elections e
    WHERE e.id = v_election_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] names an election_id that is no election the caller can read', v_index
        USING ERRCODE = '22023';
    END IF;

    IF v_kind = 'keep' AND v_is_new THEN
      RAISE EXCEPTION 'set_entity_nominations: p_nominations[%] keeps a parent, which only an object that names an id and does not change its constituency may', v_index
        USING ERRCODE = '22023';
    END IF;

    v_plan := v_plan || jsonb_build_object(
      'index', v_index,
      'id', v_id,
      'new', v_is_new,
      'election_id', v_election_id,
      'constituency_id', v_constituency_id,
      'round', v_round,
      'symbol', v_symbol,
      'kind', v_kind,
      'parent_entity_id', v_parent_entity_id,
      'name', v_name);
  END LOOP;

  -- 1. The writable rows that the set does not keep: the ones it leaves out and the stored row of every move.
  SELECT COALESCE(array_agg(k.id), ARRAY[]::uuid[]) INTO v_delete_ids
  FROM (SELECT r.key::uuid AS id FROM jsonb_object_keys(v_writable) AS r (key)) k
  WHERE k.id <> ALL (v_kept_ids);

  IF private.nominations_listed_under(v_delete_ids) THEN
    RAISE EXCEPTION 'set_entity_nominations: a nomination the set removes or moves has other nominations listed under it'
      USING ERRCODE = 'OV005';
  END IF;

  IF cardinality(v_delete_ids) > 0 THEN
    DELETE FROM public.nominations n
    WHERE n.id = ANY (v_delete_ids);
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> cardinality(v_delete_ids) THEN
      RAISE EXCEPTION USING MESSAGE = c_unwritten, ERRCODE = '42501';
    END IF;
    v_deleted := cardinality(v_delete_ids);
  END IF;

  -- 2 and 3. The kept rows first, then the new ones, each in the order of the set.
  FOR v_item IN
    SELECT t.item
    FROM jsonb_array_elements(v_plan) AS t (item)
    ORDER BY (t.item ->> 'new')::boolean, (t.item ->> 'index')::bigint
  LOOP
    v_is_new := (v_item ->> 'new')::boolean;
    v_election_id := (v_item ->> 'election_id')::uuid;
    v_constituency_id := (v_item ->> 'constituency_id')::uuid;
    v_round := (v_item ->> 'round')::integer;
    v_symbol := v_item ->> 'symbol';
    v_kind := v_item ->> 'kind';
    v_parent_entity_id := (v_item ->> 'parent_entity_id')::uuid;
    v_name := v_item ->> 'name';

    IF v_is_new THEN
      -- The caller's own row, with no parent. Its id is the caller's to read.
      v_stored_symbol := v_symbol;
      v_stored_parent := NULL;
      v_stored_custom := CASE WHEN v_kind = 'other' THEN jsonb_build_object(c_requested, v_name) END;

      INSERT INTO public.nominations (
        project_id, candidate_id, organization_id,
        election_id, constituency_id, election_round, election_symbol, custom_data
      )
      VALUES (
        v_project_id,
        CASE WHEN p_entity_type = 'candidate' THEN p_entity_id END,
        CASE WHEN p_entity_type = 'organization' THEN p_entity_id END,
        v_election_id, v_constituency_id, v_round, v_stored_symbol, v_stored_custom
      )
      RETURNING id INTO v_row_id;
      v_inserted := v_inserted + 1;
    ELSE
      v_row_id := (v_item ->> 'id')::uuid;
      v_stored := v_writable -> v_row_id::text;
      v_stored_symbol := v_stored ->> 'election_symbol';
      v_stored_parent := (v_stored ->> 'parent_nomination_id')::uuid;
      v_stored_custom := NULLIF(v_stored -> 'custom_data', 'null'::jsonb);
    END IF;

    -- What the row is to hold for the parent's kind.
    SELECT t.parent_nomination_id, t.custom_data
    INTO v_target_parent, v_target_custom
    FROM private.nomination_parent_target(v_kind, v_stored_parent, v_stored_custom, v_name) AS t;

    IF v_kind = 'entity' THEN
      -- The parent's nomination at the contest, created where it holds none.
      SELECT r.nomination_id, r.created
      INTO v_target_parent, v_parent_created
      FROM private.parent_nomination_resolved(
        v_project_id, v_parent_type, v_parent_entity_id, v_election_id, v_constituency_id, v_round,
        'set_entity_nominations', format('p_nominations[%s]', v_item ->> 'index')) AS r;

      IF v_parent_created THEN
        v_parents_created := v_parents_created + 1;
      END IF;
      IF v_target_parent IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = c_unwritten, ERRCODE = '42501';
      END IF;
    END IF;

    v_symbol_differs := v_symbol IS DISTINCT FROM v_stored_symbol;
    v_parent_differs := v_target_parent IS DISTINCT FROM v_stored_parent;
    v_custom_differs := v_target_custom IS DISTINCT FROM v_stored_custom;

    IF NOT (v_symbol_differs OR v_parent_differs OR v_custom_differs) THEN
      IF NOT v_is_new THEN
        v_unchanged := v_unchanged + 1;
      END IF;
      CONTINUE;
    END IF;

    -- One statement, naming only the columns that differ, and the confirmation wherever the custom data is written.
    IF v_symbol_differs AND v_parent_differs AND v_custom_differs THEN
      UPDATE public.nominations
      SET election_symbol = v_symbol, parent_nomination_id = v_target_parent, custom_data = v_target_custom,
          confirmed = confirmed AND NOT COALESCE(v_target_custom ? c_requested, false)
      WHERE id = v_row_id;
    ELSIF v_symbol_differs AND v_parent_differs THEN
      UPDATE public.nominations
      SET election_symbol = v_symbol, parent_nomination_id = v_target_parent
      WHERE id = v_row_id;
    ELSIF v_symbol_differs AND v_custom_differs THEN
      UPDATE public.nominations
      SET election_symbol = v_symbol, custom_data = v_target_custom,
          confirmed = confirmed AND NOT COALESCE(v_target_custom ? c_requested, false)
      WHERE id = v_row_id;
    ELSIF v_parent_differs AND v_custom_differs THEN
      UPDATE public.nominations
      SET parent_nomination_id = v_target_parent, custom_data = v_target_custom,
          confirmed = confirmed AND NOT COALESCE(v_target_custom ? c_requested, false)
      WHERE id = v_row_id;
    ELSIF v_symbol_differs THEN
      UPDATE public.nominations
      SET election_symbol = v_symbol
      WHERE id = v_row_id;
    ELSIF v_parent_differs THEN
      UPDATE public.nominations
      SET parent_nomination_id = v_target_parent
      WHERE id = v_row_id;
    ELSE
      UPDATE public.nominations
      SET custom_data = v_target_custom,
          confirmed = confirmed AND NOT COALESCE(v_target_custom ? c_requested, false)
      WHERE id = v_row_id;
    END IF;

    -- A row that row-level security hides is not an error and not a target: zero rows.
    IF NOT FOUND THEN
      RAISE EXCEPTION USING MESSAGE = c_unwritten, ERRCODE = '42501';
    END IF;

    IF NOT v_is_new THEN
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  -- Raise the end-of-transaction parent rule inside this call, and leave the constraint deferred.
  SET CONSTRAINTS public.validate_nomination_parent_required IMMEDIATE;
  SET CONSTRAINTS public.validate_nomination_parent_required DEFERRED;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'updated', v_updated,
    'deleted', v_deleted,
    'unchanged', v_unchanged,
    'parents_created', v_parents_created);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_invitations (
  p_project_id uuid,
  p_invitations jsonb,
  p_confirm_entity boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  c_requested constant text := 'requestedParentOrganization';
  v_item jsonb;
  v_ordinality bigint;
  v_index bigint;
  v_scope public.grant_scope_type;
  v_role public.grant_role_type;
  v_target_type public.entity_type;
  v_target_id uuid;
  v_external_id text;
  v_email text;
  v_expires_at timestamptz;
  v_id uuid;
  v_code text;
  v_entity_confirmed boolean;
  v_out jsonb := '[]'::jsonb;
  -- The nominations of one item.
  v_has_nominations boolean;
  v_entity_key text;
  v_entity_keys text[] := ARRAY[]::text[];
  v_parent_type public.entity_type;
  v_object jsonb;
  v_object_ordinality bigint;
  v_label text;
  v_checked jsonb;
  v_nomination_id uuid;
  v_named_ids uuid[];
  v_round integer;
  v_stored jsonb;
  v_columns jsonb;
  v_column text;
  v_column_type text;
  v_value jsonb;
  v_item_plan jsonb;
  v_entry jsonb;
  v_is_new boolean;
  v_kind text;
  v_target_parent uuid;
  v_parent_created boolean;
  v_target_custom jsonb;
  v_target jsonb;
  v_row_id uuid;
  v_row_confirmed boolean;
  v_inserted integer;
  v_updated integer;
  v_unchanged integer;
  v_parents_created integer;
  v_wrote_nomination boolean := false;
BEGIN
  IF p_confirm_entity IS NULL THEN
    RAISE EXCEPTION 'create_invitations: p_confirm_entity must be true or false'
      USING ERRCODE = '22023';
  END IF;

  IF p_invitations IS NULL OR jsonb_typeof(p_invitations) <> 'array' THEN
    RAISE EXCEPTION 'create_invitations: p_invitations must be a JSON array'
      USING ERRCODE = '22023';
  END IF;

  FOR v_item, v_ordinality IN
    SELECT t.item, t.ordinality
    FROM jsonb_array_elements(p_invitations) WITH ORDINALITY AS t (item, ordinality)
  LOOP
    v_index := v_ordinality - 1;

    IF jsonb_typeof(v_item) <> 'object' THEN
      RAISE EXCEPTION 'create_invitations: p_invitations[%] must be a JSON object', v_index
        USING ERRCODE = '22023';
    END IF;

    v_scope := COALESCE(v_item ->> 'scope', 'entity')::public.grant_scope_type;
    v_role := COALESCE(v_item ->> 'role', 'editor')::public.grant_role_type;
    v_target_type := (v_item ->> 'target_type')::public.entity_type;
    v_target_id := (v_item ->> 'target_id')::uuid;
    v_external_id := v_item ->> 'external_id';
    v_email := NULLIF(lower(btrim(v_item ->> 'email')), '');
    v_expires_at := (v_item ->> 'expires_at')::timestamptz;

    IF v_scope = 'entity' THEN
      IF v_target_type IS NULL THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] is an entity-scope item and needs a target_type', v_index
          USING ERRCODE = '22023';
      END IF;
      IF num_nonnulls(v_target_id, v_external_id) <> 1 THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] must name its entity by exactly one of target_id and external_id', v_index
          USING ERRCODE = '22023';
      END IF;
      IF v_external_id IS NOT NULL THEN
        -- Read as the caller, inside the named project only: an entity of another project, or one the caller cannot see, is not found.
        CASE v_target_type
          WHEN 'candidate' THEN
            SELECT e.id INTO v_target_id FROM public.candidates e WHERE e.project_id = p_project_id AND e.external_id = v_external_id;
          WHEN 'organization' THEN
            SELECT e.id INTO v_target_id FROM public.organizations e WHERE e.project_id = p_project_id AND e.external_id = v_external_id;
          WHEN 'faction' THEN
            SELECT e.id INTO v_target_id FROM public.factions e WHERE e.project_id = p_project_id AND e.external_id = v_external_id;
          WHEN 'alliance' THEN
            SELECT e.id INTO v_target_id FROM public.alliances e WHERE e.project_id = p_project_id AND e.external_id = v_external_id;
        END CASE;
        IF v_target_id IS NULL THEN
          RAISE EXCEPTION 'create_invitations: p_invitations[%] names no % with that external_id in the project', v_index, v_target_type
            USING ERRCODE = '22023';
        END IF;
      END IF;
    ELSE
      IF v_external_id IS NOT NULL THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] names an external_id, which only an entity-scope item may', v_index
          USING ERRCODE = '22023';
      END IF;
      IF v_scope = 'project' THEN
        v_target_id := COALESCE(v_target_id, p_project_id);
      END IF;
    END IF;

    -- The item's nominations, checked whole before anything of the item is written. Each object's checked values are kept in the item plan.
    v_has_nominations := v_item ? 'nominations';
    v_item_plan := '[]'::jsonb;
    IF v_has_nominations THEN
      IF v_scope <> 'entity' THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] states nominations, which only an entity-scope item may', v_index
          USING ERRCODE = '22023';
      END IF;
      IF v_target_type NOT IN ('candidate', 'organization') THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] states nominations for % %, which only a candidate or an organization may hold',
          v_index, (CASE v_target_type WHEN 'alliance' THEN 'an' ELSE 'a' END), v_target_type
          USING ERRCODE = '22023';
      END IF;

      PERFORM private.nomination_list_checked(
        v_item -> 'nominations', 'create_invitations', format('p_invitations[%s].nominations', v_index));

      v_entity_key := v_target_type::text || ':' || v_target_id::text;
      IF v_entity_key = ANY (v_entity_keys) THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] states nominations for an entity an earlier item of the batch states them for', v_index
          USING ERRCODE = '22023';
      END IF;
      v_entity_keys := v_entity_keys || v_entity_key;

      -- Read as the caller, before the invitation's policy has judged the caller: an entity the caller cannot read is no entity of the project, so the refusal says nothing about rows the caller cannot see.
      CASE v_target_type
        WHEN 'candidate' THEN
          PERFORM 1 FROM public.candidates e WHERE e.id = v_target_id AND e.project_id = p_project_id;
        ELSE
          PERFORM 1 FROM public.organizations e WHERE e.id = v_target_id AND e.project_id = p_project_id;
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'create_invitations: p_invitations[%] states nominations for an entity that is no entity of the project', v_index
          USING ERRCODE = '22023';
      END IF;

      -- A candidate stands under an organization and an organization under an alliance.
      v_parent_type := CASE v_target_type
        WHEN 'candidate' THEN 'organization'::public.entity_type
        ELSE 'alliance'::public.entity_type
      END;
      v_named_ids := ARRAY[]::uuid[];

      FOR v_object, v_object_ordinality IN
        SELECT t.item, t.ordinality
        FROM jsonb_array_elements(v_item -> 'nominations') WITH ORDINALITY AS t (item, ordinality)
      LOOP
        v_label := format('p_invitations[%s].nominations[%s]', v_index, v_object_ordinality - 1);

        -- The shape of the object, then the keys only an invitation reads, then the checks that read rows.
        v_checked := private.nomination_object_checked(v_object, v_parent_type, 'create_invitations', v_label);
        v_nomination_id := (v_checked ->> 'id')::uuid;

        IF jsonb_typeof(v_object -> 'confirmed') IS DISTINCT FROM 'boolean' THEN
          RAISE EXCEPTION 'create_invitations: % needs confirmed, which is true or false', v_label
            USING ERRCODE = '22023';
        END IF;

        IF v_object ? 'election_round'
           AND (jsonb_typeof(v_object -> 'election_round') <> 'number'
             OR NOT pg_input_is_valid(v_object ->> 'election_round', 'integer')) THEN
          RAISE EXCEPTION 'create_invitations: % has an election_round that is not an integer', v_label
            USING ERRCODE = '22023';
        END IF;

        SELECT COALESCE(e.current_round, 1) INTO v_round
        FROM public.elections e
        WHERE e.id = (v_checked ->> 'election_id')::uuid
          AND e.project_id = p_project_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'create_invitations: % names an election_id that is no election of the project the caller can read', v_label
            USING ERRCODE = '22023';
        END IF;
        IF v_object ? 'election_round' THEN
          v_round := (v_object ->> 'election_round')::integer;
        END IF;

        -- The stated columns, each by its JSON type; the symbol as the shape check trimmed it.
        v_columns := CASE
          WHEN v_object ? 'election_symbol' THEN jsonb_build_object('election_symbol', v_checked ->> 'symbol')
          ELSE '{}'::jsonb
        END;
        FOR v_column, v_column_type IN
          SELECT c.column_name, c.json_type
          FROM (
            VALUES
              (1, 'name', 'a JSON object'),
              (2, 'short_name', 'a JSON object'),
              (3, 'info', 'a JSON object'),
              (4, 'color', 'a JSON object'),
              (5, 'image', 'a JSON object'),
              (6, 'sort_order', 'an integer'),
              (7, 'subtype', 'a string'),
              (8, 'external_id', 'a string')
          ) AS c (ordinal, column_name, json_type)
          ORDER BY c.ordinal
        LOOP
          IF v_object ? v_column THEN
            v_value := v_object -> v_column;
            IF jsonb_typeof(v_value) <> 'null' AND NOT (CASE v_column_type
                WHEN 'a JSON object' THEN jsonb_typeof(v_value) = 'object'
                WHEN 'an integer' THEN jsonb_typeof(v_value) = 'number' AND pg_input_is_valid(v_value #>> '{}', 'integer')
                ELSE jsonb_typeof(v_value) = 'string'
              END) THEN
              RAISE EXCEPTION 'create_invitations: % has a % that is neither % nor null', v_label, v_column, v_column_type
                USING ERRCODE = '22023';
            END IF;
            v_columns := v_columns || jsonb_build_object(v_column, v_value);
          END IF;
        END LOOP;

        IF v_object ? 'custom_data' THEN
          IF jsonb_typeof(v_object -> 'custom_data') <> 'object' THEN
            RAISE EXCEPTION 'create_invitations: % has a custom_data that is not a JSON object', v_label
              USING ERRCODE = '22023';
          END IF;
          IF (v_object -> 'custom_data') ? c_requested THEN
            RAISE EXCEPTION 'create_invitations: % states requestedParentOrganization in custom_data, which only a parent of kind other sets', v_label
              USING ERRCODE = '22023';
          END IF;
        END IF;

        v_stored := NULL;
        IF v_nomination_id IS NOT NULL THEN
          IF v_nomination_id = ANY (v_named_ids) THEN
            RAISE EXCEPTION 'create_invitations: % names an id that another object of the array names', v_label
              USING ERRCODE = '22023';
          END IF;
          v_named_ids := v_named_ids || v_nomination_id;

          -- The stored row, read as the caller: a nomination of the invited entity in p_project_id.
          SELECT jsonb_build_object(
              'election_id', n.election_id,
              'constituency_id', n.constituency_id,
              'election_round', n.election_round,
              'election_symbol', n.election_symbol,
              'parent_nomination_id', n.parent_nomination_id,
              'custom_data', n.custom_data,
              'confirmed', n.confirmed,
              'name', n.name,
              'short_name', n.short_name,
              'info', n.info,
              'color', n.color,
              'image', n.image,
              'sort_order', n.sort_order,
              'subtype', n.subtype,
              'external_id', n.external_id)
          INTO v_stored
          FROM public.nominations n
          WHERE n.id = v_nomination_id
            AND n.project_id = p_project_id
            AND CASE v_target_type
              WHEN 'candidate' THEN n.candidate_id = v_target_id
              ELSE n.organization_id = v_target_id
            END;
          IF v_stored IS NULL THEN
            RAISE EXCEPTION 'create_invitations: % names an id that is no nomination of the invited entity', v_label
              USING ERRCODE = '22023';
          END IF;

          IF (v_stored ->> 'election_id')::uuid <> (v_checked ->> 'election_id')::uuid THEN
            RAISE EXCEPTION 'create_invitations: % names an election_id other than its nomination''s', v_label
              USING ERRCODE = '22023';
          END IF;
          IF (v_stored ->> 'constituency_id')::uuid <> (v_checked ->> 'constituency_id')::uuid THEN
            RAISE EXCEPTION 'create_invitations: % names a constituency_id other than its nomination''s; an invitation moves no nomination', v_label
              USING ERRCODE = '22023';
          END IF;
          IF v_object ? 'election_round'
             AND (v_stored ->> 'election_round')::integer IS DISTINCT FROM v_round THEN
            RAISE EXCEPTION 'create_invitations: % names an election_round other than its nomination''s', v_label
              USING ERRCODE = '22023';
          END IF;
          v_round := (v_stored ->> 'election_round')::integer;
        ELSIF v_checked ->> 'kind' = 'keep' THEN
          RAISE EXCEPTION 'create_invitations: % keeps a parent, which only an object that names an id may', v_label
            USING ERRCODE = '22023';
        END IF;

        v_item_plan := v_item_plan || jsonb_build_array(jsonb_build_object(
          'label', v_label,
          'id', v_nomination_id,
          'election_id', v_checked -> 'election_id',
          'constituency_id', v_checked -> 'constituency_id',
          'round', v_round,
          'kind', v_checked -> 'kind',
          'parent_entity_id', v_checked -> 'parent_entity_id',
          'name', v_checked -> 'name',
          'confirmed', v_object -> 'confirmed',
          'custom_data', v_object -> 'custom_data',
          'columns', v_columns,
          'stored', v_stored));
      END LOOP;
    END IF;

    INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email, expires_at)
    VALUES (p_project_id, v_scope, v_target_type, v_target_id, v_role, v_email, v_expires_at)
    RETURNING id INTO v_id;

    v_code := NULLIF(current_setting('openvaa.generated_invitation_code', true), '');
    PERFORM set_config('openvaa.generated_invitation_code', '', true);

    IF p_confirm_entity AND v_scope = 'entity' THEN
      CASE v_target_type
        WHEN 'candidate' THEN
          UPDATE public.candidates e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed
            AND btrim(e.first_name) <> '' AND btrim(e.last_name) <> '';
        WHEN 'organization' THEN
          UPDATE public.organizations e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed
            AND private.localized_has_text(e.name);
        WHEN 'faction' THEN
          UPDATE public.factions e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed
            AND private.localized_has_text(e.name);
        WHEN 'alliance' THEN
          UPDATE public.alliances e SET confirmed = true
          WHERE e.id = v_target_id AND e.project_id = p_project_id AND NOT e.confirmed
            AND private.localized_has_text(e.name);
      END CASE;
    END IF;

    -- The item's nominations, in the order of its array.
    v_inserted := 0;
    v_updated := 0;
    v_unchanged := 0;
    v_parents_created := 0;
    FOR v_entry IN
      SELECT t.entry
      FROM jsonb_array_elements(v_item_plan) WITH ORDINALITY AS t (entry, ordinality)
      ORDER BY t.ordinality
    LOOP
      v_label := v_entry ->> 'label';
      v_stored := v_entry -> 'stored';
      v_is_new := jsonb_typeof(v_stored) IS DISTINCT FROM 'object';
      v_kind := v_entry ->> 'kind';
      v_round := (v_entry ->> 'round')::integer;

      -- The custom data: the stated keys over the stored ones.
      v_target_custom := NULLIF(v_stored -> 'custom_data', 'null'::jsonb);
      IF jsonb_typeof(v_entry -> 'custom_data') = 'object' THEN
        v_target_custom := CASE WHEN jsonb_typeof(v_target_custom) = 'object' THEN v_target_custom ELSE '{}'::jsonb END
          || (v_entry -> 'custom_data');
      END IF;

      -- The parent and the custom data for the parent's kind; `entity` then asks for the parent's nomination at the contest, created where it holds none.
      SELECT t.parent_nomination_id, t.custom_data
      INTO v_target_parent, v_target_custom
      FROM private.nomination_parent_target(
        v_kind, (v_stored ->> 'parent_nomination_id')::uuid, v_target_custom, v_entry ->> 'name') AS t;

      IF v_kind = 'entity' THEN
        SELECT r.nomination_id, r.created
        INTO v_target_parent, v_parent_created
        FROM private.parent_nomination_resolved(
          p_project_id, v_parent_type, (v_entry ->> 'parent_entity_id')::uuid,
          (v_entry ->> 'election_id')::uuid, (v_entry ->> 'constituency_id')::uuid, v_round,
          'create_invitations', v_label) AS r;

        IF v_parent_created THEN
          v_parents_created := v_parents_created + 1;
          v_wrote_nomination := true;
        END IF;
        IF v_target_parent IS NULL THEN
          RAISE EXCEPTION 'create_invitations: % could not be written as stated', v_label
            USING ERRCODE = '42501';
        END IF;
      END IF;

      -- What the row is to hold: each column stated, or as stored when not stated.
      v_target := CASE WHEN v_is_new THEN '{}'::jsonb ELSE v_stored END
        || jsonb_build_object(
          'parent_nomination_id', v_target_parent,
          'custom_data', v_target_custom,
          'confirmed', v_entry -> 'confirmed')
        || (v_entry -> 'columns');

      IF v_is_new THEN
        INSERT INTO public.nominations (
          project_id, candidate_id, organization_id,
          election_id, constituency_id, election_round, parent_nomination_id, election_symbol, custom_data,
          name, short_name, info, color, image, sort_order, subtype, external_id
        )
        VALUES (
          p_project_id,
          CASE WHEN v_target_type = 'candidate' THEN v_target_id END,
          CASE WHEN v_target_type = 'organization' THEN v_target_id END,
          (v_entry ->> 'election_id')::uuid, (v_entry ->> 'constituency_id')::uuid, v_round,
          v_target_parent, v_target ->> 'election_symbol', v_target_custom,
          NULLIF(v_target -> 'name', 'null'::jsonb), NULLIF(v_target -> 'short_name', 'null'::jsonb),
          NULLIF(v_target -> 'info', 'null'::jsonb), NULLIF(v_target -> 'color', 'null'::jsonb),
          NULLIF(v_target -> 'image', 'null'::jsonb), (v_target ->> 'sort_order')::integer,
          v_target ->> 'subtype', v_target ->> 'external_id'
        )
        RETURNING id INTO v_row_id;
        v_inserted := v_inserted + 1;
        v_wrote_nomination := true;

        -- A new row starts unconfirmed; a stated confirmation is a write of its own.
        IF (v_target ->> 'confirmed')::boolean THEN
          UPDATE public.nominations n
          SET confirmed = true
          WHERE n.id = v_row_id
          RETURNING n.confirmed INTO v_row_confirmed;
          IF NOT FOUND OR v_row_confirmed IS DISTINCT FROM true THEN
            RAISE EXCEPTION 'create_invitations: % could not be written as stated', v_label
              USING ERRCODE = '42501';
          END IF;
        END IF;
      ELSIF v_target IS NOT DISTINCT FROM v_stored THEN
        v_unchanged := v_unchanged + 1;
      ELSE
        v_row_id := (v_entry ->> 'id')::uuid;
        UPDATE public.nominations n
        SET election_symbol = v_target ->> 'election_symbol',
            parent_nomination_id = v_target_parent,
            custom_data = v_target_custom,
            confirmed = (v_target ->> 'confirmed')::boolean,
            name = NULLIF(v_target -> 'name', 'null'::jsonb),
            short_name = NULLIF(v_target -> 'short_name', 'null'::jsonb),
            info = NULLIF(v_target -> 'info', 'null'::jsonb),
            color = NULLIF(v_target -> 'color', 'null'::jsonb),
            image = NULLIF(v_target -> 'image', 'null'::jsonb),
            sort_order = (v_target ->> 'sort_order')::integer,
            subtype = v_target ->> 'subtype',
            external_id = v_target ->> 'external_id'
        WHERE n.id = v_row_id
        RETURNING n.confirmed INTO v_row_confirmed;
        -- Row-level security hides a row without an error, and a caller without nomination.confirm has its edit unconfirmed: either is a statement not written as stated.
        IF NOT FOUND OR v_row_confirmed IS DISTINCT FROM (v_target ->> 'confirmed')::boolean THEN
          RAISE EXCEPTION 'create_invitations: % could not be written as stated', v_label
            USING ERRCODE = '42501';
        END IF;
        v_updated := v_updated + 1;
        v_wrote_nomination := true;
      END IF;
    END LOOP;

    -- The invited entity's confirmation after the item, as the caller reads it.
    v_entity_confirmed := NULL;
    IF v_scope = 'entity' THEN
      CASE v_target_type
        WHEN 'candidate' THEN
          SELECT e.confirmed INTO v_entity_confirmed FROM public.candidates e WHERE e.id = v_target_id AND e.project_id = p_project_id;
        WHEN 'organization' THEN
          SELECT e.confirmed INTO v_entity_confirmed FROM public.organizations e WHERE e.id = v_target_id AND e.project_id = p_project_id;
        WHEN 'faction' THEN
          SELECT e.confirmed INTO v_entity_confirmed FROM public.factions e WHERE e.id = v_target_id AND e.project_id = p_project_id;
        WHEN 'alliance' THEN
          SELECT e.confirmed INTO v_entity_confirmed FROM public.alliances e WHERE e.id = v_target_id AND e.project_id = p_project_id;
      END CASE;
    END IF;

    v_out := v_out || jsonb_build_array(
      jsonb_build_object(
        'id', v_id,
        'scope', v_scope,
        'target_type', v_target_type,
        'target_id', v_target_id,
        'role', v_role,
        'email', v_email,
        'expires_at', v_expires_at,
        'code', v_code,
        'entity_confirmed', v_entity_confirmed
      ) || CASE
        WHEN v_has_nominations THEN jsonb_build_object(
          'nominations', jsonb_build_object(
            'inserted', v_inserted,
            'updated', v_updated,
            'unchanged', v_unchanged,
            'parents_created', v_parents_created))
        ELSE '{}'::jsonb
      END
    );
  END LOOP;

  -- Raise the end-of-transaction parent rule inside this call when it wrote a nomination, and leave the constraint deferred.
  IF v_wrote_nomination THEN
    SET CONSTRAINTS public.validate_nomination_parent_required IMMEDIATE;
    SET CONSTRAINTS public.validate_nomination_parent_required DEFERRED;
  END IF;

  RETURN v_out;
END;
$$;
