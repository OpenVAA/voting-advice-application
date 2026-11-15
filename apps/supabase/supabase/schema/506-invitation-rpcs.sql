-- Invitation RPC functions
--
-- Functions:
-- - create_invitations() - seed a batch of invitations in one project, stating whether each invited entity is confirmed and which nominations it holds, and return each generated code once
-- - private.invitation_mode_allowed() - whether the project allows the registration mode of an open invitation
-- - private.email_holds_grant_in_project() - whether a user with a confirmed address holds a grant in a project
-- - invitation_code_status() - whether a code is valid, used or unknown
-- - invitation_link_request() - the address a sign-in mail may go to, or null
-- - invitation_link_release() - give back what a link request took when no mail went out
-- - recovery_link_request() - which mail a recovery request for an address earns, or null
-- - invitation_code_claimant_email() - the claimant's address of a used code, under an attempt limit
-- - invitation_link_witness_open(), invitation_link_witness() - whether the background work of one link request has ended
-- - claim_invitations() - turn the caller's open invitations into grants
--
-- The six `invitation_*` functions and recovery_link_request are the service role's: an Edge Function calls them with values an anonymous visitor typed, and no API role can execute them. claim_invitations is the signed-in user's and nobody else's.
--
-- Depends on:
-- - 102-entities.sql (the four entity tables)
-- - 104-nominations.sql (public.nominations, its triggers and the constraint trigger nominations_parent_required)
-- - 300-auth-tables.sql (public.grants)
-- - 301-auth-functions.sql (private.entity_project_id, private.user_password_set, private.registration_mode_allowed)
-- - 305-invitations.sql (public.invitations, its insert trigger, its policies and private.invitation_code_hash)
-- - 503-entity-rpcs.sql (private.nomination_list_checked, private.nomination_object_checked, private.parent_nomination_resolved)
-- - auth.users (Supabase Auth)
--------------------------------------------------------------------------------
-- localized_has_text: does a localized string say anything
--
-- True when the value is a JSON object with at least one member whose text is not blank. NULL, a non-object and an object of blank or null members are all false.
--
-- create_invitations is SECURITY INVOKER and calls it as its caller, so `authenticated` and `service_role` hold EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.localized_has_text (p_val jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT CASE
    WHEN jsonb_typeof(p_val) = 'object' THEN
      EXISTS (SELECT 1 FROM jsonb_each_text(p_val) AS t WHERE btrim(t.value) <> '')
    ELSE false
  END;
$$;

REVOKE
EXECUTE ON FUNCTION private.localized_has_text (jsonb)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION private.localized_has_text (jsonb) TO authenticated,
service_role;

--------------------------------------------------------------------------------
-- create_invitations RPC: seed a batch of invitations in one project, stating whether each invited entity is confirmed and which nominations it holds
--
-- p_project_id, p_invitations and p_confirm_entity are REQUIRED and none carries a DEFAULT: every row of the batch belongs to p_project_id, and a NULL p_confirm_entity is refused. p_invitations is a JSON array of items `{ scope?, role?, target_type?, target_id?, external_id?, email?, expires_at?, nominations? }`. `scope` defaults to `entity` and `role` to `editor`. An entity-scope item names its entity by `target_type` and exactly one of `target_id` and `external_id`; a project-scope item promises a role on p_project_id itself. An item with an `email` is bound to that address, and one without gets a generated code.
--
-- The plaintext of a generated code exists only in this function's return value: the table holds its hash, which no API role can read, so a code that is lost is replaced by deleting the unclaimed invitation and seeding another. The code is read from the transaction-local setting the insert trigger writes, and the setting is cleared straight after.
--
-- SECURITY INVOKER: each row is inserted as the caller, so the INSERT policy of public.invitations decides who may promise which grant, exactly as it does for a direct insert, and this body holds no authority rule of its own. An `external_id` is resolved under the caller's row-level security, inside p_project_id only. The nominations are written as the caller too, so the policies, the column grants and the triggers of public.nominations decide every statement. A service-role caller bypasses the policies and is bound by the tables' CHECK constraints and triggers.
--
-- p_confirm_entity says whether the call confirms the entities it invites. `true` confirms each named entity of the batch, in the same transaction and as the caller, so enforce_entity_immutability asks `entity.confirm`. A candidate has a name when its first and last name are both non-blank; the other three types when their localized `name` has text. An entity without a name stays unconfirmed. `false` confirms no one. No call unconfirms an entity, no item key overrides the call's value, a project-scope promise confirms nothing, and deleting the invitation later leaves the entity confirmed.
--
-- NOMINATIONS. An entity-scope item for a candidate or an organization may carry `nominations`, a JSON array of nomination objects of the invited entity. The array is checked by `private.nomination_list_checked`, so it holds at most 1000 objects, and the shape of each object by `private.nomination_object_checked`, as set_entity_nominations checks its own. The keys of one object:
--   id              - a uuid: the object describes that nomination of the invited entity. Absent: it describes a new one.
--   election_id     - a uuid, required: an election of p_project_id the caller can read. With `id` it must be the stored row's.
--   constituency_id - a uuid, required. With `id` it must be the stored row's: an invitation moves no nomination.
--   election_round  - an integer, optional. A new nomination without one is written at its election's current_round. With `id`, a stated round must be the stored row's.
--   election_symbol - a string or null. It is trimmed; a blank one is stored as NULL, and one longer than 50 characters is refused.
--   parent          - `{"kind":"none"}`, `{"kind":"entity","entity_type","entity_id"}`, `{"kind":"other","name"}` or `{"kind":"keep"}`, as set_entity_nominations takes them; `keep` only with an `id`. A candidate names an organization and an organization an alliance.
--   confirmed       - true or false, required on every object.
--   custom_data     - a JSON object, optional, written over the stored custom data key by key. It may not carry `requestedParentOrganization`, which only a parent of kind `other` sets.
--   name, short_name, info, color, image - a JSON object or null; sort_order - an integer or null; subtype, external_id - a string or null. Each optional.
-- On an object with an `id`, a column the object does not state keeps its stored value. Any other key is not read.
--
-- An object creates or updates a nomination; an invitation never deletes one. For a parent of kind `entity`, the parent's nomination at the contest is asked of `private.parent_nomination_resolved`, which refuses a parent of another project and creates the parent's bare, unconfirmed row where it holds none. A new nomination is then inserted with its parent set and without `confirmed`, which the INSERT column grant leaves out, so it starts unconfirmed, and an object that states it confirmed is confirmed by an UPDATE of the new row. An object with an `id` whose values all equal the stored row's is not written; otherwise one UPDATE writes every column at its target, the stated confirmation included. The custom data is the stated object written over the stored one, then `other` sets the requested name, `entity` and `none` remove it, and `keep` leaves it.
--
-- Every UPDATE reads back the confirmation it wrote. Row-level security refuses an UPDATE without an error, and enforce_nomination_confirmation turns off the confirmation of a row that a caller without `nomination.confirm` edits; so an UPDATE that affects no row, a parent's nomination that cannot be found after it was created, and a confirmation read back other than the one stated each raise SQLSTATE 42501 with `<label> could not be written as stated`. A caller without `nomination.confirm` that states a new nomination confirmed meets enforce_nomination_confirmation's own refusal.
--
-- Where an election's type requires a candidate's nomination to have a parent or a requested name, `nominations_parent_required` judges it when the transaction ends. A call that wrote a nomination forces that constraint after its last item and sets it back to deferred, so the refusal (SQLSTATE 23514) is raised inside the call. A call that wrote none leaves the rows an earlier statement of the caller's transaction left pending to the end of the transaction.
--
-- Each item is checked before anything of it is written, its nominations whole, and is then written in this order: the invitation, the entity's confirmation, the nominations. The function creates no entity and no user and sends nothing. The whole batch is the caller's one transaction: a refused item, a duplicate or an unknown `external_id` raises, and no row of the batch is written. A malformed batch, item or object raises SQLSTATE 22023 naming the item's index, and an object's as `p_invitations[<i>].nominations[<j>]`, and never an address. Refused besides the shapes: `nominations` on a project-scope item or on an item for a faction or an alliance; the nominations of one entity on two items of the batch; nominations for an invited entity that is no entity of p_project_id the caller can read; an `id` that another object of the array names or that names no nomination of the invited entity; an election, a constituency or a round other than the named nomination's.
--
-- Returns a JSON array with one object per item, in order: `id`, `scope`, `target_type`, `target_id`, `role`, `email`, `expires_at`, `code` (the generated code as `XXXX-XXXX-XXXX`, or null on an email item) and `entity_confirmed`, the invited entity's confirmation after the item as the caller reads it (null on a project-scope item and for an entity the caller cannot read). An item that states `nominations` also answers `nominations`: `{"inserted", "updated", "unchanged", "parents_created"}`, each a count of nominations, `parents_created` counting the rows created for a party or an alliance.
--------------------------------------------------------------------------------
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

        SELECT e.current_round INTO v_round
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

      -- The parent: `keep` leaves the stored one, `entity` asks for the parent's nomination at the contest, created where it holds none, and `none` and `other` link nothing.
      v_target_parent := NULL;
      IF v_kind = 'keep' THEN
        v_target_parent := (v_stored ->> 'parent_nomination_id')::uuid;
      ELSIF v_kind = 'entity' THEN
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

      -- The custom data: the stated keys over the stored ones, then the parent's kind.
      v_target_custom := NULLIF(v_stored -> 'custom_data', 'null'::jsonb);
      IF jsonb_typeof(v_entry -> 'custom_data') = 'object' THEN
        v_target_custom := CASE WHEN jsonb_typeof(v_target_custom) = 'object' THEN v_target_custom ELSE '{}'::jsonb END
          || (v_entry -> 'custom_data');
      END IF;
      IF v_kind = 'other' THEN
        v_target_custom := CASE WHEN jsonb_typeof(v_target_custom) = 'object' THEN v_target_custom ELSE '{}'::jsonb END
          || jsonb_build_object(c_requested, v_entry ->> 'name');
      ELSIF v_kind IN ('entity', 'none') AND jsonb_typeof(v_target_custom) = 'object' THEN
        v_target_custom := v_target_custom - c_requested;
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
    SET CONSTRAINTS public.nominations_parent_required IMMEDIATE;
    SET CONSTRAINTS public.nominations_parent_required DEFERRED;
  END IF;

  RETURN v_out;
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.create_invitations (uuid, jsonb, boolean)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.create_invitations (uuid, jsonb, boolean) TO authenticated,
service_role;

--------------------------------------------------------------------------------
-- invitation_throttle: the windowed counters of the invitation helpers
--
-- One row per key, in one of two forms:
-- - `link:<project id>:<sha256 hex of the address>` counts the sign-in and recovery mails to one address in one project.
-- - `code:<project id>:<code hash>` counts claimant look-ups of one used code.
--
-- No key holds an address in clear. A `link:` key is taken only for an address a mail would go to and a `code:` key only for a code that names a claimed row, so a caller cannot fill the table with keys of its own making, and no key is derived from a request header.
--
-- Only the SECURITY DEFINER functions of this file read or write it: row-level security is enabled with no policy and every API role's privileges are revoked.
--------------------------------------------------------------------------------
CREATE TABLE private.invitation_throttle (
  key text PRIMARY KEY,
  -- Takes in the current window.
  count integer NOT NULL DEFAULT 1,
  -- When the current window began; invitation_throttle_take starts a new one once it has ended.
  window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private.invitation_throttle ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.invitation_throttle
FROM
  PUBLIC,
  anon,
  authenticated,
  service_role;

--------------------------------------------------------------------------------
-- invitation_throttle_take: count one take against a key
--
-- Returns true when the key, counting this take, is within p_max takes in its current window of p_window. A first take creates the key; a take after the window has ended starts a new window at 1. A refused take is counted and does not move the window. The advisory lock serialises concurrent takes of one key until the transaction ends.
--
-- Only the SECURITY DEFINER functions of this file call it, as their owner, so no API role holds EXECUTE.
--------------------------------------------------------------------------------
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
  authenticated,
  service_role;

--------------------------------------------------------------------------------
-- cleanup_invitation_throttle_on_delete: a deleted invitation leaves no throttle key
--
-- Deletes the `link:` keys of the row's address and of its pending address and the `code:` key of its code. An invitation that is deleted and seeded again is therefore not answered with the wait its predecessor left behind.
--
-- SECURITY DEFINER because the deleting caller holds nothing on the throttle table. search_path is pinned as on every definer function here.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_invitation_throttle_on_delete () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  -- A null address or code hash makes its key null, which matches no row.
  DELETE FROM private.invitation_throttle t
  WHERE t.key IN (
    'link:' || OLD.project_id::text || ':' || encode(sha256(convert_to(OLD.email, 'UTF8')), 'hex'),
    'link:' || OLD.project_id::text || ':' || encode(sha256(convert_to(OLD.pending_email, 'UTF8')), 'hex'),
    'code:' || OLD.project_id::text || ':' || OLD.code_hash
  );
  RETURN OLD;
END;
$$;

CREATE TRIGGER cleanup_invitation_throttle
AFTER DELETE ON public.invitations FOR EACH ROW
EXECUTE FUNCTION public.cleanup_invitation_throttle_on_delete ();

-- Not an RPC. A trigger fires whatever EXECUTE its function carries, so nothing is lost by revoking it from the API roles.
REVOKE
EXECUTE ON FUNCTION public.cleanup_invitation_throttle_on_delete ()
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- invitation_mode_allowed: does the project allow the registration mode of this invitation?
--
-- The registration-mode condition, stated once for the three functions that read an open invitation: invitation_code_status, invitation_link_request and claim_invitations. Each treats a row this function refuses as absent.
--
-- WHICH ROWS ARE JUDGED. An entity-scope row whose target is a candidate or an organization: the registration-mode matrix has a row for those two types and for no other. Such a row is allowed when private.registration_mode_allowed says so for the row's project, its target type and its mode.
--
-- WHICH ARE NOT. A project-scope promise has no entity type, and the matrix has no row for a faction or an alliance: each is always allowed.
--
-- A ROW'S MODE is read from which of its two bindings is set: `code` for a row that holds a code hash, `email` for a row bound to an address.
--
-- The callers ask it of open rows only, so a claimed row is never judged: a registration that is finished stays as it is whatever the matrix says later. create_invitations does not ask it, so an invitation can be seeded while its mode is off and is honoured once the mode is on.
--
-- It runs as its caller. The three callers are definer functions, so no API role holds EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.invitation_mode_allowed (p_invitation public.invitations) RETURNS boolean LANGUAGE sql STABLE
SET
  search_path = '' AS $$
  SELECT CASE
    WHEN (p_invitation).scope <> 'entity' THEN true
    WHEN (p_invitation).target_type NOT IN ('candidate', 'organization') THEN true
    ELSE private.registration_mode_allowed(
      (p_invitation).project_id,
      (p_invitation).target_type::text,
      CASE WHEN (p_invitation).code_hash IS NOT NULL THEN 'code' ELSE 'email' END
    )
  END;
$$;

REVOKE
EXECUTE ON FUNCTION private.invitation_mode_allowed (public.invitations)
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- email_holds_grant_in_project: does a user with this confirmed address hold a grant in the project?
--
-- The grant-holder test, stated once for the two functions that decide whether a mail may go to an address: invitation_link_request and recovery_link_request.
--
-- True when a user whose address equals p_email and is confirmed holds a project-scope grant on p_project_id or an entity-scope grant on one of its entities. Holding a global or an account grant alone is not holding a grant in the project.
--
-- The stored address is trimmed and lower-cased before it is compared. p_email is compared as given, so the callers pass it trimmed and lower-cased.
--
-- It runs as its caller. The two callers are definer functions, so no API role holds EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.email_holds_grant_in_project (p_project_id uuid, p_email text) RETURNS boolean LANGUAGE sql STABLE
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE lower(btrim(u.email)) = p_email
      AND u.email_confirmed_at IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.grants g
        WHERE g.user_id = u.id
          AND (
            (g.scope = 'project' AND g.target_id = p_project_id)
            OR (g.scope = 'entity' AND private.entity_project_id(g.target_type, g.target_id) = p_project_id)
          )
      )
  );
$$;

REVOKE
EXECUTE ON FUNCTION private.email_holds_grant_in_project (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;

--------------------------------------------------------------------------------
-- invitation_code_status: is this code valid, used or unknown
--
-- Answers one of three words about the row of p_project_id whose code hash equals the hash of the code as typed:
-- - `used` when the row is claimed, which is `claimed_at IS NOT NULL` and so stays true after the claimant is deleted;
-- - `unknown` when the row is unclaimed and expired, when it is open but its registration mode is switched off (private.invitation_mode_allowed), and when the project holds no such row, which includes the code of another project;
-- - `valid` otherwise.
--
-- A switched-off mode has no answer of its own: the status and the body are those of a code that names nothing. The mode is asked only of a row that is open and unexpired, so such a row costs one read of its project's settings row that a code naming nothing does not.
--
-- It returns nothing else about the row, and it counts nothing: an unknown code is defended by its 60 bits.
--
-- SECURITY DEFINER because no API role can read `code_hash`.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitation_code_status (p_project_id uuid, p_code text) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      SELECT CASE
        WHEN i.claimed_at IS NOT NULL THEN 'used'
        WHEN i.expires_at IS NOT NULL AND i.expires_at <= now() THEN 'unknown'
        WHEN NOT private.invitation_mode_allowed(i) THEN 'unknown'
        ELSE 'valid'
      END
      FROM public.invitations i
      WHERE i.project_id = p_project_id
        AND i.code_hash = private.invitation_code_hash(p_code)
    ),
    'unknown'
  );
$$;

--------------------------------------------------------------------------------
-- invitation_link_request: may a sign-in mail go out, and to which address
--
-- Returns the address a sign-in mail may be sent to, or null for "do nothing". The caller sends exactly one mail to a non-null answer, or gives the answer back through invitation_link_release.
--
-- With a code (p_code is not null) the code alone decides:
-- - It names an open row and p_email is not blank: the address is the candidate, unless the row's pending address was bound less than 60 seconds ago.
-- - It names a claimed row whose claimant still exists: the candidate is the claimant's own address, whatever p_email holds, read through invitation_code_claimant_email and so counted against that code's look-up budget.
-- - It names nothing, an expired row, an open row whose registration mode is switched off (private.invitation_mode_allowed), or a claimed row whose claimant is gone: null.
--
-- Without a code, p_email is the candidate when the project holds an open invitation for it whose registration mode is allowed, or when a user with that confirmed address holds a grant in the project (private.email_holds_grant_in_project): a project-scope grant on the project or an entity-scope grant on one of its entities. Holding a global or an account grant alone does not make an address eligible.
--
-- A candidate then takes its address slot, one per address per project per 60 seconds, and the answer is null when the slot is taken. recovery_link_request takes the same slot, so a recovery mail and a sign-in mail to one address are limited together. Only after that is the address bound to an open code row as its pending address. A null answer has therefore changed no invitation row, and no slot is taken for an address no mail would go to.
--
-- A switched-off mode is answered as an unknown code or an uninvited address is: null, before a slot is asked for and before anything is written. It changes nothing for a claimed code, whose claimant is still answered, or for a user who holds a grant in the project.
--
-- Eligibility follows the rows as they are: whether an invitation's creator still holds the authority to promise it is not asked.
--
-- SECURITY DEFINER because it reads auth.users and `code_hash` and writes the pending address, none of which an API role can.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitation_link_request (
  p_project_id uuid,
  p_email text DEFAULT NULL,
  p_code text DEFAULT NULL
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
  v_row public.invitations%ROWTYPE;
  v_bind boolean := false;
  v_candidate text;
BEGIN
  IF p_project_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_code IS NOT NULL THEN
    SELECT i.* INTO v_row
    FROM public.invitations i
    WHERE i.project_id = p_project_id
      AND i.code_hash = private.invitation_code_hash(p_code)
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN NULL;
    ELSIF v_row.claimed_at IS NOT NULL THEN
      v_candidate := public.invitation_code_claimant_email(p_project_id, p_code);
    ELSIF v_row.expires_at IS NOT NULL AND v_row.expires_at <= now() THEN
      RETURN NULL;
    ELSIF NOT private.invitation_mode_allowed(v_row) THEN
      RETURN NULL;
    ELSIF v_email IS NULL THEN
      RETURN NULL;
    ELSIF v_row.pending_email_at IS NOT NULL AND v_row.pending_email_at + interval '60 seconds' > now() THEN
      RETURN NULL;
    ELSE
      v_candidate := v_email;
      v_bind := true;
    END IF;
  ELSIF v_email IS NOT NULL AND (
    EXISTS (
      SELECT 1
      FROM public.invitations i
      WHERE i.project_id = p_project_id
        AND i.email = v_email
        AND i.claimed_at IS NULL
        AND (i.expires_at IS NULL OR i.expires_at > now())
        AND private.invitation_mode_allowed(i)
    )
    OR private.email_holds_grant_in_project(p_project_id, v_email)
  ) THEN
    v_candidate := v_email;
  END IF;

  IF v_candidate IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT private.invitation_throttle_take(
    'link:' || p_project_id::text || ':' || encode(sha256(convert_to(lower(btrim(v_candidate)), 'UTF8')), 'hex'),
    1,
    interval '60 seconds'
  ) THEN
    RETURN NULL;
  END IF;

  IF v_bind THEN
    UPDATE public.invitations i
    SET pending_email = v_candidate, pending_email_at = now()
    WHERE i.id = v_row.id;
  END IF;

  RETURN v_candidate;
END;
$$;

--------------------------------------------------------------------------------
-- invitation_link_release: give back what a link request took
--
-- For a sign-in or a recovery request that was answered with an address to which no mail was then handed over. It deletes the address's slot in the project and, when p_code names an open row whose pending address is that address, clears the row's `pending_email_at`, so the same address, and the same binding of the same code, can be asked again at once.
--
-- It changes no claimed row and no other column, and it does nothing for an address that holds no slot. A look-up counted against a used code is not given back.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitation_link_release (
  p_project_id uuid,
  p_email text,
  p_code text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
BEGIN
  IF p_project_id IS NULL OR v_email IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM private.invitation_throttle t
  WHERE t.key = 'link:' || p_project_id::text || ':' || encode(sha256(convert_to(v_email, 'UTF8')), 'hex');

  IF p_code IS NOT NULL THEN
    UPDATE public.invitations i
    SET pending_email_at = NULL
    WHERE i.project_id = p_project_id
      AND i.code_hash = private.invitation_code_hash(p_code)
      AND i.claimed_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND i.pending_email = v_email;
  END IF;
END;
$$;

--------------------------------------------------------------------------------
-- recovery_link_request: which mail, if any, a recovery request for an address earns
--
-- Returns `{"email": <the address, trimmed and lower-cased>, "mail": <one of two words>}`, or null for "do nothing". The caller sends exactly one mail of the named kind to a non-null answer, or gives the answer back through invitation_link_release.
--
-- - `recovery` when a user with that confirmed address holds a grant in p_project_id (private.email_holds_grant_in_project). Whether the user has a password is not asked: opening a recovery link stores none, and the page it leads to sets one.
-- - `sign-in` when no such user exists and the project holds an open, unexpired invitation for the address whose registration mode is allowed (private.invitation_mode_allowed). Such an address has no password to recover, so it is sent the mail a sign-in request would have earned it.
-- - null for everything else: an address the project knows nothing of, the holder of a global or an account grant alone, an unconfirmed address, an expired or a claimed invitation, a null project and a blank address.
--
-- A non-null candidate then takes its address slot, one per address per project per 60 seconds, and the answer is null when the slot is taken. The slot is the one invitation_link_request takes, under the same key: a later link of either kind stops an unopened earlier one of either kind, so the two requests are limited together. No slot is taken for an address no mail would go to.
--
-- It creates no account, changes no invitation row and binds no address: the slot is all it writes. It takes a project and an address and nothing else, and it returns no user id, grant, name or reason. Which of the three outcomes an address got is known only to whoever can execute it, which is the service role alone.
--
-- SECURITY DEFINER because it reads auth.users and the grants of accounts that are not the caller's.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recovery_link_request (p_project_id uuid, p_email text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
  v_mail text;
BEGIN
  IF p_project_id IS NULL OR v_email IS NULL THEN
    RETURN NULL;
  END IF;

  IF private.email_holds_grant_in_project(p_project_id, v_email) THEN
    v_mail := 'recovery';
  ELSIF EXISTS (
    SELECT 1
    FROM public.invitations i
    WHERE i.project_id = p_project_id
      AND i.email = v_email
      AND i.claimed_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND private.invitation_mode_allowed(i)
  ) THEN
    v_mail := 'sign-in';
  ELSE
    RETURN NULL;
  END IF;

  IF NOT private.invitation_throttle_take(
    'link:' || p_project_id::text || ':' || encode(sha256(convert_to(v_email, 'UTF8')), 'hex'),
    1,
    interval '60 seconds'
  ) THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object('email', v_email, 'mail', v_mail);
END;
$$;

--------------------------------------------------------------------------------
-- invitation_code_claimant_email: the address of the user who claimed a code
--
-- Returns the claimant's address for a claimed code row of p_project_id whose claimant still exists, and null otherwise. The address is what a password sign-in by code is attempted against, so each answer is counted against the code: ten per fifteen minutes, and null beyond that, which is the answer an unknown code gets. A code that names no claimed row, or one whose claimant is gone, is not counted and writes no throttle key.
--
-- The limit is keyed on the code row. A caller that guesses passwords for one code meets it whatever address or header it sends.
--
-- SECURITY DEFINER because it reads auth.users and `code_hash`. It returns a user's address to whoever can execute it, which is the service role alone.
--------------------------------------------------------------------------------
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
  WHERE i.project_id = p_project_id
    AND i.code_hash = v_hash
    AND i.claimed_at IS NOT NULL
    AND NULLIF(btrim(u.email), '') IS NOT NULL;

  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT private.invitation_throttle_take('code:' || p_project_id::text || ':' || v_hash, 10, interval '15 minutes') THEN
    RETURN NULL;
  END IF;

  RETURN v_email;
END;
$$;

--------------------------------------------------------------------------------
-- invitation_link_witness: has the background work of one link request ended
--
-- A link request is answered before its work is done, and the answer is the same whether or not a mail goes out. The witness is how the service role learns, for one request it chose to watch, that the work has ended and whether a mail was handed over: it opens a record, passes the id along with the request, and reads the record afterwards.
--
-- An anonymous caller can neither create nor read a record. Opening is the service role's, and completing is an UPDATE of a record that exists and is still open, never an insert, so an id that was not opened writes nothing.
--
-- Row-level security is enabled with no policy and every API role's privileges are revoked: only the two SECURITY DEFINER functions below read or write the table.
--------------------------------------------------------------------------------
CREATE TABLE private.invitation_link_witness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_at timestamptz NOT NULL DEFAULT now(),
  -- Null while the work the record watches has not ended.
  completed_at timestamptz,
  -- `sent` when a mail was handed over, `not-sent` when the work ended without one.
  outcome text,
  CONSTRAINT invitation_link_witness_outcome_check CHECK (
    outcome IS NULL
    OR outcome IN ('sent', 'not-sent')
  )
);

ALTER TABLE private.invitation_link_witness ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.invitation_link_witness
FROM
  PUBLIC,
  anon,
  authenticated,
  service_role;

-- Opens a record and returns its id. Records opened more than a day ago are deleted first, so the table does not grow without bound.
CREATE OR REPLACE FUNCTION public.invitation_link_witness_open () RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_id uuid;
BEGIN
  DELETE FROM private.invitation_link_witness w
  WHERE w.opened_at < now() - interval '1 day';

  INSERT INTO private.invitation_link_witness DEFAULT VALUES
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- With an outcome, which must be `sent` or `not-sent` (anything else raises 22023), completes the record of that id if it exists and is still open; a completed record keeps its first outcome. In every case returns the record's outcome: null when no such record exists or it is still open.
CREATE OR REPLACE FUNCTION public.invitation_link_witness (p_id uuid, p_outcome text DEFAULT NULL) RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  IF p_outcome IS NOT NULL THEN
    IF p_outcome NOT IN ('sent', 'not-sent') THEN
      RAISE EXCEPTION 'invitation_link_witness: p_outcome must be sent or not-sent'
        USING ERRCODE = '22023';
    END IF;

    UPDATE private.invitation_link_witness w
    SET completed_at = now(), outcome = p_outcome
    WHERE w.id = p_id
      AND w.completed_at IS NULL;
  END IF;

  RETURN (SELECT w.outcome FROM private.invitation_link_witness w WHERE w.id = p_id);
END;
$$;

-- service_role only. Each of the seven is SECURITY DEFINER and checks nothing about its caller: published to an API role, the code check would be a code oracle, the link request and the recovery request account and invitation oracles that also write, and the claimant look-up would hand out a user's address. Supabase's default privileges grant EXECUTE on every new public function to anon and authenticated, so the REVOKE names them as well as PUBLIC.
REVOKE
EXECUTE ON FUNCTION public.invitation_code_status (uuid, text),
public.invitation_link_request (uuid, text, text),
public.invitation_link_release (uuid, text, text),
public.invitation_code_claimant_email (uuid, text),
public.invitation_link_witness_open (),
public.invitation_link_witness (uuid, text),
public.recovery_link_request (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
EXECUTE ON FUNCTION public.invitation_code_status (uuid, text),
public.invitation_link_request (uuid, text, text),
public.invitation_link_release (uuid, text, text),
public.invitation_code_claimant_email (uuid, text),
public.invitation_link_witness_open (),
public.invitation_link_witness (uuid, text),
public.recovery_link_request (uuid, text) TO service_role;

--------------------------------------------------------------------------------
-- claim_invitations RPC: turn the caller's open invitations into grants
--
-- WHAT IT TRUSTS. One thing: the caller's own confirmed address, read from the caller's row of auth.users, which is the row `auth.uid()` names. A user whose `email_confirmed_at` is null, or whose address is blank, claims nothing.
--
-- WHAT IT IGNORES. It takes no address, no user id and no invitation id, so it cannot be pointed at another person's invitation, and it never reads the token's `email` claim, which can be older than the row. p_project_id only chooses which of the caller's own invitations are looked at.
--
-- WHAT IT CANNOT KNOW. The database sees that an address is confirmed and not how it came to be. This function therefore depends on the auth service refusing public sign-up and requiring confirmation by mail: where a visitor can create an account for an address without opening a mail sent to it, that visitor can claim the address's invitations. Nothing here guards against that configuration.
--
-- WHAT IT MATCHES. The rows of p_project_id that are unclaimed and unexpired and whose `email` is the caller's address, plus the code rows whose pending address is. A code row with no pending address, or with another one, is claimed by nobody. A row whose registration mode is switched off (private.invitation_mode_allowed) is not matched either: it is neither claimed nor skipped, and it stays open.
--
-- WHAT IT WRITES. One row of public.grants per claimed invitation, copying the invitation's four columns, and on the invitation `claimed_by`, `claimed_at` and a cleared pending address. It confirms no entity and creates nothing else. Whether the invitation's creator still holds the authority to promise the grant is not asked: a row that exists is honoured, and a promise is withdrawn by deleting its row.
--
-- EACH ROW BY ITSELF. Rows are taken in the order they were created, and each is claimed or skipped on its own:
-- - an entity-scope row whose target is no longer an entity of the row's project is skipped with the reason `target_not_in_project` and stays open (no foreign key holds the target, so it is asked again here);
-- - a unique violation on `grants_user_scope_target_role_key` means the caller already holds exactly this grant: the row is marked claimed and no second grant is written;
-- - a unique violation on `idx_grants_one_candidate_editor` means another user edits that candidate: the row is skipped with the reason `candidate_has_editor` and stays open;
-- - any other violation is raised and undoes the call.
--
-- Returns `{"claimed": [...], "skipped": [...], "password_set": <boolean>}`. Each element holds `scope`, `target_type`, `target_id` and `role`, and a skipped one also `reason`. `password_set` is private.user_password_set for the caller and is present whatever was claimed. No address, code or invitation id is returned. A second call claims nothing.
--
-- A grant reaches a token only when one is issued, so a caller refreshes its session after a claim that returned a non-empty `claimed` and before it reads anything the grant opens.
--
-- SECURITY DEFINER because it reads auth.users, writes public.grants and updates public.invitations, none of which the caller can. It answers for `auth.uid()`, which neither `anon` nor the service role has, so `authenticated` alone holds EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_invitations (p_project_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_password_set boolean := false;
  v_email text;
  v_row public.invitations%ROWTYPE;
  v_spec jsonb;
  v_constraint text;
  v_skip_reason text;
  v_claimed jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
BEGIN
  IF v_uid IS NOT NULL THEN
    v_password_set := private.user_password_set(v_uid);

    SELECT lower(btrim(u.email)) INTO v_email
    FROM auth.users u
    WHERE u.id = v_uid
      AND u.email_confirmed_at IS NOT NULL
      AND NULLIF(btrim(u.email), '') IS NOT NULL;
  END IF;

  IF v_email IS NULL OR p_project_id IS NULL THEN
    RETURN jsonb_build_object('claimed', v_claimed, 'skipped', v_skipped, 'password_set', v_password_set);
  END IF;

  FOR v_row IN
    SELECT i.*
    FROM public.invitations i
    WHERE i.project_id = p_project_id
      AND i.claimed_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND (i.email = v_email OR (i.code_hash IS NOT NULL AND i.pending_email = v_email))
      AND private.invitation_mode_allowed(i)
    ORDER BY i.created_at, i.id
    FOR UPDATE
  LOOP
    v_spec := jsonb_build_object(
      'scope', v_row.scope,
      'target_type', v_row.target_type,
      'target_id', v_row.target_id,
      'role', v_row.role
    );
    v_skip_reason := NULL;

    IF v_row.scope = 'entity'
       AND private.entity_project_id(v_row.target_type, v_row.target_id) IS DISTINCT FROM v_row.project_id THEN
      v_skip_reason := 'target_not_in_project';
    ELSE
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
            v_skip_reason := 'candidate_has_editor';
          ELSE
            RAISE;
          END IF;
      END;
    END IF;

    IF v_skip_reason IS NOT NULL THEN
      v_skipped := v_skipped || jsonb_build_array(v_spec || jsonb_build_object('reason', v_skip_reason));
    ELSE
      UPDATE public.invitations i
      SET claimed_by = v_uid, claimed_at = now(), pending_email = NULL, pending_email_at = NULL
      WHERE i.id = v_row.id;
      v_claimed := v_claimed || jsonb_build_array(v_spec);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('claimed', v_claimed, 'skipped', v_skipped, 'password_set', v_password_set);
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.claim_invitations (uuid)
FROM
  PUBLIC,
  anon,
  service_role;

GRANT
EXECUTE ON FUNCTION public.claim_invitations (uuid) TO authenticated;
